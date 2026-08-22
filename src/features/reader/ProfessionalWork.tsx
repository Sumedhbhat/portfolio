import { TagList } from "../../components/TagList";
import { professionalWork } from "../../data/portfolio";

export function ProfessionalWorkChapter() {
  return (
    <section className="e-book-page" data-folio="Chapter I · Professional work" id="e-work">
      <div className="e-chapter-head">
        <small>Chapter I<br />Professional work</small>
        <h2>Systems built for the part that comes after launch.</h2>
      </div>
      <div className="e-dossier-list">
        {professionalWork.map((work, index) => (
          <article className="e-dossier" key={work.id}>
            <div className="e-dossier-copy">
              <div className="e-dossier-kicker">
                <b>{String(index + 1).padStart(2, "0")}</b>
                <span>{work.company.name} · {work.status}</span>
              </div>
              <h3>{work.title}</h3>
              <p>{work.description}</p>
            </div>
            <aside className="e-dossier-evidence">
              <small>Evidence of impact</small>
              <blockquote>{work.impact}</blockquote>
              <TagList tags={work.tags} />
            </aside>
          </article>
        ))}
      </div>
    </section>
  );
}
