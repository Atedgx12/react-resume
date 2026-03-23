import { FaArrowLeft, FaPrint } from 'react-icons/fa';

export default function PaperResume({ data, onBack }) {
  const handlePrint = () => window.print();

  return (
    <div className="paper-resume-wrapper">
      <div className="paper-controls no-print">
        <button className="btn btn-outline" onClick={onBack}><FaArrowLeft /> Back to Interactive Resume</button>
        <button className="btn btn-primary" onClick={handlePrint}><FaPrint /> Print / Save as PDF</button>
      </div>

      <div className="paper-resume" id="paper-resume">
        {/* Header */}
        <header className="paper-header">
          <h1>{data.personalInfo.fullName}</h1>
          <p>{data.personalInfo.title}</p>
          <div className="paper-contact">
            <span>{data.personalInfo.email}</span>
            <span>{data.personalInfo.phone}</span>
            <span>{data.personalInfo.location}</span>
            <span>github.com/Atedgx12</span>
            <span>linkedin.com/in/zachary-powell-83bb1199</span>
          </div>
        </header>

        {/* Summary */}
        <section className="paper-section">
          <h2>Professional Summary</h2>
          <p>{data.summary}</p>
        </section>

        {/* Experience */}
        <section className="paper-section">
          <h2>Professional Experience</h2>
          {data.experience.map((exp, i) => (
            <div className="paper-experience" key={i}>
              <div className="paper-exp-header">
                <div>
                  <strong>{exp.role}</strong> — {exp.company}
                </div>
                <div className="paper-date">{exp.date}</div>
              </div>
              <ul>
                {exp.bullets.map((b, j) => (
                  <li key={j}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {/* Education */}
        <section className="paper-section">
          <h2>Education</h2>
          {data.education.map((edu, i) => (
            <div className="paper-edu" key={i}>
              <div className="paper-exp-header">
                <strong>{edu.degree}</strong>
                <span className="paper-date">{edu.date}</span>
              </div>
              <p>{edu.institution} {edu.focus ? `— ${edu.focus}` : ''}</p>
            </div>
          ))}
        </section>

        {/* Skills */}
        <section className="paper-section">
          <h2>Technical Skills</h2>
          <div className="paper-skills">
            {['Languages', 'Frameworks', 'AI/ML', 'DevOps', 'Databases'].map(cat => {
              const skills = data.skills.filter(s => s.category === cat);
              return (
                <p key={cat}>
                  <strong>{cat}:</strong> {skills.map(s => s.name).join(', ')}
                </p>
              );
            })}
          </div>
        </section>

        {/* Projects */}
        <section className="paper-section">
          <h2>Key Projects</h2>
          {data.projects.slice(0, 6).map((proj, i) => (
            <div className="paper-project" key={i}>
              <strong>{proj.title}</strong>
              <span className="paper-tech"> [{proj.techStack.join(', ')}]</span>
              <p>{proj.description}</p>
            </div>
          ))}
        </section>

        {/* Certifications */}
        <section className="paper-section">
          <h2>Certifications</h2>
          <ul className="paper-certs">
            {data.certifications.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
