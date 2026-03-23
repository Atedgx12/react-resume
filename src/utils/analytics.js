/**
 * Resume Analytics Engine
 * Tracks: visitor identity, section dwell time, click heatmap,
 * scroll depth, forwarding chain, job correlation, and session timeline.
 * Sends data via ntfy.sh + configurable webhook for ML pipeline.
 */

const NTFY_TOPIC = 'zpowell-resume-alerts';
const ANALYTICS_SERVER = 'http://localhost:3377'; // Local analytics server
const WEBHOOK_URL = `${ANALYTICS_SERVER}/api/session`;

// ── Visitor Fingerprint (non-PII) ──
function generateFingerprint() {
  const raw = [
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency || 'unknown',
    navigator.platform,
  ].join('|');

  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
  }
  return 'v_' + Math.abs(hash).toString(36);
}

// ── URL Parameter Parser ──
function parseTrackingParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    jobId: params.get('job') || null,        // e.g. ?job=swe-google-l5
    refSource: params.get('ref') || null,     // e.g. ?ref=linkedin
    forwardedBy: params.get('fwd') || null,   // e.g. ?fwd=recruiter-jane
    campaignId: params.get('cid') || null,    // e.g. ?cid=march-batch
    shareId: params.get('sid') || null,       // unique sharing link ID
  };
}

// ── Session Store ──
function createSession() {
  const fingerprint = generateFingerprint();
  const tracking = parseTrackingParams();

  return {
    sessionId: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2),
    fingerprint,
    startTime: Date.now(),
    lastActivity: Date.now(),

    // Visitor context
    visitor: {
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      referrer: document.referrer || 'direct',
      isMobile: /Mobi|Android/i.test(navigator.userAgent),
    },

    // Job/campaign correlation
    tracking,

    // Section dwell times (ms)
    sectionDwell: {},
    // When each section was first seen
    sectionFirstSeen: {},
    // Currently visible sections
    _visibleSections: {},

    // Click log
    clicks: [],

    // Scroll tracking
    maxScrollDepth: 0,

    // Navigation path (ordered section views)
    navigationPath: [],

    // Engagement signals
    engagement: {
      tabSwitches: 0,
      totalFocusTime: 0,
      _lastFocusStart: Date.now(),
      printAttempts: 0,
      copyAttempts: 0,
      linkClicks: [],
    },
  };
}

// ── Analytics Controller ──
class AnalyticsEngine {
  constructor() {
    this.session = createSession();
    this.observers = new Set();
    this._setupListeners();
    this._setupIntersectionObserver();
    this._sendArrivalNotification();
  }

