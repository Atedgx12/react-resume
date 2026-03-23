import { useState, useRef } from 'react';
import Navbar from './components/Navbar';
import ParticleCanvas from './components/ParticleCanvas';
import Hero from './components/Hero';
import About from './components/About';
import Experience from './components/Experience';
import Skills from './components/Skills';
import Projects from './components/Projects';
import Coursework from './components/Coursework';
import Education from './components/Education';
import MLDemo from './components/MLDemo';
import Contact from './components/Contact';
import Footer from './components/Footer';
import PaperResume from './components/PaperResume';
import ResumeTracker from './components/ResumeTracker';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import resumeData from './data/resumeData';

function App() {
  const [showPaper, setShowPaper] = useState(false);
  const printRef = useRef();

  if (showPaper) {
    return <PaperResume data={resumeData} onBack={() => setShowPaper(false)} printRef={printRef} />;
  }

  return (
    <>
      <ResumeTracker />
      <AnalyticsDashboard />
      <Navbar onPaperResume={() => setShowPaper(true)} />
      <header className="hero-header">
        <ParticleCanvas />
        <Hero data={resumeData.personalInfo} />
      </header>
      <main>
        <About data={resumeData} />
        <Experience data={resumeData.experience} />
        <Skills data={resumeData.skills} />
        <Projects data={resumeData.projects} />
        <MLDemo data={resumeData} />
        <Coursework data={resumeData.graduateCoursework} />
        <Education data={resumeData} />
        <Contact data={resumeData.personalInfo} />
      </main>
      <Footer />
    </>
  );
}

export default App;
