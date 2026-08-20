import type { PortfolioData } from "../data/schema";

export function createResumeProjection(data: PortfolioData) {
  const experience = data.companies.flatMap((company) => {
    const positions = data.positions.filter((position) => position.companyId === company.id);
    const work = data.professionalWork.filter((item) => item.companyId === company.id);

    // A resume company needs both a role heading and at least one evidence bullet.
    if (positions.length === 0 || work.length === 0) return [];

    const recognition = data.recognition.flatMap((item) =>
      item.companyId === company.id && item.resumeText ? [item.resumeText] : [],
    );

    return [{
      company: company.name,
      location: company.location,
      positions: positions.map((position) => ({
        title: position.title,
        dates: position.resumeDates,
      })),
      bullets: work.map((item) => item.resumeBullet),
      recognition,
    }];
  });

  const { profile } = data;
  return {
    profile: {
      name: profile.name,
      phone: profile.phone,
      email: profile.email,
      role: profile.role,
      focus: profile.focus,
      location: profile.location,
      github: profile.github,
      githubLabel: profile.githubLabel,
      linkedin: profile.linkedin,
      linkedinLabel: profile.linkedinLabel,
      summary: profile.resumeSummary,
    },
    experience,
    skills: data.skills.map((skill) => ({
      name: skill.resumeGroup,
      items: skill.resumeItems ?? skill.items,
    })),
    education: data.education.map((education) => ({
      institution: education.institution,
      degree: education.degree,
      dates: `${education.startYear} - ${education.endYear}`,
      cgpa: education.cgpa,
    })),
  };
}

export type ResumeProjection = ReturnType<typeof createResumeProjection>;
