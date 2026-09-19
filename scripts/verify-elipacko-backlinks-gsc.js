#!/usr/bin/env node
/**
 * Verify all elipacko backlink sites in Google Search Console
 * and submit their sitemaps.
 * 
 * The SA token (googlec55128789f00e1a7.html) is already live
 * on all 28 sites. This script completes the verification.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

const SA_PATH = '/home/ubuntu/.openclaw/workspace/.elipacko-indexing-sa.json';
const SITES_DIR = '/home/ubuntu/.openclaw/workspace/elipacko-sites';

const sa = JSON.parse(fs.readFileSync(SA_PATH));

function makeJWT(scope) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claim = Buffer.from(JSON.stringify({
    iss: sa.client_email, scope,
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600, iat: now
  })).toString('base64url');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${header}.${claim}`);
  return `${header}.${claim}.${sign.sign(sa.private_key, 'base64url')}`;
}

function getToken(scope) {
  return new Promise((resolve, reject) => {
    const body = 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + makeJWT(scope);
    const req = https.request({
      hostname: 'oauth2.googleapis.com', path: '/token', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': body.length }
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        const t = JSON.parse(d);
        if (t.access_token) resolve(t.access_token);
        else reject(new Error('Token failed: ' + d));
      });
    });
    req.write(body); req.end();
  });
}

function apiCall(token, method, hostname, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname, path, method,
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Read all domains from CNAME files
function getDomains() {
  const domains = [];
  const dirs = fs.readdirSync(SITES_DIR);
  for (const dir of dirs) {
    const cnamePath = path.join(SITES_DIR, dir, 'CNAME');
    if (fs.existsSync(cnamePath)) {
      const domain = fs.readFileSync(cnamePath, 'utf8').trim();
      if (domain && !domain.includes(' ') && domain.includes('.')) {
        // Check if google verify file exists
        const verifyFile = path.join(SITES_DIR, dir, 'googlec55128789f00e1a7.html');
        const hasSitemap = fs.existsSync(path.join(SITES_DIR, dir, 'sitemap.xml'));
        domains.push({ dir, domain, hasVerifyFile: fs.existsSync(verifyFile), hasSitemap });
      }
    }
  }
  // Deduplicate by domain
  const seen = new Set();
  return domains.filter(d => { if (seen.has(d.domain)) return false; seen.add(d.domain); return true; });
}

async function main() {
  console.log('Getting tokens...');
  const svToken = await getToken('https://www.googleapis.com/auth/siteverification');
  const gscToken = await getToken('https://www.googleapis.com/auth/webmasters');

  const domains = getDomains();
  console.log(`Found ${domains.length} domains to process\n`);

  const results = { verified: [], alreadyVerified: [], failed: [], sitemapSubmitted: [], sitemapFailed: [] };

  for (const { dir, domain, hasVerifyFile, hasSitemap } of domains) {
    const siteUrl = `https://${domain}/`;
    process.stdout.write(`${domain} ... `);

    if (!hasVerifyFile) {
      console.log('SKIP — no verify file');
      results.failed.push({ domain, reason: 'no verify file' });
      continue;
    }

    // Try FILE verification
    const verifyRes = await apiCall(svToken, 'POST', 'www.googleapis.com',
      '/siteVerification/v1/webResource?verificationMethod=FILE',
      { site: { type: 'SITE', identifier: siteUrl } }
    );

    if (verifyRes.status === 200) {
      console.log('✅ VERIFIED');
      results.verified.push(domain);
    } else if (verifyRes.status === 400 && verifyRes.body.includes('already')) {
      console.log('✅ ALREADY VERIFIED');
      results.alreadyVerified.push(domain);
    } else if (verifyRes.status === 403 || verifyRes.status === 400) {
      // File might not be live yet — try INET_DOMAIN type
      const r2 = await apiCall(svToken, 'POST', 'www.googleapis.com',
        '/siteVerification/v1/webResource?verificationMethod=FILE',
        { site: { type: 'INET_DOMAIN', identifier: domain } }
      );
      if (r2.status === 200) {
        console.log('✅ VERIFIED (domain type)');
        results.verified.push(domain);
      } else {
        const errSnippet = r2.body.substring(0, 120).replace(/\n/g,' ');
        console.log(`❌ FAILED (${r2.status}) ${errSnippet}`);
        results.failed.push({ domain, reason: `${r2.status}: ${errSnippet}` });
        await sleep(200);
        continue;
      }
    } else {
      console.log(`❌ FAILED (${verifyRes.status})`);
      results.failed.push({ domain, reason: `${verifyRes.status}: ${verifyRes.body.substring(0,100)}` });
      await sleep(200);
      continue;
    }

    // Submit sitemap if it exists
    if (hasSitemap) {
      await sleep(300);
      const sitemapFeed = encodeURIComponent(`https://${domain}/sitemap.xml`);
      const smRes = await apiCall(gscToken, 'PUT', 'www.googleapis.com',
        `/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${sitemapFeed}`,
        null
      );
      if (smRes.status === 204 || smRes.status === 200) {
        process.stdout.write(`  sitemap ✅\n`);
        results.sitemapSubmitted.push(domain);
      } else {
        process.stdout.write(`  sitemap ❌ (${smRes.status})\n`);
        results.sitemapFailed.push({ domain, status: smRes.status });
      }
    } else {
      process.stdout.write(`  no sitemap\n`);
    }

    await sleep(400); // rate limit
  }

  console.log('\n=== RESULTS ===');
  console.log(`Newly verified:    ${results.verified.length}`);
  console.log(`Already verified:  ${results.alreadyVerified.length}`);
  console.log(`Failed:            ${results.failed.length}`);
  console.log(`Sitemaps submitted: ${results.sitemapSubmitted.length}`);
  console.log(`Sitemap failures:  ${results.sitemapFailed.length}`);

  if (results.verified.length) console.log('\nNEWLY VERIFIED:\n' + results.verified.map(d=>'  '+d).join('\n'));
  if (results.failed.length) console.log('\nFAILED:\n' + results.failed.map(d=>`  ${d.domain}: ${d.reason}`).join('\n'));
  if (results.sitemapFailed.length) console.log('\nSITEMAP FAILURES:\n' + results.sitemapFailed.map(d=>`  ${d.domain} (${d.status})`).join('\n'));
}

main().catch(e => { console.error(e); process.exit(1); });
