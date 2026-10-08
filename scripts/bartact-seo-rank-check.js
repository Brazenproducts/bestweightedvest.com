#!/usr/bin/env node
/**
 * Bartact SEO Rank Check — pulls directly from Google Search Console (GSC)
 * Source of truth: GSC 14-day window (never SERP scraping)
 * Saves results to memory/seo-daily-YYYY-MM-DD.md
 */
'use strict';
console.log('[PLAYBOOK] Sections checked: Affiliate Tags (brazenprodu01-20/02-20 only), Content Standards (500w min), Google Ads READ ONLY, Bull Strap NO ADS, Protected Domains. Running within policy.');

require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const fs = require('fs');
const { GoogleAuth } = require('google-auth-library');

const WORKSPACE = '/home/ubuntu/.openclaw/workspace';
const TODAY = new Date().toLocaleString('en-CA', { timeZone: 'America/Los_Angeles' }).split(',')[0];
const REPORT_FILE = `${WORKSPACE}/memory/seo-daily-${TODAY}.md`;

const KEYWORDS = [
  'jeep wrangler seat covers',
  'jeep wrangler jku seat covers',
  'jeep wrangler jl seat covers',
  'jeep gladiator seat covers',
  'jeep seat covers',
  'tactical seat covers',
  'ford bronco seat covers',
  'ford bronco accessories',
  'jeep wrangler grab handles',
  'paracord grab handles',
  'molle accessories',
  'molle seat covers jeep',
  'suspension limit straps',
  'roll bar fire extinguisher holder',
  'jeep wrangler accessories',
  'bartact seat covers',
  'jeep wrangler jk seat covers',
  'jeep tj seat covers',
];

async function gscQuery(authHeader, site, startDate, endDate, keywords) {
  const res = await fetch('https://searchconsole.googleapis.com/webmasters/v3/sites/' + encodeURIComponent(site) + '/searchAnalytics/query', {
    method: 'POST',
    headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify({ startDate, endDate, dimensions: ['query'], rowLimit: 500 })
  });
  const data = await res.json();
  const rows = data.rows || [];
  const results = {};
  for (const kw of keywords) {
    const row = rows.find(r => r.keys[0].toLowerCase() === kw.toLowerCase());
    if (row) {
      results[kw] = { pos: row.position, impressions: row.impressions, clicks: row.clicks, ctr: row.ctr };
    } else {
      results[kw] = null;
    }
  }
  return results;
}

