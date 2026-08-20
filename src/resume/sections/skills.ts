import type { PortfolioData } from "../../data/schema";
import { escapeLatex } from "../escape-latex";

export function renderSkillsSection(data: PortfolioData) {
  return [
    "%-----------TECHNICAL SKILLS-----------------",
    "\\section{\\textbf{Technical Skills}}",
    "\\begin{itemize}[leftmargin=0.05in, label={}, noitemsep, topsep=1mm]",
    ...data.skills.map((skill) =>
      `\\item{\\textbf{${escapeLatex(skill.resumeGroup)}}{: ${escapeLatex((skill.resumeItems ?? skill.items).join(", "))}}}`,
    ),
    "\\end{itemize}",
    "\\vspace{0mm}",
  ];
}
