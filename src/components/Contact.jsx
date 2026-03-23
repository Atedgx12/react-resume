import { FaEnvelope, FaPhone, FaLinkedin, FaGithub, FaMapMarkerAlt, FaGlobe } from 'react-icons/fa';
import InterestButton from './InterestButton';

export default function Contact({ data }) {
  return (
    <section id="contact" className="section">
      <div className="container">
        <h2 className="section-title">Contact</h2>
        <p className="contact-intro">Interested in working together? Let's connect.</p>
        <div className="contact-grid">
          <a href={`mailto:${data.email}`} className="contact-card">
            <FaEnvelope className="contact-icon" />
            <div>
              <p className="contact-label">Email</p>
              <p className="contact-value">{data.email}</p>
            </div>
          </a>
          <a href={`tel:${data.phone.replace(/\s/g, '')}`} className="contact-card">
            <FaPhone className="contact-icon" />
            <div>
              <p className="contact-label">Phone</p>
              <p className="contact-value">{data.phone}</p>
            </div>
          </a>
          <a href={data.linkedIn} target="_blank" rel="noopener noreferrer" className="contact-card">
            <FaLinkedin className="contact-icon" />
            <div>
              <p className="contact-label">LinkedIn</p>
              <p className="contact-value">Zachary Powell</p>
            </div>
          </a>
          <a href={data.github} target="_blank" rel="noopener noreferrer" className="contact-card">
            <FaGithub className="contact-icon" />
            <div>
              <p className="contact-label">GitHub</p>
              <p className="contact-value">Atedgx12 / nomadictechco</p>
            </div>
          </a>
          <a href={data.resume} target="_blank" rel="noopener noreferrer" className="contact-card">
            <FaGlobe className="contact-icon" />
            <div>
              <p className="contact-label">Interactive Resume</p>
              <p className="contact-value">atedgx12.github.io/react-resume</p>
            </div>
          </a>
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.location)}`} target="_blank" rel="noopener noreferrer" className="contact-card">
            <FaMapMarkerAlt className="contact-icon" />
            <div>
              <p className="contact-label">Location</p>
              <p className="contact-value">{data.location}</p>
            </div>
          </a>
        </div>

        <InterestButton />
      </div>
    </section>
  );
}
