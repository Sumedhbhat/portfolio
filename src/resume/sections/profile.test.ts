import { describe, expect, it } from "vitest";
import { portfolio } from "../../data/portfolio";
import { renderProfileSection } from "./profile";

describe("profile section", () => {
  it("defines the contact commands used by the LaTeX header", () => {
    const output = renderProfileSection(portfolio.profile).join("\n");

    expect(output).toContain(`\\newcommand{\\resumeName}{${portfolio.profile.name}}`);
    expect(output).toContain(`\\newcommand{\\resumeEmail}{${portfolio.profile.email}}`);
    expect(output).toContain(`\\newcommand{\\resumeLinkedinUrl}{${portfolio.profile.linkedin}}`);
  });
});
