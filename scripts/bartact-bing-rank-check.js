#!/usr/bin/env node
/**
 * Bartact Bing Webmaster Tools Daily Rank Check
 * Uses Bing Webmaster Tools API to pull:
 *   - Top pages by Bing traffic
 *   - Keyword rankings for target keywords
 * Writes results to /tmp/bartact-bing-rank-results.json
 */
'use strict';

const fs = require('fs');
const https = require('https');

const BING_API_KEY = process.env.BING_WMT_KEY || 'ed298ad4e7244db380e73e24b68b197d';
const SITE_URL = 'https://www.bartact.com/';
const OUT_FILE = '/tmp/bartact-bing-rank-results.json';

const TARGET_KEYWORDS = [
  'jeep wrangler seat covers',
  'jeep wrangler jl seat covers',
  'jeep gladiator seat covers',
  'jeep wrangler grab handles',
  'jeep wrangler jl grab handles',
  'paracord grab handles jeep',
  'ford bronco grab handles',
  'ford bronco seat covers',
  'toyota tacoma seat covers',
  'jeep wrangler tj seat covers',
  'jeep wrangler jk seat covers',
  'suspension limit straps utv',
  'suspension limit straps',
  'limit straps off road',
  'molle seat covers jeep',
  'molle attachments',
  'roll bar fire extinguisher holder',
  'jeep wrangler fire extinguisher holder'
];

function bingApiRequest(path) {
  return new Promise((resolve, reject) => {
    const url = `https://ssl.bing.com/webmaster/api.svc/json/${path}&apikey=${BING_API_KEY}`;
    const parsed = new URL(url);
    const opts = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 15000
    };
    const req = https.request(opts, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: null, raw: body.slice(0, 200), error: `JSON parse failed: ${e.message}` });
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Bing API request timed out')); });
    req.end();
  });
}

async function getTopPages() {
  // GetTopPages: top pages by Bing clicks (last 30 days)
  const today = new Date();
  const endDate = today.toISOString().split('T')[0];
  const startDate = new Date(today - 30 * 86400000).toISOString().split('T')[0];
  const encodedSite = encodeURIComponent(SITE_URL);
  try {
    const resp = await bingApiRequest(
      `GetTopPages?siteUrl=${encodedSite}&startDate=${startDate}&endDate=${endDate}`
    );
    if (resp.error) return { error: resp.error, raw: resp.raw };
    if (!resp.data) return { error: 'No data returned' };
    // Response: { d: [ { Url, Clicks, Impressions, AvgClickPosition, AvgImpressionPosition } ] }
    const pages = resp.data.d || resp.data.value || resp.data.TopPages || [];
    return { pages: Array.isArray(pages) ? pages.slice(0, 20) : [] };
  } catch (e) {
    return { error: e.message };
  }
}

async function getTopKeywords() {
  // GetTopKeywords: top keywords driving traffic
  const today = new Date();
  const endDate = today.toISOString().split('T')[0];
  const startDate = new Date(today - 30 * 86400000).toISOString().split('T')[0];
  const encodedSite = encodeURIComponent(SITE_URL);
  try {
    const resp = await bingApiRequest(
      `GetTopKeywords?siteUrl=${encodedSite}&startDate=${startDate}&endDate=${endDate}&rowOffset=0&rowLength=50`
    );
    if (resp.error) return { error: resp.error, keywords: [] };
    const keywords = resp.data?.d || resp.data?.value || resp.data?.Keywords || [];
    return { keywords: Array.isArray(keywords) ? keywords : [] };
  } catch (e) {
    return { error: e.message, keywords: [] };
  }
}

async function getKeywordStats(keyword) {
  const encodedSite = encodeURIComponent(SITE_URL);
  const encodedKw = encodeURIComponent(keyword);
  const today = new Date();
  const endDate = today.toISOString().split('T')[0];
  const startDate = new Date(today - 30 * 86400000).toISOString().split('T')[0];
  try {
    const resp = await bingApiRequest(
      `GetKeywordStats?siteUrl=${encodedSite}&query=${encodedKw}&country=US&language=en-US&startDate=${startDate}&endDate=${endDate}`
    );
    if (resp.error) return { error: resp.error };
    return resp.data?.d?.[0] || resp.data?.value?.[0] || resp.data || null;
  } catch (e) {
    return { error: e.message };
  }
}

async function main() {
  console.log('Bing Webmaster Tools rank check starting...');
  const results = {
    timestamp: new Date().toISOString(),
    site: SITE_URL,
    topPages: [],
    topKeywords: [],
    targetKeywordRanks: {},
    errors: []
  };

  // 1. Top Pages
  console.log('  Fetching Bing top pages...');
  const pagesResult = await getTopPages();
  if (pagesResult.error) {
    results.errors.push(`TopPages: ${pagesResult.error}`);
    console.log(`  ⚠ TopPages error: ${pagesResult.error}`);
  } else {
    results.topPages = pagesResult.pages;
    console.log(`  ✓ Got ${pagesResult.pages.length} top pages`);
  }

  // 2. Top Keywords
  console.log('  Fetching Bing top keywords...');
  const kwResult = await getTopKeywords();
  if (kwResult.error) {
    results.errors.push(`TopKeywords: ${kwResult.error}`);
    console.log(`  ⚠ TopKeywords error: ${kwResult.error}`);
  } else {
    results.topKeywords = kwResult.keywords;
    console.log(`  ✓ Got ${kwResult.keywords.length} top keywords`);
  }

  // 3. Check specific target keywords (sample 6 to avoid rate limits)
  console.log('  Checking target keyword stats...');
  const kwSample = TARGET_KEYWORDS.slice(0, 6);
  for (const kw of kwSample) {
    const stat = await getKeywordStats(kw);
    if (stat && !stat.error) {
      results.targetKeywordRanks[kw] = stat;
    } else {
      results.targetKeywordRanks[kw] = { error: stat?.error || 'no data' };
    }
    await new Promise(r => setTimeout(r, 800));
  }

  // Write output
  fs.writeFileSync(OUT_FILE, JSON.stringify(results, null, 2));
  console.log(`\nBing results written to ${OUT_FILE}`);

  // Summary
  console.log('\n=== BING TOP PAGES ===');
  if (results.topPages.length > 0) {
    results.topPages.slice(0, 10).forEach((p, i) => {
      const url = p.Url || p.url || p.Page || 'unknown';
      const clicks = p.Clicks || p.clicks || 0;
      const pos = p.AvgClickPosition || p.avgClickPosition || p.position || '-';
      console.log(`  ${i + 1}. ${url} (${clicks} clicks, pos: ${pos})`);
    });
  } else {
    console.log('  No top pages data available');
  }

  console.log('\n=== BING TOP KEYWORDS ===');
  if (results.topKeywords.length > 0) {
    results.topKeywords.slice(0, 10).forEach((k, i) => {
      const query = k.Query || k.query || k.Keyword || 'unknown';
      const clicks = k.Clicks || k.clicks || 0;
      const pos = k.AvgClickPosition || k.avgPosition || '-';
      console.log(`  ${i + 1}. "${query}" (${clicks} clicks, pos: ${pos})`);
    });
  } else {
    console.log('  No top keywords data available');
  }

  return results;
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
