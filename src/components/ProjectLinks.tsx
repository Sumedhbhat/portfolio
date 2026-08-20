import type { ProjectLink } from "../data/types";

interface ProjectLinksProps {
  links: ProjectLink[];
}

export function ProjectLinks({ links }: ProjectLinksProps) {
  if (!links.length) return null;

  return (
    <div className="project-links">
      {links.map((link) => (
        <a className="external" href={link.url} key={link.url} rel="noreferrer" target="_blank">
          {link.label}
        </a>
      ))}
    </div>
  );
}
