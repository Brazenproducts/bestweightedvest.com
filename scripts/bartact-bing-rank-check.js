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

// Aggregate helper: combine per-date rows by a key field, summing clicks/impressions
function aggregateByKey(rows, keyField) {
  const map = new Map();
  for (const r of rows) {
    const key = r[keyField];
    if (!key) continue;
    const cur = map.get(key) || { key, Clicks: 0, Impressions: 0, posSum: 0, posN: 0 };
    cur.Clicks += (r.Clicks || 0);
    cur.Impressions += (r.Impressions || 0);
    if (typeof r.AvgImpressionPosition === 'number' && r.AvgImpressionPosition > 0) {
      cur.posSum += r.AvgImpressionPosition * (r.Impressions || 1);
      cur.posN += (r.Impressions || 1);
    }
    map.set(key, cur);
  }
  return [...map.values()].map(x => ({
    key: x.key,
    Clicks: x.Clicks,
    Impressions: x.Impressions,
    AvgPosition: x.posN > 0 ? +(x.posSum / x.posN).toFixed(1) : null,
  })).sort((a, b) => b.Clicks - a.Clicks || b.Impressions - a.Impressions);
}

async function getTopPages() {
  // GetPageStats: per-page per-date stats (last ~180 days default window)
  const encodedSite = encodeURIComponent(SITE_URL);
  try {
    const resp = await bingApiRequest(`GetPageStats?siteUrl=${encodedSite}`);
    if (resp.error) return { error: resp.error, raw: resp.raw };
    if (!resp.data) return { error: 'No data returned' };
    const rows = resp.data.d || resp.data.value || [];
    if (!Array.isArray(rows)) return { pages: [] };
    // GetPageStats returns Query = the page URL
    const agg = aggregateByKey(rows, 'Query');
    return { pages: agg.slice(0, 20).map(p => ({
      Url: p.key, Clicks: p.Clicks, Impressions: p.Impressions, AvgImpressionPosition: p.AvgPosition
    })) };
  } catch (e) {
    return { error: e.message };
  }
}

let _queryStatsCache = null;
async function getQueryStatsRaw() {
  if (_queryStatsCache) return _queryStatsCache;
  const encodedSite = encodeURIComponent(SITE_URL);
  const resp = await bingApiRequest(`GetQueryStats?siteUrl=${encodedSite}`);
  const rows = resp.data?.d || resp.data?.value || [];
  _queryStatsCache = Array.isArray(rows) ? rows : [];
  return _queryStatsCache;
}

async function getTopKeywords() {
  // GetQueryStats: per-query per-date stats, aggregate into top keywords
  try {
    const rows = await getQueryStatsRaw();
    const agg = aggregateByKey(rows, 'Query');
    return { keywords: agg.slice(0, 25).map(k => ({
      Query: k.key, Clicks: k.Clicks, Impressions: k.Impressions, AvgPosition: k.AvgPosition
    })) };
  } catch (e) {
    return { error: e.message, keywords: [] };
  }
}

async function getKeywordStats(keyword) {
  // Match target keyword against aggregated GetQueryStats data
  try {
    const rows = await getQueryStatsRaw();
    const agg = aggregateByKey(rows, 'Query');
    const match = agg.find(k => (k.key || '').toLowerCase() === keyword.toLowerCase());
    if (match) {
      return { Query: match.key, Clicks: match.Clicks, Impressions: match.Impressions, AvgPosition: match.AvgPosition };
    }
    return { error: 'not in Bing query data' };
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
  for (const kw of TARGET_KEYWORDS) {
    const stat = await getKeywordStats(kw);
    if (stat && !stat.error) {
      results.targetKeywordRanks[kw] = stat;
    } else {
      results.targetKeywordRanks[kw] = { error: stat?.error || 'no data' };
    }
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
      const impr = p.Impressions || 0;
      const pos = p.AvgImpressionPosition ?? '-';
      console.log(`  ${i + 1}. ${url} (${clicks} clicks, ${impr} impr, avg pos: ${pos})`);
    });
  } else {
    console.log('  No top pages data available');
  }

  console.log('\n=== BING TOP KEYWORDS ===');
  if (results.topKeywords.length > 0) {
    results.topKeywords.slice(0, 10).forEach((k, i) => {
      const query = k.Query || k.query || k.Keyword || 'unknown';
      const clicks = k.Clicks || k.clicks || 0;
      const impr = k.Impressions || 0;
      const pos = k.AvgPosition ?? '-';
      console.log(`  ${i + 1}. "${query}" (${clicks} clicks, ${impr} impr, avg pos: ${pos})`);
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
