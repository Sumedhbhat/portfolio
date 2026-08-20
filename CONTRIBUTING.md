# Contributing

## One source of truth

Edit career content only in `data/portfolio.json`. It owns the profile, companies, positions, professional work, projects, skills, recognition, and education used everywhere else.

Do not copy this content into React components, SQL seed statements, graph configuration, or LaTeX files:

- `src/data/portfolio.ts` provides typed selectors for the React app.
- `src/features/query/database.ts` derives DuckDB tables from the same data.
- `src/features/graph/buildGraph.ts` derives graph nodes and relationships from it.
- `scripts/generate-resume.mjs` generates `build/generated/resume-content.tex` for LaTeX.

The generated LaTeX file is build output and must not be committed or edited.

## Project map

```text
data/portfolio.json             canonical career content
src/App.tsx                     edition routing
src/components/                 shared React components
src/features/reader/            primary book experience
src/features/query/             DuckDB console and database projection
src/features/graph/             D3 career graph and graph projection
src/styles/                     styles split by experience
scripts/generate-resume.mjs     JSON-to-LaTeX generator
source/                         stable LaTeX layout and commands
```

The root `index.html` is only Vite’s mount document. It contains no portfolio data, templates, styles, or application behavior.

## Updating content

1. Edit the relevant record in `data/portfolio.json`.
2. Keep IDs stable because positions, work, recognition, and graph links refer to them.
3. Use `resumeBullet` when a professional-work item needs resume-specific phrasing; the web description and impact remain part of that same canonical record.
4. Run `make check`.
5. Review both the React app and `build/Sumedh_S_Bhat.pdf` before opening a pull request.

The tests reject broken company references and duplicate identifiers. The resume generator also validates the data before emitting LaTeX.

## React development

Install dependencies and start Vite:

```sh
npm install
npm run dev
```

Useful commands:

```sh
npm test       # shared-data and projection tests
npm run build  # TypeScript and production Vite build
npm run check  # both of the above
```

Keep presentation code inside the feature that owns it. Shared data selectors belong in `src/data/`; small reusable UI belongs in `src/components/`.

## Resume generation

Generate the intermediate LaTeX and build the PDF:

```sh
make generate
make build
```

Run the complete validation suite:

```sh
make check
```

This validates the canonical data, runs React tests and type checking, builds the production site, lints generated and static LaTeX, compiles the PDF, and fails on configured layout warnings.

## Releases

A successful push to `master`, including a merged pull request, publishes the main resume. The workflow creates a `release-master-<run-number>` tag and attaches `Sumedh_S_Bhat.pdf`.

Specialized resumes are published only when a tag beginning with `resume-` is pushed. See `docs/release-management.md` for the release lifecycle.

The Pages workflow builds and deploys the React app from `dist/` whenever its source or canonical data changes on `master`.
