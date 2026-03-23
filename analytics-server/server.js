const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3377;
const DB_PATH = path.join(__dirname, 'resume_analytics.db');

// ── Database Setup ──
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    fingerprint TEXT,
    timestamp TEXT DEFAULT (datetime('now')),
    total_time_ms INTEGER,
    focus_time_ms INTEGER,
    max_scroll_depth INTEGER,
    click_count INTEGER,
    tab_switches INTEGER,
    print_attempts INTEGER,
    copy_attempts INTEGER,

    -- Visitor info
    user_agent TEXT,
    language TEXT,
    timezone TEXT,
    screen TEXT,
    viewport TEXT,
    referrer TEXT,
    is_mobile INTEGER,

    -- Tracking / job correlation
    job_id TEXT,
    ref_source TEXT,
    forwarded_by TEXT,
    campaign_id TEXT,
    share_id TEXT
  );

  CREATE TABLE IF NOT EXISTS section_dwell (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    section TEXT NOT NULL,
    dwell_ms INTEGER NOT NULL,
    first_seen_ms INTEGER,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
  );

  CREATE TABLE IF NOT EXISTS clicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    time_ms INTEGER,
    section TEXT,
    element TEXT,
    label TEXT,
    x INTEGER,
    y INTEGER,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
  );

  CREATE TABLE IF NOT EXISTS navigation_path (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    step INTEGER,
    section TEXT,
    time_ms INTEGER,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
  );

  CREATE TABLE IF NOT EXISTS link_clicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    url TEXT,
    label TEXT,
    time_ms INTEGER,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
  );

  CREATE TABLE IF NOT EXISTS interest_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    timestamp TEXT DEFAULT (datetime('now')),
    choice TEXT NOT NULL,
    name TEXT,
    company TEXT,
    email TEXT,
    note TEXT,
    job_id TEXT,
    ref_source TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_job ON sessions(job_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_fingerprint ON sessions(fingerprint);
  CREATE INDEX IF NOT EXISTS idx_sessions_timestamp ON sessions(timestamp);
  CREATE INDEX IF NOT EXISTS idx_dwell_session ON section_dwell(session_id);
  CREATE INDEX IF NOT EXISTS idx_interest_choice ON interest_responses(choice);
`);

// ── Prepared Statements ──
const insertSession = db.prepare(`
  INSERT OR REPLACE INTO sessions (
    session_id, fingerprint, timestamp, total_time_ms, focus_time_ms,
    max_scroll_depth, click_count, tab_switches, print_attempts, copy_attempts,
    user_agent, language, timezone, screen, viewport, referrer, is_mobile,
    job_id, ref_source, forwarded_by, campaign_id, share_id
  ) VALUES (
    @session_id, @fingerprint, @timestamp, @total_time_ms, @focus_time_ms,
    @max_scroll_depth, @click_count, @tab_switches, @print_attempts, @copy_attempts,
    @user_agent, @language, @timezone, @screen, @viewport, @referrer, @is_mobile,
    @job_id, @ref_source, @forwarded_by, @campaign_id, @share_id
  )
`);

const insertDwell = db.prepare(`
  INSERT INTO section_dwell (session_id, section, dwell_ms, first_seen_ms)
  VALUES (@session_id, @section, @dwell_ms, @first_seen_ms)
`);

const insertClick = db.prepare(`
  INSERT INTO clicks (session_id, time_ms, section, element, label, x, y)
  VALUES (@session_id, @time_ms, @section, @element, @label, @x, @y)
`);

const insertNavStep = db.prepare(`
  INSERT INTO navigation_path (session_id, step, section, time_ms)
  VALUES (@session_id, @step, @section, @time_ms)
`);

const insertLinkClick = db.prepare(`
  INSERT INTO link_clicks (session_id, url, label, time_ms)
  VALUES (@session_id, @url, @label, @time_ms)
`);

const insertInterest = db.prepare(`
  INSERT INTO interest_responses (session_id, choice, name, company, email, note, job_id, ref_source)
  VALUES (@session_id, @choice, @name, @company, @email, @note, @job_id, @ref_source)
`);

// ── Middleware ──
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ── Ingest Session Data ──
const ingestSession = db.transaction((data) => {
  insertSession.run({
    session_id: data.sessionId,
    fingerprint: data.fingerprint,
    timestamp: data.timestamp,
    total_time_ms: data.totalTimeMs,
    focus_time_ms: data.focusTimeMs,
    max_scroll_depth: data.maxScrollDepth,
    click_count: data.clicks?.length || 0,
    tab_switches: data.engagement?.tabSwitches || 0,
    print_attempts: data.engagement?.printAttempts || 0,
    copy_attempts: data.engagement?.copyAttempts || 0,
    user_agent: data.visitor?.userAgent,
    language: data.visitor?.language,
    timezone: data.visitor?.timezone,
    screen: data.visitor?.screen,
    viewport: data.visitor?.viewport,
    referrer: data.visitor?.referrer,
    is_mobile: data.visitor?.isMobile ? 1 : 0,
    job_id: data.tracking?.jobId,
    ref_source: data.tracking?.refSource,
    forwarded_by: data.tracking?.forwardedBy,
    campaign_id: data.tracking?.campaignId,
    share_id: data.tracking?.shareId,
  });

  // Section dwell times
  if (data.sectionDwell) {
    for (const [section, dwell_ms] of Object.entries(data.sectionDwell)) {
      insertDwell.run({
        session_id: data.sessionId,
        section,
        dwell_ms,
        first_seen_ms: data.sectionFirstSeen?.[section] || null,
      });
    }
  }

  // Clicks
  if (data.clicks) {
    for (const click of data.clicks) {
      insertClick.run({
        session_id: data.sessionId,
        time_ms: click.time,
        section: click.section,
        element: click.element,
        label: click.text,
        x: click.x,
        y: click.y,
      });
    }
  }

  // Navigation path
  if (data.navigationPath) {
    data.navigationPath.forEach((nav, i) => {
      insertNavStep.run({
        session_id: data.sessionId,
        step: i,
        section: nav.section,
        time_ms: nav.time,
      });
    });
  }

  // Link clicks
  if (data.engagement?.linkClicks) {
    for (const link of data.engagement.linkClicks) {
      insertLinkClick.run({
        session_id: data.sessionId,
        url: link.url,
        label: link.text,
        time_ms: link.time,
      });
    }
  }
});

// ── Routes ──

// Receive session analytics
app.post('/api/session', (req, res) => {
  try {
    ingestSession(req.body);
    res.json({ ok: true });
  } catch (err) {
    console.error('Ingest error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Receive interest button responses
app.post('/api/interest', (req, res) => {
  try {
    const { sessionId, choice, name, company, email, note, jobId, refSource } = req.body;
    insertInterest.run({
      session_id: sessionId || null,
      choice,
      name: name || null,
      company: company || null,
      email: email || null,
      note: note || null,
      job_id: jobId || null,
      ref_source: refSource || null,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Interest error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Query Endpoints ──

// All sessions summary
app.get('/api/sessions', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
  const offset = parseInt(req.query.offset) || 0;
  const jobId = req.query.job || null;

  let query = `SELECT * FROM sessions`;
  const params = {};
  if (jobId) {
    query += ` WHERE job_id = @job_id`;
    params.job_id = jobId;
  }
  query += ` ORDER BY timestamp DESC LIMIT @limit OFFSET @offset`;
  params.limit = limit;
  params.offset = offset;

  const rows = db.prepare(query).all(params);
  res.json(rows);
});

// Section engagement leaderboard
app.get('/api/analytics/sections', (req, res) => {
  const rows = db.prepare(`
    SELECT section,
           COUNT(*) as views,
           ROUND(AVG(dwell_ms)) as avg_dwell_ms,
           MAX(dwell_ms) as max_dwell_ms,
           ROUND(AVG(first_seen_ms)) as avg_first_seen_ms
    FROM section_dwell
    GROUP BY section
    ORDER BY avg_dwell_ms DESC
  `).all();
  res.json(rows);
});

// Job correlation — which jobs get the most engagement
app.get('/api/analytics/jobs', (req, res) => {
  const rows = db.prepare(`
    SELECT job_id,
           COUNT(*) as sessions,
           ROUND(AVG(total_time_ms)) as avg_time_ms,
           ROUND(AVG(focus_time_ms)) as avg_focus_ms,
           ROUND(AVG(max_scroll_depth)) as avg_scroll,
           SUM(print_attempts) as total_prints,
           COUNT(DISTINCT fingerprint) as unique_viewers
    FROM sessions
    WHERE job_id IS NOT NULL
    GROUP BY job_id
    ORDER BY sessions DESC
  `).all();
  res.json(rows);
});

// Forwarding chain — track who forwarded to whom
app.get('/api/analytics/forwarding', (req, res) => {
  const rows = db.prepare(`
    SELECT forwarded_by, ref_source, job_id,
           COUNT(*) as views,
           ROUND(AVG(total_time_ms)) as avg_time_ms,
           ROUND(AVG(max_scroll_depth)) as avg_scroll
    FROM sessions
    WHERE forwarded_by IS NOT NULL
    GROUP BY forwarded_by, ref_source, job_id
    ORDER BY views DESC
  `).all();
  res.json(rows);
});

// Interest responses
app.get('/api/analytics/interest', (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM interest_responses ORDER BY timestamp DESC
  `).all();
  res.json(rows);
});

