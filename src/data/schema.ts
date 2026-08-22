import { z } from "zod";

const requiredText = z.string().min(1);
const positiveId = z.number().int().positive();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected an ISO date (YYYY-MM-DD).");

export const profileSchema = z.strictObject({
  name: requiredText,
  role: requiredText,
  focus: requiredText,
  location: requiredText,
  phone: requiredText,
  email: z.email(),
  github: z.url(),
  githubLabel: requiredText,
  linkedin: z.url(),
  linkedinLabel: requiredText,
  summary: requiredText,
  resumeSummary: requiredText,
});

export const companySchema = z.strictObject({
  id: positiveId,
  name: requiredText,
  location: requiredText,
  displayLocation: requiredText,
  description: requiredText,
});

export const positionSchema = z.strictObject({
  id: positiveId,
  companyId: positiveId,
  title: requiredText,
  startDate: date,
  endDate: date.nullable(),
  displayDates: requiredText,
  resumeDates: requiredText,
  description: requiredText,
});

export const professionalWorkSchema = z.strictObject({
  id: positiveId,
  companyId: positiveId,
  title: requiredText,
  status: requiredText,
  description: requiredText,
  impact: requiredText,
  resumeBullet: requiredText,
  tags: z.array(requiredText).min(1),
});

export const projectLinkSchema = z.strictObject({
  label: requiredText,
  url: z.url(),
});

export const projectSchema = z.strictObject({
  id: positiveId,
  title: requiredText,
  kind: requiredText,
  status: requiredText,
  year: requiredText,
  description: requiredText,
  tags: z.array(requiredText).min(1),
  links: z.array(projectLinkSchema),
});

export const skillGroupSchema = z.strictObject({
  id: requiredText,
  group: requiredText,
  resumeGroup: requiredText,
  items: z.array(requiredText).min(1),
  resumeItems: z.array(requiredText).min(1).optional(),
});

export const recognitionSchema = z.strictObject({
  id: positiveId,
  year: requiredText,
  title: requiredText,
  note: requiredText,
  companyId: positiveId.optional(),
  resumeText: requiredText.optional(),
});

export const educationSchema = z.strictObject({
  id: positiveId,
  institution: requiredText,
  degree: requiredText,
  shortDegree: requiredText,
  startYear: z.number().int(),
  endYear: z.number().int(),
  cgpa: z.number().min(0).max(10),
});

const portfolioShape = z.strictObject({
  profile: profileSchema,
  companies: z.array(companySchema).min(1),
  positions: z.array(positionSchema).min(1),
  professionalWork: z.array(professionalWorkSchema).min(1),
  projects: z.array(projectSchema).min(1),
  skills: z.array(skillGroupSchema).min(1),
  recognition: z.array(recognitionSchema).min(1),
  education: z.array(educationSchema).min(1),
});

type Identified = { id: number | string };

function validateUniqueIds(
  records: Identified[],
  collection: keyof PortfolioData,
  context: z.RefinementCtx,
) {
  const seen = new Set<number | string>();
  records.forEach((record, index) => {
    if (seen.has(record.id)) {
      context.addIssue({
        code: "custom",
        message: `Duplicate id ${record.id}.`,
        path: [collection, index, "id"],
      });
    }
    seen.add(record.id);
  });
}

export const portfolioSchema = portfolioShape.superRefine((data, context) => {
  validateUniqueIds(data.companies, "companies", context);
  validateUniqueIds(data.positions, "positions", context);
  validateUniqueIds(data.professionalWork, "professionalWork", context);
  validateUniqueIds(data.projects, "projects", context);
  validateUniqueIds(data.skills, "skills", context);
  validateUniqueIds(data.recognition, "recognition", context);
  validateUniqueIds(data.education, "education", context);

  const companyIds = new Set(data.companies.map((company) => company.id));
  const references = [
    ...data.positions.map((record, index) => ({ collection: "positions", index, companyId: record.companyId })),
    ...data.professionalWork.map((record, index) => ({ collection: "professionalWork", index, companyId: record.companyId })),
    ...data.recognition.flatMap((record, index) => record.companyId === undefined
      ? []
      : [{ collection: "recognition", index, companyId: record.companyId }]),
  ];

  references.forEach(({ collection, index, companyId }) => {
    if (!companyIds.has(companyId)) {
      context.addIssue({
        code: "custom",
        message: `Unknown company id ${companyId}.`,
        path: [collection, index, "companyId"],
      });
    }
  });
});

export type Profile = z.infer<typeof profileSchema>;
export type Company = z.infer<typeof companySchema>;
export type Position = z.infer<typeof positionSchema>;
export type ProfessionalWork = z.infer<typeof professionalWorkSchema>;
export type ProjectLink = z.infer<typeof projectLinkSchema>;
export type Project = z.infer<typeof projectSchema>;
export type SkillGroup = z.infer<typeof skillGroupSchema>;
export type Recognition = z.infer<typeof recognitionSchema>;
export type Education = z.infer<typeof educationSchema>;
export type PortfolioData = z.infer<typeof portfolioShape>;
