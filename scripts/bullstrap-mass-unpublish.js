#!/usr/bin/env node
/**
 * bullstrap-mass-unpublish.js
 *
 * Unpublishes all products from Bull Strap store that are NOT
 * Bartact, Bull Strap, or Carli brand products.
 *
 * KEEP vendors: Bartact, Bull Strap, Carli
 * Everything else: set published = false (hidden from storefront + Google)
 * Fully reversible — products stay in Shopify admin, nothing is deleted.
 *
 * State: memory/bullstrap-mass-unpublish-state.json
 * Log:   memory/bullstrap-mass-unpublish.log
 */

require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const https = require('https');
const fs = require('fs');

const TOKEN = process.env.SHOPIFY_TOKEN_BULLSTRAP;
const SHOP = 'bull-strap-78.myshopify.com';
const STATE_FILE = '/home/ubuntu/.openclaw/workspace/memory/bullstrap-mass-unpublish-state.json';
const LOG_FILE = '/home/ubuntu/.openclaw/workspace/memory/bullstrap-mass-unpublish.log';

// Vendors to KEEP published — everything else gets hidden
const KEEP_VENDORS = ['bartact', 'bull strap', 'bullstrap', 'carli'];

if (!TOKEN) { console.error('FATAL: SHOPIFY_TOKEN_BULLSTRAP not set'); process.exit(1); }

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function shopifyGet(path) {
  return new Promise((res, rej) => {
    const req = https.request({
      hostname: SHOP, path, method: 'GET',
      headers: { 'X-Shopify-Access-Token': TOKEN, 'Content-Type': 'application/json' }
    }, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => { try { res({ status: r.statusCode, body: JSON.parse(d) }); } catch(e) { rej(e); } });
    });
    req.on('error', rej);
    req.end();
  });
}

function shopifyPut(path, body) {
  return new Promise((res, rej) => {
    const buf = Buffer.from(JSON.stringify(body));
    const req = https.request({
      hostname: SHOP, path, method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': TOKEN,
        'Content-Type': 'application/json',
        'Content-Length': buf.length
      }
    }, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => { try { res({ status: r.statusCode, body: JSON.parse(d) }); } catch(e) { rej(e); } });
    });
    req.on('error', rej);
    req.write(buf);
    req.end();
  });
}

function shouldKeep(vendor) {
  if (!vendor) return false;
  const v = vendor.toLowerCase();
  return KEEP_VENDORS.some(k => v.includes(k));
}

async function main() {
  log('=== Bull Strap Mass Unpublish STARTED ===');
  log('Keeping vendors: ' + KEEP_VENDORS.join(', '));

  // Load or init state
  let state = { sinceId: 0, unpublished: 0, kept: 0, errors: 0, done: false };
  if (fs.existsSync(STATE_FILE)) {
    try {
      const loaded = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      if (loaded.done) {
        log('State file shows already complete. Delete state file to re-run.');
        process.exit(0);
      }
      state = loaded;
      log(`Resuming: sinceId=${state.sinceId} | unpublished=${state.unpublished} | kept=${state.kept}`);
    } catch(e) {
      log('Could not load state, starting fresh: ' + e.message);
    }
  }

  let pagesProcessed = 0;

  while (true) {
    // Fetch next page of published products
    let resp;
    let getRetries = 0;
    while (getRetries < 5) {
      resp = await shopifyGet(
        `/admin/api/2026-01/products.json?limit=250&since_id=${state.sinceId}&published_status=published&fields=id,vendor,title`
      );
      if (resp.status === 429) {
        log('Rate limited on GET, waiting 15s...');
        await sleep(15000);
        getRetries++;
        continue;
      }
      break;
    }

    const products = resp.body.products || [];
    if (products.length === 0) {
      log('No more products. Sweep complete.');
      break;
    }

    state.sinceId = products[products.length - 1].id;
    pagesProcessed++;

    for (const product of products) {
      const keep = shouldKeep(product.vendor);

      if (keep) {
        state.kept++;
        log(`KEEP  [${product.vendor}] ${product.title.substring(0, 70)}`);
        continue;
      }

      // Unpublish
      let putRetries = 0;
      let success = false;
      while (putRetries < 4 && !success) {
        await sleep(550); // ~1.8/sec, safely within 2/sec Shopify limit
        const upd = await shopifyPut(
          `/admin/api/2026-01/products/${product.id}.json`,
          { product: { id: product.id, published: false } }
        );
        if (upd.status === 429) {
          log(`Rate limited on PUT ${product.id}, waiting 15s...`);
          await sleep(15000);
          putRetries++;
          continue;
        }
        if (upd.status === 200) {
          state.unpublished++;
          success = true;
        } else {
          log(`ERROR [${upd.status}] on product ${product.id} (${product.vendor})`);
          state.errors++;
          putRetries++;
        }
      }

      // Progress snapshot every 1000 unpublished
      if (state.unpublished > 0 && state.unpublished % 1000 === 0) {
        log(`--- MILESTONE: ${state.unpublished} unpublished | ${state.kept} kept | ${state.errors} errors ---`);
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
      }
    }

    // Save state after each page of 250
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    log(`Page ${pagesProcessed} done | sinceId=${state.sinceId} | unpublished=${state.unpublished} | kept=${state.kept}`);
    await sleep(300);
  }

  state.done = true;
  state.completedAt = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

  log('=== COMPLETE ===');
  log(`Unpublished: ${state.unpublished}`);
  log(`Kept published: ${state.kept}`);
  log(`Errors: ${state.errors}`);
}

main().catch(err => {
  log('FATAL ERROR: ' + err.message);
  process.exit(1);
});
