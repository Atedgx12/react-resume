import { FaFlask } from 'react-icons/fa';

export default function Coursework({ data }) {
  return (
    <section id="coursework" className="section">
      <div className="container">
        <h2 className="section-title">Graduate Coursework — Rice University</h2>
        <div className="coursework-grid">
          {data.map((course) => (
            <div className="coursework-card" key={course.code}>
              <div className="course-header">
                <span className="course-code">{course.code}</span>
                <span className="course-semester">{course.semester}</span>
              </div>
              <h3>{course.name}</h3>
              <p>{course.highlights}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
