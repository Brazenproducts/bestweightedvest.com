#!/usr/bin/env node
/**
 * Bartact SEO Rank Check — pulls directly from Google Search Console (GSC)
 * Source of truth: GSC 14-day window (never SERP scraping)
 * Saves results to memory/seo-daily-YYYY-MM-DD.md
 */
'use strict';

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

async function main() {
  const keyFile = JSON.parse(fs.readFileSync(`${WORKSPACE}/.gcp-service-account.json`, 'utf8'));
  const auth = new GoogleAuth({ credentials: keyFile, scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();
  const authHeader = 'Bearer ' + token;
  const site = 'https://www.bartact.com/';

  // 14-day window ending yesterday
  const end = new Date();
  end.setDate(end.getDate() - 1);
  const start = new Date(end);
  start.setDate(start.getDate() - 13);
  const fmt = d => d.toISOString().split('T')[0];
  const START = fmt(start);
  const END = fmt(end);

  console.log(`Bartact GSC Rank Check — ${TODAY}`);
  console.log(`Window: ${START} to ${END} (14 days)\n`);

  const results = [];

  for (const kw of KEYWORDS) {
    const body = {
      startDate: START, endDate: END,
      dimensions: ['query'],
      dimensionFilterGroups: [{ filters: [{ dimension: 'query', operator: 'equals', expression: kw }] }],
      rowLimit: 1
    };
    const r = await fetch(
      'https://searchconsole.googleapis.com/webmasters/v3/sites/' + encodeURIComponent(site) + '/searchAnalytics/query',
      { method: 'POST', headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    );
    const rows = (await r.json()).rows || [];
    if (rows.length) {
      const row = rows[0];
      results.push({ kw, pos: row.position, impressions: row.impressions, clicks: row.clicks, ctr: row.ctr });
    } else {
      results.push({ kw, pos: null, impressions: 0, clicks: 0, ctr: 0 });
    }
  }

  // Sort by position
  const ranked = results.filter(r => r.pos !== null).sort((a, b) => a.pos - b.pos);
  const noData = results.filter(r => r.pos === null);

  const page1 = ranked.filter(r => r.pos <= 10);
  const page2 = ranked.filter(r => r.pos > 10 && r.pos <= 20);
  const beyond = ranked.filter(r => r.pos > 20);

  console.log('=== PAGE 1 (positions 1-10) ===');
  page1.forEach(r => {
    const zeroCtr = r.impressions >= 100 && r.ctr < 0.005 ? ' ⚠️ ZERO-CTR' : '';
    console.log(`  #${r.pos.toFixed(1)} | ${r.impressions} impr | ${r.clicks} clk | ${(r.ctr*100).toFixed(1)}% CTR${zeroCtr} | ${r.kw}`);
  });

  if (page2.length) {
    console.log('\n=== PAGE 2 (positions 11-20) ===');
    page2.forEach(r => console.log(`  #${r.pos.toFixed(1)} | ${r.impressions} impr | ${r.clicks} clk | ${r.kw}`));
  }

  if (beyond.length) {
    console.log('\n=== BEYOND PAGE 2 (positions 21+) ===');
    beyond.forEach(r => console.log(`  #${r.pos.toFixed(1)} | ${r.impressions} impr | ${r.clicks} clk | ${r.kw}`));
  }

  if (noData.length) {
    console.log('\n=== NO IMPRESSION DATA ===');
    noData.forEach(r => console.log(`  (no data) | ${r.kw}`));
  }

  // Zero-CTR alerts
  const zeroCtrAlerts = ranked.filter(r => r.impressions >= 100 && r.ctr < 0.005);
  if (zeroCtrAlerts.length) {
    console.log('\n=== ZERO-CTR ALERTS (>100 impr, <0.5% CTR) ===');
    zeroCtrAlerts.forEach(r => console.log(`  #${r.pos.toFixed(1)} | ${r.impressions} impr | ${(r.ctr*100).toFixed(2)}% CTR | ${r.kw}`));
  }

  // Save report
  const report = [
    `# Bartact SEO Daily Rank Check — ${TODAY}`,
    `**GSC Window:** ${START} to ${END} (14 days)`,
    '',
    '## Page 1 Rankings',
    ...page1.map(r => `- #${r.pos.toFixed(1)} | ${r.impressions} impr | ${r.clicks} clk | ${(r.ctr*100).toFixed(1)}% CTR | ${r.kw}`),
    '',
    page2.length ? '## Page 2 Rankings\n' + page2.map(r => `- #${r.pos.toFixed(1)} | ${r.impressions} impr | ${r.kw}`).join('\n') : '',
    beyond.length ? '## Beyond Page 2\n' + beyond.map(r => `- #${r.pos.toFixed(1)} | ${r.impressions} impr | ${r.kw}`).join('\n') : '',
    zeroCtrAlerts.length ? '## Zero-CTR Alerts\n' + zeroCtrAlerts.map(r => `- #${r.pos.toFixed(1)} | ${r.impressions} impr | ${(r.ctr*100).toFixed(2)}% CTR | ${r.kw}`).join('\n') : '',
  ].filter(Boolean).join('\n');

  fs.writeFileSync(REPORT_FILE, report);
  console.log(`\nReport saved: ${REPORT_FILE}`);

  // Also save JSON for ranking monitor to consume
  fs.writeFileSync('/tmp/bartact-rank-results.json', JSON.stringify({ source: 'gsc', date: TODAY, window: { start: START, end: END }, results }, null, 2));
  console.log('Rank results saved to /tmp/bartact-rank-results.json');
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
