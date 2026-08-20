import type { PortfolioData } from "../../data/schema";
import { escapeLatex } from "../escape-latex";

export function renderExperienceSection(data: PortfolioData) {
  const lines = [
    "%-----------EXPERIENCE-----------------",
    "\\section{\\textbf{Experience}}",
    "\\resumeSubHeadingListStart",
  ];

  for (const company of data.companies) {
    const positions = data.positions.filter((position) => position.companyId === company.id);
    const work = data.professionalWork.filter((item) => item.companyId === company.id);

    // A resume company needs both a role heading and at least one evidence bullet.
    if (positions.length === 0 || work.length === 0) continue;

    lines.push(
      `\\resumeCompany{${escapeLatex(company.name)}}{${escapeLatex(company.location)}}{`,
      ...positions.map((position) =>
        `    \\resumePosition{${escapeLatex(position.title)}}{${escapeLatex(position.resumeDates)}}`,
      ),
      "}",
      "\\resumeItemListStart",
      ...work.map((item) => `    \\item{${escapeLatex(item.resumeBullet)}}`),
      "\\resumeItemListEnd",
    );

    const recognition = data.recognition.filter(
      (item) => item.companyId === company.id && item.resumeText,
    );
    lines.push(...recognition.map((item) =>
      `\\noindent\\hspace{3ex}\\small{\\textbf{Recognition:} ${escapeLatex(item.resumeText)}}`,
    ));
  }

  lines.push("\\resumeSubHeadingListEnd", "\\vspace{-3mm}");
  return lines;
}
