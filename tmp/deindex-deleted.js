require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const https = require('https');

// All 10 rogue tarp/off-topic URLs that were deleted (8 by SD + 2 today)
const deletedUrls = [
  'https://www.bartact.com/blogs/news/how-to-install-and-secure-your-cargo-with-quality-limit-straps',
  'https://www.bartact.com/blogs/news/polyester-vs-canvas-which-material-truly-protects-your-cargo',
  'https://www.bartact.com/blogs/news/uv-protected-tarp-why-quality-materials-matter-for-outdoor-gear-storage',
  'https://www.bartact.com/blogs/news/best-waterproof-tarps-durability-and-uv-protection-guide',
  'https://www.bartact.com/blogs/news/heavy-duty-cargo-tarp-cordura-fabric-vs-budget-alternatives',
  'https://www.bartact.com/blogs/news/foam-backed-tarps-why-scrim-backing-matters-for-durability',
  'https://www.bartact.com/blogs/news/uv-protected-tarps-why-foam-backed-designs-last-longer',
  'https://www.bartact.com/blogs/news/foam-backed-vs-solid-tarps-which-material-protects-best',
  'https://www.bartact.com/blogs/news/scrim-backed-tarps-industrial-grade-protection-that-lasts',
  'https://www.bartact.com/blogs/news/weather-resistant-tarps-vs-standard-whats-really-worth-it'
];

function headStatus(url) {
  return new Promise((resolve) => {
    const u = new URL(url);
    https.request({ hostname: u.hostname, path: u.pathname, method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0' } }, r => {
      r.resume();
      resolve(r.statusCode);
    }).on('error', () => resolve(0)).end();
  });
}

(async () => {
  console.log('=== STEP 1: Confirm deleted URLs return 404/410 (not soft-200) ===\n');
  const live = [];
  for (const url of deletedUrls) {
    const code = await headStatus(url);
    const ok = (code === 404 || code === 410);
    console.log((ok ? '✅' : '⚠️ ') + ' HTTP ' + code + ' | ' + url.replace('https://www.bartact.com', ''));
    if (!ok && code === 200) live.push(url);
  }
  if (live.length) {
    console.log('\n⚠️ ' + live.length + ' still return 200 (soft-404 risk) — these need noindex or confirm deletion.');
  } else {
    console.log('\nAll deleted URLs return 404/410 — good de-index signal.');
  }

  // STEP 2: Submit to IndexNow so Bing/Yandex drop them
  console.log('\n=== STEP 2: IndexNow submission (Bing/Yandex drop) ===\n');
  const INDEXNOW_KEY = 'b4f7e2a1c3d5e6f7a8b9c0d1e2f3a4b5';
  const body = JSON.stringify({
    host: 'www.bartact.com',
    key: INDEXNOW_KEY,
    keyLocation: 'https://www.bartact.com/' + INDEXNOW_KEY + '.txt',
    urlList: deletedUrls
  });
  for (const host of ['api.indexnow.org', 'www.bing.com']) {
    const status = await new Promise((resolve) => {
      const req = https.request({ hostname: host, path: '/indexnow', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, r => { r.resume(); resolve(r.statusCode); });
      req.on('error', () => resolve(0)); req.write(body); req.end();
    });
    console.log('  ' + ((status === 200 || status === 202) ? '✅' : '⚠️ ') + ' ' + host + ': HTTP ' + status);
  }
  console.log('\nNote: Google has no "remove" API for non-owners. Google will drop these naturally on next crawl (now that they 404/410). For faster removal, Mitch can use GSC > Removals tool on these 10 URLs.');
})().catch(e => console.error('ERR', e.message));
