import { useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Mail,
  Menu,
  X,
  MapPin,
  Download
} from "lucide-react";

import { usePortfolio } from "./lib/usePortfolio";
import "./App.css";

function App({ previewData = null }) {
  const publishedData = usePortfolio();
  const data = previewData ?? publishedData;
  const [menuOpen, setMenuOpen] = useState(false);

  const profile = data.profile ?? {};
  const about = data.about ?? {};
  const projects = data.projects ?? [];
  const skills = data.skills ?? [];
  const experience = data.experience ?? [];

  const closeMenu = () => setMenuOpen(false);

  const links = [
    { label: "About", href: "#about" },
    { label: "Work", href: "#work" },
    { label: "Expertise", href: "#expertise" },
    { label: "Experience", href: "#experience" },
    { label: "Contact", href: "#contact" }
  ];

  const location = profile.location || "";
  const headline = profile.tagline ||
    "Building thoughtful solutions with technology.";

  return (
    <div className="portfolio-site">
      <div className="page-container">

        <header className="site-header">
          <a href="#home" className="site-logo"
             onClick={closeMenu}>
            {profile.name || "Portfolio"}
            <span>.</span>
          </a>

          <button
            className="mobile-menu-button"
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>

          <nav id="primary-navigation"
               className={`site-nav ${menuOpen ? "open" : ""}`}
               aria-label="Primary navigation">
            {links.map(link => (
              <a href={link.href}
                 key={link.href}
                 onClick={closeMenu}>
                {link.label}
              </a>
            ))}
          </nav>
        </header>

        <main>
          {/* HERO */}
          <section id="home" className="hero-section">
            <div className="hero-copy">
              <p className="eyebrow">
                {location ? (
                  <>
                    <MapPin size={14} aria-hidden="true" />
                    {location}
                  </>
                ) : (
                  "WELCOME TO MY PORTFOLIO"
                )}
              </p>

              <h1>{headline}</h1>

              <p className="hero-intro">
                I'm <strong>{profile.name || "Your Name"}</strong>
                {profile.title ? ` — ${profile.title}.` : "."}
              </p>

              <p className="hero-description">
                {profile.bio}
              </p>

              <div className="hero-buttons">
                <a href="#work" className="button-primary">
                  Explore my work
                  <ArrowUpRight size={18} />
                </a>

                <a href="#contact" className="button-secondary">
                  Get in touch
                  <ArrowRight size={18} />
                </a>
              </div>
            </div>

            <figure className="hero-portrait">
              {profile.photoUrl ? (
                <img
                  src={profile.photoUrl}
                  alt={`Portrait of ${profile.name || "portfolio owner"}`}
                  width="560"
                  height="650"
                  fetchPriority="high" loading="eager" decoding="async"
                />
              ) : (
                <div className="portrait-placeholder"
                     aria-label="Profile photo placeholder">
                  <span className="portrait-monogram">
                    {(profile.name || "P")
                      .trim()
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                  <span>YOUR PORTRAIT</span>
                </div>
              )}
              <figcaption>
                {profile.photoCaption || profile.title || ""}
              </figcaption>
            </figure>
          </section>

          <div className="section-marker" aria-hidden="true">
            <span></span>
          </div>

          {/* ABOUT */}
          <section id="about" className="editorial-section split-section">
            <div className="section-intro">
              <p className="eyebrow">A LITTLE CONTEXT</p>
              <h2>{about.heading || "The person behind the work"}</h2>
            </div>

            <div className="section-body">
              <p>{about.description || profile.bio}</p>
            </div>
          </section>

          {/* WORK */}
          <section id="work" className="editorial-section">
            <div className="section-top">
              <div>
                <p className="eyebrow">SELECTED WORK</p>
                <h2>Ideas made tangible.</h2>
              </div>
              <p>
                A selection of projects, experiments and
                solutions I've worked on.
              </p>
            </div>

            <div className="project-list">
              {projects.map((project, index) => {
                const href = project.demo || project.github;
                const details = (
                  <>
                    <span className="project-index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="project-details">
                      <p className="project-type">
                        {project.category || "FEATURED PROJECT"}
                      </p>
                      <h3>{project.title}</h3>
                      <p>{project.description}</p>
                      {project.imageUrl && (
                        <img
                          className="project-image"
                          src={project.imageUrl}
                          alt={`Screenshot of ${project.title}`}
                          loading="lazy"
                          decoding="async"
                        />
                      )}

                      <div className="project-tags">
                        {(project.technologies ?? []).map(tech => (
                          <span key={tech}>{tech}</span>
                        ))}
                      </div>
                    </div>
                    {href && (
                      <ArrowUpRight
                        className="project-arrow"
                        size={23}
                        aria-hidden="true"
                      />
                    )}
                  </>
                );

                return href ? (
                  <a className="project-row"
                     href={href}
                     target="_blank"
                     rel="noopener noreferrer"
                     key={project.id || index}>
                    {details}
                  </a>
                ) : (
                  <article className="project-row"
                           key={project.id || index}>
                    {details}
                  </article>
                );
              })}

              {projects.length === 0 && (
                <p className="empty-section">
                  Selected projects will appear here.
                </p>
              )}
            </div>
          </section>

          {/* EXPERTISE */}
          <section id="expertise"
                   className="editorial-section split-section">
            <div className="section-intro">
              <p className="eyebrow">WHAT I WORK WITH</p>
              <h2>Skills, tools and expertise.</h2>
            </div>

            <div className="section-body">
              <p>
                The technologies and capabilities I use
                to create effective digital solutions.
              </p>

              <div className="skills-list">
                {skills.map((skill, index) => (
                  <div className="skill-row"
                       key={skill.id || index}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{skill.name}</strong>
                    <small>{skill.category}</small>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* EXPERIENCE */}
          {experience.length > 0 && (
            <section id="experience"
                     className="editorial-section split-section">
              <div className="section-intro">
                <p className="eyebrow">PROFESSIONAL JOURNEY</p>
                <h2>Experience and contributions.</h2>
              </div>

              <div className="section-body experience-list">
                {experience.map((item, index) => (
                  <article className="experience-item"
                           key={item.id || index}>
                    <span className="experience-period">
                      {item.period}
                    </span>
                    <h3>{item.role}</h3>
                    <strong>{item.organization}</strong>
                    <p>{item.description}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* CONTACT */}
          <section id="contact"
                   className="editorial-section contact-section">
            <p className="eyebrow">LET'S CONNECT</p>
            <h2>
              Have an idea?
              <span> Let's make it happen.</span>
            </h2>

            <p>
              I'm open to meaningful collaborations,
              interesting projects and professional opportunities.
            </p>

            <div className="contact-actions">
              {profile.email && (
                <a className="button-primary"
                   href={`mailto:${profile.email}`}>
                  <Mail size={19} />
                  Send me an email
                </a>
              )}
              {profile.cvUrl && (
                <a className="button-secondary"
                   href={profile.cvUrl}
                   target="_blank"
                   rel="noopener noreferrer">
                  <Download size={18} />
                  View my CV
                </a>
              )}
            </div>
          </section>
        </main>

        {/* FOOTER */}
        <footer className="site-footer">
          <p>
            {profile.title || "Professional portfolio"}
          </p>
          <div className="footer-links">
            {profile.github && (
              <a href={profile.github}
                 target="_blank"
                 rel="noopener noreferrer">GitHub</a>
            )}
            {profile.linkedin && (
              <a href={profile.linkedin}
                 target="_blank"
                 rel="noopener noreferrer">LinkedIn</a>
            )}
            {profile.email && (
              <a href={`mailto:${profile.email}`}>Email</a>
            )}
          </div>
          <p>
            © {new Date().getFullYear()} {profile.name || "Portfolio"}
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;




