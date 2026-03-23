import { useState, useEffect, useCallback } from 'react';
import { FaTimes, FaChartBar, FaCopy, FaLink } from 'react-icons/fa';
import { getAnalytics } from '../utils/analytics';

export default function AnalyticsDashboard() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [linkForm, setLinkForm] = useState({ job: '', ref: 'linkedin', fwd: '' });
  const [generatedLink, setGeneratedLink] = useState('');

  // Ctrl+Shift+D to toggle
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Subscribe to live analytics updates
  useEffect(() => {
    if (!open) return;
    const engine = getAnalytics();
    setData(engine.getSessionSummary());
    const unsub = engine.subscribe((summary) => setData(summary));
    const interval = setInterval(() => setData(engine.getSessionSummary()), 1000);
    return () => { unsub(); clearInterval(interval); };
  }, [open]);

  const generateLink = useCallback(() => {
    const engine = getAnalytics();
    const link = engine.generateTrackingLink(linkForm.job, linkForm.ref, linkForm.fwd);
    setGeneratedLink(link);
  }, [linkForm]);

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink);
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!open || !data) return null;

  const totalSec = (data.totalTimeMs / 1000).toFixed(0);
  const focusSec = (data.focusTimeMs / 1000).toFixed(0);
  const sortedSections = Object.entries(data.sectionDwell)
    .sort((a, b) => b[1] - a[1]);
  const maxDwell = sortedSections[0]?.[1] || 1;

  return (
    <div className="analytics-overlay">
      <div className="analytics-panel">
        <div className="analytics-header">
          <h3><FaChartBar /> Live Analytics Dashboard</h3>
          <button onClick={() => setOpen(false)}><FaTimes /></button>
        </div>

        <div className="analytics-body">
          {/* Session Overview */}
          <div className="analytics-section">
            <h4>Session Overview</h4>
            <div className="analytics-stats">
              <div className="stat-card">
                <span className="stat-value">{totalSec}s</span>
                <span className="stat-label">Total Time</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{focusSec}s</span>
                <span className="stat-label">Focus Time</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{data.maxScrollDepth}%</span>
                <span className="stat-label">Scroll Depth</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{data.clicks.length}</span>
                <span className="stat-label">Clicks</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{data.engagement.tabSwitches}</span>
                <span className="stat-label">Tab Switches</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{data.engagement.printAttempts}</span>
                <span className="stat-label">Print Attempts</span>
              </div>
            </div>
          </div>

          {/* Tracking Context */}
          {data.tracking.jobId && (
            <div className="analytics-section">
              <h4>Job Correlation</h4>
              <div className="analytics-meta">
                {data.tracking.jobId && <p><strong>Job:</strong> {data.tracking.jobId}</p>}
                {data.tracking.refSource && <p><strong>Source:</strong> {data.tracking.refSource}</p>}
                {data.tracking.forwardedBy && <p><strong>Forwarded by:</strong> {data.tracking.forwardedBy}</p>}
                {data.tracking.campaignId && <p><strong>Campaign:</strong> {data.tracking.campaignId}</p>}
              </div>
            </div>
          )}

          {/* Section Dwell Times */}
          <div className="analytics-section">
            <h4>Section Engagement (dwell time)</h4>
            <div className="dwell-bars">
              {sortedSections.map(([name, ms]) => (
                <div className="dwell-row" key={name}>
                  <span className="dwell-name">{name}</span>
                  <div className="dwell-bar-track">
                    <div
                      className="dwell-bar-fill"
                      style={{ width: `${(ms / maxDwell) * 100}%` }}
                    />
                  </div>
                  <span className="dwell-time">{(ms / 1000).toFixed(1)}s</span>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Path */}
          <div className="analytics-section">
            <h4>Navigation Path</h4>
            <div className="nav-path">
              {data.navigationPath.map((n, i) => (
                <span key={i}>
                  <span className="nav-node">{n.section}</span>
                  {i < data.navigationPath.length - 1 && <span className="nav-arrow"> → </span>}
                </span>
              ))}
            </div>
          </div>

          {/* Visitor Info */}
          <div className="analytics-section">
            <h4>Visitor</h4>
            <div className="analytics-meta">
              <p><strong>Fingerprint:</strong> {data.fingerprint}</p>
              <p><strong>Device:</strong> {data.visitor.isMobile ? 'Mobile' : 'Desktop'} {data.visitor.screen}</p>
              <p><strong>Referrer:</strong> {data.visitor.referrer}</p>
              <p><strong>Timezone:</strong> {data.visitor.timezone}</p>
            </div>
          </div>

          {/* Link Generator */}
          <div className="analytics-section">
            <h4><FaLink /> Tracking Link Generator</h4>
            <p className="analytics-hint">Generate unique links per job application to track views.</p>
            <div className="link-form">
              <input
                placeholder="Job ID (e.g. swe-google-l5)"
                value={linkForm.job}
                onChange={(e) => setLinkForm({ ...linkForm, job: e.target.value })}
              />
              <select value={linkForm.ref} onChange={(e) => setLinkForm({ ...linkForm, ref: e.target.value })}>
                <option value="linkedin">LinkedIn</option>
                <option value="indeed">Indeed</option>
                <option value="direct">Direct Email</option>
                <option value="github">GitHub</option>
                <option value="other">Other</option>
              </select>
              <input
                placeholder="Forwarded to (optional)"
                value={linkForm.fwd}
                onChange={(e) => setLinkForm({ ...linkForm, fwd: e.target.value })}
              />
              <button className="btn btn-primary" onClick={generateLink}>Generate Link</button>
            </div>
            {generatedLink && (
              <div className="generated-link">
                <code>{generatedLink}</code>
                <button onClick={copyLink} title="Copy"><FaCopy /></button>
              </div>
            )}
          </div>

          {/* Export */}
          <div className="analytics-section">
            <button className="btn btn-outline" onClick={exportData}>
              Export Session Data (JSON for ML)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
