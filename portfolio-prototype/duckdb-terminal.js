(function () {
  const DUCKDB_MODULE_URL = "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.33.1-dev57.0/+esm";
  let connectionPromise;

  const education = [
    {
      dates: "2019–2023",
      degree: "BE, Computer Science and Engineering",
      institution: "Nitte Meenakshi Institute of Technology",
      cgpa: 9.09,
    },
  ];

  function rowsForDataset(dataset) {
    return {
      profile: [dataset.profile],
      projects: dataset.publicProjects,
      skills: dataset.skills,
      recognition: dataset.recognition,
      education,
    };
  }

  function normalizedWorkPoints(professional) {
    return professional.map((point, index) => ({
      id: index + 1,
      company_id: point.companyId,
      title: point.title,
      status: point.status,
      description: point.description,
      impact: point.impact,
      tags: point.tags,
    }));
  }

  async function createConnection(dataset) {
    const duckdb = await import(DUCKDB_MODULE_URL);
    const bundle = await duckdb.selectBundle(duckdb.getJsDelivrBundles());
    const workerUrl = URL.createObjectURL(
      new Blob([`importScripts("${bundle.mainWorker}");`], { type: "text/javascript" }),
    );
    const worker = new Worker(workerUrl);
    const database = new duckdb.AsyncDuckDB(new duckdb.VoidLogger(), worker);

    try {
      await database.instantiate(bundle.mainModule, bundle.pthreadWorker);
    } finally {
      URL.revokeObjectURL(workerUrl);
    }

    const connection = await database.connect();

    await database.registerFileText("companies.json", JSON.stringify(dataset.companies));
    await connection.query(`
      CREATE TABLE companies (
        id INTEGER PRIMARY KEY,
        name VARCHAR NOT NULL,
        location VARCHAR NOT NULL,
        description VARCHAR NOT NULL
      )
    `);
    await connection.query(`
      INSERT INTO companies
      SELECT id::INTEGER, name, location, description
      FROM read_json_auto('companies.json', format = 'array')
    `);

    await database.registerFileText("positions.json", JSON.stringify(dataset.positions));
    await connection.query(`
      CREATE TABLE positions (
        id INTEGER PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id),
        title VARCHAR NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE
      )
    `);
    await connection.query(`
      INSERT INTO positions
      SELECT id::INTEGER, companyId::INTEGER, title, startDate::DATE, endDate::DATE
      FROM read_json_auto('positions.json', format = 'array')
    `);

    await database.registerFileText(
      "work_points.json",
      JSON.stringify(normalizedWorkPoints(dataset.professional)),
    );
    await connection.query(`
      CREATE TABLE work_points (
        id INTEGER PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id),
        title VARCHAR NOT NULL,
        status VARCHAR NOT NULL,
        description VARCHAR NOT NULL,
        impact VARCHAR NOT NULL,
        tags VARCHAR[] NOT NULL
      )
    `);
    await connection.query(`
      INSERT INTO work_points
      SELECT id::INTEGER, company_id::INTEGER, title, status, description, impact, tags
      FROM read_json_auto('work_points.json', format = 'array')
    `);

    for (const [tableName, rows] of Object.entries(rowsForDataset(dataset))) {
      const fileName = `${tableName}.json`;
      await database.registerFileText(fileName, JSON.stringify(rows));
      await connection.query(
        `CREATE TABLE ${tableName} AS SELECT * FROM read_json_auto('${fileName}', format = 'array')`,
      );
    }

    await connection.query(`
      CREATE VIEW where_i_worked AS
      WITH position_rollup AS (
        SELECT
          c.id AS company_id,
          arg_max(p.title, p.start_date) AS latest_position,
          strftime(min(p.start_date), '%b %Y') AS started,
          CASE
            WHEN count(*) FILTER (WHERE p.end_date IS NULL) > 0 THEN 'Present'
            ELSE strftime(max(p.end_date), '%b %Y')
          END AS ended,
          list(
            struct_pack(
              title := p.title,
              started := strftime(p.start_date, '%b %Y'),
              ended := COALESCE(strftime(p.end_date, '%b %Y'), 'Present')
            )
            ORDER BY p.start_date
          ) AS position_history
        FROM companies c
        JOIN positions p ON p.company_id = c.id
        GROUP BY c.id
      ),
      work_rollup AS (
        SELECT
          company_id,
          list(
            struct_pack(
              title := title,
              description := description,
              impact := impact,
              technologies := tags
            )
            ORDER BY id
          ) AS work_points
        FROM work_points
        GROUP BY company_id
      )
      SELECT
        c.id AS company_id,
        c.name AS company,
        c.location,
        c.description,
        p.latest_position,
        p.started,
        p.ended,
        p.position_history,
        w.work_points
      FROM companies c
      JOIN position_rollup p ON p.company_id = c.id
      JOIN work_rollup w ON w.company_id = c.id
    `);

    return connection;
  }

  function getConnection(dataset) {
    if (!connectionPromise) connectionPromise = createConnection(dataset);
    return connectionPromise;
  }

  function setEngineState(text, state) {
    const element = document.getElementById("f-engine-state");
    if (!element) return;
    element.textContent = text;
    element.classList.toggle("is-ready", state === "ready");
    element.classList.toggle("is-error", state === "error");
  }

  function normalizeCell(value) {
    if (value === null || value === undefined) return "NULL";
    if (typeof value === "bigint") return String(value);
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "object") {
      try {
        return JSON.stringify(value, (_, nested) =>
          typeof nested === "bigint" ? String(nested) : nested,
        );
      } catch (_) {
        return String(value);
      }
    }
    return String(value);
  }

  function appendCommand(transcript, query) {
    const entry = document.createElement("section");
    entry.className = "f-entry";

    const command = document.createElement("div");
    command.className = "f-command";
    const commandText = document.createElement("span");
    commandText.textContent = query;
    command.append(commandText);
    entry.append(command);
    transcript.append(entry);
    return entry;
  }

  function appendText(entry, text, className = "") {
    const output = document.createElement("pre");
    output.className = `f-text-result ${className}`.trim();
    output.textContent = text;
    entry.append(output);
    return output;
  }

  function appendTable(entry, result, elapsed) {
    const fields = result.schema.fields;
    const rows = result.toArray();
    const meta = document.createElement("p");
    meta.className = "f-result-meta";
    meta.textContent = `${rows.length} ${rows.length === 1 ? "row" : "rows"} · ${elapsed} ms`;
    entry.append(meta);

    if (!fields.length) {
      appendText(entry, "Query completed.");
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "f-result-wrap";
    const table = document.createElement("table");
    table.className = "f-result";
    const head = document.createElement("thead");
    const headRow = document.createElement("tr");
    fields.forEach((field) => {
      const th = document.createElement("th");
      th.scope = "col";
      th.textContent = field.name;
      headRow.append(th);
    });
    head.append(headRow);
    table.append(head);

    const body = document.createElement("tbody");
    rows.forEach((row) => {
      const tr = document.createElement("tr");
      fields.forEach((field) => {
        const td = document.createElement("td");
        td.textContent = normalizeCell(row[field.name]);
        tr.append(td);
      });
      body.append(tr);
    });
    table.append(body);
    wrapper.append(table);
    entry.append(wrapper);
  }

  async function runMetaCommand(connection, query) {
    const [command, ...args] = query.trim().split(/\s+/);
    if (command === ".help") {
      return {
        text: [
          ".tables              list tables and views",
          ".schema TABLE        show a table or view definition",
          ".clear               clear the transcript",
          ".help                show these commands",
          "",
          "Any other input is executed as DuckDB SQL.",
        ].join("\n"),
      };
    }
    if (command === ".tables") {
      return {
        result: await connection.query(`
          SELECT table_name AS name, table_type AS type
          FROM information_schema.tables
          WHERE table_schema = 'main'
          ORDER BY table_type, table_name
        `),
      };
    }
    if (command === ".schema") {
      const tableName = args[0];
      if (!tableName || !/^[a-z_][a-z0-9_]*$/i.test(tableName)) {
        throw new Error("Usage: .schema TABLE");
      }
      return {
        result: await connection.query(`
          SELECT table_name AS name, sql
          FROM duckdb_tables()
          WHERE table_name = '${tableName}'
          UNION ALL
          SELECT view_name AS name, sql
          FROM duckdb_views()
          WHERE view_name = '${tableName}'
        `),
      };
    }
    throw new Error(`Unknown command: ${command}. Run .help to see available commands.`);
  }

  window.activateDuckDbTerminal = async function activateDuckDbTerminal(dataset) {
    const form = document.getElementById("f-query-form");
    const input = document.getElementById("f-query");
    const runButton = document.getElementById("f-run");
    const transcript = document.getElementById("f-transcript");
    if (!form || !input || !runButton || !transcript) return;

    const exampleButtons = [...document.querySelectorAll(".f-example")];
    exampleButtons.forEach((button) => {
      button.disabled = true;
    });
    const history = [];
    let historyIndex = 0;
    let connection;
    let running = false;

    function setBusy(isBusy, label = "Run query") {
      running = isBusy;
      runButton.disabled = isBusy;
      runButton.textContent = label;
      exampleButtons.forEach((button) => {
        button.disabled = isBusy;
      });
    }

    async function execute(rawQuery) {
      const query = rawQuery.trim();
      if (!query || running) return;
      if (query === ".clear") {
        transcript.replaceChildren();
        return;
      }

      history.push(query);
      historyIndex = history.length;
      const entry = appendCommand(transcript, query);
      let waitingMessage;
      setBusy(true, connection ? "Running…" : "Waiting…");
      if (!connection) {
        waitingMessage = appendText(
          entry,
          "One-time DuckDB engine startup in progress. Your query is queued…",
        );
      }

      try {
        if (!connection) {
          connection = await getConnection(dataset);
          waitingMessage.remove();
          runButton.textContent = "Running…";
        }
        const startedAt = performance.now();
        if (query.startsWith(".")) {
          const output = await runMetaCommand(connection, query);
          if (output.text) appendText(entry, output.text);
          if (output.result) appendTable(entry, output.result, Math.round(performance.now() - startedAt));
        } else {
          const result = await connection.query(query);
          appendTable(entry, result, Math.round(performance.now() - startedAt));
        }
      } catch (error) {
        if (waitingMessage) waitingMessage.remove();
        appendText(entry, error instanceof Error ? error.message : String(error), "f-error");
      } finally {
        setBusy(false);
        transcript.scrollTop = transcript.scrollHeight;
        input.focus();
      }
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void execute(input.value);
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        form.requestSubmit();
        return;
      }
      if (event.key === "ArrowUp" && history.length) {
        event.preventDefault();
        historyIndex = Math.max(0, historyIndex - 1);
        input.value = history[historyIndex];
      }
      if (event.key === "ArrowDown" && history.length) {
        event.preventDefault();
        historyIndex = Math.min(history.length, historyIndex + 1);
        input.value = history[historyIndex] || "";
      }
    });

    exampleButtons.forEach((button) => {
      button.addEventListener("click", () => {
        input.value = button.dataset.query;
        void execute(input.value);
      });
    });

    try {
      connection = await getConnection(dataset);
      if (!document.getElementById("f-query-form")) return;
      setEngineState("DuckDB ready", "ready");
      if (!running) setBusy(false);
      const welcome = transcript.querySelector(".f-welcome");
      if (welcome) welcome.innerHTML = "<b>DuckDB portfolio shell</b><br>Database ready. Run <code>.tables</code> or choose an example query.";
      input.focus();
    } catch (error) {
      connectionPromise = undefined;
      if (!document.getElementById("f-query-form")) return;
      setEngineState("DuckDB failed", "error");
      const welcome = transcript.querySelector(".f-welcome");
      if (welcome) welcome.textContent = "DuckDB could not start. Check the browser connection and reload this variant.";
      appendText(transcript, error instanceof Error ? error.message : String(error), "f-error");
    }
  };
})();
