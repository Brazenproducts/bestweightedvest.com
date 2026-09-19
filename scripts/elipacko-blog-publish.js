#!/usr/bin/env node
'use strict';
/**
 * Elipacko Backlink Blog Publisher
 * Accepts JSON on stdin, builds HTML, commits to GitHub, indexes via Google + Bing
 *
 * Input (stdin JSON):
 * {
 *   "siteName": "poultryboxes",          // dir name in elipacko-sites/ (no .com)
 *   "domain": "poultryboxes.com",        // CNAME domain
 *   "slug": "pp-poultry-box-sizing-guide.html",
 *   "title": "PP Poultry Box Sizing Guide: Broiler to Turkey",
 *   "metaDesc": "150 chars max...",
 *   "category": "Buying Guide",          // e.g. "Buying Guide", "Industry Explainer", "How-To"
 *   "htmlContent": "<p>...</p>..."       // inner HTML only, no wrapper
 * }
 *
 * Output (stdout JSON): { ok, url, googleStatus, bingStatus, error }
 */

const fs   = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const WORKSPACE    = '/home/ubuntu/.openclaw/workspace';
const SITES_DIR    = path.join(WORKSPACE, 'elipacko-sites');
const SA_FILE      = path.join(WORKSPACE, '.bartact-indexing-service-account.json');
const INDEXNOW_KEY = 'b4f7e2a1c3d5e6f7a8b9c0d1e2f3a4b5';
const LOG_FILE     = path.join(WORKSPACE, 'logs/elipacko-blog-publishing.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.error(line);
  try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch (e) {}
}

