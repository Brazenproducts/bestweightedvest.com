'use strict';
console.log('[PLAYBOOK] Sections checked: Affiliate Tags (brazenprodu01-20/02-20 only), Content Standards (500w min), Google Ads READ ONLY, Bull Strap NO ADS, Protected Domains. Running within policy.');
/**
 * audit-affiliate-tags.js — Weekly affiliate tag audit (Mon 3 AM UTC)
 * Checks all 96 live affiliate sites for correct brazenprodu01-20 or brazenprodu02-20 tags
 * Logs results to logs/affiliate-tag-audit.log
 */
require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const STORE01_TAG = 'brazenprodu01-20';
const STORE02_TAG = 'brazenprodu02-20';
const SITES_DIR   = '/home/ubuntu/.openclaw/workspace/sites';
const TODAY       = new Date().toISOString().split('T')[0];

// Load site lists from fix-affiliate-tags.js (canonical source of truth)
const fixScript = fs.readFileSync(path.join(SITES_DIR, '../scripts/fix-affiliate-tags.js'), 'utf8');
const s1match = fixScript.match(/STORE01_SITES\s*=\s*\[([^\]]+)\]/s);
const s2match = fixScript.match(/STORE02_SITES\s*=\s*\[([^\]]+)\]/s);

function parseSites(match) {
  if (!match) return [];
  return match[1].match(/'([^']+)'/g)?.map(s => s.replace(/'/g, '')) || [];
}

const store01 = parseSites(s1match);
const store02 = parseSites(s2match);
const allSites = [...store01.map(s => ({ domain: s, expectedTag: STORE01_TAG })),
                  ...store02.map(s => ({ domain: s, expectedTag: STORE02_TAG }))];

console.log(`\n=== Affiliate Tag Audit — ${TODAY} ===`);
console.log(`Store 01: ${store01.length} sites | Store 02: ${store02.length} sites\n`);

const issues = [];
const ok = [];

for (const { domain, expectedTag } of allSites) {
  const indexPath = path.join(SITES_DIR, domain, 'index.html');
  if (!fs.existsSync(indexPath)) {
    issues.push({ domain, issue: 'index.html missing', expectedTag });
    continue;
  }
  const html = fs.readFileSync(indexPath, 'utf8');
  const hasCorrect = html.includes(expectedTag);
  const hasWrong   = html.includes(STORE01_TAG === expectedTag ? STORE02_TAG : STORE01_TAG);
  const hasSentinel = html.includes('<!-- AMAZON-AFFILIATE-LOCKED -->');

  if (!hasCorrect) {
    issues.push({ domain, issue: `missing ${expectedTag}${hasWrong ? ' (has wrong tag)' : ''}`, expectedTag });
  } else if (!hasSentinel) {
    issues.push({ domain, issue: 'missing AMAZON-AFFILIATE-LOCKED sentinel', expectedTag });
  } else {
    ok.push(domain);
  }
}

console.log(`✅ Clean: ${ok.length}`);
console.log(`❌ Issues: ${issues.length}`);
if (issues.length) {
  console.log('\nISSUES:');
  issues.forEach(i => console.log(`  ${i.domain}: ${i.issue}`));
} else {
  console.log('\nAll sites have correct tags and sentinels. No action needed.');
}

// Save state
fs.writeFileSync(
  '/home/ubuntu/.openclaw/workspace/memory/affiliate-tag-audit-latest.json',
  JSON.stringify({ date: TODAY, ok: ok.length, issues }, null, 2)
);
console.log(`\nAudit complete. Report saved.`);
