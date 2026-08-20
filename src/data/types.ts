export interface Profile {
  name: string;
  role: string;
  focus: string;
  location: string;
  phone: string;
  email: string;
  github: string;
  githubLabel: string;
  linkedin: string;
  linkedinLabel: string;
  summary: string;
  resumeSummary: string;
}

export interface Company {
  id: number;
  name: string;
  location: string;
  displayLocation: string;
  description: string;
}

export interface Position {
  id: number;
  companyId: number;
  title: string;
  startDate: string;
  endDate: string | null;
  displayDates: string;
  resumeDates: string;
  description: string;
}

export interface ProfessionalWork {
  id: number;
  companyId: number;
  title: string;
  status: string;
  description: string;
  impact: string;
  resumeBullet: string;
  tags: string[];
}

export interface ProjectLink {
  label: string;
  url: string;
}

export interface Project {
  id: number;
  title: string;
  kind: string;
  status: string;
  year: string;
  description: string;
  tags: string[];
  links: ProjectLink[];
}

export interface SkillGroup {
  id: string;
  group: string;
  resumeGroup: string;
  items: string[];
  resumeItems?: string[];
}

export interface Recognition {
  id: number;
  year: string;
  title: string;
  note: string;
  companyId?: number;
  resumeText?: string;
}

export interface Education {
  id: number;
  institution: string;
  degree: string;
  shortDegree: string;
  startYear: number;
  endYear: number;
  cgpa: number;
}

export interface PortfolioData {
  profile: Profile;
  companies: Company[];
  positions: Position[];
  professionalWork: ProfessionalWork[];
  projects: Project[];
  skills: SkillGroup[];
  recognition: Recognition[];
  education: Education[];
}
