# Portfolio and resume

This repository builds two presentations from one canonical career record:

- a React portfolio with Reader, Query Console, and Career Graph experiences;
- a generated LaTeX resume published as a PDF.

All authored career content lives in [`data/portfolio.json`](data/portfolio.json). React reads it directly, DuckDB tables and graph nodes are derived from it at runtime, and `scripts/generate-resume.mjs` turns it into LaTeX during the resume build.

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
