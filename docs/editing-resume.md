# Editing the resume

The portfolio JSON owns career facts. The files under `src/resume/sections/` own how each résumé section appears in LaTeX.

## Add a position or experience

You do not need to edit generator code.

For another position at an existing company:

1. Add the role to `data/portfolio/positions.json` with the existing `companyId`.
2. Add its evidence bullets to `data/portfolio/professional-work.json` with the same `companyId`.
3. Put records in the order you want them to appear.

For a new company, first add it to `data/portfolio/companies.json` and use its new `id` as the `companyId` in both files above.

The PDF uses `resumeDates` from positions and `resumeBullet` from professional work. The portfolio website uses the longer description and impact fields from those same records.

## Add a résumé section

1. Add the section's career facts to the appropriate file under `data/portfolio/`. If the facts form a new domain collection, add a JSON file and register it in `src/data/schema.ts` and `src/data/portfolio.ts`.
2. Create one renderer under `src/resume/sections/`, such as `certifications.ts`.
3. Export a function with this shape:

```ts
import type { PortfolioData } from "../../data/schema";

export function renderCertificationsSection(data: PortfolioData) {
  return [
    "%-----------CERTIFICATIONS-----------------",
    "\\section{\\textbf{Certifications}}",
    // Return one LaTeX line per array item.
  ];
}
```

4. Import the function in `src/resume/section-order.ts` and add it where the section should appear.
5. Add a focused test beside the section file, then run `make check`.

## Change an existing section

Each section has one source file:

```text
src/resume/sections/profile.ts      contact commands used by the header
src/resume/sections/summary.ts      summary
src/resume/sections/experience.ts   companies, positions, bullets, recognition
src/resume/sections/skills.ts       technical skills
src/resume/sections/education.ts    education
```

`src/resume/section-order.ts` controls the order. `src/resume/escape-latex.ts` handles special characters. `scripts/generate-resume.ts` only writes the generated file and normally needs no editing.
