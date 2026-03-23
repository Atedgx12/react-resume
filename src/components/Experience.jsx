import { useState } from 'react';
import { FaBriefcase, FaChevronDown, FaChevronUp } from 'react-icons/fa';

export default function Experience({ data }) {
  const [expandedIdx, setExpandedIdx] = useState(0);

  return (
    <section id="experience" className="section">
      <div className="container">
        <h2 className="section-title">Experience</h2>
        <div className="experience-timeline">
          {data.map((exp, i) => (
            <div className={`experience-card${expandedIdx === i ? ' active' : ''}`} key={i}>
              <div className="experience-header" onClick={() => setExpandedIdx(expandedIdx === i ? -1 : i)}>
                <div className="exp-icon"><FaBriefcase /></div>
                <div className="exp-meta">
                  <h3 className="exp-role">{exp.role}</h3>
                  <p className="exp-company">{exp.company}</p>
                  <p className="exp-date">{exp.date}</p>
                </div>
                <span className="exp-toggle">
                  {expandedIdx === i ? <FaChevronUp /> : <FaChevronDown />}
                </span>
              </div>
              {expandedIdx === i && (
                <div className="experience-details">
                  <ul>
                    {exp.bullets.map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                  <div className="exp-skills">
                    {exp.skills.map((s, j) => (
                      <span className="exp-skill-tag" key={j}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
