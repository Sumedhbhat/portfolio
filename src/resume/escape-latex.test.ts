import { describe, expect, it } from "vitest";
import { escapeLatex } from "./escape-latex";

describe("LaTeX escaping", () => {
  it.each([
    ["\\", "\\textbackslash{}"],
    ["{value}", "\\{value\\}"],
    ["50% & $5 #1_a", "50\\% \\& \\$5 \\#1\\_a"],
    ["x^2 ~ y", "x\\textasciicircum{}2 \\textasciitilde{} y"],
    ["one–two — it’s", "one--two --- it's"],
  ])("escapes %s", (input, expected) => {
    expect(escapeLatex(input)).toBe(expected);
  });
});
