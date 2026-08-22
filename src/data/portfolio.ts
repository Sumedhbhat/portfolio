import companies from "../../data/portfolio/companies.json";
import education from "../../data/portfolio/education.json";
import positions from "../../data/portfolio/positions.json";
import professionalWorkRecords from "../../data/portfolio/professional-work.json";
import profile from "../../data/portfolio/profile.json";
import projects from "../../data/portfolio/projects.json";
import recognition from "../../data/portfolio/recognition.json";
import skills from "../../data/portfolio/skills.json";
import { portfolioSchema } from "./schema";

export const portfolio = portfolioSchema.parse({
  profile,
  companies,
  positions,
  professionalWork: professionalWorkRecords,
  projects,
  skills,
  recognition,
  education,
});

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
