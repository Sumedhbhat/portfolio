const replacements: Record<string, string> = {
  "\\": "\\textbackslash{}",
  "{": "\\{",
  "}": "\\}",
  "%": "\\%",
  "$": "\\$",
  "&": "\\&",
  "#": "\\#",
  "_": "\\_",
  "^": "\\textasciicircum{}",
  "~": "\\textasciitilde{}",
};

export function escapeLatex(value: unknown) {
  return String(value)
    .replace(/[\\{}%$&#_^~]/g, (character) => replacements[character] ?? character)
    .replaceAll("–", "--")
    .replaceAll("—", "---")
    .replaceAll("’", "'");
}