function toDisplayName(domain) {
  return domain.replace('.com', '').replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([a-zA-Z])([0-9])/g, '$1 $2')
    .split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function buildHtml({ domain, slug, title, metaDesc, category, htmlContent }) {
  const displayName = toDisplayName(domain);
  const canonical   = `https://${domain}/blog/${slug}`;
  const dateStr     = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const schemaDate  = new Date().toISOString().split('T')[0];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${title} | ${displayName}</title>
  <meta name="description" content="${metaDesc}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${metaDesc}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="https://brazenproducts.github.io/elipacko-assets/orange-box.jpg">
  <meta property="og:image:width" content="900">
  <meta property="og:image:height" content="600">
  <meta property="og:site_name" content="${displayName}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${metaDesc}">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":"${title.replace(/"/g, '\\"')}","description":"${metaDesc.replace(/"/g, '\\"')}","url":"${canonical}","datePublished":"${schemaDate}","dateModified":"${schemaDate}","publisher":{"@type":"Organization","name":"Elipacko USA","url":"https://elipacko.com"}}</script>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,'Segoe UI',system-ui,sans-serif;background:#fff;color:#1a1a1a;line-height:1.75}
    header{border-bottom:1px solid #e5e5e5;padding:.9rem 1.5rem;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:#fff;z-index:100}
    .brand{font-size:.95rem;font-weight:800;color:#1a1a1a;letter-spacing:-.4px;text-decoration:none}
    .brand em{color:#d97706;font-style:normal}
    nav a{color:#555;font-size:.8rem;text-decoration:none;font-weight:500;margin-left:1.4rem}
    nav a:hover{color:#d97706}
    .wrap{max-width:740px;margin:0 auto;padding:2.5rem 1.5rem 5rem}
    .post-cat{font-size:.72rem;color:#d97706;font-weight:700;text-transform:uppercase;letter-spacing:.14em;margin-bottom:.6rem}
    h1{font-size:clamp(1.5rem,3.5vw,2.1rem);font-weight:800;line-height:1.18;margin-bottom:.9rem;color:#0a1628}
    .byline{font-size:.78rem;color:#aaa;border-bottom:1px solid #eee;padding-bottom:1.1rem;margin-bottom:1.8rem}
    h2{font-size:1.05rem;font-weight:700;color:#0a1628;margin:2.2rem 0 .6rem}
    h3{font-size:.96rem;font-weight:700;color:#0a1628;margin:1.6rem 0 .4rem}
    p{color:#3d3d3d;margin-bottom:1rem;font-size:.97rem}
    ul,ol{color:#3d3d3d;font-size:.97rem;padding-left:1.5rem;margin-bottom:1rem}
    li{margin-bottom:.45rem}
    a{color:#d97706;font-weight:600;text-decoration:none}
    a:hover{text-decoration:underline}
    strong{color:#1a1a1a}
    .cta{background:#fffbf0;border:1.5px solid #d97706;border-radius:8px;padding:1.4rem 1.6rem;margin:2.2rem 0}
    .cta p{margin-bottom:.4rem;color:#78350f}
    .cta a{color:#78350f;font-weight:700}
    footer{border-top:1px solid #eee;padding:2rem 1.5rem;text-align:center;color:#bbb;font-size:.76rem;max-width:740px;margin:0 auto}
  </style>
</head>
<body>
  <header>
    <a href="/" class="brand">${displayName} <em>Guide</em></a>
    <nav>
      <a href="/">Home</a>
      <a href="/blog/index.html">Blog</a>
    </nav>
  </header>
  <div class="wrap">
    <p class="post-cat">${category || 'Industry Guide'}</p>
    <h1>${title}</h1>
    <p class="byline">${displayName} Editorial &bull; ${dateStr}</p>
    ${htmlContent}
  </div>
  <footer>
    <p>&copy; 2026 ${displayName} — Industry guides and packaging information</p>
  </footer>
</body>
</html>`;
}

function buildBlogIndex(domain) {
  const displayName = toDisplayName(domain);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Blog | ${displayName}</title>
  <link rel="canonical" href="https://${domain}/blog/">
  <style>body{font-family:system-ui,sans-serif;max-width:720px;margin:0 auto;padding:2rem 1.5rem;color:#333}h1{margin-bottom:1rem}a{color:#d97706}</style>
</head>
<body>
  <h1>${displayName} Blog</h1>
  <p>Industry guides and packaging product information.</p>
  <p style="margin-top:1rem"><a href="/">← Back to home</a></p>
</body>
</html>`;
}

async function getGoogleToken() {
  const sa  = JSON.parse(fs.readFileSync(SA_FILE, 'utf8'));
  const now = Math.floor(Date.now() / 1000);
  const hdr = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const clm = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600, iat: now
  })).toString('base64url');
  const sig = crypto.createSign('RSA-SHA256');
  sig.update(`${hdr}.${clm}`);
  const jwt = `${hdr}.${clm}.${sig.sign(sa.private_key, 'base64url')}`;

  return new Promise((resolve, reject) => {
    const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;
    const req = https.request({
      hostname: 'oauth2.googleapis.com', path: '/token', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        const j = JSON.parse(d);
        j.access_token ? resolve(j.access_token) : reject(new Error(`Token fail: ${d.slice(0, 200)}`));
      });
    });
    req.on('error', reject); req.write(body); req.end();
  });
}

async function submitToGoogle(url, token) {
  return new Promise(resolve => {
    const body = JSON.stringify({ url, type: 'URL_UPDATED' });
    const req = https.request({
      hostname: 'indexing.googleapis.com',
      path: '/v3/urlNotifications:publish',
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d.slice(0, 200) }));
    });
    req.on('error', e => resolve({ status: 0, body: e.message }));
    req.write(body); req.end();
  });
}

async function submitToBing(domain, url) {
  return new Promise(resolve => {
    const body = JSON.stringify({
      host: domain, key: INDEXNOW_KEY,
      keyLocation: `https://${domain}/${INDEXNOW_KEY}.txt`,
      urlList: [url]
    });
    const req = https.request({
      hostname: 'www.bing.com', path: '/indexnow', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode }));
    });
    req.on('error', e => resolve({ status: 0, body: e.message }));
    req.write(body); req.end();
  });
}

async function main() {
  let raw = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) raw += chunk;
  const data = JSON.parse(raw.trim());

  const { siteName, domain, slug, title, metaDesc, category, htmlContent } = data;
  if (!siteName || !domain || !slug || !title || !htmlContent) {
    throw new Error('Missing required fields: siteName, domain, slug, title, htmlContent');
  }

  const siteDir    = path.join(SITES_DIR, siteName);
  const blogDir    = path.join(siteDir, 'blog');
  const filePath   = path.join(blogDir, slug);
  const url        = `https://${domain}/blog/${slug}`;

  if (!fs.existsSync(siteDir)) throw new Error(`Site dir not found: ${siteDir}`);

  // Ensure blog/ dir + index.html
  if (!fs.existsSync(blogDir)) {
    fs.mkdirSync(blogDir, { recursive: true });
    log(`Created blog/ for ${domain}`);
  }
  const blogIndexPath = path.join(blogDir, 'index.html');
  if (!fs.existsSync(blogIndexPath)) {
    fs.writeFileSync(blogIndexPath, buildBlogIndex(domain));
    log(`Created blog/index.html for ${domain}`);
  }

  // Write blog post
  const html = buildHtml({ domain, slug, title, metaDesc, category, htmlContent });
  fs.writeFileSync(filePath, html, 'utf8');
  log(`✅ Wrote blog/${slug} for ${domain}`);

  // Git commit + push
  const gitOpts = { cwd: siteDir, encoding: 'utf8', timeout: 60000 };
  spawnSync('git', ['config', 'user.email', 'bot@brazenproducts.com'], gitOpts);
  spawnSync('git', ['config', 'user.name', 'Brazen Bot'], gitOpts);

  const filesToAdd = ['blog/' + slug];
  if (!fs.existsSync(path.join(blogDir, '.gitkeep'))) filesToAdd.push('blog/index.html');

  spawnSync('git', ['add', ...filesToAdd], gitOpts);
  const commit = spawnSync('git', ['commit', '-m', `blog: ${title.slice(0, 72)}`], gitOpts);
  if (commit.status !== 0 && !commit.stdout.includes('nothing to commit')) {
    log(`⚠️ git commit: ${commit.stderr || commit.stdout}`);
  }

  // Pull --rebase first to handle any remote-ahead conflicts, then push with upstream set
  const pull = spawnSync('git', ['pull', '--rebase', 'origin', 'main'], gitOpts);
  if (pull.status !== 0) {
    log(`⚠️ git pull --rebase for ${domain}: ${pull.stderr || pull.stdout}`);
  }
  const push = spawnSync('git', ['push', '--set-upstream', 'origin', 'main'], gitOpts);
  if (push.status !== 0) {
    log(`❌ git push failed for ${domain}: ${push.stderr}`);
  } else {
    log(`✅ Pushed ${domain}/blog/${slug}`);
  }

  // Google Indexing API (Bartact SA — shared quota, 120/day for elipacko backlinks)
  let googleStatus = '❌ skipped';
  try {
    const token  = await getGoogleToken();
    const result = await submitToGoogle(url, token);
    googleStatus = result.status === 200 ? '✅ 200' : `❌ HTTP ${result.status} ${result.body.slice(0, 80)}`;
    log(`Google Indexing ${googleStatus} — ${url}`);
  } catch (e) {
    googleStatus = `❌ ${e.message.slice(0, 80)}`;
    log(`Google Indexing error: ${e.message}`);
  }

  // Bing IndexNow
  let bingStatus = '❌ skipped';
  try {
    const result = await submitToBing(domain, url);
    bingStatus = (result.status === 200 || result.status === 202) ? `✅ ${result.status}` : `❌ HTTP ${result.status}`;
    log(`Bing IndexNow ${bingStatus} — ${url}`);
  } catch (e) {
    bingStatus = `❌ ${e.message.slice(0, 80)}`;
  }

  const out = { ok: true, url, googleStatus, bingStatus };
  process.stdout.write('\n' + JSON.stringify(out) + '\n');
}

main().catch(e => {
  log(`FATAL: ${e.message}`);
  process.stdout.write(JSON.stringify({ ok: false, error: e.message }) + '\n');
  process.exit(1);
});
