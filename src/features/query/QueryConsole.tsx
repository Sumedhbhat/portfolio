import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { portfolio } from "../../data/portfolio";
import { executeQuery, getConnection, type QueryOutput } from "./database";

const examples = [
  { label: ".tables", query: ".tables" },
  { label: "Where I worked", query: "SELECT * FROM where_i_worked ORDER BY company;" },
  { label: "Position history", query: "SELECT c.name AS company, p.title, strftime(p.start_date, '%b %Y') AS started, COALESCE(strftime(p.end_date, '%b %Y'), 'Present') AS ended FROM positions p JOIN companies c ON c.id = p.company_id ORDER BY p.start_date;" },
  { label: "Work points", query: "SELECT c.name AS company, w.title, w.description, w.impact FROM work_points w JOIN companies c ON c.id = w.company_id ORDER BY c.name, w.id;" },
];

interface TranscriptEntry {
  id: number;
  query: string;
  output?: QueryOutput;
  error?: string;
}

export function QueryConsole() {
  const [engine, setEngine] = useState<"loading" | "ready" | "error">("loading");
  const [engineError, setEngineError] = useState("");
  const [query, setQuery] = useState("SELECT * FROM where_i_worked;");
  const [running, setRunning] = useState(false);
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const history = useRef<string[]>([]);
  const historyIndex = useRef(0);
  const nextId = useRef(1);
  const transcript = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void getConnection().then(() => setEngine("ready")).catch((error) => {
      setEngine("error");
      setEngineError(error instanceof Error ? error.message : String(error));
    });
  }, []);

  useEffect(() => {
    transcript.current?.scrollTo({ top: transcript.current.scrollHeight });
  }, [entries]);

  async function run(rawQuery: string) {
    const value = rawQuery.trim();
    if (!value || running) return;
    if (value === ".clear") {
      setEntries([]);
      return;
    }

    const id = nextId.current++;
    history.current.push(value);
    historyIndex.current = history.current.length;
    setEntries((current) => [...current, { id, query: value }]);
    setRunning(true);
    try {
      const output = await executeQuery(value);
      setEntries((current) => current.map((entry) => entry.id === id ? { ...entry, output } : entry));
      setEngine("ready");
    } catch (error) {
      setEntries((current) => current.map((entry) => entry.id === id ? { ...entry, error: error instanceof Error ? error.message : String(error) } : entry));
      if (engine === "loading") setEngine("error");
    } finally {
      setRunning(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void run(query);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void run(query);
    } else if (event.key === "ArrowUp" && history.current.length) {
      event.preventDefault();
      historyIndex.current = Math.max(0, historyIndex.current - 1);
      setQuery(history.current[historyIndex.current]);
    } else if (event.key === "ArrowDown" && history.current.length) {
      event.preventDefault();
      historyIndex.current = Math.min(history.current.length, historyIndex.current + 1);
      setQuery(history.current[historyIndex.current] ?? "");
    }
  }

  const schema = [
    ["companies", portfolio.companies.length], ["positions", portfolio.positions.length],
    ["work_points", portfolio.professionalWork.length], ["projects", portfolio.projects.length],
    ["profile", 1], ["skills", portfolio.skills.length], ["recognition", portfolio.recognition.length],
    ["education", portfolio.education.length], ["where_i_worked", "view"],
  ];

  return (
    <div className="layout-f"><div className="f-shell">
      <nav className="f-nav"><strong>{portfolio.profile.name} / Query Console</strong><div><span className="f-live">Runs in your browser</span><a href={`mailto:${portfolio.profile.email}`}>Contact</a></div></nav>
      <main className="f-workbench">
        <aside aria-label="Database schema" className="f-schema">
          <div><div className="f-schema-head"><h2>main</h2><span>Schema</span></div><ul className="f-tree">{schema.map(([name, count]) => <li key={name}>{name}<small>{typeof count === "number" ? `${count} rows` : count}</small></li>)}</ul></div>
          <p className="f-schema-note">Start with <code>SELECT * FROM where_i_worked;</code>, inspect a table with <code>.schema positions</code>, or run any DuckDB SQL. Changes live only for this browser session.</p>
        </aside>
        <section aria-label="Interactive DuckDB terminal" className="f-terminal">
          <header className="f-terminal-bar"><span aria-hidden="true" className="f-dots"><i /><i /><i /></span><span className="f-terminal-title">portfolio.duckdb — local session</span><span className={`f-engine-state is-${engine}`} role="status">{engine === "ready" ? "DuckDB ready" : engine === "error" ? "DuckDB failed" : "Loading database engine"}</span></header>
          <div aria-label="Example queries" className="f-examples"><span>Try</span>{examples.map((example) => <button className="f-example" disabled={running} key={example.label} onClick={() => { setQuery(example.query); void run(example.query); }} type="button">{example.label}</button>)}</div>
          <div aria-live="polite" className="f-transcript" ref={transcript}>
            {!entries.length && <div className="f-welcome"><b>DuckDB portfolio shell</b><br />{engine === "ready" ? "Database ready. Run .tables or choose an example query." : engine === "error" ? `DuckDB could not start: ${engineError}` : "Loading the database and résumé records…"}</div>}
            {entries.map((entry) => <Transcript key={entry.id} entry={entry} />)}
          </div>
          <form className="f-query-form" onSubmit={submit}>
            <label className="f-input-wrap"><span aria-hidden="true" className="f-prompt">›</span><textarea aria-label="SQL query" className="f-query" onChange={(event) => setQuery(event.target.value)} onKeyDown={handleKeyDown} placeholder="SELECT * FROM where_i_worked;" rows={2} spellCheck={false} value={query} /></label>
            <button className="f-run" disabled={running || engine === "error"} type="submit">{running ? "Running…" : "Run query"}</button>
            <p className="f-hint">Enter to run · Shift + Enter for a new line · ↑↓ for query history · .help for commands</p>
          </form>
        </section>
      </main>
    </div></div>
  );
}

function Transcript({ entry }: { entry: TranscriptEntry }) {
  return (
    <section className="f-entry">
      <div className="f-command"><span>{entry.query}</span></div>
      {!entry.output && !entry.error && <pre className="f-text-result">Waiting for DuckDB…</pre>}
      {entry.error && <pre className="f-text-result f-error">{entry.error}</pre>}
      {entry.output?.type === "text" && <pre className="f-text-result">{entry.output.text}</pre>}
      {entry.output?.type === "table" && <><p className="f-result-meta">{entry.output.rows.length} {entry.output.rows.length === 1 ? "row" : "rows"} · {entry.output.elapsed} ms</p><div className="f-result-wrap"><table className="f-result"><thead><tr>{entry.output.columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr></thead><tbody>{entry.output.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, columnIndex) => <td key={`${rowIndex}-${columnIndex}`}>{cell}</td>)}</tr>)}</tbody></table></div></>}
    </section>
  );
}
