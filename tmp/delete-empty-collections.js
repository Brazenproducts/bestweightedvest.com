'use strict';
require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const https = require('https');

const TOKEN = proces…ACT;
const SHOP = 'bartact.myshopify.com';

const toDelete = [
  'ebay-collection',
  'hvac-filters',
  'miscellaneous-1',
  'motorcycle-gear',
  'seat-belts-harnesses',
  'uncategorized',
  'winch-strap'
];

function shopify(method, apiPath) {
  return new Promise((res, rej) => {
    const req = https.request({
      hostname: SHOP,
      path: '/admin/api/2024-01/' + apiPath,
      method,
      headers: { 'X-Shopify-Access-Token': TOKEN, 'Content-Type': 'application/json' }
    }, r => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>{ try{res({status:r.statusCode,body:JSON.parse(d)})}catch(e){res({status:r.statusCode,body:d})} }); });
    req.on('error', rej);
    req.end();
  });
}

async function main() {
  const [custom, smart] = await Promise.all([
    shopify('GET', 'custom_collections.json?limit=250&fields=id,title,handle'),
    shopify('GET', 'smart_collections.json?limit=250&fields=id,title,handle')
  ]);

  const customList = custom.body.custom_collections || [];
  const smartList = smart.body.smart_collections || [];
  const all = [...customList, ...smartList];

  for (const handle of toDelete) {
    const col = all.find(c => c.handle === handle);
    if (!col) { console.log('NOT FOUND: ' + handle); continue; }
    const isCustom = customList.find(c => c.handle === handle);
    const type = isCustom ? 'custom_collections' : 'smart_collections';
    const r = await shopify('DELETE', type + '/' + col.id + '.json');
    console.log((r.status === 200 ? '✅' : '❌') + ' ' + handle + ' — HTTP ' + r.status);
  }
  console.log('\nDone.');
}

main().catch(e => console.error('Fatal:', e.message));
