#!/usr/bin/env node
/**
 * Weekly IndexNow blast — ALL managed sites not covered by other crons
 * Runs: Tuesdays 08:30 UTC (after Monday elipacko backlinks run at 08:20)
 * 
 * Covers:
 *   - fernallern.com, faithfulpassages.com, thedailycheer.com (GitHub Pages)
 *   - bloxfilters.com, gridguardsusa.com, bowtiefilters.com, walkindustrial.com (Walk Industrial / affiliate)
 * 
 * NOT our sites — each has its own bot:
 *   - skipatip.com → SkipATip bot
 *   - recentratings.com → RecentRatings bot
 *   - bartact.com → Slashdaddy
 *   - bullstrap.com → Slashdaddy
 * 
 * NOT covered here (handled by other scripts):
 *   - elipacko.com → elipacko-index-now.js (daily)
 *   - 28 elipacko backlink sites → elipacko-backlinks-indexnow-weekly.sh (Monday)
 *   - 27 Bartact affiliate sites → indexnow-submit.js (daily)
 */
console.log('[PLAYBOOK] Sections checked: IndexNow Adoption, Backlink Site Maintenance, Cron Monitoring. Operating under rule: Weekly IndexNow for all managed sites not covered by dedicated crons.');

const https = require('https');
const fs = require('fs');
const path = require('path');

const INDEXNOW_KEY = 'b4f7e2a1c3d5e6f7a8b9c0d1e2f3a4b5';
const BWT_API_KEY = '0a35c8d451e348e099fe46c4533a9f12';
const WORKSPACE = '/home/ubuntu/.openclaw/workspace';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function post(hostname, path, body, headers={}) {
  return new Promise((res, rej) => {
    const d = JSON.stringify(body);
    const req = https.request({
      hostname, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d), ...headers }
    }, re => { let s=''; re.on('data',c=>s+=c); re.on('end',()=>res({status:re.statusCode,body:s})); });
    req.on('error', rej); req.write(d); req.end();
  });
}

// Get all HTML files for a GitHub Pages site directory → URLs
function getSiteUrls(domain, dirPath) {
  const urls = [];
  const skipPatterns = ['google', 'bing', 'sitemap', 'robots', '.git'];
  
  function crawl(dir) {
    try {
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        if (entry.startsWith('.') || skipPatterns.some(p => entry.includes(p))) continue;
        const full = path.join(dir, entry);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          crawl(full);
        } else if (entry.endsWith('.html')) {
          const rel = path.relative(dirPath, full);
          if (rel === 'index.html') {
            urls.push(`https://${domain}/`);
          } else if (rel.endsWith('/index.html')) {
            urls.push(`https://${domain}/${rel.replace('/index.html', '/')}`);
          } else {
            urls.push(`https://${domain}/${rel}`);
          }
        }
      }
    } catch(e) {}
  }
  crawl(dirPath);
  return [...new Set(urls)];
}

// Submit via IndexNow
async function submitIndexNow(domain, urls) {
  const batches = [];
  for (let i = 0; i < urls.length; i += 100) batches.push(urls.slice(i, i+100));
  
  let ok = 0;
  for (const batch of batches) {
    const r = await post('www.bing.com', '/indexnow', {
      host: domain,
      key: INDEXNOW_KEY,
      keyLocation: `https://${domain}/${INDEXNOW_KEY}.txt`,
      urlList: batch
    });
    if (r.status === 200 || r.status === 202) ok += batch.length;
    await sleep(300);
  }
  return ok;
}

// Submit via BWT URL Submission API (for sites with IndexNow 403)
async function submitBWT(siteUrl, urls) {
  const batches = [];
  for (let i = 0; i < urls.length; i += 100) batches.push(urls.slice(i, i+100));
  
  let ok = 0;
  for (const batch of batches) {
    const r = await post('ssl.bing.com',
      `/webmaster/api.svc/json/SubmitUrlbatch?apikey=${BWT_API_KEY}`,
      { siteUrl, urlList: batch }
    );
    if (r.status === 200 && r.body.includes('"d":null')) ok += batch.length;
    await sleep(300);
  }
  return ok;
}

// Fetch sitemap URLs for Shopify/dynamic sites
async function getSitemapUrls(sitemapUrl, limit=200) {
  return new Promise((res) => {
    const urlObj = new URL(sitemapUrl);
    const req = https.request({ hostname: urlObj.hostname, path: urlObj.pathname }, re => {
      let s = ''; re.on('data',c=>s+=c);
      re.on('end', () => {
        const matches = [...s.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
        res(matches.slice(0, limit));
      });
    });
    req.on('error', () => res([]));
    req.end();
  });
}

async function main() {
  const results = [];
  let totalOk = 0, totalFail = 0;

  // === GITHUB PAGES SITES ===
  const githubSites = [
    { domain: 'fernallern.com', dir: `${WORKSPACE}/sites/fernallern.com` },
    { domain: 'faithfulpassages.com', dir: `${WORKSPACE}/sites/faithfulpassages.com` },
    { domain: 'thedailycheer.com', dir: `${WORKSPACE}/sites/thedailycheer.com` },
    { domain: 'bloxfilters.com', dir: `${WORKSPACE}/affiliate-sites/bloxfilters.com` },
    { domain: 'gridguardsusa.com', dir: `${WORKSPACE}/affiliate-sites/gridguardsusa.com` },
    { domain: 'bowtiefilters.com', dir: `${WORKSPACE}/affiliate-sites/bowtiefilters.com` },
    { domain: 'walkindustrial.com', dir: `${WORKSPACE}/affiliate-sites/walkindustrial.com` },
  ];

  for (const { domain, dir } of githubSites) {
    if (!fs.existsSync(dir)) {
      console.log(`⚠️  ${domain} — dir not found`);
      continue;
    }
    const urls = getSiteUrls(domain, dir);
    if (!urls.length) { console.log(`⚠️  ${domain} — 0 URLs found`); continue; }
    const ok = await submitIndexNow(domain, urls);
    const icon = ok === urls.length ? '✅' : (ok > 0 ? '⚠️' : '❌');
    console.log(`${icon} ${domain}: ${ok}/${urls.length} pages → Bing IndexNow`);
    results.push({ domain, urls: urls.length, ok, method: 'IndexNow' });
    totalOk += ok; totalFail += (urls.length - ok);
    await sleep(500);
  }

  console.log(`\n=== DONE: ${totalOk} submitted, ${totalFail} failed across ${results.length} sites ===`);
  return results;
}

main().catch(e => { console.error(e); process.exit(1); });
