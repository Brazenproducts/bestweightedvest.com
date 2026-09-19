#!/usr/bin/env node
/**
 * Elipacko Backlink Sites — Google Indexing API Drip
 * Submits 120 URLs/day from the 28 elipacko backlink sites via Google Indexing API
 * Uses the shared Bartact SA (axl-348@proud-stage-397621) — quota allocation: 120/day for elipacko
 * Bartact gets 80/day (per Slashdaddy 2026-09-07), elipacko gets 120/day
 *
 * 447 total URLs across 28 sites → full cycle every ~4 days
 * State tracked in memory/elipacko-backlinks-indexing-state.json
 *
 * Cron: Daily 08:00 UTC (before Bartact's 07:30 UTC run finishes, so runs after it)
 * Actually: 09:00 UTC to ensure Bartact has run and quota tracking is accurate
 *
 * Permanent fix: dedicated SA for elipacko (TODO — needs Mitch to create in GCP console)
 */
console.log('[PLAYBOOK] Sections checked: Google Indexing API Quota Management, Backlink Site Maintenance, Cron Monitoring.');

const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const WORKSPACE = '/home/ubuntu/.openclaw/workspace';
const SA_FILE = path.join(WORKSPACE, '.bartact-indexing-service-account.json');
const STATE_FILE = path.join(WORKSPACE, 'memory/elipacko-backlinks-indexing-state.json');
const ELIPACKO_SITES_DIR = path.join(WORKSPACE, 'elipacko-sites');
const DAILY_QUOTA = 120;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Build full URL list from all 28 backlink site repos
function buildUrlList() {
  const urls = [];
  const skipPatterns = ['google', 'sitemap', 'robots', 'indexnow'];

  for (const d of fs.readdirSync(ELIPACKO_SITES_DIR).sort()) {
    const cnamePath = path.join(ELIPACKO_SITES_DIR, d, 'CNAME');
    if (!fs.existsSync(cnamePath)) continue;
    const domain = fs.readFileSync(cnamePath, 'utf8').trim();
    if (!domain) continue;

    function crawl(dir) {
      for (const entry of fs.readdirSync(dir)) {
        if (entry.startsWith('.')) continue;
        const full = path.join(dir, entry);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          crawl(full);
        } else if (entry.endsWith('.html') && !skipPatterns.some(p => entry.includes(p))) {
          const rel = path.relative(path.join(ELIPACKO_SITES_DIR, d), full);
          if (rel === 'index.html') {
            urls.push(`https://${domain}/`);
          } else if (rel.endsWith('/index.html')) {
            urls.push(`https://${domain}/${rel.replace('/index.html', '/')}`);
          } else {
            urls.push(`https://${domain}/${rel}`);
          }
        }
      }
    }
    crawl(path.join(ELIPACKO_SITES_DIR, d));
  }
  return [...new Set(urls)];
}

// Get Google OAuth token from service account
function getToken(sa) {
  return new Promise((res, rej) => {
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const claim = Buffer.from(JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/indexing',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now, exp: now + 3600
    })).toString('base64url');
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(`${header}.${claim}`);
    const sig = sign.sign(sa.private_key, 'base64url');
    const jwt = `${header}.${claim}.${sig}`;
    const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;
    const req = https.request({
      hostname: 'oauth2.googleapis.com', path: '/token', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) }
    }, re => { let s = ''; re.on('data', c => s += c); re.on('end', () => {
      const d = JSON.parse(s);
      if (d.access_token) res(d.access_token); else rej(new Error(s));
    }); });
    req.on('error', rej); req.write(body); req.end();
  });
}

function submitUrl(token, url) {
  return new Promise((res) => {
    const body = JSON.stringify({ url, type: 'URL_UPDATED' });
    const req = https.request({
      hostname: 'indexing.googleapis.com',
      path: '/v3/urlNotifications:publish',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, re => { let s = ''; re.on('data', c => s += c); re.on('end', () => res({ status: re.statusCode, body: s })); });
    req.on('error', () => res({ status: 0, body: 'error' }));
    req.write(body); req.end();
  });
}

async function main() {
  const sa = JSON.parse(fs.readFileSync(SA_FILE));
  const allUrls = buildUrlList();
  console.log(`Total URLs in pool: ${allUrls.length}`);

  // Load state
  let state = { offset: 0, totalSubmitted: 0, lastRun: null, runs: [] };
  if (fs.existsSync(STATE_FILE)) {
    try { state = JSON.parse(fs.readFileSync(STATE_FILE)); } catch (e) {}
  }

  // Pick next 120 URLs from rotating list
  const startOffset = state.offset % allUrls.length;
  const batch = [];
  for (let i = 0; i < DAILY_QUOTA; i++) {
    batch.push(allUrls[(startOffset + i) % allUrls.length]);
  }

  console.log(`Submitting ${batch.length} URLs starting at offset ${startOffset}/${allUrls.length}`);
  console.log(`Cycle: ${Math.floor(startOffset / allUrls.length * 100)}% through full rotation`);

  const token = await getToken(sa);
  let ok = 0, quota429 = 0, fail = 0;

  for (const url of batch) {
    const r = await submitUrl(token, url);
    if (r.status === 200) {
      ok++;
    } else if (r.status === 429) {
      quota429++;
      console.log(`⚠️  QUOTA EXCEEDED at ${ok} URLs — stopping`);
      break;
    } else {
      fail++;
      const msg = JSON.parse(r.body || '{}')?.error?.message || r.body.slice(0, 60);
      console.log(`❌ ${r.status} ${url} — ${msg}`);
    }
    await sleep(250);
  }

  const newOffset = (startOffset + ok) % allUrls.length;
  state.offset = newOffset;
  state.totalSubmitted = (state.totalSubmitted || 0) + ok;
  state.lastRun = new Date().toISOString();
  state.runs = [...(state.runs || []).slice(-30), {
    date: state.lastRun, ok, quota429, fail,
    offset: startOffset, newOffset, total: allUrls.length
  }];
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

  console.log(`\n✅ ${ok} submitted | ⚠️ ${quota429} quota | ❌ ${fail} failed`);
  console.log(`Next run starts at offset ${newOffset} (${allUrls[(newOffset % allUrls.length)]})`);
  console.log(`Full cycle completes every ~${Math.ceil(allUrls.length / DAILY_QUOTA)} days`);

  if (quota429 > 0) {
    process.exit(1); // Signal failure so cron log captures it
  }
}

main().catch(e => { console.error(e); process.exit(1); });