// Click heatmap data
app.get('/api/analytics/clicks', (req, res) => {
  const sessionId = req.query.session || null;
  let query = `SELECT section, element, label, COUNT(*) as count
               FROM clicks`;
  const params = {};
  if (sessionId) {
    query += ` WHERE session_id = @session_id`;
    params.session_id = sessionId;
  }
  query += ` GROUP BY section, element ORDER BY count DESC LIMIT 100`;
  const rows = db.prepare(query).all(params);
  res.json(rows);
});

// Full session detail
app.get('/api/sessions/:id', (req, res) => {
  const session = db.prepare('SELECT * FROM sessions WHERE session_id = ?').get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Not found' });

  const dwell = db.prepare('SELECT * FROM section_dwell WHERE session_id = ?').all(req.params.id);
  const clicks = db.prepare('SELECT * FROM clicks WHERE session_id = ?').all(req.params.id);
  const navPath = db.prepare('SELECT * FROM navigation_path WHERE session_id = ? ORDER BY step').all(req.params.id);
  const links = db.prepare('SELECT * FROM link_clicks WHERE session_id = ?').all(req.params.id);

  res.json({ session, dwell, clicks, navPath, links });
});

// Raw export for ML pipeline
app.get('/api/export', (req, res) => {
  const sessions = db.prepare('SELECT * FROM sessions ORDER BY timestamp DESC').all();
  const dwell = db.prepare('SELECT * FROM section_dwell').all();
  const interest = db.prepare('SELECT * FROM interest_responses').all();
  res.json({ sessions, dwell, interest, exportedAt: new Date().toISOString() });
});

