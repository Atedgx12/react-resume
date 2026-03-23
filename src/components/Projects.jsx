import { useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import SystemDiagram from './SystemDiagram';

const screenshots = import.meta.glob('../assets/images/screenshots/*.png', { eager: true });
function getScreenshot(filename) {
  const match = Object.entries(screenshots).find(([path]) => path.endsWith('/' + filename));
  return match ? match[1].default : null;
}

export default function Projects({ data }) {
  const [activeProject, setActiveProject] = useState(0);
  const project = data[activeProject];

  const prev = () => setActiveProject(i => (i - 1 + data.length) % data.length);
  const next = () => setActiveProject(i => (i + 1) % data.length);

  const screenshotSrc = project.screenshot ? getScreenshot(project.screenshot) : null;

  return (
    <section id="projects" className="section">
      <div className="container">
        <h2 className="section-title">Projects</h2>

        {/* Project selector tabs */}
        <div className="project-tabs">
          {data.map((p, i) => (
            <button
              key={p.id}
              className={`project-tab${activeProject === i ? ' active' : ''}`}
              onClick={() => setActiveProject(i)}
              title={p.title}
            >
              {p.title.split(':')[0].trim()}
            </button>
          ))}
        </div>

        {/* Active project display */}
        <div className="project-showcase">
          <div className="project-nav">
            <button onClick={prev} aria-label="Previous project"><FaChevronLeft /></button>
            <span className="project-nav-title">{project.title}</span>
            <button onClick={next} aria-label="Next project"><FaChevronRight /></button>
          </div>

          <div className="project-display">
            {/* Screenshot or System Architecture Diagram */}
            <div className="project-diagram">
              {screenshotSrc ? (
                <a href={project.link} target="_blank" rel="noopener noreferrer" className="project-screenshot-link">
                  <img src={screenshotSrc} alt={`${project.title} homepage`} className="project-screenshot" />
                  <span className="screenshot-overlay">Visit Site →</span>
                </a>
              ) : (
                <SystemDiagram architecture={project.architecture} />
              )}
            </div>

            {/* Project Info */}
            <div className="project-info">
              <span className={`project-type-badge ${project.type}`}>{project.type === 'web' ? 'Web Application' : project.type === 'ml' ? 'ML / AI' : 'Systems'}</span>
              <p className="project-description">{project.description}</p>
              <div className="project-tech">
                {project.techStack.map((t, i) => (
                  <span key={i}>{t}</span>
                ))}
              </div>
              <a href={project.github} target="_blank" rel="noopener noreferrer" className="project-link">View Source →</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
