'use strict';
require('dotenv').config();

const token = process.env.SHOPIFY_TOKEN_BARTACT;
const store = 'bartact.myshopify.com';
const colId = 137429778455;

async function upsertMetafield(key, value) {
  const listRes = await fetch(
    `https://${store}/admin/api/2024-01/collections/${colId}/metafields.json?namespace=global&key=${key}`,
    { headers: { 'X-Shopify-Access-Token': token } }
  );
  const list = await listRes.json();
  const existing = list.metafields?.[0];

  if (existing) {
    const r = await fetch(
      `https://${store}/admin/api/2024-01/metafields/${existing.id}.json`,
      {
        method: 'PUT',
        headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ metafield: { id: existing.id, value, type: 'single_line_text_field' } })
      }
    ).then(r => r.json());
    console.log(`Updated ${key}: ${r.metafield?.value || JSON.stringify(r).slice(0, 100)}`);
  } else {
    const r = await fetch(
      `https://${store}/admin/api/2024-01/collections/${colId}/metafields.json`,
      {
        method: 'POST',
        headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ metafield: { namespace: 'global', key, value, type: 'single_line_text_field' } })
      }
    ).then(r => r.json());
    console.log(`Created ${key}: ${r.metafield?.value || JSON.stringify(r).slice(0, 100)}`);
  }
}

async function main() {
  await upsertMetafield(
    'title_tag',
    'MOLLE Accessories for Jeep & Tactical Vehicles | Bartact'
  );
  await upsertMetafield(
    'description_tag',
    'Shop Bartact MOLLE accessories — PALS-compatible pouches, T-bar attachments, and modular gear built for Jeep Wrangler, Gladiator, and tactical vehicles. Made in USA.'
  );
  console.log('Done.');
}

main().catch(e => console.log('Error:', e.message));
