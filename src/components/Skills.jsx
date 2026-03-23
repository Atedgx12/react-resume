import { useState, useEffect, useRef } from 'react';

const CATEGORIES = ['All', 'Languages', 'Frameworks', 'AI/ML', 'DevOps', 'Databases', 'Soft Skills'];

export default function Skills({ data }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const filtered = activeCategory === 'All'
    ? data
    : data.filter(s => s.category === activeCategory);

  return (
    <section id="skills" className="section" ref={ref}>
      <div className="container">
        <h2 className="section-title">Skills</h2>
        <div className="skill-filters">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`filter-btn${activeCategory === cat ? ' active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="skill-bars">
          {filtered.map((skill, i) => (
            <div className="skill-row" key={skill.name}>
              <span className="skill-name">{skill.name}</span>
              <div className="skill-bar">
                <div
                  className="skill-bar-fill"
                  style={{
                    width: visible ? `${skill.level}%` : '0%',
                    transitionDelay: `${i * 60}ms`,
                  }}
                />
              </div>
              <span className="skill-level">{skill.level}%</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
