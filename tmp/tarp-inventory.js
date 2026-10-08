require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const https = require('https');
const token = process.env.SHOPIFY_TOKEN_BARTACT;

function get(p) {
  return new Promise((res, rej) => {
    https.get({ hostname: 'bartact.myshopify.com', path: p, headers: { 'X-Shopify-Access-Token': token } }, r => {
      let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res(JSON.parse(b)); } catch (e) { res(null); } });
    }).on('error', rej);
  });
}

(async () => {
  const a = await get('/admin/api/2024-01/blogs/19510597/articles.json?limit=60&fields=id,title,handle,published_at');
  const arts = (a && a.articles) || [];

  const tarpRe = /tarp|scrim|foam-backed|polyester vs canvas|which material (truly )?protects/i;

  const tarps = arts.filter(x => tarpRe.test(x.title));
  const legit = arts.filter(x => !tarpRe.test(x.title));

  console.log('=== BUCKET 1: TARP / OFF-TOPIC — PRUNE CANDIDATES (' + tarps.length + ') ===\n');
  for (const t of tarps) {
    console.log('  id ' + t.id + ' | ' + (t.published_at || '').slice(0, 10) + ' | ' + t.title);
    console.log('    https://www.bartact.com/blogs/news/' + t.handle);
  }

  console.log('\n=== BUCKET 2: ON-BRAND / KEEP (' + legit.length + ') ===\n');
  for (const t of legit) {
    console.log('  ' + (t.published_at || '').slice(0, 10) + ' | ' + t.title);
  }
})().catch(e => console.error('ERR', e.message));