  // ── Section Visibility Tracking ──
  _setupIntersectionObserver() {
    const sectionNames = [
      'hero', 'about', 'experience', 'skills',
      'projects', 'ml-demo', 'coursework', 'education', 'contact',
    ];

    this.io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id || entry.target.closest('section')?.id;
          if (!id) return;

          if (entry.isIntersecting) {
            // Section entered viewport
            this.session._visibleSections[id] = Date.now();
            if (!this.session.sectionFirstSeen[id]) {
              this.session.sectionFirstSeen[id] = Date.now() - this.session.startTime;
              this.session.navigationPath.push({
                section: id,
                time: Date.now() - this.session.startTime,
              });
            }
          } else {
            // Section left viewport — record dwell time
            const enterTime = this.session._visibleSections[id];
            if (enterTime) {
              const dwell = Date.now() - enterTime;
              this.session.sectionDwell[id] = (this.session.sectionDwell[id] || 0) + dwell;
              delete this.session._visibleSections[id];
            }
          }
        });
        this._notifyObservers();
      },
      { threshold: 0.3 }
    );

    // Observe after DOM is ready
    requestAnimationFrame(() => {
      sectionNames.forEach((name) => {
        const el = document.getElementById(name);
        if (el) this.io.observe(el);
      });
      // Also observe the hero header
      const hero = document.querySelector('.hero-header');
      if (hero) {
        hero.id = hero.id || 'hero';
        this.io.observe(hero);
      }
    });
  }

  // ── Click Tracking ──
  _handleClick = (e) => {
    const target = e.target.closest('a, button, [data-track]');
    const section = e.target.closest('section')?.id || e.target.closest('.hero-header') ? 'hero' : 'unknown';

    const entry = {
      time: Date.now() - this.session.startTime,
      section,
      element: target ? (target.tagName + (target.className ? '.' + target.className.split(' ')[0] : '')) : 'body',
      text: target?.textContent?.slice(0, 50) || '',
      x: e.clientX,
      y: e.clientY,
    };

    this.session.clicks.push(entry);

    // Track external link clicks
    if (target?.tagName === 'A' && target.href && target.target === '_blank') {
      this.session.engagement.linkClicks.push({
        url: target.href,
        text: target.textContent?.slice(0, 50),
        time: entry.time,
      });
    }

    this.session.lastActivity = Date.now();
    this._notifyObservers();
  };

  // ── Scroll Depth ──
  _handleScroll = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const depth = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
    if (depth > this.session.maxScrollDepth) {
      this.session.maxScrollDepth = depth;
      this._notifyObservers();
    }
    this.session.lastActivity = Date.now();
  };

  // ── Tab Focus/Blur ──
  _handleVisibility = () => {
    if (document.hidden) {
      // Tab lost focus
      const focusDuration = Date.now() - this.session.engagement._lastFocusStart;
      this.session.engagement.totalFocusTime += focusDuration;
      this.session.engagement.tabSwitches++;
    } else {
      // Tab regained focus
      this.session.engagement._lastFocusStart = Date.now();
    }
    this._notifyObservers();
  };

  // ── Print Detection ──
  _handleBeforePrint = () => {
    this.session.engagement.printAttempts++;
    this._notifyObservers();
  };

  // ── Copy Detection ──
  _handleCopy = () => {
    this.session.engagement.copyAttempts++;
    this._notifyObservers();
  };

  _setupListeners() {
    document.addEventListener('click', this._handleClick, true);
    window.addEventListener('scroll', this._handleScroll, { passive: true });
    document.addEventListener('visibilitychange', this._handleVisibility);
    window.addEventListener('beforeprint', this._handleBeforePrint);
    document.addEventListener('copy', this._handleCopy);
    window.addEventListener('beforeunload', this._handleUnload);
  }

  // ── Arrival Notification ──
  _sendArrivalNotification() {
    const { tracking, visitor } = this.session;
    const title = tracking.jobId
      ? `👀 Resume viewed for: ${tracking.jobId}`
      : '👀 Someone is viewing your resume!';

    const body = [
      tracking.refSource && `Source: ${tracking.refSource}`,
      tracking.forwardedBy && `⚡ FORWARDED by: ${tracking.forwardedBy}`,
      tracking.campaignId && `Campaign: ${tracking.campaignId}`,
      `Device: ${visitor.isMobile ? 'Mobile' : 'Desktop'} ${visitor.screen}`,
      `From: ${visitor.referrer}`,
      `Timezone: ${visitor.timezone}`,
      `Time: ${new Date().toLocaleString()}`,
    ].filter(Boolean).join('\n');

    this._sendNtfy(title, body, tracking.forwardedBy ? '5' : '3');
  }

  // ── Exit Summary ──
  _handleUnload = () => {
    // Flush visible sections
    Object.keys(this.session._visibleSections).forEach((id) => {
      const dwell = Date.now() - this.session._visibleSections[id];
      this.session.sectionDwell[id] = (this.session.sectionDwell[id] || 0) + dwell;
    });

    // Calculate total focus time
    if (!document.hidden) {
      this.session.engagement.totalFocusTime += Date.now() - this.session.engagement._lastFocusStart;
    }

    const totalTime = Date.now() - this.session.startTime;
    const topSections = Object.entries(this.session.sectionDwell)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, ms]) => `${name}: ${(ms / 1000).toFixed(0)}s`)
      .join(', ');

    const title = this.session.tracking.jobId
      ? `📊 Session ended — ${this.session.tracking.jobId}`
      : '📊 Resume session ended';

    const body = [
      `Total time: ${(totalTime / 1000).toFixed(0)}s (focused: ${(this.session.engagement.totalFocusTime / 1000).toFixed(0)}s)`,
      `Scroll depth: ${this.session.maxScrollDepth}%`,
      `Clicks: ${this.session.clicks.length}`,
      `Top sections: ${topSections || 'none tracked'}`,
      `Tab switches: ${this.session.engagement.tabSwitches}`,
      this.session.engagement.printAttempts > 0 && `🖨️ Print attempts: ${this.session.engagement.printAttempts}`,
      this.session.engagement.linkClicks.length > 0 && `🔗 External links clicked: ${this.session.engagement.linkClicks.map(l => l.text).join(', ')}`,
      `Navigation: ${this.session.navigationPath.map(n => n.section).join(' → ')}`,
      this.session.tracking.forwardedBy && `⚡ Was forwarded by: ${this.session.tracking.forwardedBy}`,
    ].filter(Boolean).join('\n');

    // Use sendBeacon for reliability on page unload
    const ntfyUrl = `https://ntfy.sh/${NTFY_TOPIC}`;
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'text/plain' });
      navigator.sendBeacon(ntfyUrl, blob);
    } else {
      this._sendNtfy(title, body, '3');
    }

    // Send full session data to local server DB
    this._sendWebhook();
  };

  // ── Data Transmission ──
  _sendNtfy(title, body, priority = '3') {
    try {
      fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
        method: 'POST',
        headers: { 'Title': title, 'Priority': priority },
        body,
      }).catch(() => {});
    } catch { /* silent */ }
  }

  _sendWebhook() {
    if (!WEBHOOK_URL) return;

    const payload = this.getSessionSummary();
    try {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(WEBHOOK_URL, blob);
      } else {
        fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      }
    } catch { /* silent */ }
  }

  // ── Clean Session Summary for Export/Dashboard ──
  getSessionSummary() {
    // Flush currently visible sections for live reading
    const liveDwell = { ...this.session.sectionDwell };
    Object.entries(this.session._visibleSections).forEach(([id, start]) => {
      liveDwell[id] = (liveDwell[id] || 0) + (Date.now() - start);
    });

    const totalTime = Date.now() - this.session.startTime;
    let focusTime = this.session.engagement.totalFocusTime;
    if (!document.hidden) {
      focusTime += Date.now() - this.session.engagement._lastFocusStart;
    }

    return {
      sessionId: this.session.sessionId,
      fingerprint: this.session.fingerprint,
      timestamp: new Date().toISOString(),
      totalTimeMs: totalTime,
      focusTimeMs: focusTime,
      visitor: this.session.visitor,
      tracking: this.session.tracking,
      sectionDwell: liveDwell,
      sectionFirstSeen: this.session.sectionFirstSeen,
      navigationPath: this.session.navigationPath,
      clicks: this.session.clicks,
      maxScrollDepth: this.session.maxScrollDepth,
      engagement: {
        tabSwitches: this.session.engagement.tabSwitches,
        printAttempts: this.session.engagement.printAttempts,
        copyAttempts: this.session.engagement.copyAttempts,
        linkClicks: this.session.engagement.linkClicks,
      },
    };
  }

  // ── Generate Shareable Tracking Link ──
  generateTrackingLink(jobId, refSource, shareTarget) {
    const base = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    if (jobId) params.set('job', jobId);
    if (refSource) params.set('ref', refSource);
    if (shareTarget) params.set('fwd', shareTarget);
    params.set('sid', Date.now().toString(36));
    return `${base}?${params.toString()}`;
  }

  // ── Observer Pattern for Dashboard ──
  subscribe(callback) {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  _notifyObservers() {
    this.observers.forEach((cb) => cb(this.getSessionSummary()));
  }

  destroy() {
    document.removeEventListener('click', this._handleClick, true);
    window.removeEventListener('scroll', this._handleScroll);
    document.removeEventListener('visibilitychange', this._handleVisibility);
    window.removeEventListener('beforeprint', this._handleBeforePrint);
    document.removeEventListener('copy', this._handleCopy);
    window.removeEventListener('beforeunload', this._handleUnload);
    if (this.io) this.io.disconnect();
  }
}

// Singleton
let instance = null;
export function getAnalytics() {
  if (!instance) instance = new AnalyticsEngine();
  return instance;
}

export default AnalyticsEngine;
