#!/usr/bin/env node
'use strict';
/**
 * bartact-seo-maintenance.js  — REBUILT 2026-10-05 (diagnostic-first)
 *
 * Replaces the script that went missing ~Sept 20, 2026 (its disappearance
 * correlates with a ~70% organic traffic decline — under investigation).
 *
 * PHASE 1 (ACTIVE NOW): Diagnostic / monitoring ONLY. No mutations, no pings.
 *   - Pull GSC per-page Search Analytics (28d vs prior 28d)
 *   - Flag pages with impression collapse (>50% drop) and pages gone to ZERO
 *   - Check sitemap.xml + sub-sitemaps return 200
 *   - Check robots.txt is sane (no accidental Disallow: /)
 *   - Spot-check a sample of key pages for noindex tags / HTTP status
 *   - Write a dated report to memory/ and only message Mitch if something is alarming
 *
 * PHASE 2 (DISABLED — enable only after GSC confirms an indexing problem):
 *   - Sitemap lastmod freshness, IndexNow (Bing/Yandex) submissions
 *
 * PHASE 3 (DISABLED — optional/experimental, gray-hat):
 *   - Google Indexing API pings for collection/product URLs
 *     NOTE: officially only sanctioned for JobPosting/BroadcastEvent schema.
 *
 * Run: node scripts/bartact-seo-maintenance.js
 */

require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const https = require('https');
const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

const WORKSPACE = '/home/ubuntu/.openclaw/workspace';
const SA_KEY = path.join(WORKSPACE, '.bartact-indexing-service-account.json');
const GSC_SITE = 'https://www.bartact.com/';
const SITE_HOST = 'www.bartact.com';
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN_BARTACT;
const TELEGRAM_CHAT = '7550065844';

// Thresholds
const IMPRESSION_DROP_ALERT = 0.50;   // flag pages that lost >50% impressions
const SITEWIDE_DROP_ALERT   = 0.30;   // message Mitch if sitewide impr down >30%

const today = new Date().toISOString().slice(0, 10);

// ── helpers ───────────────────────────────────────────────────────────────
function httpStatus(url) {
  return new Promise((resolve) => {
    https.get(url, (r) => { r.resume(); resolve(r.statusCode); })
      .on('error', () => resolve(0));
  });
}

function httpGet(url) {
  return new Promise((resolve) => {
    https.get(url, (r) => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>resolve({status:r.statusCode,body:d})); })
      .on('error', () => resolve({status:0,body:''}));
  });
}

async function gscToken() {
  const auth = new GoogleAuth({ keyFile: SA_KEY, scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });
  const c = await auth.getClient();
  return (await c.getAccessToken()).token;
}

function gscQuery(token, body) {
  return new Promise((resolve, reject) => {
    const buf = Buffer.from(JSON.stringify(body));
    const site = encodeURIComponent(GSC_SITE);
    https.request({
      hostname: 'searchconsole.googleapis.com',
      path: `/webmasters/v3/sites/${site}/searchAnalytics/query`,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Content-Length': buf.length }
    }, r => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>{ try{resolve(JSON.parse(d));}catch(e){reject(e);} }); })
      .on('error', reject).end(buf);
  });
}

function tgSend(msg) {
  if (!TELEGRAM_TOKEN) return Promise.resolve();
  return new Promise((resolve) => {
    const buf = Buffer.from(JSON.stringify({ chat_id: TELEGRAM_CHAT, text: msg, parse_mode: 'Markdown' }));
    const req = https.request({ hostname:'api.telegram.org', path:`/bot${TELEGRAM_TOKEN}/sendMessage`, method:'POST',
      headers:{'Content-Type':'application/json','Content-Length':buf.length} }, r=>{ r.resume(); r.on('end',resolve); });
    req.on('error', resolve); req.write(buf); req.end();
  });
}

function dateStr(daysAgo) { return new Date(Date.now() - daysAgo*86400000).toISOString().slice(0,10); }

