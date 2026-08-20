import type { PortfolioData } from "../../data/schema";
import { escapeLatex } from "../escape-latex";

export function renderSummarySection(data: PortfolioData) {
  return [
    "%-----------SUMMARY-----------------",
    "\\section{\\textbf{Summary}}",
    "\\begingroup",
    "\\raggedright",
    "\\hyphenpenalty=10000",
    "\\exhyphenpenalty=10000",
    escapeLatex(data.profile.resumeSummary),
    "\\par",
    "\\endgroup",
  ];
}
