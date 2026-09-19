#!/usr/bin/env node
/**
 * bullstrap-inventory-filter.js
 *
 * Bull Strap Inventory Filter — Hide Low-Stock Third-Party Products
 *
 * Purpose:
 *   Hide Turn14 products with inventory < 2 (deny policy) from storefront
 *   WITHOUT drafting them (fully reversible).
 *
 * Rules:
 *   • Bartact & Bull Strap own products: NEVER touched
 *   • Turn14 products with inventory < 2: set published=false (hidden)
 *   • Products with inventory_policy='continue': ALWAYS kept visible
 *   • No products are deleted or archived
 *
 * Output: Summary line with counts
 */

require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const https = require('https');

const TOKEN = process.env.SHOPIFY_TOKEN_BULLSTRAP;
const SHOP = 'bull-strap-78.myshopify.com';

// Vendors to always keep visible (never hide)
const KEEP_VENDORS = ['bartact', 'bull strap', 'bullstrap', 'carli'];

if (!TOKEN) {
  console.error('FATAL: SHOPIFY_TOKEN_BULLSTRAP not set');
  process.exit(1);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: SHOP,
      path,
      method,
      headers: {
        'X-Shopify-Access-Token': TOKEN,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    };
    let data = '';
    const r = https.request(options, res => {
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data), headers: res.headers });
        } catch(e) {
          resolve({ status: res.statusCode, body: { raw: data }, headers: res.headers });
        }
      });
    });
    r.on('error', reject);
    if (payload) r.write(payload);
    r.end();
  });
}

function isKeptVendor(vendor) {
  if (!vendor) return false;
  const v = vendor.toLowerCase();
  return KEEP_VENDORS.some(k => v.includes(k));
}

async function fetchAllProducts() {
  const products = [];
  let sinceId = 0;

  while (true) {
    const path = `/admin/api/2024-01/products.json?limit=250&since_id=${sinceId}&fields=id,vendor,title,status,published,variants`;
    const res = await req('GET', path);

    if (!res.body.products) {
      console.error('Unexpected response:', JSON.stringify(res.body).slice(0, 200));
      break;
    }

    const batch = res.body.products;
    products.push(...batch);
    process.stdout.write(`\rFetched ${products.length} products...`);

    if (batch.length < 250) break;
    sinceId = batch[batch.length - 1].id;
    await sleep(300);
  }

  console.log(`\nTotal fetched: ${products.length}`);
  return products;
}

async function getVariantInventory(variantId) {
  const path = `/admin/api/2024-01/variants/${variantId}.json?fields=id,inventory_quantity,inventory_policy`;
  const res = await req('GET', path);
  if (res.body.variant) {
    return {
      quantity: res.body.variant.inventory_quantity || 0,
      policy: res.body.variant.inventory_policy || 'deny'
    };
  }
  return { quantity: 0, policy: 'deny' };
}

async function shouldHideProduct(product) {
  // Never hide kept vendors (Bartact, Bull Strap, etc.)
  if (isKeptVendor(product.vendor)) {
    return false;
  }

  // Get inventory from first variant
  if (!product.variants || product.variants.length === 0) {
    return false;
  }

  const variant = product.variants[0];
  const inv = await getVariantInventory(variant.id);

  // Always keep products with inventory_policy='continue'
  if (inv.policy === 'continue') {
    return false;
  }

  // Hide if inventory < 2
  return inv.quantity < 2;
}

async function hideProduct(productId, title) {
  const path = `/admin/api/2024-01/products/${productId}.json`;
  const res = await req('PUT', path, {
    product: { id: productId, published: false }
  });

  if (res.status === 200 || res.status === 204) {
    return true;
  } else {
    console.warn(`  ⚠️  Failed to hide ${productId} (${title.slice(0, 40)}): HTTP ${res.status}`);
    return false;
  }
}

async function main() {
  console.log('=== Bull Strap Inventory Filter ===\n');
  console.log('Keeping vendors: ' + KEEP_VENDORS.join(', '));
  console.log('Rules:');
  console.log('  • Hide Turn14 products with inventory < 2 (deny policy)');
  console.log('  • Always keep products with inventory_policy=continue');
  console.log('  • Never touch Bartact/Bull Strap own products\n');

  // Fetch all products
  console.log('Fetching all products...');
  const products = await fetchAllProducts();

  // Find products to hide
  console.log('\nAnalyzing inventory levels...');
  const toHide = [];

  for (let i = 0; i < products.length; i++) {
    process.stdout.write(`\rAnalyzed ${i + 1}/${products.length}...`);

    if (await shouldHideProduct(products[i])) {
      toHide.push(products[i]);
    }

    // Rate limiting
    if (i % 50 === 0) await sleep(100);
  }

  console.log(`\n\nFound ${toHide.length} products to hide.\n`);

  if (toHide.length === 0) {
    console.log('No products need to be hidden. All set!');
    process.exit(0);
  }

  // Hide products
  console.log('Hiding low-stock products...');
  let hidden = 0;
  let failed = 0;

  for (let i = 0; i < toHide.length; i++) {
    const p = toHide[i];
    if (await hideProduct(p.id, p.title)) {
      hidden++;
    } else {
      failed++;
    }

    if ((hidden + failed) % 10 === 0) {
      process.stdout.write(`\rHidden ${hidden}/${toHide.length} (${failed} failed)...`);
    }

    await sleep(200);
  }

  // Summary
  console.log(`\n\n=== SUMMARY ===`);
  console.log(`Products analyzed:  ${products.length}`);
  console.log(`Hidden (low stock): ${hidden}`);
  console.log(`Failed to hide:     ${failed}`);
  console.log(`Kept visible:       ${products.length - toHide.length}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
