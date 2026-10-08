require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const https = require('https');
const { GoogleAuth } = require('google-auth-library');

const SA_KEY = '/home/ubuntu/.openclaw/workspace/.bartact-indexing-service-account.json';
const urls = [
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

async function token(scope) {
  const auth = new GoogleAuth({ keyFile: SA_KEY, scopes: [scope] });
  const c = await auth.getClient();
  return (await c.getAccessToken()).token;
}

// The Indexing API supports URL_DELETED — the correct programmatic "drop this page" signal to Google
function indexingDelete(tok, url) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ url, type: 'URL_DELETED' });
    const req = https.request({
      hostname: 'indexing.googleapis.com',
      path: '/v3/urlNotifications:publish',
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + tok, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, r => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>resolve({ status: r.statusCode, body: d })); });
    req.on('error', () => resolve({ status: 0, body: 'err' }));
    req.write(body); req.end();
  });
}

(async () => {
  console.log('=== Submitting URL_DELETED to Google Indexing API for all 10 removed tarp URLs ===\n');
  const tok = await token('https://www.googleapis.com/auth/indexing');
  let ok = 0;
  for (const url of urls) {
    const r = await indexingDelete(tok, url);
    const good = r.status === 200;
    if (good) ok++;
    console.log((good ? '✅' : '⚠️  HTTP ' + r.status) + ' | ' + url.replace('https://www.bartact.com', ''));
    if (!good && r.body) console.log('     ' + r.body.slice(0, 120));
    await new Promise(res => setTimeout(res, 400)); // avoid rate limits
  }
  console.log('\n' + ok + '/' + urls.length + ' submitted as URL_DELETED to Google.');
  console.log('This is the direct programmatic de-index signal — tells Google to drop these from the index on next processing.');
})().catch(e => console.error('ERR', e.message));
