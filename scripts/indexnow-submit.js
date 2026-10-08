#!/usr/bin/env node
/**
 * indexnow-submit.js
 * Submit Bartact affiliate site homepages to Bing/Yandex via IndexNow.
 * 
 * Covers the 27+ Bartact Store 01 affiliate sites + wrangliator.com pages.
 * Also covers Walk Industrial affiliate sites and GitHub Pages sites.
 * 
 * Runs: called by "Affiliate Network IndexNow + Sitemap Resubmit" cron (Tuesdays 11:00 UTC)
 * Also referenced for daily use from weekly-indexnow-all-sites.js
 * 
 * NOT covered here (have dedicated scripts):
 *   - elipacko.com → elipacko-index-now.js (daily)
 *   - 28 elipacko backlink sites → elipacko-backlinks-indexnow-weekly.sh (Monday)
 *   - bartact.com → bartact-full-site-indexing.js (Google Indexing API)
 *   - bullstrap.com → bullstrap-full-indexing.js
 */

console.log('[PLAYBOOK] Sections checked: IndexNow Adoption, Affiliate Network Indexing. Operating under rule: Submits all affiliate site URLs not covered by dedicated scripts.');

const https = require('https');

const INDEXNOW_KEY = 'b4f7e2a1c3d5e6f7a8b9c0d1e2f3a4b5';

// All affiliate/managed site homepages to submit via IndexNow
// RULE: Homepages ONLY for pure-affiliate sites. Full-page lists only for editorial sites.
const SITE_URLS = [
  // === Bartact Store 01 — Jeep/Truck accessories affiliate sites ===
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

  // === Wrangliator — editorial content, full page list is safe ===
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

  // === Walk Industrial affiliate sites ===
  'https://bloxfilters.com/',
  'https://gridguardsusa.com/',
  'https://bowtiefilters.com/',
  'https://walkindustrial.com/',

  // === GitHub Pages managed sites ===
  'https://fernallern.com/',
  'https://faithfulpassages.com/',
  'https://thedailycheer.com/',
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function post(hostname, path, body) {
  return new Promise((res, rej) => {
    const d = JSON.stringify(body);
    const req = https.request({
      hostname, path, method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(d)
      }
    }, re => {
      let s = '';
      re.on('data', c => s += c);
      re.on('end', () => res({ status: re.statusCode, body: s }));
    });
    req.on('error', rej);
    req.write(d);
    req.end();
  });
}

// Group URLs by domain for batched IndexNow submission
function groupByDomain(urls) {
  const map = {};
  for (const url of urls) {
    const m = url.match(/^https?:\/\/([^/]+)/);
    if (!m) continue;
    const domain = m[1];
    if (!map[domain]) map[domain] = [];
    map[domain].push(url);
  }
  return map;
}

async function submitDomain(domain, urls) {
  const batches = [];
  for (let i = 0; i < urls.length; i += 100) batches.push(urls.slice(i, i + 100));

  let ok = 0;
  for (const batch of batches) {
    try {
      const r = await post('www.bing.com', '/indexnow', {
        host: domain,
        key: INDEXNOW_KEY,
        keyLocation: `https://${domain}/${INDEXNOW_KEY}.txt`,
        urlList: batch
      });
      if (r.status === 200 || r.status === 202) {
        ok += batch.length;
      } else {
        console.log(`  ⚠️  Bing returned ${r.status} for ${domain}: ${r.body.slice(0, 120)}`);
      }
    } catch (e) {
      console.log(`  ❌ Network error for ${domain}: ${e.message}`);
    }
    await sleep(300);
  }
  return ok;
}

async function main() {
  console.log(`\n🚀 IndexNow submission — ${SITE_URLS.length} URLs across ${Object.keys(groupByDomain(SITE_URLS)).length} domains`);
  console.log(`   Key: ${INDEXNOW_KEY}\n`);

  const byDomain = groupByDomain(SITE_URLS);
  let totalOk = 0, totalFail = 0, sitesDone = 0;

  for (const [domain, urls] of Object.entries(byDomain)) {
    const ok = await submitDomain(domain, urls);
    const fail = urls.length - ok;
    const icon = ok === urls.length ? '✅' : (ok > 0 ? '⚠️' : '❌');
    console.log(`${icon} ${domain}: ${ok}/${urls.length} URLs → Bing IndexNow`);
    totalOk += ok;
    totalFail += fail;
    sitesDone++;
    await sleep(500);
  }

  console.log(`\n=== DONE ===`);
  console.log(`Sites: ${sitesDone}`);
  console.log(`Submitted: ${totalOk}`);
  console.log(`Failed: ${totalFail}`);
  if (totalFail > 0 && totalFail / (totalOk + totalFail) > 0.1) {
    console.log(`⚠️ ERROR RATE ABOVE 10% — review failures above`);
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
