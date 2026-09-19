#!/usr/bin/env node
// bartact-full-site-indexing.js
// Submits Bartact AFFILIATE BACKLINK SITES to Google Indexing API
// Uses axl-348 SA (project 351767043397) — quota shared with Elipacko (Fern)
// bartact.com itself is already indexed — do NOT re-submit it here
// Runs at 08:05 UTC daily (quota resets 08:00 UTC = midnight PST)

const fs   = require('fs');
const https = require('https');
const crypto = require('crypto');
const path = require('path');

const WORKSPACE  = path.join(__dirname, '..');
const SA_PATH    = path.join(WORKSPACE, '.bartact-indexing-service-account.json');
const STATE_PATH = path.join(WORKSPACE, 'memory/bartact-affiliate-indexing-state.json');
const LOG_PATH   = path.join(WORKSPACE, 'memory/bartact-affiliate-indexing-log.md');
const DAILY_LIMIT = 150; // leave ~50 for Fern's Elipacko indexing

// HARD RULE: HOMEPAGES ONLY for affiliate sites.
// Inner pages can have products removed from Amazon or pulled by us = ghost URLs.
// NEVER submit inner pages of affiliate sites to Google Indexing API.
// Wrangliator pages are safe (editorial content, no products that get removed).
const AFFILIATE_URLS = [
  // Store 01 — automotive affiliate sites, homepages ONLY
  'https://fordbroncoaccessories.com/',
  'https://besttruckaccessories.com/',
  'https://wranglerseatcover.com/',
  'https://gladiatorseatcover.com/',
  'https://gladiatorseat.com/',
  'https://jlseatcovers.com/',
  'https://jlseats.com/',
  'https://jluseatcovers.com/',
  'https://jkseatcovers.com/',
  'https://tacticalseatcovers.com/',
  'https://tacticalseats.com/',
  'https://wranglerseats.com/',
  'https://wranglerseat.com/',
  'https://jlcovers.com/',
  'https://wranglergrabhandles.com/',
  'https://rollbarhandles.com/',
  'https://jkrollbar.com/',
  'https://wranglerjeepaccessories.com/',
  'https://broncofloormats.com/',
  'https://broncoexterior.com/',
  'https://lightningaftermarket.com/',
  'https://mollestraps.com/',
  'https://slatetruckaccessories.com/',
  'https://tacomaseats.com/',
  'https://bestseatcover.com/',
  'https://bestbroncoaccessories.com/',
  'https://bestrecoverykit.com/',
  'https://gladiatorgrabhandle.com/',
  'https://jeepseatcover.com/',
  'https://jkseatcovers.com/',
  'https://jtseats.com/',
  'https://jtseatcovers.com/',
  'https://tjseatcovers.com/',
  'https://molleattachments.com/',
  'https://tacticalseat.com/',
  'https://tacticalcovers.com/',
  'https://allautodirect.com/',
  'https://bestgolfcartaccessories.com/',
  'https://mollebag.com/',
  'https://molleinterior.com/',
  'https://mollesystems.com/',
  'https://broncograbhandles.com/',
  'https://broncohandles.com/',
  'https://broncointerior.com/',
  'https://broncorollbars.com/',
  'https://broncoseat.com/',
  'https://broncoshade.com/',
  'https://broncoupgrade.com/',
  'https://sidebysidegoods.com/',
  // wrangliator — editorial content, safe to index all pages
  'https://wrangliator.com/',
  'https://wrangliator.com/jeep-wrangler-seat-covers.html',
  'https://wrangliator.com/paracord-grab-handles.html',
  'https://wrangliator.com/molle-accessories.html',
  'https://wrangliator.com/door-storage-bags.html',
  'https://wrangliator.com/fire-extinguisher-mount.html',
  'https://wrangliator.com/sun-shades.html',
  'https://wrangliator.com/suspension-limit-straps.html',
  'https://wrangliator.com/console-organizers.html',
  'https://wrangliator.com/550-paracord.html',
];

function makeJWT(sa) {
  const now = Math.floor(Date.now() / 1000);
  const h = Buffer.from(JSON.stringify({alg:'RS256',typ:'JWT'})).toString('base64url');
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

function httpPost(hostname, path, data, headers) {
  return new Promise((resolve, reject) => {
    const body = typeof data === 'string' ? data : JSON.stringify(data);
    const req = https.request({hostname, path, method:'POST',
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

async function getToken(sa) {
  const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${makeJWT(sa)}`;
  const r = await httpPost('oauth2.googleapis.com', '/token', body,
    {'Content-Type':'application/x-www-form-urlencoded'});
  const d = JSON.parse(r.body);
  if (!d.access_token) throw new Error('No token: ' + r.body);
  return d.access_token;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const sa = JSON.parse(fs.readFileSync(SA_PATH));
  const today = new Date().toISOString().split('T')[0];

  let state = {pointer: 0, lastDate: '', submittedToday: 0, totalSubmitted: 0};
  try { state = JSON.parse(fs.readFileSync(STATE_PATH)); } catch(e) {}
  if (state.lastDate !== today) {
    state.lastDate = today;
    state.submittedToday = 0;
  }

  if (state.submittedToday >= DAILY_LIMIT) {
    console.log(`Already submitted ${state.submittedToday} today. Done.`);
    return;
  }

  const token = await getToken(sa);
  const remaining = DAILY_LIMIT - state.submittedToday;
  const pointer = state.pointer || 0;
  let ok = 0, fail = 0;

  console.log(`Bartact affiliate indexing — ${today}`);
  console.log(`Pointer: ${pointer}/${AFFILIATE_URLS.length}, quota remaining: ${remaining}`);

  for (let i = 0; i < AFFILIATE_URLS.length && ok + fail < remaining; i++) {
    const idx = (pointer + i) % AFFILIATE_URLS.length;
    const url = AFFILIATE_URLS[idx];
    const r = await httpPost('indexing.googleapis.com',
      '/v3/urlNotifications:publish',
      {url, type: 'URL_UPDATED'},
      {'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'}
    );
    if (r.status === 200) {
      ok++;
      console.log(`✅ [${ok}] ${url}`);
    } else {
      fail++;
      const msg = r.body.slice(0, 100);
      console.log(`❌ ${r.status} ${url}: ${msg}`);
      if (r.status === 429) { console.log('Quota hit.'); break; }
    }
    await sleep(250);
  }

  state.pointer = (pointer + ok + fail) % AFFILIATE_URLS.length;
  state.submittedToday += ok;
  state.totalSubmitted = (state.totalSubmitted || 0) + ok;
  state.lastRun = new Date().toISOString();
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
  fs.appendFileSync(LOG_PATH, `- ${today}: submitted=${ok}, failed=${fail}, total=${state.totalSubmitted}\n`);

  console.log(`\nDone: ${ok} submitted, ${fail} failed`);
  if (ok < 10) process.exitCode = 1;
}

main().catch(e => { console.error('FATAL:', e.message); process.exitCode = 1; });
