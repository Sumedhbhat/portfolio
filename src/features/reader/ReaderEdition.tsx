import profileImage from "../../../assets/profile.png";
import { SocialLinks } from "../../components/SocialLinks";
import { experience, portfolio } from "../../data/portfolio";
import type { Edition } from "../../App";
import { ProfessionalWorkChapter } from "./ProfessionalWork";
import { ProjectCatalogue } from "./ProjectCatalogue";

interface ReaderEditionProps {
  onNavigate: (edition: Edition) => void;
}

export function ReaderEdition({ onNavigate }: ReaderEditionProps) {
  const { profile } = portfolio;
  const education = portfolio.education[0];

  return (
    <div className="layout-e">
      <div className="e-shell">
        <nav className="e-reader-nav">
          <strong>{profile.name} · Reader’s Edition</strong>
          <div>
            <a href="#e-contents">Contents</a>
            <a href="#e-alternatives">Other readings</a>
            <a href="#e-work">Work</a>
            <a href={`mailto:${profile.email}`}>Contact</a>
          </div>
        </nav>

        <header className="e-spread" id="e-contents">
          <section className="e-cover">
            <div className="e-spine">Selected Works · {profile.name} · 2022—2026</div>
            <div className="e-cover-mark">SB</div>
            <small>A portfolio in five chapters</small>
            <h1>Selected <em>Works</em></h1>
            <p className="e-cover-subtitle">Production systems, public projects, research, and the engineering practice behind them.</p>
            <div className="e-cover-author">
              <img alt={`Portrait of ${profile.name}`} src={profileImage} />
              <div><b>{profile.name}</b><span>{profile.role} · {profile.location}</span></div>
            </div>
          </section>
          <section className="e-title-page">
            <small>Reader’s edition · Revised 2026</small>
            <h2>Contents</h2>
            <p>{profile.summary}</p>
            <div className="e-contents">
              <a href="#e-work"><span>Professional work</span><b>01</b></a>
              <a href="#e-shelf"><span>Working library</span><b>02</b></a>
              <a href="#e-projects"><span>Public projects</span><b>03</b></a>
              <a href="#e-experience"><span>Experience</span><b>04</b></a>
              <a href="#e-colophon"><span>Notes & colophon</span><b>05</b></a>
            </div>
            <div className="e-title-social"><SocialLinks /></div>
          </section>
        </header>

        <section aria-labelledby="e-alternatives-title" className="e-alternatives" id="e-alternatives">
          <div className="e-alternatives-head">
            <small>Alternative<br />readings</small>
            <div>
              <h2 id="e-alternatives-title">Two other ways to read the same work.</h2>
              <p>This book is the primary edition. If you prefer to query the portfolio or trace its connections, open one of these alternate experiences.</p>
            </div>
          </div>
          <div className="e-alternative-grid">
            <AlternativeCard edition="query" kicker="For querying" number="01" onNavigate={onNavigate} title="Query Console">
              A live DuckDB edition for exploring companies, roles, projects, and work points with SQL in the browser.
            </AlternativeCard>
            <AlternativeCard edition="graph" kicker="For connecting" number="02" onNavigate={onNavigate} title="Career Graph">
              A spatial map showing how roles, shipped systems, tools, projects, education, and recognition relate.
            </AlternativeCard>
          </div>
        </section>

        <ProfessionalWorkChapter />

        <section className="e-bookshelf" id="e-shelf">
          <div className="e-bookshelf-head">
            <h2>The working library</h2>
            <p>The languages, frameworks, and disciplines I return to while designing and delivering software.</p>
          </div>
          <div className="e-spines">
            {portfolio.skills.map((skill) => (
              <article className="e-skill-spine" key={skill.id}>
                <h3>{skill.group}</h3><p>{skill.items.join(", ")}</p>
              </article>
            ))}
          </div>
        </section>

        <ProjectCatalogue />

        <section className="e-book-page" data-folio="Chapter IV · Experience" id="e-experience">
          <div className="e-chapter-head">
            <small>Chapter IV<br />Chronology</small>
            <h2>How my work has grown over time.</h2>
          </div>
          <div className="e-history">
            {experience.map((position) => (
              <article className="e-role" key={position.id}>
                <time>{position.displayDates}</time>
                <h3>{position.title} · <span>{position.company.name}</span></h3>
                <p>{position.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="e-book-page" data-folio="Chapter V · Notes & colophon" id="e-colophon">
          <div className="e-chapter-head">
            <small>Chapter V<br />Back matter</small>
            <h2>Recognition, education, and publication notes.</h2>
          </div>
          <div className="e-colophon">
            <div>
              <h2>Recognition</h2>
              {portfolio.recognition.map((item) => <article key={item.id}><small>{item.year}</small><h3>{item.title}</h3></article>)}
            </div>
            <div>
              <h2>Education</h2>
              <article><small>{education.startYear}—{education.endYear}</small><h3>{education.shortDegree} · {education.institution} · CGPA {education.cgpa}</h3></article>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

interface AlternativeCardProps {
  children: string;
  edition: Edition;
  kicker: string;
  number: string;
  onNavigate: (edition: Edition) => void;
  title: string;
}

function AlternativeCard({ children, edition, kicker, number, onNavigate, title }: AlternativeCardProps) {
  return (
    <button className="e-alternative-card" data-edition={edition} onClick={() => onNavigate(edition)} type="button">
      <span className="e-alternative-kicker"><span>Alternate {number}</span><span>{kicker}</span></span>
      <h3>{title}</h3>
      <p>{children}</p>
      <span className="e-alternative-action"><span>Open {title === "Query Console" ? "the console" : "the graph"}</span><b aria-hidden="true">→</b></span>
    </button>
  );
}
