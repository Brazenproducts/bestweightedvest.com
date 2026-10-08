#!/usr/bin/env node
/**
 * factor-filter-header-fix.js
 * Fixes the sticky header covering hero text on mobile.
 * Run once with a valid SHOPIFY_TOKEN_FACTOR in .env
 * 
 * The problem: position:sticky header overlaps the first section on mobile.
 * The fix: add scroll-margin-top + padding-top compensation to the theme CSS.
 */
require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const https = require('https');

const TOKEN = process.env.SHOPIFY_TOKEN_FACTOR;
const STORE = 'factorfilters.myshopify.com';
const THEME_ID = '184379146608';

if (!TOKEN) {
  console.error('Missing SHOPIFY_TOKEN_FACTOR in .env');
  process.exit(1);
}

function shopify(method, path, body) {
  return new Promise((res, rej) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      host: STORE, path: `/admin/api/2024-01${path}`, method,
      headers: {
        'X-Shopify-Access-Token': TOKEN,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, resp => {
      let d = ''; resp.on('data', c => d += c);
      resp.on('end', () => res({ status: resp.statusCode, body: JSON.parse(d) }));
    });
    req.on('error', rej);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  // Get the current theme CSS asset
  const r = await shopify('GET', `/themes/${THEME_ID}/assets.json?asset[key]=assets/base.css`);
  
  let cssKey = 'assets/base.css';
  let currentCSS = '';
  
  if (r.status === 200 && r.body.asset) {
    currentCSS = r.body.asset.value || '';
    console.log('Found base.css, length:', currentCSS.length);
  } else {
    // Try theme.css or application.css
    for (const key of ['assets/theme.css', 'assets/application.css', 'assets/global.css']) {
      const r2 = await shopify('GET', `/themes/${THEME_ID}/assets.json?asset[key]=${key}`);
      if (r2.status === 200 && r2.body.asset) {
        cssKey = key;
        currentCSS = r2.body.asset.value || '';
        console.log(`Found ${key}, length:`, currentCSS.length);
        break;
      }
    }
  }

  // The CSS fix — add padding-top to body/main equal to header height
  // and scroll-margin-top to all sections with IDs
  const FIX = `
/* === HEADER OVERLAP FIX (mobile) === */
/* Prevents sticky header from covering page content on small screens */
@media screen and (max-width: 749px) {
  .shopify-section:first-of-type {
    padding-top: calc(var(--header-height, 60px) + 16px) !important;
  }
  
  main > .shopify-section:first-child {
    padding-top: calc(var(--header-height, 60px) + 16px) !important;
  }
}

/* Scroll margin for all anchored sections */
[id] {
  scroll-margin-top: calc(var(--header-height, 60px) + 8px);
}
/* === END HEADER OVERLAP FIX === */
`;

  if (currentCSS.includes('HEADER OVERLAP FIX')) {
    console.log('Fix already applied — skipping');
    return;
  }

  const newCSS = currentCSS + FIX;
  
  // Write back
  const w = await shopify('PUT', `/themes/${THEME_ID}/assets.json`, {
    asset: { key: cssKey, value: newCSS }
  });
  
  if (w.status === 200) {
    console.log('✅ Header fix applied to', cssKey);
  } else {
    console.error('❌ Failed:', w.status, JSON.stringify(w.body).slice(0, 200));
    
    // Try injecting into theme.liquid instead
    console.log('Trying theme.liquid injection...');
    const tl = await shopify('GET', `/themes/${THEME_ID}/assets.json?asset[key]=layout/theme.liquid`);
    if (tl.status === 200 && tl.body.asset) {
      let liquid = tl.body.asset.value;
      const styleTag = `<style>
/* Header mobile fix */
@media(max-width:749px){
  .shopify-section:first-of-type,.main-content>.shopify-section:first-child{
    padding-top:calc(var(--header-height,60px) + 16px)!important
  }
}
[id]{scroll-margin-top:calc(var(--header-height,60px) + 8px)}
</style>`;
      liquid = liquid.replace('</head>', styleTag + '\n</head>');
      const tw = await shopify('PUT', `/themes/${THEME_ID}/assets.json`, {
        asset: { key: 'layout/theme.liquid', value: liquid }
      });
      if (tw.status === 200) {
        console.log('✅ Header fix injected into theme.liquid');
        // Save token so it persists
        require('fs').appendFileSync('/home/ubuntu/.openclaw/workspace/.env', '\nSHOPIFY_TOKEN_FACTOR=' + TOKEN + '\n');
      } else {
        console.error('❌ theme.liquid also failed:', tw.status);
      }
    }
  }
}

main().catch(console.error);
