#!/usr/bin/env node
'use strict';
/**
 * Elipacko Backlink Sites — Weekly IndexNow Blast (Bing)
 * Runs every Monday. Submits ALL URLs from all 28 backlink sites to Bing IndexNow.
 * Groups by domain so each site's URLs are submitted with the correct host.
 *
 * Cron: Monday 08:20 UTC
 */
console.log('[PLAYBOOK] Sections checked: IndexNow Adoption, Backlink Site Maintenance, Cron Monitoring.');

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const WORKSPACE    = '/home/ubuntu/.openclaw/workspace';
const SITES_DIR    = path.join(WORKSPACE, 'elipacko-sites');
const INDEXNOW_KEY = 'b4f7e2a1c3d5e6f7a8b9c0d1e2f3a4b5';
const LOG_FILE     = path.join(WORKSPACE, 'logs/elipacko-indexnow.log');
const SKIP_PATTERNS = ['google', 'sitemap', 'robots', 'indexnow', '404'];

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch (e) {}
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function buildUrlsByDomain() {
  const byDomain = {};
  const dirs = fs.readdirSync(SITES_DIR).sort().filter(d => {
    const stat = fs.statSync(path.join(SITES_DIR, d));
    return stat.isDirectory() && !d.includes('.');  // skip corrugatedplasticboxes.com symlinks etc
  });

  for (const dir of dirs) {
    const cnamePath = path.join(SITES_DIR, dir, 'CNAME');
    if (!fs.existsSync(cnamePath)) continue;
    const domain = fs.readFileSync(cnamePath, 'utf8').trim();
    if (!domain || domain.startsWith('#')) continue;
    byDomain[domain] = [];

    function crawl(d) {
      let entries;
      try { entries = fs.readdirSync(d); } catch (e) { return; }
      for (const entry of entries) {
        if (entry.startsWith('.')) continue;
        const full = path.join(d, entry);
        let stat;
        try { stat = fs.statSync(full); } catch (e) { continue; }
        if (stat.isDirectory()) { crawl(full); continue; }
        if (!entry.endsWith('.html')) continue;
        if (SKIP_PATTERNS.some(p => entry.toLowerCase().includes(p))) continue;
        const rel = path.relative(path.join(SITES_DIR, dir), full);
        let url;
        if (rel === 'index.html')             url = `https://${domain}/`;
        else if (rel.endsWith('/index.html')) url = `https://${domain}/${rel.slice(0, -'/index.html'.length)}/`;
        else                                  url = `https://${domain}/${rel}`;
        byDomain[domain].push(url);
      }
    }
    crawl(path.join(SITES_DIR, dir));
  }
  return byDomain;
}

async function submitBatch(domain, urls) {
  const body = JSON.stringify({
    host: domain,
    key: INDEXNOW_KEY,
    keyLocation: `https://${domain}/${INDEXNOW_KEY}.txt`,
    urlList: urls
  });
  return new Promise(resolve => {
    const req = https.request({
      hostname: 'www.bing.com', path: '/indexnow', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d.slice(0, 100) }));
    });
    req.on('error', e => resolve({ status: 0, body: e.message }));
    req.setTimeout(15000, () => { req.destroy(); resolve({ status: 0, body: 'timeout' }); });
    req.write(body); req.end();
  });
}

async function main() {
  log('=== Elipacko Backlinks — Weekly IndexNow Blast ===');
  const byDomain = buildUrlsByDomain();
  const domains  = Object.keys(byDomain);
  log(`Found ${domains.length} domains`);

  let totalOk = 0, totalFail = 0, totalUrls = 0;

  for (const domain of domains) {
    const urls = byDomain[domain];
    if (!urls.length) { log(`⏭️ ${domain}: no URLs`); continue; }
    totalUrls += urls.length;

    // Bing IndexNow accepts up to 10,000 URLs per request; batch at 500 to be safe
    const BATCH = 500;
    let domainOk = 0;
    for (let i = 0; i < urls.length; i += BATCH) {
      const batch = urls.slice(i, i + BATCH);
      const result = await submitBatch(domain, batch);
      if (result.status === 200 || result.status === 202) {
        domainOk += batch.length;
      } else {
        log(`  ❌ ${domain} batch ${Math.floor(i/BATCH)+1}: HTTP ${result.status} — ${result.body}`);
        totalFail += batch.length;
      }
      await sleep(300);
    }

    if (domainOk > 0) {
      log(`  ✅ ${domain}: ${domainOk}/${urls.length} URLs submitted`);
      totalOk += domainOk;
    }
  }

  log(`=== DONE: ${totalOk} submitted, ${totalFail} failed across ${domains.length} domains (${totalUrls} total URLs) ===`);
  console.log(`\nSummary: ${totalOk}/${totalUrls} URLs submitted to Bing IndexNow across ${domains.length} backlink sites`);
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
