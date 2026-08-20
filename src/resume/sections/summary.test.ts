import { describe, expect, it } from "vitest";
import { portfolio } from "../../data/portfolio";
import { renderSummarySection } from "./summary";

describe("summary section", () => {
  it("uses the resume-specific summary", () => {
    expect(renderSummarySection(portfolio)).toContain(
      portfolio.profile.resumeSummary.replaceAll("–", "--").replaceAll("—", "---").replaceAll("’", "'"),
    );
  });
});
