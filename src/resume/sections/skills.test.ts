import { describe, expect, it } from "vitest";
import { portfolio } from "../../data/portfolio";
import { escapeLatex } from "../escape-latex";
import { renderSkillsSection } from "./skills";

describe("skills section", () => {
  it("falls back to the full skill list", () => {
    const data = structuredClone(portfolio);
    data.skills[0].resumeItems = undefined;

    expect(renderSkillsSection(data).join("\n")).toContain(
      escapeLatex(data.skills[0].items.join(", ")),
    );
  });
});
