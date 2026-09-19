#!/usr/bin/env node
require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const TOKEN = process.env.SHOPIFY_TOKEN_BULLSTRAP;
const https = require('https');
const SHOP = 'bull-strap-78.myshopify.com';
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (!TOKEN) { console.error('No token'); process.exit(1); }

function shopify(method, path, body) {
  return new Promise((res,rej) => {
    const buf = body ? Buffer.from(JSON.stringify(body)) : null;
    const req = https.request({
      hostname: SHOP, path, method,
      headers: { 'X-Shopify-Access-Token': TOKEN, 'Content-Type': 'application/json', ...(buf?{'Content-Length':buf.length}:{}) }
    }, r => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>res({status:r.statusCode,body:d?JSON.parse(d):{}})); });
    req.on('error',rej);
    if (buf) req.write(buf);
    req.end();
  });
}

const COLLECTIONS = [
  { id: 631234822417, name: 'coilovers' },
  { id: 631237804305, name: 'brake-line-kits' },
  { id: 631238820113, name: 'control-arms' },
  { id: 631249076497, name: 'steering-stabilizer' },
  { id: 631235445009, name: 'lift-kits' },
  { id: 631239704849, name: 'winches' }
];

async function main() {
  let totalPublished = 0;

  for (const coll of COLLECTIONS) {
    let published = 0;
    let page = 1;

    // Collect IDs from collection first
    const collects = await shopify('GET', `/admin/api/2026-01/collects.json?collection_id=${coll.id}&limit=250`);
    const productIds = (collects.body.collects || []).map(c => c.product_id);

    console.log(`\n${coll.name}: ${productIds.length} products in collection`);

    // Re-publish each one (up to 100 per collection to avoid flooding)
    const toPublish = productIds.slice(0, 100);
    for (const pid of toPublish) {
      const r = await shopify('PUT', `/admin/api/2026-01/products/${pid}.json`, {
        product: { id: pid, published: true }
      });
      if (r.status === 200) {
        published++;
        process.stdout.write('.');
      } else {
        process.stdout.write('x');
      }
      await sleep(280);
    }

    console.log(`\n  ✅ ${published}/${toPublish.length} republished`);
    totalPublished += published;
    await sleep(500);
  }

  console.log(`\nTotal republished: ${totalPublished} products across 6 collections`);
}

main().catch(e => console.error(e.message));
