import { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaCertificate } from 'react-icons/fa';

export default function About({ data }) {
  const [expanded, setExpanded] = useState(false);
  const { narrative, highlights, certifications } = data;

  return (
    <section id="about" className="section">
      <div className="container">
        <h2 className="section-title">About Me</h2>
        <div className="about-content">
          <p className="about-intro">{narrative.intro}</p>

          <div className="about-highlights">
            {highlights.map((h, i) => (
              <div className="highlight-item" key={i}>
                <span className="highlight-number">{h.number}</span>
                <span className="highlight-label">{h.label}</span>
              </div>
            ))}
          </div>

          <button className="expand-btn" onClick={() => setExpanded(e => !e)}>
            {expanded ? <><FaChevronUp /> Read Less</> : <><FaChevronDown /> Read My Full Story</>}
          </button>

          {expanded && (
            <div className="about-narrative">
              <div className="narrative-section">
                <h3>Military Foundation</h3>
                <p>{narrative.navy}</p>
              </div>
              <div className="narrative-section">
                <h3>Entrepreneurial Drive</h3>
                <p>{narrative.entrepreneurship}</p>
              </div>
              <div className="narrative-section">
                <h3>Academic Rigor</h3>
                <p>{narrative.academic}</p>
              </div>
              <div className="narrative-section synthesis">
                <p><em>{narrative.synthesis}</em></p>
              </div>
            </div>
          )}

          <div className="certifications">
            <h3><FaCertificate /> Certifications</h3>
            <div className="cert-list">
              {certifications.map((cert, i) => (
                <span className="cert-tag" key={i}>{cert}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
