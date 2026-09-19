#!/usr/bin/env node
/**
 * bullstrap-gsc-url-delete.js
 * Submits all ghost/abandoned Bull Strap URLs as URL_DELETED to Google Indexing API.
 * Forces Google to drop them immediately instead of waiting months for natural crawl.
 *
 * Uses axl-348@proud-stage-397621 service account (GSC Owner on bullstrap.com).
 * Batch: up to 199/day quota limit.
 * State: memory/bullstrap-gsc-delete-state.json
 */

const crypto = require('crypto');
const https = require('https');
const fs = require('fs');

const SA_FILE = '/home/ubuntu/.openclaw/workspace/.gcp-service-account.json';
const GHOST_FILE = '/home/ubuntu/.openclaw/workspace/memory/bullstrap-abandoned-url-removal.txt';
const STATE_FILE = '/home/ubuntu/.openclaw/workspace/memory/bullstrap-gsc-delete-state.json';
const LOG_FILE = '/home/ubuntu/.openclaw/workspace/memory/bullstrap-gsc-delete.log';
const DAILY_LIMIT = 199;
const DELAY_MS = 400;

const sa = JSON.parse(fs.readFileSync(SA_FILE));

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

function makeJWT() {
  const now = Math.floor(Date.now() / 1000);
  const h = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600
  })).toString('base64url');
  const s = crypto.createSign('RSA-SHA256').update(h + '.' + p).sign(sa.private_key, 'base64url');
  return h + '.' + p + '.' + s;
}

async function getToken() {
  const body = Buffer.from(new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: makeJWT()
  }).toString());
  return new Promise((res, rej) => {
    const req = https.request({
      hostname: 'oauth2.googleapis.com', path: '/token', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': body.length }
    }, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d))); });
    req.on('error', rej); req.write(body); req.end();
  });
}

async function submitDeleted(token, url) {
  const body = Buffer.from(JSON.stringify({ url, type: 'URL_DELETED' }));
  return new Promise((res, rej) => {
    const req = https.request({
      hostname: 'indexing.googleapis.com', path: '/v3/urlNotifications:publish', method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Content-Length': body.length
      }
    }, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => res({ status: r.statusCode, body: d })); });
    req.on('error', rej); req.write(body); req.end();
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  log('=== Bull Strap GSC URL Delete STARTED ===');

  const tok = await getToken();
  if (!tok.access_token) { log('FATAL: Token error: ' + JSON.stringify(tok)); process.exit(1); }
  log('Token OK');

  // Load ghost URLs
  const allUrls = fs.readFileSync(GHOST_FILE, 'utf8')
    .split('\n').map(l => l.trim()).filter(l => l.startsWith('http'));
  log('Total ghost URLs loaded: ' + allUrls.length);

  // Load state
  let state = { processed: 0, succeeded: 0, failed: 0, done: false };
  if (fs.existsSync(STATE_FILE)) {
    try { state = JSON.parse(fs.readFileSync(STATE_FILE)); } catch (e) {}
  }
  if (state.done) { log('Already complete. Delete state file to re-run.'); return; }

  const remaining = allUrls.slice(state.processed);
  const batch = remaining.slice(0, DAILY_LIMIT);
  log(`Processing ${batch.length} URLs (${state.processed} already done)`);

  for (const url of batch) {
    const r = await submitDeleted(tok.access_token, url);
    if (r.status === 200) {
      state.succeeded++;
      log(`✅ ${url.replace('https://bullstrap.com', '')}`);
    } else {
      state.failed++;
      log(`❌ [${r.status}] ${url.replace('https://bullstrap.com', '')} — ${r.body.substring(0, 100)}`);
      if (r.status === 401) {
        log('FATAL: Auth still failing. GSC owner permission may not have propagated yet.');
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
        process.exit(1);
      }
    }
    state.processed = allUrls.indexOf(url) + 1;
    await sleep(DELAY_MS);
  }

  if (state.processed >= allUrls.length) {
    state.done = true;
    log('=== ALL URLS SUBMITTED ===');
  }
  state.completedAt = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  log(`Done: ${state.succeeded} succeeded, ${state.failed} failed`);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
