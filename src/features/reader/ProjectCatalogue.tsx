import { ProjectLinks } from "../../components/ProjectLinks";
import { TagList } from "../../components/TagList";
import { portfolio } from "../../data/portfolio";

export function ProjectCatalogue() {
  return (
    <section className="e-book-page" data-folio="Chapter III · Public projects" id="e-projects">
      <div className="e-chapter-head">
        <small>Chapter III<br />Public catalogue</small>
        <h2>Projects and research.</h2>
      </div>
      <div className="e-catalogue">
        {portfolio.projects.map((project) => (
          <article className="e-catalogue-card" key={project.id}>
            <small>{project.year}<br />{project.kind}</small>
            <div><h3>{project.title}</h3><TagList tags={project.tags} /></div>
            <p>{project.description}</p>
            <ProjectLinks links={project.links} />
          </article>
        ))}
      </div>
    </section>
  );
}
