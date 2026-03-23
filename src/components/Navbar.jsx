import { useState, useEffect, useCallback, useRef } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';

const NAV_LINKS = [
  { href: '#about', label: 'About' },
  { href: '#experience', label: 'Experience' },
  { href: '#skills', label: 'Skills' },
  { href: '#projects', label: 'Projects' },
  { href: '#ml-demo', label: 'AI Lab' },
  { href: '#coursework', label: 'Coursework' },
  { href: '#education', label: 'Education' },
  { href: '#contact', label: 'Contact' },
];

export default function Navbar({ onPaperResume }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown when clicking outside the nav
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleNavClick = useCallback((e) => {
    const href = e.currentTarget.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        // Close menu after successful navigation
        setMenuOpen(false);
      }
    }
  }, []);

  return (
    <nav className={`nav${scrolled ? ' scrolled' : ''}`} ref={navRef}>
      <div className="container nav-container">
        <a href="#" className="logo" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); setMenuOpen(false); }}>
          Zachary<span>Powell</span>
        </a>
        <button
          className={`mobile-menu-btn${menuOpen ? ' active' : ''}`}
          onClick={() => setMenuOpen(prev => !prev)}
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
        <div className={`nav-links${menuOpen ? ' active' : ''}`}>
          {NAV_LINKS.map(link => (
            <a key={link.href} href={link.href} onClick={handleNavClick}>
              {link.label}
            </a>
          ))}
          <button className="nav-btn" onClick={() => { onPaperResume(); setMenuOpen(false); }}>
            Paper Resume
          </button>
        </div>
      </div>
    </nav>
  );
}