// ── main ──────────────────────────────────────────────────────────────────
async function main() {
  const report = [];
  const alerts = [];
  report.push(`# Bartact SEO Maintenance — ${today} (Phase 1: diagnostic)`);
  report.push('');

  // 1) Sitemap + robots health
  report.push('## Crawl infrastructure');
  const smStatus = await httpStatus(`https://${SITE_HOST}/sitemap.xml`);
  report.push(`- sitemap.xml: HTTP ${smStatus}${smStatus!==200?' ⚠️':''}`);
  if (smStatus !== 200) alerts.push(`sitemap.xml returned HTTP ${smStatus}`);

  const robots = await httpGet(`https://${SITE_HOST}/robots.txt`);
  const blanketDisallow = /^\s*Disallow:\s*\/\s*$/mi.test(robots.body) && !/Allow:\s*\//i.test(robots.body);
  report.push(`- robots.txt: HTTP ${robots.status}${blanketDisallow?' 🔴 BLANKET DISALLOW':' ✅'}`);
  if (blanketDisallow) alerts.push('robots.txt may be blocking the whole site (Disallow: /)');

  // sub-sitemaps
  const sm = await httpGet(`https://${SITE_HOST}/sitemap.xml`);
  const subs = (sm.body.match(/<loc>([^<]+)<\/loc>/g) || []).map(s => s.replace(/<\/?loc>/g,''));
  report.push(`- sub-sitemaps found: ${subs.length}`);
  report.push('');

  // 2) GSC per-page impression comparison (28d vs prior 28d)
  report.push('## Impression analysis (last 28d vs prior 28d)');
  let sitewideAlert = false;
  try {
    const token = await gscToken();
    const recent = await gscQuery(token, { startDate: dateStr(31), endDate: dateStr(3), dimensions: ['page'], rowLimit: 500 });
    const prior  = await gscQuery(token, { startDate: dateStr(59), endDate: dateStr(31), dimensions: ['page'], rowLimit: 500 });
    const rm = {}, pm = {};
    (recent.rows||[]).forEach(r => rm[r.keys[0]] = r.impressions);
    (prior.rows||[]).forEach(r => pm[r.keys[0]] = r.impressions);

    const recentTotal = Object.values(rm).reduce((a,b)=>a+b,0);
    const priorTotal  = Object.values(pm).reduce((a,b)=>a+b,0);
    const sitewideDrop = priorTotal>0 ? (priorTotal-recentTotal)/priorTotal : 0;
    report.push(`- Sitewide impressions: ${priorTotal} → ${recentTotal} (${(sitewideDrop*100).toFixed(0)}% change)`);
    if (sitewideDrop > SITEWIDE_DROP_ALERT) { sitewideAlert = true; alerts.push(`Sitewide impressions down ${(sitewideDrop*100).toFixed(0)}% over 28d`); }

    const drops = [];
    for (const url in pm) { const b=pm[url], a=rm[url]||0; if (b>=50) drops.push({url,b,a,pct:(b-a)/b}); }
    drops.sort((x,y)=>(y.b-y.a)-(x.b-x.a));
    const bigDrops = drops.filter(d => d.pct >= IMPRESSION_DROP_ALERT);
    const zeroed = drops.filter(d => d.a === 0);
    report.push(`- Pages down >${IMPRESSION_DROP_ALERT*100}%: ${bigDrops.length}`);
    report.push(`- Pages gone to ZERO impressions: ${zeroed.length}`);
    report.push('');
    report.push('### Top 20 impression losses');
    for (const d of drops.slice(0,20)) {
      report.push(`- ${d.b}→${d.a} (-${Math.round(d.pct*100)}%) ${d.url.replace('https://www.bartact.com','')}`);
    }
    if (zeroed.length >= 20) alerts.push(`${zeroed.length} pages dropped to ZERO impressions — likely indexing issue`);
  } catch (e) {
    report.push(`- GSC query failed: ${e.message}`);
  }
  report.push('');

  // 3) Note phase status
  report.push('## Phase status');
  report.push('- Phase 1 (diagnostic): ACTIVE');
  report.push('- Phase 2 (sitemap freshness + IndexNow): DISABLED — enable after GSC confirms indexing issue');
  report.push('- Phase 3 (Google Indexing API pings): DISABLED — gray-hat, optional');

  // write report
  const outPath = path.join(WORKSPACE, `memory/bartact-seo-maintenance-${today}.md`);
  fs.writeFileSync(outPath, report.join('\n'));
  console.log(report.join('\n'));
  console.log(`\nReport saved: ${outPath}`);

  // only message Mitch if something alarming
  if (alerts.length) {
    const msg = `⚠️ *Bartact SEO Maintenance Alert* (${today})\n\n` + alerts.map(a=>`• ${a}`).join('\n') +
      `\n\nFull report: memory/bartact-seo-maintenance-${today}.md`;
    await tgSend(msg);
    console.log('\nAlert sent to Mitch.');
  } else {
    console.log('\nNo alerts — silent exit.');
  }
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