async function main() {
  const keyFile = JSON.parse(fs.readFileSync(`${WORKSPACE}/.gcp-service-account.json`, 'utf8'));
  const auth = new GoogleAuth({ credentials: keyFile, scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();
  const authHeader = 'Bearer ' + token;
  const site = 'https://www.bartact.com/';

  const fmt = d => d.toISOString().split('T')[0];

  // Current window: last 14 days
  const end = new Date();
  end.setDate(end.getDate() - 1);
  const start = new Date(end);
  start.setDate(start.getDate() - 13);
  const START = fmt(start);
  const END = fmt(end);

  // Previous window: the 14 days before that
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - 13);
  const PREV_START = fmt(prevStart);
  const PREV_END = fmt(prevEnd);

  console.log(`Bartact GSC Rank Check — ${TODAY}`);
  console.log(`Current: ${START} → ${END} vs Prior: ${PREV_START} → ${PREV_END}\n`);

  // Fetch both windows in parallel
  const [curr, prev] = await Promise.all([
    gscQuery(authHeader, site, START, END, KEYWORDS),
    gscQuery(authHeader, site, PREV_START, PREV_END, KEYWORDS)
  ]);

  // Build combined results
  const results = KEYWORDS.map(kw => ({
    kw,
    pos:  curr[kw]?.pos  ?? null,
    clicks: curr[kw]?.clicks ?? 0,
    impressions: curr[kw]?.impressions ?? 0,
    ctr:  curr[kw]?.ctr  ?? 0,
    prevPos: prev[kw]?.pos ?? null,
    prevClicks: prev[kw]?.clicks ?? 0,
  }));

  const ranked = results.filter(r => r.pos !== null).sort((a, b) => a.pos - b.pos);
  const noData = results.filter(r => r.pos === null);
  const page1  = ranked.filter(r => r.pos <= 10);
  const page2  = ranked.filter(r => r.pos > 10 && r.pos <= 20);
  const beyond = ranked.filter(r => r.pos > 20);

  function arrow(cur, prv) {
    if (prv === null) return '  NEW';
    const diff = prv - cur; // positive = improved (lower number)
    if (Math.abs(diff) < 0.3) return '  ―';
    return diff > 0 ? ` ▲${diff.toFixed(1)}` : ` ▼${Math.abs(diff).toFixed(1)}`;
  }

  function fmt_row(r) {
    const pos   = `#${r.pos.toFixed(1)}`;
    const prev  = r.prevPos ? `(was #${r.prevPos.toFixed(1)})` : '(new)';
    const trend = arrow(r.pos, r.prevPos);
    const clkChg = r.prevClicks > 0 ? ` [${r.clicks>r.prevClicks?'+':''}${r.clicks-r.prevClicks} clks]` : '';
    const warn  = r.impressions >= 100 && r.ctr < 0.005 ? ' ⚠️ZERO-CTR' : '';
    return `${pos.padEnd(6)} ${prev.padEnd(12)}${trend.padEnd(7)} | ${r.clicks} clks | ${r.kw}${clkChg}${warn}`;
  }

  console.log('PAGE 1:');
  page1.forEach(r => console.log('  ' + fmt_row(r)));

  if (page2.length) {
    console.log('\nPAGE 2:');
    page2.forEach(r => console.log('  ' + fmt_row(r)));
  }

  if (beyond.length) {
    console.log('\nBEYOND PAGE 2:');
    beyond.forEach(r => console.log('  ' + fmt_row(r)));
  }

  if (noData.length) {
    console.log('\nNO DATA: ' + noData.map(r => r.kw).join(', '));
  }

  // Zero-CTR alerts
  const zeroCtrAlerts = ranked.filter(r => r.impressions >= 100 && r.ctr < 0.005);
  if (zeroCtrAlerts.length) {
    console.log('\n⚠️  ZERO-CTR (>100 impr, <0.5% CTR):');
    zeroCtrAlerts.forEach(r => console.log(`  #${r.pos.toFixed(1)} ${r.kw} — ${r.impressions} impressions, only ${r.clicks} clicks`));
  }

  // Save report
  const report = [
    `# Bartact GSC Rankings — ${TODAY}`,
    `Current: ${START} → ${END} | Prior: ${PREV_START} → ${PREV_END}`,
    `Format: #rank (was #rank) ▲/▼ change | clicks | keyword`,
    '',
    'PAGE 1:',
    ...page1.map(r => '  ' + fmt_row(r)),
    '',
    page2.length  ? 'PAGE 2:\n'  + page2.map(r  => '  ' + fmt_row(r)).join('\n') : '',
    beyond.length ? 'PAGE 3+:\n' + beyond.map(r => '  ' + fmt_row(r)).join('\n') : '',
    noData.length ? 'NO DATA: ' + noData.map(r => r.kw).join(', ') : '',
    zeroCtrAlerts.length ? '\n⚠️ ZERO-CTR:\n' + zeroCtrAlerts.map(r => `  #${r.pos.toFixed(1)} ${r.kw} (${r.impressions} impr, ${r.clicks} clicks)`).join('\n') : '',
  ].filter(Boolean).join('\n');

  fs.writeFileSync(REPORT_FILE, report);
  console.log(`\nReport saved: ${REPORT_FILE}`);

  fs.writeFileSync('/tmp/bartact-rank-results.json', JSON.stringify({ source: 'gsc', date: TODAY, window: { start: START, end: END }, results }, null, 2));
  console.log('Rank results saved to /tmp/bartact-rank-results.json');
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
