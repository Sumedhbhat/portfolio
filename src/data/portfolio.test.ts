import { describe, expect, it } from "vitest";
import { buildGraph } from "../features/graph/buildGraph";
import { portfolio } from "./portfolio";
import { portfolioSchema } from "./schema";

describe("canonical portfolio data", () => {
  it("keeps company references valid and identifiers unique", () => {
    const companyIds = new Set(portfolio.companies.map((company) => company.id));
    expect(companyIds.size).toBe(portfolio.companies.length);
    expect(new Set(portfolio.positions.map((position) => position.id)).size).toBe(portfolio.positions.length);
    expect(new Set(portfolio.professionalWork.map((work) => work.id)).size).toBe(portfolio.professionalWork.length);
    for (const item of [...portfolio.positions, ...portfolio.professionalWork]) expect(companyIds.has(item.companyId)).toBe(true);
  });

  it("builds every experience from the canonical records", () => {
    const graph = buildGraph(portfolio);
    expect(graph.nodes.filter((node) => node.type === "position")).toHaveLength(portfolio.positions.length);
    expect(graph.nodes.filter((node) => node.type === "work")).toHaveLength(portfolio.professionalWork.length);
    expect(graph.nodes.filter((node) => node.type === "education")).toHaveLength(portfolio.education.length);
  });

  it("rejects malformed domain data at runtime", () => {
    const invalidPortfolio = structuredClone(portfolio);
    invalidPortfolio.profile.email = "not-an-email";
    expect(portfolioSchema.safeParse(invalidPortfolio).success).toBe(false);
  });

  it("rejects references to companies that do not exist", () => {
    const invalidPortfolio = structuredClone(portfolio);
    invalidPortfolio.positions[0].companyId = 999;
    const result = portfolioSchema.safeParse(invalidPortfolio);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(expect.objectContaining({
        path: ["positions", 0, "companyId"],
      }));
    }
  });
});
