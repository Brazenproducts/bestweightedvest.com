#!/usr/bin/env node
// gsc-submit-queue.js
// Submits URLs from google-indexing-queue.json to Google Indexing API (bartact SA)
// Queue file: workspace/google-indexing-queue.json  — { "urls": [...] }
// On success: removes submitted URLs from the queue
// On failure: leaves them in the queue for retry next run
//
// Cron: bartact-gsc-submit-queue — runs daily at 07:01 UTC
// SA: .bartact-indexing-service-account.json (project 351767043397)
// Daily quota: 200 (leave headroom for other indexing jobs)

const fs     = require('fs');
const https  = require('https');
const crypto = require('crypto');
const path   = require('path');

const WORKSPACE   = path.join(__dirname, '..');
const SA_PATH     = path.join(WORKSPACE, '.bartact-indexing-service-account.json');
const QUEUE_PATH  = path.join(WORKSPACE, 'google-indexing-queue.json');
const LOG_PATH    = path.join(WORKSPACE, 'memory/bartact-indexing-daily-log.md');
const STATE_PATH  = path.join(WORKSPACE, 'memory/bartact-indexing-state.json');
const DAILY_LIMIT = 200;

function makeJWT(sa) {
  const now = Math.floor(Date.now() / 1000);
  const h = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600, iat: now
  })).toString('base64url');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${h}.${p}`);
  return `${h}.${p}.${sign.sign(sa.private_key, 'base64url')}`;
}

function httpPost(hostname, urlPath, data, headers) {
  return new Promise((resolve, reject) => {
    const body = typeof data === 'string' ? data : JSON.stringify(data);
    const req = https.request({
      hostname, path: urlPath, method: 'POST',
      headers: { 'Content-Length': Buffer.byteLength(body), ...headers }
    }, res => {
      let buf = '';
      res.on('data', d => buf += d);
      res.on('end', () => resolve({ status: res.statusCode, body: buf }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function getToken(sa) {
  const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${makeJWT(sa)}`;
  const r = await httpPost('oauth2.googleapis.com', '/token', body,
    { 'Content-Type': 'application/x-www-form-urlencoded' });
  const d = JSON.parse(r.body);
  if (!d.access_token) throw new Error('Token failed: ' + r.body.slice(0, 120));
  return d.access_token;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const today = new Date().toISOString().split('T')[0];

  // Load queue
  let queue = { urls: [] };
  try { queue = JSON.parse(fs.readFileSync(QUEUE_PATH)); } catch (e) {
    console.log('No queue file or parse error — nothing to submit.');
    return;
  }

  if (!queue.urls || queue.urls.length === 0) {
    console.log('Queue is empty — nothing to submit.');
    return;
  }

  // Load state for today's quota tracking
  let state = { lastDate: '', submittedToday: 0, totalSubmitted: 0 };
  try { state = JSON.parse(fs.readFileSync(STATE_PATH)); } catch (e) {}
  if (state.lastDate !== today) {
    state.lastDate = today;
    state.submittedToday = 0;
  }

  const quotaRemaining = DAILY_LIMIT - state.submittedToday;
  if (quotaRemaining <= 0) {
    console.log(`Daily quota exhausted (${state.submittedToday}/${DAILY_LIMIT}). Try again tomorrow.`);
    return;
  }

  const batchUrls = queue.urls.slice(0, quotaRemaining);
  console.log(`Bartact GSC submit queue — ${today}`);
  console.log(`Queue: ${queue.urls.length} URLs | Quota remaining: ${quotaRemaining} | Submitting: ${batchUrls.length}`);

  // Auth
  let token;
  try {
    const sa = JSON.parse(fs.readFileSync(SA_PATH));
    token = await getToken(sa);
    console.log('Token: ✅');
  } catch (e) {
    console.error('FATAL: Auth failed —', e.message);
    process.exitCode = 1;
    return;
  }

  let ok = 0, fail = 0;
  const submitted = [];
  const failed    = [];

  for (const url of batchUrls) {
    try {
      const r = await httpPost(
        'indexing.googleapis.com',
        '/v3/urlNotifications:publish',
        { url, type: 'URL_UPDATED' },
        { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      );
      if (r.status === 200) {
        ok++;
        submitted.push(url);
        console.log(`✅ [${ok}] ${url}`);
      } else {
        fail++;
        failed.push(url);
        const msg = r.body.slice(0, 100);
        console.log(`❌ ${r.status} ${url}: ${msg}`);
        if (r.status === 429) { console.log('Quota hit — stopping.'); break; }
      }
    } catch (e) {
      fail++;
      failed.push(url);
      console.log(`❌ ERROR ${url}: ${e.message}`);
    }
    await sleep(300);
  }

  // Remove successfully submitted URLs from queue; keep failed + unprocessed
  const remaining = queue.urls.filter(u => !submitted.includes(u));
  queue.urls = remaining;
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));

  // Update state
  state.submittedToday = (state.submittedToday || 0) + ok;
  state.totalSubmitted = (state.totalSubmitted || 0) + ok;
  state.lastRun = new Date().toISOString();
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));

  // Log
  const logLine = `- ${today}: submitted=${ok}, failed=${fail}, total=${state.totalSubmitted}, queueRemaining=${remaining.length}`;
  fs.appendFileSync(LOG_PATH, logLine + '\n');

  console.log(`\nDone: ${ok} submitted, ${fail} failed, ${remaining.length} still in queue`);

  if (fail > 0) process.exitCode = 1;
}

main().catch(e => { console.error('FATAL:', e.message); process.exitCode = 1; });
