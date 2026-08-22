import * as duckdb from "@duckdb/duckdb-wasm";
import duckdbEhWasm from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url";
import duckdbMvpWasm from "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url";
import duckdbEhWorker from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url";
import duckdbMvpWorker from "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url";
import { portfolio } from "../../data/portfolio";

const bundles: duckdb.DuckDBBundles = {
  mvp: { mainModule: duckdbMvpWasm, mainWorker: duckdbMvpWorker },
  eh: { mainModule: duckdbEhWasm, mainWorker: duckdbEhWorker },
};

let connectionPromise: Promise<duckdb.AsyncDuckDBConnection> | undefined;

function rowsForDataset() {
  return {
    profile: [portfolio.profile],
    projects: portfolio.projects,
    skills: portfolio.skills,
    recognition: portfolio.recognition,
    education: portfolio.education,
  };
}

async function createConnection() {
  const bundle = await duckdb.selectBundle(bundles);
  if (!bundle.mainWorker) throw new Error("DuckDB worker bundle is unavailable.");

  const worker = new Worker(bundle.mainWorker);
  const database = new duckdb.AsyncDuckDB(new duckdb.VoidLogger(), worker);
  await database.instantiate(bundle.mainModule, bundle.pthreadWorker);
  const connection = await database.connect();

  await database.registerFileText("companies.json", JSON.stringify(portfolio.companies));
  await connection.query(`
    CREATE TABLE companies AS
    SELECT id::INTEGER AS id, name, displayLocation AS location, description
    FROM read_json_auto('companies.json', format = 'array')
  `);

  await database.registerFileText("positions.json", JSON.stringify(portfolio.positions));
  await connection.query(`
    CREATE TABLE positions AS
    SELECT id::INTEGER AS id, companyId::INTEGER AS company_id, title,
      startDate::DATE AS start_date, endDate::DATE AS end_date, description
    FROM read_json_auto('positions.json', format = 'array')
  `);

  await database.registerFileText("work_points.json", JSON.stringify(portfolio.professionalWork));
  await connection.query(`
    CREATE TABLE work_points AS
    SELECT id::INTEGER AS id, companyId::INTEGER AS company_id, title, status, description, impact, tags
    FROM read_json_auto('work_points.json', format = 'array')
  `);

  for (const [tableName, rows] of Object.entries(rowsForDataset())) {
    const fileName = `${tableName}.json`;
    await database.registerFileText(fileName, JSON.stringify(rows));
    await connection.query(
      `CREATE TABLE ${tableName} AS SELECT * FROM read_json_auto('${fileName}', format = 'array')`,
    );
  }

  await connection.query(`
    CREATE VIEW where_i_worked AS
    WITH position_rollup AS (
      SELECT c.id AS company_id, arg_max(p.title, p.start_date) AS latest_position,
        strftime(min(p.start_date), '%b %Y') AS started,
        CASE WHEN count(*) FILTER (WHERE p.end_date IS NULL) > 0 THEN 'Present'
          ELSE strftime(max(p.end_date), '%b %Y') END AS ended,
        list(struct_pack(title := p.title, started := strftime(p.start_date, '%b %Y'),
          ended := COALESCE(strftime(p.end_date, '%b %Y'), 'Present')) ORDER BY p.start_date) AS position_history
      FROM companies c JOIN positions p ON p.company_id = c.id GROUP BY c.id
    ),
    work_rollup AS (
      SELECT company_id,
        list(struct_pack(title := title, description := description, impact := impact,
          technologies := tags) ORDER BY id) AS work_points
      FROM work_points GROUP BY company_id
    )
    SELECT c.id AS company_id, c.name AS company, c.location, c.description,
      p.latest_position, p.started, p.ended, p.position_history, w.work_points
    FROM companies c
    JOIN position_rollup p ON p.company_id = c.id
    JOIN work_rollup w ON w.company_id = c.id
  `);

  return connection;
}

export function getConnection() {
  connectionPromise ??= createConnection().catch((error) => {
    connectionPromise = undefined;
    throw error;
  });
  return connectionPromise;
}

function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "bigint") return String(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    return JSON.stringify(value, (_, nested) => typeof nested === "bigint" ? String(nested) : nested);
  }
  return String(value);
}

export interface TableOutput {
  type: "table";
  columns: string[];
  rows: string[][];
  elapsed: number;
}

export interface TextOutput {
  type: "text";
  text: string;
}

export type QueryOutput = TableOutput | TextOutput;

export async function executeQuery(query: string): Promise<QueryOutput> {
  const connection = await getConnection();
  const startedAt = performance.now();
  const [command, argument] = query.trim().split(/\s+/, 2);

  if (command === ".help") {
    return { type: "text", text: ".tables              list tables and views\n.schema TABLE        show a table or view definition\n.clear               clear the transcript\n.help                show these commands\n\nAny other input is executed as DuckDB SQL." };
  }

  let result;
  if (command === ".tables") {
    result = await connection.query(`SELECT table_name AS name, table_type AS type FROM information_schema.tables WHERE table_schema = 'main' ORDER BY table_type, table_name`);
  } else if (command === ".schema") {
    if (!argument || !/^[a-z_][a-z0-9_]*$/i.test(argument)) throw new Error("Usage: .schema TABLE");
    result = await connection.query(`SELECT table_name AS name, sql FROM duckdb_tables() WHERE table_name = '${argument}' UNION ALL SELECT view_name AS name, sql FROM duckdb_views() WHERE view_name = '${argument}'`);
  } else if (command.startsWith(".")) {
    throw new Error(`Unknown command: ${command}. Run .help to see available commands.`);
  } else {
    result = await connection.query(query);
  }

  const columns = result.schema.fields.map((field) => field.name);
  const rows = result.toArray().map((row) => columns.map((column) => normalizeCell(row[column])));
  return { type: "table", columns, rows, elapsed: Math.round(performance.now() - startedAt) };
}
