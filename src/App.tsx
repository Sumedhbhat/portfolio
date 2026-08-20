import { lazy, Suspense, useEffect, useState } from "react";
import { portfolio } from "./data/portfolio";
import { ReaderEdition } from "./features/reader/ReaderEdition";

const QueryConsole = lazy(() => import("./features/query/QueryConsole").then((module) => ({ default: module.QueryConsole })));
const CareerGraph = lazy(() => import("./features/graph/CareerGraph").then((module) => ({ default: module.CareerGraph })));

export type Edition = "reader" | "query" | "graph";

function editionFromUrl(): Edition {
  const variant = new URLSearchParams(window.location.search).get("variant")?.toUpperCase();
  if (variant === "F") return "query";
  if (variant === "G") return "graph";
  return "reader";
}

function updateUrl(edition: Edition, replace = false) {
  const url = new URL(window.location.href);
  url.searchParams.delete("work");
  if (edition === "query") url.searchParams.set("variant", "F");
  else if (edition === "graph") url.searchParams.set("variant", "G");
  else url.searchParams.delete("variant");
  if (edition !== "reader") url.hash = "";
  window.history[replace ? "replaceState" : "pushState"]({}, "", url);
}

export function App() {
  const [edition, setEdition] = useState<Edition>(editionFromUrl);

  useEffect(() => {
    const handlePopState = () => setEdition(editionFromUrl());
    window.addEventListener("popstate", handlePopState);
    updateUrl(edition, true);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const names: Record<Edition, string> = {
      reader: "Reader’s Edition",
      query: "Query Console",
      graph: "Career Graph",
    };
    document.title = `${names[edition]} · ${portfolio.profile.name}`;
    document.documentElement.dataset.currentVariant = edition;
  }, [edition]);

  function navigate(next: Edition) {
    updateUrl(next);
    setEdition(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  return (
    <>
      {edition === "reader" && <ReaderEdition onNavigate={navigate} />}
      <Suspense fallback={<div className="edition-loading">Opening this edition…</div>}>
        {edition === "query" && <QueryConsole />}
        {edition === "graph" && <CareerGraph />}
      </Suspense>
      {edition !== "reader" && (
        <button className="edition-return" onClick={() => navigate("reader")} type="button">
          <span aria-hidden="true">←</span> Back to Reader’s Edition
        </button>
      )}
    </>
  );
}
