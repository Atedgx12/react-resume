import { FaRocket, FaUniversity, FaMedal, FaBuilding, FaChartLine } from 'react-icons/fa';

const ICONS = [FaUniversity, FaMedal, FaBuilding, FaChartLine];

export default function ValueProposition({ data }) {
  if (!data) return null;

  return (
    <section id="value" className="section value-proposition-section">
      <div className="container">
        <h2 className="section-title">
          <FaRocket style={{ marginRight: '0.5rem' }} />
          {data.headline}
        </h2>
        <div className="value-grid">
          {data.points.map((point, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <div className="value-card" key={i}>
                <div className="value-card-icon">
                  <Icon />
                </div>
                <h3 className="value-card-title">{point.title}</h3>
                <p className="value-card-detail">{point.detail}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
