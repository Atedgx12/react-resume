import { FaGithub, FaLinkedin } from 'react-icons/fa';

export default function Hero({ data }) {
  return (
    <div className="container hero-content">
      <p className="hero-greeting">Hi, my name is</p>
      <h1>{data.fullName}</h1>
      <h2>{data.title}</h2>
      <p className="hero-tagline">
        Co-Founder, Nomadic Tech Co &bull; MCS Student, Rice University &bull; 8-Year Navy Veteran
      </p>
      <div className="hero-buttons">
        <a href="#contact" className="btn btn-primary" onClick={(e) => { e.preventDefault(); document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' }); }}>
          Get In Touch
        </a>
        <a href={data.github} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
          <FaGithub /> GitHub
        </a>
        <a href={data.linkedIn} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
          <FaLinkedin /> LinkedIn
        </a>
      </div>
    </div>
  );
}
