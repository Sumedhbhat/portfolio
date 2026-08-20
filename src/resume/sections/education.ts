import type { PortfolioData } from "../../data/schema";
import { escapeLatex } from "../escape-latex";

export function renderEducationSection(data: PortfolioData) {
  return [
    "%-----------EDUCATION-----------------",
    "\\section{\\textbf{Education}}",
    "\\resumeSubHeadingListStart",
    ...data.education.flatMap((item) => [
      "\\resumeSubheading",
      `  {${escapeLatex(item.institution)}}{CGPA: \\textbf{${escapeLatex(item.cgpa)}}}`,
      `  {${escapeLatex(item.degree)}}{${item.startYear} - ${item.endYear}}`,
    ]),
    "\\resumeSubHeadingListEnd",
    "\\vspace{-1mm}",
  ];
}
