import { describe, expect, it } from "vitest";
import { portfolio } from "../../data/portfolio";
import { renderExperienceSection } from "./experience";

describe("experience section", () => {
  it("preserves company and position order", () => {
    const output = renderExperienceSection(portfolio).join("\n");
    const includedCompanies = portfolio.companies.filter((company) =>
      portfolio.positions.some((position) => position.companyId === company.id)
      && portfolio.professionalWork.some((work) => work.companyId === company.id),
    );
    const companyOffsets = includedCompanies.map((company) => output.indexOf(company.name));

    expect(companyOffsets).toEqual([...companyOffsets].sort((left, right) => left - right));
    const firstCompanyPositions = portfolio.positions.filter(
      (position) => position.companyId === includedCompanies[0].id,
    );
    const positionOffsets = firstCompanyPositions.map((position) => output.indexOf(position.title));
    expect(positionOffsets).toEqual([...positionOffsets].sort((left, right) => left - right));
  });

  it("omits a company without work evidence", () => {
    const data = structuredClone(portfolio);
    const omittedCompany = data.companies[0];
    data.professionalWork = data.professionalWork.filter(
      (work) => work.companyId !== omittedCompany.id,
    );

    expect(renderExperienceSection(data).join("\n")).not.toContain(omittedCompany.name);
  });

  it("includes only recognition with resume text for that company", () => {
    const data = structuredClone(portfolio);
    const companyId = data.companies[0].id;
    data.recognition = [
      { id: 101, year: "2026", title: "Visible", note: "Visible", companyId, resumeText: "Visible recognition." },
      { id: 102, year: "2026", title: "Hidden", note: "Hidden", companyId },
      { id: 103, year: "2026", title: "Other", note: "Other", companyId: 999, resumeText: "Other recognition." },
    ];

    const output = renderExperienceSection(data).join("\n");
    expect(output).toContain("Visible recognition.");
    expect(output).not.toContain("Other recognition.");
  });
});
