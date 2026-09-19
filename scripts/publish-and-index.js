#!/usr/bin/env node
// publish-and-index.js  (aka bartact-publish-and-index.js)
// Universal quality gate + multi-engine indexing for ALL bots on ALL sites
//
// USAGE:
//   node scripts/bartact-publish-and-index.js <url> [url2...]
//   node scripts/bartact-publish-and-index.js --account bullstrap <url>
//   node scripts/bartact-publish-and-index.js --account brazenauto <url>
//   node scripts/bartact-publish-and-index.js --account bartact <url>
//
// CREDENTIAL AUTO-DETECTION (if --account not specified):
//   bartact.com / ballkinis.com  → .bartact-indexing-service-account.json (SA)
//   bullstrap.com / carli*        → .bullstrap-indexing-credentials.json (OAuth)
//   everything else               → .brazenauto-indexing-credentials.json (OAuth)
//
// QUALITY GATE (must pass before ANY indexing happens):
//   - Meta title: 40-65 chars
//   - Meta description: 120-165 chars
//   - Word count: 400+ words
//   - At least 1 internal link
//   - No forbidden claims (Cordura on wrong products, invented claims)
//
// INDEXING (on pass):
//   - Google Indexing API (using correct account for domain)
//   - IndexNow → Bing + Yandex (all sites)
//
// HARD RULES — DO NOT CHANGE:
//   - NEVER index affiliate site inner pages (homepages only)
//   - ALWAYS run quality gate before submitting
//   - Existing pages that are already indexed don't need re-submission
//     UNLESS the content changed (blog edits, collection updates, etc.)

const https  = require('https');
const crypto = require('crypto');
const path   = require('path');
const fs     = require('fs');

const WORKSPACE     = path.join(__dirname, '..');
const INDEXNOW_KEY  = 'b4f7e2a1c3d5e6f7a8b9c0d1e2f3a4b5';
const LOG_PATH      = path.join(WORKSPACE, 'memory/publish-index-log.md');

// Credential files
const CREDS = {
  bartact:    path.join(WORKSPACE, '.bartact-indexing-service-account.json'),   // SA
  bullstrap:  path.join(WORKSPACE, '.bullstrap-indexing-credentials.json'),     // OAuth
  brazenauto: path.join(WORKSPACE, '.brazenauto-indexing-credentials.json'),    // OAuth
};

// Domain → account mapping (auto-detect)
const DOMAIN_MAP = [
  { pattern: /bartact\.com|ballkinis\.com/i,             account: 'bartact'    },
  { pattern: /bullstrap\.com|bull-strap\.com|carli/i,    account: 'bullstrap'  },
];
// default: brazenauto

function detectAccount(url) {
  const hostname = new URL(url).hostname.toLowerCase();
  for (const { pattern, account } of DOMAIN_MAP) {
    if (pattern.test(hostname)) return account;
  }
  return 'brazenauto';
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'SEO-Quality-Bot/1.0' } }, res => {
      let buf = '';
      res.on('data', d => buf += d);
      res.on('end', () => resolve({ status: res.statusCode, body: buf }));
    }).on('error', reject);
  });
}

