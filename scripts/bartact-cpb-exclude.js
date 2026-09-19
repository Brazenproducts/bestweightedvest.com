/**
 * bartact-cpb-exclude.js
 * Runs daily at 6am Pacific.
 * 1. Tags all cpb_ordered Shopify products with google-excluded + hidden
 * 2. Deletes all CPB product entries from Google Merchant Center feed
 * Permanent fix — new custom orders never leak into Google Shopping or other feeds.
 */
require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const { GoogleAuth } = require('google-auth-library');

const MC_ID = '5676911172';
const SHOPIFY_CLIENT_ID = '78fd9505a467f0795d035e5f4a6dfb06';

async function getShopifyToken() {
  const r = await fetch('https://bartact.myshopify.com/admin/oauth/access_token', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: SHOPIFY_CLIENT_ID, client_secret: process.env.SHOPIFY_CLIENT_SECRET_BARTACT, grant_type: 'client_credentials' })
  });
  return (await r.json()).access_token;
}

async function getMCToken() {
  const auth = new GoogleAuth({
    keyFile: '/home/ubuntu/.openclaw/workspace/.gcp-service-account.json',
    scopes: ['https://www.googleapis.com/auth/content']
  });
  return (await (await auth.getClient()).getAccessToken()).token;
}

async function main() {
  const shopifyToken = await getShopifyToken();
  const mcToken = await getMCToken();
  const SH = { 'X-Shopify-Access-Token': shopifyToken, 'Content-Type': 'application/json' };

  // ── Step 1: Tag all cpb_ordered products in Shopify ──────────────────────
  let cpbIds = new Set();
  let allCPB = [];

  for (const status of ['active', 'draft']) {
    let url = `https://bartact.myshopify.com/admin/api/2024-01/products.json?limit=250&status=${status}&product_type=cpb_ordered&fields=id,handle,tags`;
    while (url) {
      const resp = await fetch(url, { headers: SH });
      const data = await resp.json();
      (data.products || []).forEach(p => { cpbIds.add(String(p.id)); allCPB.push(p); });
      const link = resp.headers.get('link') || '';
      const next = link.match(/<([^>]+)>;\s*rel="next"/);
      url = next ? next[1] : null;
      await new Promise(r => setTimeout(r, 150));
    }
  }

  console.log(`[CPB Exclude] Found ${allCPB.length} cpb_ordered products in Shopify`);

  const needsTag = allCPB.filter(p => !p.tags.includes('google-excluded') || !p.tags.includes('hidden'));
  let tagged = 0;
  for (const p of needsTag) {
    const tagSet = new Set(p.tags.split(',').map(t => t.trim()).filter(Boolean));
    tagSet.add('google-excluded');
    tagSet.add('hidden');
    const upd = await (await fetch(`https://bartact.myshopify.com/admin/api/2024-01/products/${p.id}.json`, {
      method: 'PUT', headers: SH,
      body: JSON.stringify({ product: { id: p.id, tags: Array.from(tagSet).join(', ') } })
    })).json();
    if (upd.product?.id) { tagged++; console.log(`  ✅ Tagged: ${p.handle}`); }
    else console.log(`  ❌ Tag failed: ${p.handle}`);
    await new Promise(r => setTimeout(r, 200));
  }

  if (needsTag.length === 0) console.log('[CPB Exclude] All Shopify CPB products already tagged correctly.');
  else console.log(`[CPB Exclude] Tagged ${tagged}/${needsTag.length} new CPB products.`);

  // ── Step 2: Delete CPB entries from Google Merchant Center ────────────────
  let allMC = [];
  let nextPageToken = null;
  do {
    const url = `https://shoppingcontent.googleapis.com/content/v2.1/${MC_ID}/products?maxResults=250` + (nextPageToken ? `&pageToken=${nextPageToken}` : '');
    const r = await (await fetch(url, { headers: { 'Authorization': 'Bearer ' + mcToken } })).json();
    allMC = allMC.concat(r.resources || []);
    nextPageToken = r.nextPageToken || null;
    await new Promise(r => setTimeout(r, 150));
  } while (nextPageToken);

  const cpbMC = allMC.filter(p => {
    const match = p.offerId?.match(/shopify_US_(\d+)_(\d+)/);
    return match && cpbIds.has(match[1]);
  });

  console.log(`[CPB Exclude] Found ${cpbMC.length} CPB entries in MC feed`);

  let deleted = 0;
  for (const p of cpbMC) {
    const r = await fetch(`https://shoppingcontent.googleapis.com/content/v2.1/${MC_ID}/products/${encodeURIComponent(p.id)}`, {
      method: 'DELETE', headers: { 'Authorization': 'Bearer ' + mcToken }
    });
    if (r.status === 204 || r.status === 200 || r.status === 404 || r.status === 410) deleted++;
    else {
      const err = await r.json().catch(() => ({}));
      console.log(`  ❌ MC delete failed: ${p.offerId} — ${JSON.stringify(err).substring(0, 80)}`);
    }
    await new Promise(r => setTimeout(r, 150));
  }

  if (cpbMC.length === 0) console.log('[CPB Exclude] No CPB entries in MC feed — all clear.');
  else console.log(`[CPB Exclude] Deleted ${deleted}/${cpbMC.length} CPB entries from MC feed.`);

  console.log('[CPB Exclude] Done.');
}

main().catch(e => {
  console.error('[CPB Exclude] ERROR:', e.message);
  process.exit(1);
});
