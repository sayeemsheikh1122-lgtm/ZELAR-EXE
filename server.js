const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

const LICENSES_FILE = path.join(__dirname, 'licenses.json');

function loadLicenses() {
  try {
    if (!fs.existsSync(LICENSES_FILE)) return [];
    return JSON.parse(fs.readFileSync(LICENSES_FILE, 'utf8'));
  } catch { return []; }
}

function saveLicenses(data) {
  fs.writeFileSync(LICENSES_FILE, JSON.stringify(data, null, 2));
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── VERIFY LICENSE ─────────────────────────────────────
app.post('/verify-license', (req, res) => {
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ message: 'No code provided.' });

  const licenses = loadLicenses();
  const idx = licenses.findIndex(l => l.code === code.trim().toUpperCase());

  if (idx === -1) return res.status(403).json({ message: 'Invalid license code.' });
  if (licenses[idx].status === 'USED') return res.status(403).json({ message: 'License already used.' });

  licenses[idx].status  = 'USED';
  licenses[idx].usedAt  = new Date().toISOString();
  licenses[idx].usedBy  = 'web-login';
  licenses[idx].logs = licenses[idx].logs || [];
  licenses[idx].logs.push({ when: new Date().toISOString(), by: 'web-login', action: 'used' });

  saveLicenses(licenses);
  return res.json({ ok: true });
});

// ── PROXY UID ─────────────────────────────────────────
app.post('/proxy/add_uid', async (req, res) => {
  const TARGET = 'http://cloud.obsidianhosting.xyz:2091/api/free/add_uid';
  try {
    const response = await fetch(TARGET, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const text = await response.text();
    res.status(response.status).send(text);
  } catch (err) {
    res.status(502).send('Proxy error: ' + err.message);
  }
});

// ── HEALTH CHECK ──────────────────────────────────────
app.get('/ping', (req, res) => res.send('pong'));

// ── SELF PING (keep Render awake) ─────────────────────
const RENDER_URL = process.env.RENDER_EXTERNAL_URL || null;
setTimeout(() => {
  if (!RENDER_URL) return;
  const ping = () => fetch(`${RENDER_URL}/ping`).catch(() => {});
  ping();
  setInterval(ping, 10 * 60 * 1000);
}, 60 * 1000);

// ── CATCH-ALL ─────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
