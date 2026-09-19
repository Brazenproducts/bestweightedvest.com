#!/usr/bin/env node
// Bull Strap SEO Description Sweep — GraphQL cursor-based
// Sweeps all active Shopify products for missing/short seo.description metafields
// and generates keyword-rich descriptions from product title using category templates.
// State is saved to memory/bullstrap-seo-desc-sweep-state.json for resume across runs.
// MAX_RUNTIME_MS: 140 seconds — exits cleanly before cron session boundary.

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const https = require('https');
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.SHOPIFY_TOKEN_BULLSTRAP;
const SHOP = 'bull-strap-78.myshopify.com';
const STATE_FILE = path.join(__dirname, '..', 'memory', 'bullstrap-seo-desc-sweep-state.json');
const MAX_RUNTIME_MS = 140000;   // 140 sec — leaves buffer before 300-sec cron timeout
const MAX_FIX_PER_RUN = 300;    // hard cap on fixes per run to avoid rate-limit storms
const PAGE_SIZE = 250;
const DELAY_MS = 300;           // ~3 calls/sec — Shopify GraphQL bucket is 50 pts/sec

const startedAt = Date.now();

// ─── GraphQL helper ────────────────────────────────────────────────────────────
function gql(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query, variables });
    const req = https.request({
      hostname: SHOP,
      path: '/admin/api/2024-01/graphql.json',
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': TOKEN,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch (e) { resolve({ status: res.statusCode, body: null, raw: d }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── State ─────────────────────────────────────────────────────────────────────
function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
  catch (e) {
    return { cursor: null, totalFixed: 372353, totalChecked: 7265000, lastRun: null };
  }
}

function saveState(state) {
  state.lastRun = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ─── Description generation ────────────────────────────────────────────────────
function getCategorySuffix(title) {
  const tl = title.toLowerCase();
  if (tl.includes('limit strap') || tl.includes('bump stop') || tl.includes('bumpstop'))
    return 'Made in USA, Berry Compliant. Shop limit straps and bump stops at Bull Strap.';
  if (tl.includes('strap') || tl.includes('harness') || tl.includes('tether'))
    return 'Heavy-duty nylon with Chromoly hardware. Free shipping on orders over $99.';
  if (tl.includes('exhaust') || tl.includes('muffler') || tl.includes('header'))
    return 'Free shipping on orders over $99. Shop exhaust systems and upgrades.';
  if (tl.includes('suspension') || tl.includes('lift kit') || tl.includes('coilover') || tl.includes('shock'))
    return 'Expert fitment guides available. Shop suspension upgrades and lift kits.';
  if (tl.includes('brake') || tl.includes('rotor') || tl.includes('caliper') || tl.includes('pad'))
    return 'OE-spec and performance brake options. Free shipping on orders over $99.';
  if (tl.includes('air filter') || tl.includes('cold air') || tl.includes('intake'))
    return 'Boost airflow and performance. Shop cold air intakes and filters.';
  if (tl.includes('fender') || tl.includes('bumper') || tl.includes('grille'))
    return 'Direct-fit exterior accessories. Free shipping on orders over $99.';
  if (tl.includes('tonneau') || tl.includes('bed cover') || tl.includes('truck bed'))
    return 'Multiple styles available. Shop truck bed covers and accessories.';
  if (tl.includes('winch') || tl.includes('recovery') || tl.includes('tow strap'))
    return 'Built for off-road reliability. Shop recovery gear and winches.';
  if (tl.includes('light') || tl.includes('led') || tl.includes('lamp'))
    return 'LED and auxiliary lighting options. Free shipping on orders over $99.';
  if (tl.includes('seat cover') || tl.includes('seat pad'))
    return 'Comfort and protection upgrades. Shop seat covers at Bull Strap.';
  if (tl.includes('steering') || tl.includes('tie rod'))
    return 'Restore precision handling. Shop steering components and upgrades.';
  if (tl.includes('differential') || tl.includes('gear') || tl.includes('axle'))
    return 'Performance and replacement drivetrain parts. Free shipping over $99.';
  if (tl.includes('radiator') || tl.includes('cooling') || tl.includes('thermostat'))
    return 'Keep your engine running cool. Shop cooling system parts.';
  if (tl.includes('oil') || tl.includes('filter') || tl.includes('fluid'))
    return 'Keep your vehicle running right. Shop fluids and filters.';
  if (tl.includes('wheel') || tl.includes('tire') || tl.includes('spacer'))
    return 'Perfect fitment guaranteed. Shop wheels and tire accessories.';
  if (tl.includes('armor') || tl.includes('skid') || tl.includes('guard'))
    return 'Built for the trail. Shop armor and underbody protection.';
  if (tl.includes('roof rack') || tl.includes('cargo') || tl.includes('rack'))
    return 'Maximize your hauling capacity. Shop roof racks and cargo systems.';
  if (tl.includes('jeep') || tl.includes('wrangler') || tl.includes('gladiator'))
    return 'Top Jeep accessories with free shipping on orders over $99. Shop Bull Strap.';
  if (tl.includes('ford') || tl.includes('bronco') || tl.includes('f-150') || tl.includes('f150'))
    return 'Top Ford truck accessories. Free shipping on orders over $99.';
  if (tl.includes('ram') || tl.includes('dodge') || tl.includes('1500') || tl.includes('2500'))
    return 'Top Ram truck accessories. Free shipping on orders over $99.';
  if (tl.includes('toyota') || tl.includes('tacoma') || tl.includes('tundra'))
    return 'Top Toyota truck accessories. Free shipping on orders over $99.';
  return 'Free shipping on orders over $99. Top brands and fast delivery at Bull Strap.';
}

function buildDescription(title, existingDesc) {
  // Already long enough — no fix needed
  if (existingDesc && existingDesc.trim().length >= 80) return null;

  // Build a new description from the title
  const base = title.length > 100 ? title.substring(0, 100) : title;
  const suffix = getCategorySuffix(title);
  let desc = base + '. ' + suffix;
  if (desc.length > 155) desc = desc.substring(0, 152) + '...';
  return desc;
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!TOKEN) { console.error('SHOPIFY_TOKEN_BULLSTRAP not set'); process.exit(1); }

  const state = loadState();
  let { cursor, totalFixed, totalChecked } = state;
  let runFixed = 0, runChecked = 0;
  let hasNextPage = true;

  console.log(`Starting sweep | cursor: ${cursor ? cursor.slice(0, 20) + '...' : 'null'} | totalFixed: ${totalFixed} | totalChecked: ${totalChecked}`);

  while (hasNextPage) {
    // Wall-clock guard
    if (Date.now() - startedAt > MAX_RUNTIME_MS) {
      console.log('Wall-clock limit reached — saving state and exiting');
      break;
    }
    if (runFixed >= MAX_FIX_PER_RUN) {
      console.log('Fix cap reached for this run — saving state');
      break;
    }

    const query = `
      query Products($cursor: String) {
        products(first: ${PAGE_SIZE}, after: $cursor, query: "status:active") {
          pageInfo { hasNextPage endCursor }
          edges {
            node {
              id
              title
              vendor
              seo { description }
            }
          }
        }
      }
    `;

    const resp = await gql(query, { cursor: cursor || null });
    if (!resp.body || resp.body.errors) {
      const errDetail = JSON.stringify(resp.body?.errors || resp.raw || 'unknown');
      console.error('GraphQL error:', errDetail.slice(0, 300));
      // Save state and exit on error — will resume next run
      break;
    }

    const products = resp.body.data?.products;
    if (!products) { console.error('No products in response'); break; }

    hasNextPage = products.pageInfo.hasNextPage;
    cursor = products.pageInfo.endCursor;

    const edges = products.edges || [];
    runChecked += edges.length;
    totalChecked += edges.length;

    for (const { node: p } of edges) {
      // Skip Bull Strap and Bartact own-brand products — they have curated descriptions
      if (p.vendor === 'Bull Strap' || p.vendor === 'Bartact') continue;

      const currentDesc = p.seo?.description || '';
      const newDesc = buildDescription(p.title, currentDesc);
      if (!newDesc) continue;  // Description is fine

      // Update via productUpdate mutation
      await sleep(DELAY_MS);

      const mutation = `
        mutation UpdateSEO($id: ID!, $desc: String!) {
          productUpdate(input: { id: $id, seo: { description: $desc } }) {
            product { id seo { description } }
            userErrors { field message }
          }
        }
      `;
      const updateResp = await gql(mutation, { id: p.id, desc: newDesc });
      const errors = updateResp.body?.data?.productUpdate?.userErrors;
      if (errors && errors.length > 0) {
        console.warn(`  Skipped ${p.title.slice(0, 60)}: ${errors[0].message}`);
        continue;
      }

      runFixed++;
      totalFixed++;
      console.log(`  Fixed [${runFixed}]: ${p.title.slice(0, 80)}`);

      // Periodic checkpoint
      if (runFixed % 25 === 0) {
        saveState({ cursor, totalFixed, totalChecked });
        console.log(`  Checkpoint: run=${runFixed} fixed, ${runChecked} checked | all-time=${totalFixed} fixed`);
      }
    }

    await sleep(DELAY_MS);
  }

  // Reset cursor when full catalog sweep is complete
  if (!hasNextPage && Date.now() - startedAt <= MAX_RUNTIME_MS) {
    console.log('Full catalog sweep complete — resetting cursor for next run');
    cursor = null;
  }

  saveState({ cursor, totalFixed, totalChecked });

  console.log('\n=== RUN COMPLETE ===');
  console.log(`This run:  ${runChecked} checked, ${runFixed} fixed`);
  console.log(`All-time:  ${totalChecked} checked, ${totalFixed} fixed`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
