#!/usr/bin/env node
// filli-site-audit.js — Weekly Jeep/Truck affiliate site audit
// Run: node /home/ubuntu/.openclaw/workspace/scripts/filli-site-audit.js
// Outputs: one line per site with real metrics, flags issues

const fs = require('fs');
const path = require('path');

const SITES_DIR = '/home/ubuntu/.openclaw/workspace/sites';

const SITES = [
  'jlseatcovers.com',
  'broncoseatcover.com',
  'wranglerseats.com',
  'tacomaseats.com',
  'tacticalseats.com',
  'jeepseatcover.com',
  'gladiatorseatcover.com',
  'bestseatcover.com',
  'wranglerseatcover.com',
  'wranglerseat.com',
];

const results = [];

for (const site of SITES) {
  const indexPath = path.join(SITES_DIR, site, 'index.html');
  const row = { site, status: 'ok', issues: [] };

  if (!fs.existsSync(indexPath)) {
    row.status = 'MISSING';
    row.issues.push('no index.html');
    results.push(row);
    continue;
  }

  const html = fs.readFileSync(indexPath, 'utf8');
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const words = text.trim().split(' ').filter(w => w.length > 0).length;
  const bartact = (html.match(/bartact/gi) || []).length;
  const amazonLinks = (html.match(/amazon\.com\/dp\//gi) || []).length;
  const lazyImages = (html.match(/loading=["']lazy["']/gi) || []).length;
  const bullstrap = (html.match(/bullstrap\.com/gi) || []).length;

  row.words = words;
  row.bartact = bartact;
  row.amazonLinks = amazonLinks;
  row.lazyImages = lazyImages;
  row.bullstrap = bullstrap;

  if (words < 800) row.issues.push(`LOW_WORDS(${words})`);
  if (bartact < 3) row.issues.push(`LOW_BARTACT(${bartact})`);
  if (amazonLinks === 0) row.issues.push('NO_AMAZON_LINKS');
  if (lazyImages > 0) row.issues.push(`LAZY_LOADING(${lazyImages})`);
  if (bullstrap === 0) row.issues.push('NO_BULLSTRAP_LINK');

  if (row.issues.length > 0) row.status = 'ISSUES';
  results.push(row);
}

console.log('\n=== FILLI WEEKLY SEO AUDIT ===');
console.log(`Run: ${new Date().toISOString()}\n`);

let clean = 0;
let issues = 0;
let missing = 0;

for (const r of results) {
  if (r.status === 'MISSING') {
    console.log(`❌ ${r.site}: MISSING index.html`);
    missing++;
  } else if (r.status === 'ISSUES') {
    console.log(`⚠️  ${r.site}: words=${r.words} bartact=${r.bartact} amazon=${r.amazonLinks} bullstrap=${r.bullstrap} | ISSUES: ${r.issues.join(', ')}`);
    issues++;
  } else {
    console.log(`✅ ${r.site}: words=${r.words} bartact=${r.bartact} amazon=${r.amazonLinks} bullstrap=${r.bullstrap}`);
    clean++;
  }
}

console.log(`\nSummary: ${clean} clean / ${issues} with issues / ${missing} missing`);
process.exit(0);
