import { FaGraduationCap } from 'react-icons/fa';

export default function Education({ data }) {
  const { education, narrative } = data;

  return (
    <section id="education" className="section">
      <div className="container">
        <h2 className="section-title">Education</h2>

        <div className="education-journey">
          <p>{narrative.academic}</p>
        </div>

        <div className="education-cards">
          {education.map((edu, i) => (
            <div className="education-card" key={i}>
              <div className="edu-icon"><FaGraduationCap /></div>
              <div className="edu-content">
                <h3 className="edu-degree">{edu.degree}</h3>
                <p className="edu-institution">{edu.institution}</p>
                <p className="edu-date">{edu.date}</p>
                {edu.focus && <p className="edu-focus"><strong>Focus:</strong> {edu.focus}</p>}
                <p className="edu-coursework"><strong>Key Courses:</strong> {edu.coursework}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
