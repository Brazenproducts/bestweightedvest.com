'use strict';
require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const https = require('https');
const { GoogleAuth } = require('google-auth-library');

const TOKEN = process.env.SHOPIFY_TOKEN_BARTACT;
const SHOP = 'bartact.myshopify.com';

function shopify(method, apiPath, body) {
  return new Promise((res, rej) => {
    const buf = body ? Buffer.from(JSON.stringify(body)) : null;
    const req = https.request({
      hostname: SHOP,
      path: '/admin/api/2024-01/' + apiPath,
      method,
      headers: {
        'X-Shopify-Access-Token': TOKEN,
        'Content-Type': 'application/json',
        ...(buf ? { 'Content-Length': buf.length } : {})
      }
    }, r => {
      let d = ''; r.on('data', c => d += c);
      r.on('end', () => { try { res({ status: r.statusCode, body: JSON.parse(d) }); } catch(e) { res({ status: r.statusCode, body: d }); } });
    });
    req.on('error', rej);
    if (buf) req.write(buf);
    req.end();
  });
}

async function gscQuery(body) {
  const auth = new GoogleAuth({
    keyFile: '/home/ubuntu/.openclaw/workspace/.bartact-indexing-service-account.json',
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
  });
  const client = await auth.getClient();
  const token = (await client.getAccessToken()).token;
  const site = encodeURIComponent('https://www.bartact.com/');
  return new Promise((res, rej) => {
    const buf = Buffer.from(JSON.stringify(body));
    https.request({
      hostname: 'searchconsole.googleapis.com',
      path: '/webmasters/v3/sites/' + site + '/searchAnalytics/query',
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Content-Length': buf.length }
    }, r => {
      let d = ''; r.on('data', c => d += c);
      r.on('end', () => res(JSON.parse(d)));
    }).on('error', rej).end(buf);
  });
}

