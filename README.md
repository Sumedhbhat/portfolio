# Portfolio and resume

This repository builds two presentations from one canonical career record:

- a React portfolio with Reader, Query Console, and Career Graph experiences;
- a generated LaTeX resume published as a PDF.

All authored career content lives in domain-level JSON files under [`data/portfolio/`](data/portfolio/). [`src/data/portfolio.ts`](src/data/portfolio.ts) validates and composes them into one typed portfolio record. React, DuckDB, the career graph, and the résumé generator all consume that same record.

## Development

```sh
npm install
npm run dev
```

Run the complete web and resume checks with:

```sh
make check
```

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the project map and content-editing workflow.
