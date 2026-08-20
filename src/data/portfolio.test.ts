import { describe, expect, it } from "vitest";
import { buildGraph } from "../features/graph/buildGraph";
import { portfolio } from "./portfolio";

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
});
