import { describe, expect, it } from "vitest";
import { portfolio } from "../../data/portfolio";
import { renderEducationSection } from "./education";

describe("education section", () => {
  it("renders each education record in source order", () => {
    const output = renderEducationSection(portfolio).join("\n");
    const offsets = portfolio.education.map((education) => output.indexOf(education.institution));

    expect(offsets).toEqual([...offsets].sort((left, right) => left - right));
  });
});
