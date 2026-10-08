require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const https = require('https');
const fs = require('fs');
const token = process.env.SHOPIFY_TOKEN_BARTACT;

function get(p) {
  return new Promise((res, rej) => {
    https.get({ hostname: 'bartact.myshopify.com', path: p, headers: { 'X-Shopify-Access-Token': token } }, r => {
      let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res(JSON.parse(b)); } catch (e) { res(null); } });
    }).on('error', rej);
  });
}

(async () => {
  const cfg = JSON.parse(fs.readFileSync('/home/ubuntu/.openclaw/workspace/memory/blog-rotation.json.QUARANTINED', 'utf8'));
  const bartactPosts = (cfg.history || []).filter(h => h.store === 'bartact');

  const a = await get('/admin/api/2024-01/blogs/19510597/articles.json?limit=100&fields=id,title,handle,published_at');
  const liveTitles = new Set(((a && a.articles) || []).map(x => x.title.trim().toLowerCase()));
  const liveByHandle = {};
  ((a && a.articles) || []).forEach(x => { liveByHandle[(x.handle || '').toLowerCase()] = x; });

  console.log('=== CROSS-CHECK: rogue-generated Bartact posts — LIVE vs already DELETED ===\n');
  let stillLive = [];
  for (const p of bartactPosts) {
    const handle = (p.post_url || '').split('/blogs/news/')[1] || '';
    const live = liveByHandle[handle.toLowerCase()] || liveTitles.has(p.post_title.trim().toLowerCase());
    const tarp = /tarp|scrim|foam-backed|polyester vs canvas|cargo/i.test(p.post_title);
    const status = live ? '🔴 STILL LIVE' : '✅ already deleted';
    console.log(status + ' | ' + p.date + ' | ' + p.post_title + (tarp ? '  [TARP]' : '  [limit-strap/off-topic]'));
    if (live) stillLive.push({ title: p.post_title, handle, id: (liveByHandle[handle.toLowerCase()] || {}).id });
  }
  console.log('\nStill-live rogue posts needing removal: ' + stillLive.length);
  stillLive.forEach(s => console.log('  id ' + (s.id || '?') + ' | ' + s.title));
})().catch(e => console.error('ERR', e.message));
