import { describe, expect, it } from "vitest";
import { portfolio } from "../data/portfolio";
import { createResumeProjection } from "./create-resume-projection";
import { escapeLatex } from "./escape-latex";
import { renderResume } from "./render-resume";

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

describe("resume projection", () => {
  it("preserves company and position order", () => {
    const resume = createResumeProjection(portfolio);
    const includedCompanies = portfolio.companies.filter((company) =>
      portfolio.positions.some((position) => position.companyId === company.id)
      && portfolio.professionalWork.some((work) => work.companyId === company.id),
    );

    expect(resume.experience.map((item) => item.company)).toEqual(
      includedCompanies.map((company) => company.name),
    );
    expect(resume.experience[0].positions.map((position) => position.title)).toEqual(
      portfolio.positions
        .filter((position) => position.companyId === includedCompanies[0].id)
        .map((position) => position.title),
    );
  });

  it("omits a company without work evidence", () => {
    const data = structuredClone(portfolio);
    const omittedCompany = data.companies[0];
    data.professionalWork = data.professionalWork.filter(
      (work) => work.companyId !== omittedCompany.id,
    );

    expect(createResumeProjection(data).experience).not.toContainEqual(
      expect.objectContaining({ company: omittedCompany.name }),
    );
  });

  it("includes only recognition with resume text for that company", () => {
    const data = structuredClone(portfolio);
    const companyId = data.companies[0].id;
    data.recognition = [
      { id: 101, year: "2026", title: "Visible", note: "Visible", companyId, resumeText: "Visible recognition." },
      { id: 102, year: "2026", title: "Hidden", note: "Hidden", companyId },
      { id: 103, year: "2026", title: "Other", note: "Other", companyId: data.companies[1].id, resumeText: "Other recognition." },
    ];

    const company = createResumeProjection(data).experience.find(
      (item) => item.company === data.companies[0].name,
    );
    expect(company?.recognition).toEqual(["Visible recognition."]);
  });

  it("falls back to the full skill list", () => {
    const data = structuredClone(portfolio);
    data.skills[0].resumeItems = undefined;

    expect(createResumeProjection(data).skills[0].items).toEqual(data.skills[0].items);
  });
});

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
