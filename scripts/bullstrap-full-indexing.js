#!/usr/bin/env node
// bullstrap-full-indexing.js
// Drip-feeds the full Bull Strap product catalog (78,820 URLs) to Google Indexing API
// Uses .bullstrap-indexing-credentials.json SA (dedicated quota)
// Runs at 09:05 UTC daily (quota resets ~09:00 UTC)
// At 200/day it cycles the full catalog in ~394 days

const fs   = require('fs');
const https = require('https');
const path = require('path');

const WORKSPACE   = path.join(__dirname, '..');
const SA_PATH     = path.join(WORKSPACE, '.bullstrap-indexing-credentials.json');
const URLS_PATH   = path.join(WORKSPACE, 'sites/besttirepatch.com/memory/bullstrap-all-urls-for-indexing.json');
const STATE_PATH  = path.join(WORKSPACE, 'memory/bullstrap-indexing-state.json');
const LOG_PATH    = path.join(WORKSPACE, 'memory/bullstrap-indexing-daily-log.md');
const DAILY_LIMIT = 200; // dedicated SA — full quota

// OAuth2 refresh token flow (not SA JWT)

function httpPost(hostname, reqPath, data, headers) {
  return new Promise((resolve, reject) => {
    const body = typeof data === 'string' ? data : JSON.stringify(data);
    const req = https.request({hostname, path: reqPath, method:'POST',
      headers: {'Content-Length': Buffer.byteLength(body), ...headers}
    }, res => {
      let buf = '';
      res.on('data', d => buf += d);
      res.on('end', () => resolve({status: res.statusCode, body: buf}));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function getToken(creds) {
  // If access_token already present and not expired, try it first;
  // otherwise refresh via refresh_token
  if (creds.refresh_token) {
    const body = [
      `client_id=${encodeURIComponent(creds.client_id)}`,
      `client_secret=${encodeURIComponent(creds.client_secret)}`,
      `refresh_token=${encodeURIComponent(creds.refresh_token)}`,
      `grant_type=refresh_token`
    ].join('&');
    const r = await httpPost('oauth2.googleapis.com', '/token', body,
      {'Content-Type':'application/x-www-form-urlencoded'});
    const d = JSON.parse(r.body);
    if (!d.access_token) throw new Error('No token from refresh: ' + r.body);
    return d.access_token;
  }
  if (creds.access_token) return creds.access_token;
  throw new Error('No usable credentials (no refresh_token or access_token)');
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const creds = JSON.parse(fs.readFileSync(SA_PATH));
  const urlData = JSON.parse(fs.readFileSync(URLS_PATH));
  const URLS = Array.isArray(urlData) ? urlData : urlData.urls;
  const today = new Date().toISOString().split('T')[0];

  let state = {pointer: 0, lastDate: '', submittedToday: 0, totalPushed: 0};
  try { state = JSON.parse(fs.readFileSync(STATE_PATH)); } catch(e) {}
  if (state.lastDate !== today) {
    state.lastDate = today;
    state.submittedToday = 0;
  }

  if (state.submittedToday >= DAILY_LIMIT) {
    console.log(`Already submitted ${state.submittedToday} today. Done.`);
    console.log(`urlsPushedToday=${state.submittedToday} totalPushed=${state.totalPushed}`);
    return;
  }

  const token = await getToken(creds);
  const remaining = DAILY_LIMIT - state.submittedToday;
  const pointer   = state.pointer || 0;
  let ok = 0, fail = 0;

  console.log(`Bull Strap full catalog indexing — ${today}`);
  console.log(`Catalog size: ${URLS.length} URLs`);
  console.log(`Pointer: ${pointer}/${URLS.length}, quota remaining: ${remaining}`);

  for (let i = 0; i < URLS.length && ok + fail < remaining; i++) {
    const idx = (pointer + i) % URLS.length;
    const url = URLS[idx];
    const r = await httpPost('indexing.googleapis.com',
      '/v3/urlNotifications:publish',
      {url, type: 'URL_UPDATED'},
      {'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'}
    );
    if (r.status === 200) {
      ok++;
      if (ok <= 5 || ok % 50 === 0) console.log(`✅ [${ok}] ${url}`);
    } else {
      fail++;
      const msg = r.body.slice(0, 120);
      console.log(`❌ ${r.status} ${url}: ${msg}`);
      if (r.status === 429) { console.log('Quota hit — stopping.'); break; }
    }
    await sleep(300);
  }

  state.pointer      = (pointer + ok + fail) % URLS.length;
  state.submittedToday += ok;
  state.totalPushed  = (state.totalPushed || 0) + ok;
  state.lastRun      = new Date().toISOString();
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));

  // append to daily log
  const logLine = `| ${today} | ${ok} | ${fail} | ${state.totalPushed} | pointer ${state.pointer}/${URLS.length} |\n`;
  if (!fs.existsSync(LOG_PATH)) {
    fs.writeFileSync(LOG_PATH, '# Bull Strap Indexing Daily Log\n\n| Date | dailyCount | Failed | totalPushed | Position |\n|------|-----------|--------|-------------|----------|\n');
  }
  fs.appendFileSync(LOG_PATH, logLine);

  console.log(`\nDone: ${ok} submitted, ${fail} failed`);
  console.log(`urlsPushedToday=${ok} totalPushed=${state.totalPushed}`);
}

main().catch(e => { console.error('FATAL:', e.message); process.exitCode = 1; });
