import type { PortfolioData } from "../data/schema";
import { renderEducationSection } from "./sections/education";
import { renderExperienceSection } from "./sections/experience";
import { renderSkillsSection } from "./sections/skills";
import { renderSummarySection } from "./sections/summary";

export type ResumeSection = (data: PortfolioData) => string[];

// This array is the resume's section order. Add, remove, or move one entry here.
export const resumeSections = [
  renderSummarySection,
  renderExperienceSection,
  renderSkillsSection,
  renderEducationSection,
] satisfies ResumeSection[];
