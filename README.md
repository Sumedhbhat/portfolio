# Portfolio and resume

This repository builds two presentations from one canonical career record:

- a React portfolio with Reader, Query Console, and Career Graph experiences;
- a LuaLaTeX resume published as a PDF.

All authored career content lives in domain-level JSON files under [`data/portfolio/`](data/portfolio/). [`src/data/portfolio.ts`](src/data/portfolio.ts) validates and composes them for React, DuckDB, and the career graph. LuaLaTeX reads the same JSON directly from the authored files under [`source/sections/`](source/sections/).

See [`docs/editing-resume.md`](docs/editing-resume.md) for the exact steps to add experience, add a section, or change section order.

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
