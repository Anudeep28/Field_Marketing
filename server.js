/**
 * FieldPulse Sync Server
 *
 * A lightweight Node.js server that:
 *  1. Serves the static Expo web build from ./dist
 *  2. Provides a shared PostgreSQL-backed data store (replaces per-origin localStorage)
 *  3. Provides Server-Sent Events (SSE) for real-time push to admin dashboard
 *  4. Accepts POST /api/events from field agents to broadcast via SSE
 *
 * Usage:
 *   node server.js
 *   → serves on http://0.0.0.0:3000
 *   → admin opens http://localhost:3000
 *   → agents open  http://<LAN_IP>:3000
 *
 * Environment variables:
 *   DATABASE_URL  — PostgreSQL connection string (required)
 *   PORT          — HTTP port (default: 3000)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');

// ── PostgreSQL data store ────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=disable')
    ? false
    : process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS kv_store (
      key         TEXT PRIMARY KEY,
      value       TEXT,
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  console.log('�️  PostgreSQL kv_store table ready');
}

async function dbGet(key) {
  const { rows } = await pool.query('SELECT value FROM kv_store WHERE key = $1', [key]);
  return rows.length > 0 ? rows[0].value : null;
}

async function dbSet(key, value) {
  await pool.query(
    `INSERT INTO kv_store (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
    [key, value]
  );
}

async function dbDelete(key) {
  await pool.query('DELETE FROM kv_store WHERE key = $1', [key]);
}

// ── SSE clients ─────────────────────────────────────────────────────
let sseClients = [];

function broadcastSSE(event) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  sseClients.forEach((res) => {
    try { res.write(payload); } catch { /* client gone */ }
  });
}

// ── Event log (last 200 events kept in memory) ─────────────────────
const eventLog = [];
const MAX_EVENTS = 200;

function pushEvent(evt) {
  evt.ts = Date.now();
  evt.id = evt.id || `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  eventLog.push(evt);
  if (eventLog.length > MAX_EVENTS) eventLog.splice(0, eventLog.length - MAX_EVENTS);
  broadcastSSE(evt);
}

// ── MIME types ──────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.ttf':  'font/ttf',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.map':  'application/json',
};

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => resolve(body));
  });
}

const server = http.createServer(async (req, res) => {
  cors(res);

  // ── Preflight ──
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // ══════════════════════════════════════════════════════════════════
  // API: Server-Sent Events stream
  // ══════════════════════════════════════════════════════════════════
  if (pathname === '/api/events' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    res.write(':ok\n\n');

    // Send any recent events the client may have missed (last 30 seconds)
    const since = parseInt(url.searchParams.get('since') || '0', 10);
    if (since > 0) {
      const missed = eventLog.filter((e) => e.ts > since);
      missed.forEach((e) => res.write(`data: ${JSON.stringify(e)}\n\n`));
    }

    sseClients.push(res);
    req.on('close', () => {
      sseClients = sseClients.filter((c) => c !== res);
    });
    return;
  }

  // ══════════════════════════════════════════════════════════════════
  // API: Push event (field agent → server → admin via SSE)
  // ══════════════════════════════════════════════════════════════════
  if (pathname === '/api/events' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const evt = JSON.parse(body);
      pushEvent(evt);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Invalid JSON' }));
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // API: Shared data store  GET /api/data/:key
  // ══════════════════════════════════════════════════════════════════
  if (pathname.startsWith('/api/data/') && req.method === 'GET') {
    const key = decodeURIComponent(pathname.slice('/api/data/'.length));
    try {
      const value = await dbGet(key);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ key, value: value !== null ? value : null }));
    } catch (err) {
      console.error('DB GET error:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Database error' }));
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // API: Shared data store  POST /api/data/:key
  // ══════════════════════════════════════════════════════════════════
  if (pathname.startsWith('/api/data/') && req.method === 'POST') {
    const key = decodeURIComponent(pathname.slice('/api/data/'.length));
    const body = await readBody(req);
    try {
      const { value } = JSON.parse(body);
      await dbSet(key, value);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      if (err instanceof SyntaxError) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
      console.error('DB SET error:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Database error' }));
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // API: Delete data key  (used by resetAllData)
  // ══════════════════════════════════════════════════════════════════
  if (pathname.startsWith('/api/data/') && req.method === 'DELETE') {
    const key = decodeURIComponent(pathname.slice('/api/data/'.length));
    try {
      await dbDelete(key);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      console.error('DB DELETE error:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Database error' }));
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // Static file serving (Expo web build)
  // ══════════════════════════════════════════════════════════════════
  let filePath = path.join(DIST_DIR, pathname === '/' ? 'index.html' : pathname);

  // If path doesn't exist, serve index.html (SPA fallback)
  if (!fs.existsSync(filePath)) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    const ext = path.extname(filePath);
    const mime = MIME[ext] || 'application/octet-stream';
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-cache' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

async function start() {
  try {
    await initDb();
  } catch (err) {
    console.error('❌ Failed to connect to PostgreSQL:', err.message);
    console.error('   Make sure DATABASE_URL is set and the database is reachable.');
    process.exit(1);
  }

  server.listen(PORT, '0.0.0.0', () => {
    const interfaces = require('os').networkInterfaces();
    let lanIP = 'unknown';
    for (const iface of Object.values(interfaces)) {
      for (const cfg of iface) {
        if (cfg.family === 'IPv4' && !cfg.internal) { lanIP = cfg.address; break; }
      }
    }
    console.log('');
    console.log('  ┌─────────────────────────────────────────────┐');
    console.log('  │  FieldPulse Sync Server running!             │');
    console.log('  │                                              │');
    console.log(`  │  Admin:  http://localhost:${PORT}              │`);
    console.log(`  │  Agents: http://${lanIP}:${PORT}     │`);
    console.log('  │                                              │');
    console.log('  │  SSE:    /api/events  (GET = stream)         │');
    console.log('  │  Events: /api/events  (POST = push)          │');
    console.log('  │  Data:   /api/data/:key (GET/POST/DELETE)    │');
    console.log('  └─────────────────────────────────────────────┘');
    console.log('');
  });
}

start();