// Dashboard stats
app.get('/api/analytics/dashboard', (req, res) => {
  const totals = db.prepare(`
    SELECT COUNT(*) as total_sessions,
           COUNT(DISTINCT fingerprint) as unique_visitors,
           ROUND(AVG(total_time_ms)) as avg_time_ms,
           ROUND(AVG(max_scroll_depth)) as avg_scroll,
           SUM(print_attempts) as total_prints,
           COUNT(DISTINCT job_id) as tracked_jobs
    FROM sessions
  `).get();

  const interested = db.prepare(`SELECT COUNT(*) as count FROM interest_responses WHERE choice = 'interested'`).get();
  const passed = db.prepare(`SELECT COUNT(*) as count FROM interest_responses WHERE choice = 'not-interested'`).get();

  const recentSessions = db.prepare(`SELECT session_id, job_id, ref_source, forwarded_by, total_time_ms, max_scroll_depth, timestamp FROM sessions ORDER BY timestamp DESC LIMIT 10`).all();

  res.json({
    ...totals,
    interested: interested.count,
    passed: passed.count,
    recentSessions,
  });
});

// ── Start ──
app.listen(PORT, () => {
  console.log(`\n  📊 Resume Analytics Server`);
  console.log(`  ─────────────────────────`);
  console.log(`  Running on: http://localhost:${PORT}`);
  console.log(`  Database:   ${DB_PATH}`);
  console.log(`  Dashboard:  http://localhost:${PORT}/api/analytics/dashboard`);
  console.log(`  Sessions:   http://localhost:${PORT}/api/sessions`);
  console.log(`  Export:     http://localhost:${PORT}/api/export\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});