async function main() {
  console.log('=== STEP 1: FIX META TAGS ===\n');

  // Get all collections
  const [custom, smart] = await Promise.all([
    shopify('GET', 'custom_collections.json?limit=250&fields=id,title,handle'),
    shopify('GET', 'smart_collections.json?limit=250&fields=id,title,handle')
  ]);
  const all = [...(custom.body.custom_collections || []), ...(smart.body.smart_collections || [])];

  const targets = [
    {
      handle: 'tactical-seat-covers',
      newTitle: 'Tactical Seat Covers | MOLLE, Custom Fit | Bartact',
      newDesc: 'Custom tactical seat covers with MOLLE/PALS webbing — made in Temecula, CA. Fits Jeep Wrangler, Gladiator, Bronco, and Tacoma.'
    },
    {
      handle: 'ford-bronco-seat-covers',
      newTitle: 'Ford Bronco Seat Covers | Custom Fit | Bartact',
      newDesc: null // desc is fine at 144 chars, only title needs fixing
    }
  ];

  for (const t of targets) {
    const col = all.find(c => c.handle === t.handle);
    if (!col) { console.log('NOT FOUND: ' + t.handle); continue; }

    // Get existing metafields
    const mf = await shopify('GET', 'collections/' + col.id + '/metafields.json?namespace=global');
    const metafields = mf.body.metafields || [];
    const titleMF = metafields.find(m => m.key === 'title_tag');
    const descMF = metafields.find(m => m.key === 'description_tag');

    console.log(t.handle + ':');
    console.log('  Old title: "' + (titleMF?.value || 'NONE') + '" (' + (titleMF?.value?.length || 0) + 'ch)');
    console.log('  New title: "' + t.newTitle + '" (' + t.newTitle.length + 'ch)');

    // Fix title
    if (titleMF) {
      const r = await shopify('PUT', 'metafields/' + titleMF.id + '.json', {
        metafield: { id: titleMF.id, value: t.newTitle, type: 'single_line_text_field' }
      });
      console.log('  Title update: ' + (r.status === 200 ? '✅ HTTP 200' : '❌ HTTP ' + r.status));
    } else {
      const r = await shopify('POST', 'collections/' + col.id + '/metafields.json', {
        metafield: { namespace: 'global', key: 'title_tag', value: t.newTitle, type: 'single_line_text_field' }
      });
      console.log('  Title create: ' + (r.status === 201 ? '✅ HTTP 201' : '❌ HTTP ' + r.status));
    }

    // Fix desc if needed
    if (t.newDesc) {
      console.log('  Old desc: "' + (descMF?.value?.slice(0,80) || 'NONE') + '..." (' + (descMF?.value?.length || 0) + 'ch)');
      console.log('  New desc: "' + t.newDesc + '" (' + t.newDesc.length + 'ch)');
      if (descMF) {
        const r = await shopify('PUT', 'metafields/' + descMF.id + '.json', {
          metafield: { id: descMF.id, value: t.newDesc, type: 'single_line_text_field' }
        });
        console.log('  Desc update: ' + (r.status === 200 ? '✅ HTTP 200' : '❌ HTTP ' + r.status));
      } else {
        const r = await shopify('POST', 'collections/' + col.id + '/metafields.json', {
          metafield: { namespace: 'global', key: 'description_tag', value: t.newDesc, type: 'single_line_text_field' }
        });
        console.log('  Desc create: ' + (r.status === 201 ? '✅ HTTP 201' : '❌ HTTP ' + r.status));
      }
    }
    console.log('');
  }

  console.log('\n=== STEP 5: GSC DIAGNOSTICS ===\n');

  // Check GSC coverage for crawl errors
  try {
    // Check impressions on 7 empty collections to see if any have traffic
    const emptyHandles = ['ebay-collection', 'hvac-filters', 'miscellaneous-1', 'motorcycle-gear', 'seat-belts-harnesses', 'uncategorized', 'winch-strap'];
    const urls = emptyHandles.map(h => 'https://www.bartact.com/collections/' + h);

    console.log('Checking empty collections for GSC impressions...');
    const gscData = await gscQuery({
      startDate: '2026-09-01', endDate: '2026-09-28',
      dimensions: ['page'], rowLimit: 500
    });

    const pageMap = {};
    (gscData.rows || []).forEach(r => { pageMap[r.keys[0]] = r; });

    console.log('\nEmpty collection GSC status:');
    for (const url of urls) {
      const handle = url.split('/').pop();
      const data = pageMap[url];
      if (data) {
        console.log('  ⚠️  ' + handle + ': ' + data.impressions + ' impr, ' + data.clicks + ' clicks, pos ' + data.position.toFixed(1) + ' — HAS TRAFFIC, populate don\'t delete');
      } else {
        console.log('  ✅ ' + handle + ': no GSC data — safe to delete/redirect');
      }
    }

    // Check for any dramatic impression drops on key pages
    console.log('\nKey page impression trend (Sept 22-28 vs Sept 15-21):');
    const keyPages = [
      'https://www.bartact.com/collections/tactical-seat-covers',
      'https://www.bartact.com/collections/jeep-wrangler-seat-covers',
      'https://www.bartact.com/collections/molle-accessories',
      'https://www.bartact.com/collections/ford-bronco-seat-covers'
    ];

    const [recent, prior] = await Promise.all([
      gscQuery({ startDate: '2026-09-22', endDate: '2026-09-28', dimensions: ['page'], rowLimit: 500 }),
      gscQuery({ startDate: '2026-09-15', endDate: '2026-09-21', dimensions: ['page'], rowLimit: 500 })
    ]);

    const recentMap = {}, priorMap2 = {};
    (recent.rows || []).forEach(r => { recentMap[r.keys[0]] = r; });
    (prior.rows || []).forEach(r => { priorMap2[r.keys[0]] = r; });

    keyPages.forEach(url => {
      const r = recentMap[url];
      const p = priorMap2[url];
      const path = url.replace('https://www.bartact.com', '');
      if (r && p) {
        const imprChange = r.impressions - p.impressions;
        const flag = imprChange < -100 ? '⬇️ ' : imprChange > 100 ? '⬆️ ' : '➡️ ';
        console.log('  ' + flag + path + ': ' + p.impressions + ' → ' + r.impressions + ' impr (' + (imprChange > 0 ? '+' : '') + imprChange + ')');
      } else if (r) {
        console.log('  🆕 ' + path + ': ' + r.impressions + ' impr (new)');
      } else {
        console.log('  ❓ ' + path + ': no recent data');
      }
    });

  } catch(e) {
    console.error('GSC error:', e.message);
  }

  // Check maintenance script
  console.log('\n=== STEP 2: INVESTIGATE bartact-seo-maintenance.js ===\n');
  const fs = require('fs');
  const scriptPath = '/home/ubuntu/.openclaw/workspace/scripts/bartact-seo-maintenance.js';
  if (fs.existsSync(scriptPath)) {
    console.log('Script EXISTS at', scriptPath);
  } else {
    console.log('Script MISSING:', scriptPath);
    // Check git history
    try {
      const { execSync } = require('child_process');
      const gitLog = execSync('cd /home/ubuntu/.openclaw/workspace && git log --all --oneline -- scripts/bartact-seo-maintenance.js 2>&1').toString();
      console.log('Git history:', gitLog || 'No git history found');
    } catch(e) {
      console.log('Git history: not available -', e.message);
    }
    // Check logs for what it did last time
    const logPath = '/home/ubuntu/.openclaw/workspace/logs/bartact-seo-maintenance.log';
    if (fs.existsSync(logPath)) {
      const log = fs.readFileSync(logPath, 'utf8');
      console.log('\nLast maintenance log contents:');
      console.log(log.slice(-3000));
    } else {
      console.log('No maintenance log found at', logPath);
    }
  }
}

main().catch(e => console.error('Fatal:', e.message));
