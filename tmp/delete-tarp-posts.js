require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const https = require('https');
const token = process.env.SHOPIFY_TOKEN_BARTACT;
const BLOG_ID = 19510597;

const toDelete = [
  { id: 569370312747, title: 'How to Install and Secure Your Cargo with Quality Limit Straps' },
  { id: 635217084459, title: 'Polyester vs Canvas: Which Material Truly Protects Your Cargo?' }
];

function del(articleId) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'bartact.myshopify.com',
      path: `/admin/api/2024-01/blogs/${BLOG_ID}/articles/${articleId}.json`,
      method: 'DELETE',
      headers: { 'X-Shopify-Access-Token': token }
    }, r => { let b=''; r.on('data',c=>b+=c); r.on('end',()=>resolve(r.statusCode)); });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  for (const p of toDelete) {
    const status = await del(p.id);
    console.log((status === 200 ? '✅ DELETED' : '❌ FAILED (HTTP ' + status + ')') + ' | id ' + p.id + ' | ' + p.title);
  }
  console.log('\nDone. Deleted posts now return 404/410 (removed from Shopify).');
})().catch(e => console.error('ERR', e.message));
