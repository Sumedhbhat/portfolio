import { portfolio } from "../data/portfolio";

export function SocialLinks() {
  const { profile } = portfolio;
  return (
    <>
      <a className="external" href={profile.github} rel="noreferrer" target="_blank">GitHub</a>
      <a className="external" href={profile.linkedin} rel="noreferrer" target="_blank">LinkedIn</a>
      <a href={`mailto:${profile.email}`}>Email</a>
    </>
  );
}
