import type { Profile } from "../../data/schema";
import { escapeLatex } from "../escape-latex";

export function renderProfileSection(profile: Profile) {
  return [
    `\\newcommand{\\resumeName}{${escapeLatex(profile.name)}}`,
    `\\newcommand{\\resumePhone}{${escapeLatex(profile.phone)}}`,
    `\\newcommand{\\resumeEmail}{${escapeLatex(profile.email)}}`,
    `\\newcommand{\\resumeRole}{${escapeLatex(profile.role)}}`,
    `\\newcommand{\\resumeFocus}{${escapeLatex(profile.focus)}}`,
    `\\newcommand{\\resumeLocation}{${escapeLatex(profile.location)}}`,
    `\\newcommand{\\resumeGithubUrl}{${escapeLatex(profile.github)}}`,
    `\\newcommand{\\resumeGithubLabel}{${escapeLatex(profile.githubLabel)}}`,
    `\\newcommand{\\resumeLinkedinUrl}{${escapeLatex(profile.linkedin)}}`,
    `\\newcommand{\\resumeLinkedinLabel}{${escapeLatex(profile.linkedinLabel)}}`,
  ];
}
