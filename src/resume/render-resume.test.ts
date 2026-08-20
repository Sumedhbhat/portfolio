import { describe, expect, it } from "vitest";
import { portfolio } from "../data/portfolio";
import { renderResume } from "./render-resume";

describe("resume rendering", () => {
  it("renders sections in document order and ends with a newline", () => {
    const output = renderResume(portfolio);
    const sections = ["Summary", "Experience", "Technical Skills", "Education"];
    const offsets = sections.map((section) => output.indexOf(`\\section{\\textbf{${section}}}`));

    expect(offsets).toEqual([...offsets].sort((left, right) => left - right));
    expect(offsets.every((offset) => offset >= 0)).toBe(true);
    expect(output.endsWith("\n")).toBe(true);
  });
});