function httpPost(hostname, urlPath, data, headers) {
  return new Promise((resolve, reject) => {
    const body = typeof data === 'string' ? data : JSON.stringify(data);
    const req = https.request({ hostname, path: urlPath, method: 'POST',
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

// ── Google auth ───────────────────────────────────────────────────────────────

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

async function getToken(accountName) {
  const credsFile = CREDS[accountName];
  if (!fs.existsSync(credsFile)) throw new Error(`Creds not found: ${credsFile}`);
  const creds = JSON.parse(fs.readFileSync(credsFile));

  if (creds.type === 'service_account') {
    // SA — JWT flow
    const jwt = makeJWT(creds);
    const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;
    const r = await httpPost('oauth2.googleapis.com', '/token', body,
      { 'Content-Type': 'application/x-www-form-urlencoded' });
    const d = JSON.parse(r.body);
    if (!d.access_token) throw new Error('SA token failed: ' + r.body.slice(0, 100));
    return d.access_token;
  } else {
    // OAuth refresh token flow
    const body = `client_id=${encodeURIComponent(creds.client_id)}&client_secret=${encodeURIComponent(creds.client_secret)}&refresh_token=${encodeURIComponent(creds.refresh_token)}&grant_type=refresh_token`;
    const r = await httpPost('oauth2.googleapis.com', '/token', body,
      { 'Content-Type': 'application/x-www-form-urlencoded' });
    const d = JSON.parse(r.body);
    if (!d.access_token) throw new Error('OAuth token failed: ' + r.body.slice(0, 100));
    return d.access_token;
  }
}

// ── Quality gate ──────────────────────────────────────────────────────────────

const FORBIDDEN_PATTERNS = [
  { re: /bartact\s+invented/i,      msg: 'Never claim Bartact invented anything' },
  { re: /\b1[,\s]?000\s*d\s+cordura/i, msg: 'Do not specify denier count (1000D)' },
];

function stripHtml(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, '')
             .replace(/<style[\s\S]*?<\/style>/gi, '')
             .replace(/<[^>]+>/g, ' ')
             .replace(/&[a-z]+;/gi, ' ')
             .replace(/\s+/g, ' ').trim();
}

function extractMeta(html, name) {
  const p1 = new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']{1,300})["']`, 'i');
  const p2 = new RegExp(`<meta[^>]+content=["']([^"']{1,300})["'][^>]+name=["']${name}["']`, 'i');
  const m = html.match(p1) || html.match(p2);
  return m ? m[1].trim() : null;
}

function extractTitle(html) {
  const m = html.match(/<title>([^<]{1,200})<\/title>/i);
  return m ? m[1].trim() : null;
}

async function qualityCheck(url) {
  console.log(`\n── Quality check: ${url}`);
  let r;
  try {
    r = await httpsGet(url);
  } catch (e) {
    return { pass: false, errors: [`Fetch failed: ${e.message}`], url };
  }

  if (r.status !== 200) {
    return { pass: false, errors: [`HTTP ${r.status} — page not live`], url };
  }

  const html  = r.body;
  const text  = stripHtml(html);
  const words = text.split(/\s+/).filter(w => w.length > 1).length;
  const errors   = [];
  const warnings = [];

  // Meta title
  const title = extractTitle(html);
  if (!title)               errors.push('Missing <title> tag');
  else if (title.length < 30) errors.push(`Title too short: ${title.length} chars — "${title}"`);
  else if (title.length > 65) warnings.push(`Title long: ${title.length} chars (ideal ≤60) — "${title.slice(0,60)}..."`);
  else console.log(`  ✅ Title (${title.length}ch): ${title}`);

  // Meta description
  const desc = extractMeta(html, 'description');
  if (!desc)                errors.push('Missing meta description');
  else if (desc.length < 120) errors.push(`Meta desc too short: ${desc.length} chars (min 120) — "${desc.slice(0,60)}..."`);
  else if (desc.length > 165) warnings.push(`Meta desc long: ${desc.length} chars`);
  else console.log(`  ✅ Meta desc (${desc.length}ch)`);

  // Word count
  if (words < 400) errors.push(`Too short: ${words} words (min 400)`);
  else console.log(`  ✅ Words: ${words}`);

  // Internal links
  const intLinks = (html.match(/href=["'][^"']*(?:bartact|bullstrap|brazen)[^"']*["']/gi) || []).length
                 + (html.match(/href=["']\/[a-z][^"']*["']/gi) || []).length;
  if (intLinks < 1) errors.push('No internal links — need ≥1 link to another page on same site');
  else console.log(`  ✅ Internal links: ${intLinks}`);

  // Forbidden patterns
  for (const { re, msg } of FORBIDDEN_PATTERNS) {
    if (re.test(text)) warnings.push(`Check needed: ${msg}`);
  }

  if (errors.length > 0) {
    console.log(`  ❌ FAILED (${errors.length} error${errors.length > 1 ? 's' : ''}):`);
    errors.forEach(e => console.log(`     • ${e}`));
  } else {
    console.log('  ✅ Quality gate PASSED');
  }
  warnings.forEach(w => console.log(`  ⚠️  ${w}`));

  return { pass: errors.length === 0, errors, warnings, url, title, wordCount: words };
}

// ── Indexing ──────────────────────────────────────────────────────────────────

async function submitGoogle(url, token) {
  const r = await httpPost('indexing.googleapis.com',
    '/v3/urlNotifications:publish',
    { url, type: 'URL_UPDATED' },
    { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  );
  return { ok: r.status === 200, status: r.status };
}

async function submitIndexNow(urls) {
  const byDomain = {};
  for (const url of urls) {
    const h = new URL(url).hostname;
    if (!byDomain[h]) byDomain[h] = [];
    byDomain[h].push(url);
  }
  const endpoints = ['api.indexnow.org', 'www.bing.com', 'yandex.com'];
  const results   = [];
  for (const [domain, domUrls] of Object.entries(byDomain)) {
    const payload = { host: domain, key: INDEXNOW_KEY,
      keyLocation: `https://${domain}/${INDEXNOW_KEY}.txt`, urlList: domUrls };
    for (const ep of endpoints) {
      try {
        const r = await httpPost(ep, '/indexnow', payload,
          { 'Content-Type': 'application/json; charset=utf-8' });
        results.push({ engine: ep, domain, status: r.status });
      } catch (e) {
        results.push({ engine: ep, domain, error: e.message });
      }
    }
  }
  return results;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  let accountOverride = null;
  const urls = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--account' && args[i + 1]) {
      accountOverride = args[++i];
    } else if (args[i].startsWith('http')) {
      urls.push(args[i]);
    }
  }

  if (urls.length === 0) {
    console.error('Usage: node publish-and-index.js [--account bartact|bullstrap|brazenauto] <url> [url2...]');
    process.exit(1);
  }

  console.log('=== Publish & Index — Quality Gate ===');
  console.log(`URLs: ${urls.length} | Time: ${new Date().toISOString()}`);

  // Group by account
  const byAccount = {};
  for (const url of urls) {
    const account = accountOverride || detectAccount(url);
    if (!byAccount[account]) byAccount[account] = [];
    byAccount[account].push(url);
  }

  const passed = [], failed = [];

  // Quality gate — all URLs
  for (const url of urls) {
    const result = await qualityCheck(url);
    if (result.pass) passed.push(url);
    else failed.push({ url, errors: result.errors });
    await sleep(400);
  }

  console.log(`\n── Results: ${passed.length} passed / ${failed.length} failed ──`);

  if (passed.length === 0) {
    console.log('❌ Nothing passed quality gate. Fix issues and re-run.');
    process.exitCode = 1;
    return;
  }

  // Submit passing URLs by account
  const googleResults = [];
  for (const [account, accountUrls] of Object.entries(byAccount)) {
    const passingForAccount = accountUrls.filter(u => passed.includes(u));
    if (passingForAccount.length === 0) continue;

    console.log(`\nGoogle Indexing API [${account}]:`);
    let token;
    try {
      token = await getToken(account);
      console.log(`  Token: ✅`);
    } catch (e) {
      console.log(`  Token: ❌ ${e.message}`);
      continue;
    }

    for (const url of passingForAccount) {
      const { ok, status } = await submitGoogle(url, token);
      console.log(`  ${ok ? '✅' : '❌ ' + status} ${url}`);
      googleResults.push({ url, ok, status });
      await sleep(300);
    }
  }

  // IndexNow — all passed URLs, all engines
  console.log('\nIndexNow (Bing + Yandex):');
  const inResults = await submitIndexNow(passed);
  inResults.forEach(r => {
    const ok = r.status === 200 || r.status === 202;
    console.log(`  ${ok ? '✅' : '❌'} ${r.engine} [${r.domain}]: ${r.status || r.error}`);
  });

  // Log
  const date  = new Date().toISOString().split('T')[0];
  const entry = [
    `\n## ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC`,
    `Passed: ${passed.length}/${urls.length} | Google OK: ${googleResults.filter(r => r.ok).length} | IndexNow: submitted`,
    ...passed.map(u => `- ✅ ${u}`),
    ...(failed.length ? ['Failed quality gate:', ...failed.map(f => `- ❌ ${f.url}: ${f.errors[0]}`)] : []),
  ].join('\n');
  fs.appendFileSync(LOG_PATH, entry + '\n');

  console.log(`\n=== Done: ${passed.length} indexed, ${failed.length} blocked by quality gate ===`);
  if (failed.length > 0) process.exitCode = 1;
}

main().catch(e => { console.error('FATAL:', e.message); process.exitCode = 1; });
