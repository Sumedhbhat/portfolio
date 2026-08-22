# Editing the resume

The portfolio JSON owns career facts. The files under `source/sections/` own how each résumé section appears. LuaLaTeX reads the JSON directly, so there is no generated TypeScript template between the data and the résumé.

## Add a position or experience

You do not need to edit generator code.

For another position at an existing company:

1. Add the role to `data/portfolio/positions.json` with the existing `companyId`.
2. Add its evidence bullets to `data/portfolio/professional-work.json` with the same `companyId`.
3. Put records in the order you want them to appear.

For a new company, first add it to `data/portfolio/companies.json` and use its new `id` as the `companyId` in both files above.

The PDF uses `resumeDates` from positions and `resumeBullet` from professional work. The portfolio website uses the longer description and impact fields from those same records.

## Add a résumé section

1. Add the section's career facts to the appropriate file under `data/portfolio/`.
2. Create one TeX file under `source/sections/`, such as `certifications.tex`.
3. Read the JSON collection through `resume.data` inside a `luacode*` block:

```tex
\section{\textbf{Certifications}}
\begin{luacode*}
for _, certification in ipairs(resume.data.certifications) do
  resume.line("\\textbf{" .. resume.escape(certification.name) .. "}")
end
\end{luacode*}
```

4. Add `\input{source/sections/certifications}` at the intended position in `source/resume.tex`.
5. If this is a new domain collection, also register its JSON file in `src/data/schema.ts`, `src/data/portfolio.ts`, and `source/lib/resume-data.lua`.
6. Add a data validation test, then run `make check`.

## Change an existing section

Each section has one source file:

```text
source/sections/profile.tex      contact commands used by the header
source/sections/summary.tex      summary
source/sections/experience.tex   companies, positions, bullets, recognition
source/sections/skills.tex       technical skills
source/sections/education.tex    education
```

`source/resume.tex` controls the order. `source/lib/resume-data.lua` loads JSON, finds related records, and escapes special characters. Most résumé changes only touch JSON or one section file.
