import rawPortfolio from "../../data/portfolio.json";
import type { PortfolioData } from "./types";

export const portfolio = rawPortfolio as PortfolioData;

export function companyById(companyId: number) {
  const company = portfolio.companies.find((candidate) => candidate.id === companyId);
  if (!company) throw new Error(`Unknown company id: ${companyId}`);
  return company;
}

export const experience = portfolio.positions.map((position) => ({
  ...position,
  company: companyById(position.companyId),
}));

export const professionalWork = portfolio.professionalWork.map((work) => ({
  ...work,
  company: companyById(work.companyId),
}));
