# Contributing

Thank you for contributing to Resume Tracker. This guide explains how to update the resume, validate changes, and work with specialized resume variants.

## Release rule

A pull request or an open branch does not publish a resume.

A successful push to `master`, including a pull-request merge, automatically publishes the main resume. The workflow creates a tag named `release-master-<run-number>` on that commit and attaches `Sumedh_S_Bhat.pdf`.

Specialized resumes are published only when a tag beginning with `resume-` is pushed. The tag may point to a commit on any branch, so a specialized resume can be released without merging that branch into `master`.

See [`docs/release-management.md`](docs/release-management.md) for the complete release lifecycle.

## Resume organization

The resume is assembled by `source/resume.tex`. Personal details are stored in `source/personal-info.tex`.

Shared LaTeX setup is organized separately:

- `source/config/packages.tex` contains package imports.
- `source/config/layout.tex` contains page, text, table, and section styling.
- `source/utils/resume-commands.tex` contains reusable resume commands, list helpers, and column types.

Each category has a folder under `source/sections/`:

- `header/`
- `summary/`
- `experience/`
- `projects/`
- `skills/`
- `education/`
- `certifications/`
- `achievements/`

Every category folder contains:

- `section.tex`, which controls the category heading and entry order.
- `_template.tex`, which provides reusable placeholder content.
- One `.tex` file for each individual entry, or a company folder for experience spanning multiple positions.

The order of the complete resume is controlled by the `\input` lines in `source/resume.tex`. The order within a category is controlled by the `\input` lines in that category's `section.tex`.

## Adding an entry

1. Copy the category's `_template.tex` file.
2. Give the copied file a descriptive lowercase, hyphen-separated name.
3. Replace all placeholder content.
4. Add the `\input` line shown in the template to the category's `section.tex`.
5. Place the `\input` line where the entry should appear in the resume.

For example, to add an experience:

```sh
cp source/sections/experience/_template.tex source/sections/experience/company-name.tex
```

Then add this line to `source/sections/experience/section.tex`:

```tex
\input{source/sections/experience/company-name}
```

Do not add `_template.tex` itself to a `section.tex` file. Templates are linted but are not rendered. The `make lint` command fails if any other entry file is missing from its category's `section.tex`.

### Adding multiple positions at one company

Use a company folder when one employer has multiple positions. This renders the company name and location once while keeping each position in its own file:

```text
source/sections/experience/company-name/
├── section.tex
├── newer-position.tex
└── earlier-position.tex
```

The company folder's `section.tex` owns the shared heading and position order:

```tex
\resumeCompanyHeading{COMPANY NAME}{LOCATION}
\input{source/sections/experience/company-name/newer-position}
\input{source/sections/experience/company-name/earlier-position}
```

Each position file owns its title, dates, and bullet points:

```tex
\resumePositionHeading{JOB TITLE}{START DATE - END DATE}
\vspace{1.0mm}
\resumeItemListStart
    \item{Describe an accomplishment and its measurable result.}
\resumeItemListEnd
```

Finally, include the company folder from `source/sections/experience/section.tex`:

```tex
\input{source/sections/experience/company-name/section}
```

The include linter checks both the company folder and its individual position files.

## Optional sections

Summary and Certifications are disabled by default. Enable either one by uncommenting its `\input` line in `source/resume.tex`:

```tex
\input{source/sections/summary/section}
\input{source/sections/certifications/section}
```

## LaTeX content

Escape LaTeX special characters when they should appear as text:

| Character | Write |
| --- | --- |
| `%` | `\%` |
| `&` | `\&` |
| `#` | `\#` |
| `_` | `\_` |

Follow the formatting already used by neighboring entries. Avoid changing files in `source/config/` or `source/utils/` unless the change is intended to affect the entire resume.

## Validate changes locally

Run the custom lint-rule tests:

```sh
make test
```

Run syntax and section-include linting:

```sh
make lint
```

Compile the PDF:

```sh
make build
```

Run all checks, including tests, linting, compilation, PDF verification, and configured layout-warning checks:

```sh
make check
```

The generated PDF is written to `build/Sumedh_S_Bhat.pdf`. Review it visually before opening a pull request or creating a release tag.

## Pull requests

Pull requests targeting `master` automatically:

1. Lint every LaTeX source and template file.
2. Compile the resume.
3. Verify that a non-empty PDF was generated.
4. Fail on configured layout warnings.

Pull-request checks do not upload the PDF as an Actions artifact and do not create a GitHub release.

After the pull request is merged, the resulting push to `master` runs the checks again. If they pass, the workflow creates a build-numbered `release-master-*` tag and publishes the main resume.

## Specialized resume branches

Use a separate branch for a resume aimed at a specific role when those changes should not become part of the main resume. For example:

```sh
git switch -c resume/cybersecurity
make check
```

The branch may remain separate from `master`. If the specialized resume should be published, create and push a `resume-*` tag that points to the desired commit. See [`docs/release-management.md`](docs/release-management.md) for exact commands and naming behavior.

## Contribution checklist

Before submitting or publishing changes, confirm that:

- Content was added to the correct category folder.
- A descriptive filename was used.
- The category's `section.tex` includes the entry in the intended position.
- LaTeX special characters are escaped.
- Placeholder text and example links were removed.
- `make check` passes.
- The generated PDF was reviewed visually.
- Changes merged into `master` are ready to be published automatically.
- A `resume-*` tag is created only when a specialized branch release is intended.
