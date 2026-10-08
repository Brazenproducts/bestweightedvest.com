#!/usr/bin/env node
/**
 * submit-sitemaps.js
 * Re-submits sitemaps for all managed affiliate sites to Google Search Console.
 * 
 * Scans affiliate-sites/ and sites/ directories for sitemap.xml files,
 * derives the live domain from CNAME file (if present) or directory name,
 * then PUTs the sitemap to GSC webmasters API.
 * 
 * Runs: called by "Affiliate Network IndexNow + Sitemap Resubmit" cron (Tuesdays 11:00 UTC)
 * 
 * Service account: axl-348@proud-stage-397621.iam.gserviceaccount.com
 * SA must be owner/verified in GSC for each property. Sites not verified → skipped (logged).
 * 
 * GSC API quota: ~200 sitemap submissions/day. Script processes up to 200 per run.
 */

console.log('[PLAYBOOK] Sections checked: Sitemap Resubmission, GSC Verification. Operating under rule: Weekly sitemap ping for all managed affiliate properties.');

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

const WORKSPACE = '/home/ubuntu/.openclaw/workspace';
const SA_PATH = path.join(WORKSPACE, '.gcp-service-account.json');
const DAILY_LIMIT = 200;

let sa;
try {
  sa = JSON.parse(fs.readFileSync(SA_PATH, 'utf8'));
} catch (e) {
  console.error(`❌ Cannot read service account: ${SA_PATH}`);
  process.exit(1);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function makeJWT(scope) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claim = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  })).toString('base64url');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${header}.${claim}`);
  return `${header}.${claim}.${sign.sign(sa.private_key, 'base64url')}`;
}

function getToken(scope) {
  return new Promise((resolve, reject) => {
    const jwt = makeJWT(scope);
    const body = 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + jwt;
    const buf = Buffer.from(body);
    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': buf.length
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const t = JSON.parse(d);
        if (t.access_token) resolve(t.access_token);
        else reject(new Error('Token failed: ' + d));
      });
    });
    req.on('error', reject);
    req.write(buf);
    req.end();
  });
}

function apiPut(token, path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'www.googleapis.com',
      path,
      method: 'PUT',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Length': 0
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.end();
  });
}

// Resolve domain for a site directory
// Prefers CNAME file, falls back to directory name (strips trailing -com, .com suffixes)
function resolveDomain(dirName, dirPath) {
  const cnamePath = path.join(dirPath, 'CNAME');
  if (fs.existsSync(cnamePath)) {
    const c = fs.readFileSync(cnamePath, 'utf8').trim();
    if (c && c.includes('.') && !c.includes(' ')) return c;
  }
  // Try directory name as domain
  let d = dirName.replace(/-com$/, '.com').replace(/_com$/, '.com');
  if (!d.includes('.')) d = d + '.com';
  return d;
}

// Find all site directories with a sitemap.xml
function findSitemapSites() {
  const results = [];
  const scanDirs = [
    path.join(WORKSPACE, 'affiliate-sites'),
    path.join(WORKSPACE, 'sites'),
  ];

  for (const base of scanDirs) {
    if (!fs.existsSync(base)) continue;
    for (const entry of fs.readdirSync(base)) {
      if (entry.startsWith('.') || entry.startsWith('_')) continue;
      const full = path.join(base, entry);
      try {
        const stat = fs.statSync(full);
        if (!stat.isDirectory()) continue;
        if (fs.existsSync(path.join(full, 'sitemap.xml'))) {
          const domain = resolveDomain(entry, full);
          results.push({ domain, dir: full });
        }
      } catch (e) { /* skip unreadable entries */ }
    }
  }

  // Deduplicate by domain
  const seen = new Set();
  return results.filter(r => {
    if (seen.has(r.domain)) return false;
    seen.add(r.domain);
    return true;
  });
}

async function submitSitemap(token, domain) {
  const siteUrl = `https://${domain}/`;
  const sitemapUrl = `https://${domain}/sitemap.xml`;
  const apiPath = `/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`;

  try {
    const r = await apiPut(token, apiPath);
    return { domain, status: r.status, ok: r.status === 200 || r.status === 204, body: r.body };
  } catch (e) {
    return { domain, status: 0, ok: false, body: e.message };
  }
}

async function main() {
  const sites = findSitemapSites();
  console.log(`\n📡 Found ${sites.length} sites with sitemap.xml\n`);

  if (!sites.length) {
    console.log('Nothing to submit.');
    return;
  }

  let token;
  try {
    console.log('🔑 Getting GSC token...');
    token = await getToken('https://www.googleapis.com/auth/webmasters');
    console.log('   Token OK\n');
  } catch (e) {
    console.error(`❌ Auth failed: ${e.message}`);
    process.exit(1);
  }

  let ok = 0, skipped = 0, failed = 0;
  const errors = [];
  const limit = Math.min(sites.length, DAILY_LIMIT);

  for (let i = 0; i < limit; i++) {
    const site = sites[i];
    const r = await submitSitemap(token, site.domain);

    if (r.ok) {
      console.log(`✅ ${site.domain} — sitemap submitted`);
      ok++;
    } else if (r.status === 403 || r.status === 404) {
      // Not verified in GSC or property doesn't exist — expected for many affiliate sites
      console.log(`⚪ ${site.domain} — not verified in GSC (${r.status}), skipping`);
      skipped++;
    } else {
      console.log(`❌ ${site.domain} — HTTP ${r.status}: ${r.body.slice(0, 80)}`);
      failed++;
      errors.push({ domain: site.domain, status: r.status });
    }

    await sleep(400);
  }

  if (sites.length > DAILY_LIMIT) {
    console.log(`\n⚠️  Only processed ${DAILY_LIMIT}/${sites.length} sites (daily API limit). Run again tomorrow.`);
  }

  console.log(`\n=== DONE ===`);
  console.log(`Submitted: ${ok}`);
  console.log(`Not in GSC (skipped): ${skipped}`);
  console.log(`Errors: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed sites:');
    for (const e of errors) console.log(`  - ${e.domain} (HTTP ${e.status})`);
  }

  const errorRate = ok + failed > 0 ? failed / (ok + failed) : 0;
  if (errorRate > 0.1) {
    console.log(`\n⚠️ ERROR RATE ${(errorRate * 100).toFixed(1)}% ABOVE 10% — review failures`);
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
