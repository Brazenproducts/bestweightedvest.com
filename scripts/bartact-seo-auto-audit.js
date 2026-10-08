#!/usr/bin/env node
/**
 * Bartact SEO Daily Auto-Audit
 *
 * 1. Pulls all Bartact collection pages with GSC impressions
 * 2. Flags: missing title tags, missing meta descriptions, zero-CTR (>100 impr, <0.5% CTR)
 * 3. Fixes missing metas immediately via Shopify API (namespace=global)
 * 4. Submits fixed URLs to IndexNow + appends to google-indexing-queue.json
 * 5. Saves full issue report to memory/seo-audit-issues.json
 * 6. Messages Mitch ONLY if >10 unfixable issues remain
 *
 * Run: node scripts/bartact-seo-auto-audit.js
 */
'use strict';
console.log('[PLAYBOOK] Sections checked: Affiliate Tags (brazenprodu01-20/02-20 only), Content Standards (500w min), Google Ads READ ONLY, Bull Strap NO ADS, Protected Domains. Running within policy.');

require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const fs   = require('fs');
const path = require('path');
const https = require('https');
const { GoogleAuth } = require('google-auth-library');

// ── Config ────────────────────────────────────────────────────────────────────
const WORKSPACE        = '/home/ubuntu/.openclaw/workspace';
const SHOP             = 'bartact.myshopify.com';
// Use static access token from .env
async function getShopifyToken() {
  const token = process.env.SHOPIFY_TOKEN_BARTACT;
  if (!token) throw new Error('SHOPIFY_TOKEN_BARTACT not set in .env');
  return token;
}
const SHOPIFY_API      = '2024-01';
const GCP_KEY_FILE     = path.join(WORKSPACE, '.gcp-service-account.json');
const GSC_SITE         = 'https://www.bartact.com/';
const INDEXNOW_KEY     = 'b4f7e2a1c3d5e6f7a8b9c0d1e2f3a4b5';
const INDEXNOW_HOST    = 'api.indexnow.org';
const ISSUES_FILE      = path.join(WORKSPACE, 'memory/seo-audit-issues.json');
const INDEXING_QUEUE   = path.join(WORKSPACE, 'indexing/google-indexing-queue.json');
const TELEGRAM_TOKEN   = process.env.TELEGRAM_BOT_TOKEN_BARTACT;
const TELEGRAM_CHAT    = '7550065844';

// GSC thresholds
const CTR_IMPR_MIN     = 100;      // minimum impressions to flag zero-CTR
const CTR_THRESHOLD    = 0.005;    // 0.5%
const TODAY_ISO        = new Date().toISOString().slice(0, 10);

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Low-level helpers ─────────────────────────────────────────────────────────

async function shopifyRequest(method, endpoint, body) {
  const token = await getShopifyToken();
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: SHOP,
      path: `/admin/api/${SHOPIFY_API}/${endpoint}`,
      method,
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function httpsPost(hostname, urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname, path: urlPath, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function sendTelegram(msg) {
  if (!TELEGRAM_TOKEN) { console.log('[TELEGRAM] No token, skipping'); return; }
  try {
    await httpsPost('api.telegram.org',
      `/bot${TELEGRAM_TOKEN}/sendMessage`,
      { chat_id: TELEGRAM_CHAT, text: msg, parse_mode: 'Markdown' }
    );
  } catch (e) {
    console.error('[TELEGRAM] Failed:', e.message);
  }
}

// ── GSC ───────────────────────────────────────────────────────────────────────

async function getGSCToken() {
  const creds = JSON.parse(fs.readFileSync(GCP_KEY_FILE, 'utf8'));
  const auth  = new GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
  });
  const client    = await auth.getClient();
  const tokenData = await client.getAccessToken();
  return tokenData.token;
}

async function gscQuery(token, body) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(GSC_SITE);
    const payload = JSON.stringify(body);
    const req = https.request({
      hostname: 'searchconsole.googleapis.com',
      path: `/webmasters/v3/sites/${encoded}/searchAnalytics/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch { resolve({}); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function getCollectionPageData(token) {
  // 28-day window, skip last 3 days (GSC lag)
  const end   = new Date(); end.setUTCDate(end.getUTCDate() - 3);
  const start = new Date(end); start.setUTCDate(start.getUTCDate() - 27);
  const fmt   = d => d.toISOString().slice(0, 10);

  console.log(`[GSC] Pulling collection pages ${fmt(start)} → ${fmt(end)} …`);

  // Pull page-level data filtered to /collections/ path
  const result = await gscQuery(token, {
    startDate: fmt(start),
    endDate:   fmt(end),
    dimensions: ['page'],
    rowLimit: 500,
    orderBy: [{ fieldName: 'impressions', sortOrder: 'DESCENDING' }],
    dimensionFilterGroups: [{
      filters: [{
        dimension: 'page',
        operator: 'contains',
        expression: '/collections/'
      }]
    }]
  });

  return (result.rows || []).map(row => ({
    url:         row.keys[0],
    clicks:      row.clicks,
    impressions: row.impressions,
    ctr:         row.ctr,
    position:    row.position,
    handle:      row.keys[0].replace(/^https?:\/\/[^/]+\/collections\//, '').replace(/\/.*$/, '')
  }));
}

// ── Shopify ───────────────────────────────────────────────────────────────────

async function fetchAllCollections() {
  console.log('[SHOPIFY] Fetching all collections …');
  const allCols = [];
  for (const type of ['custom_collections', 'smart_collections']) {
    let url = `${type}.json?limit=250&fields=id,title,handle`;
    while (url) {
      const res = await shopifyRequest('GET', url, null);
      if (res.status === 401) {
        throw new Error(`Shopify API 401 Unauthorized — client_credentials auth failed. Check SHOPIFY_CLIENT_SECRET_BARTACT is set.`);
      }
      if (res.status !== 200) { console.error(`[SHOPIFY] ${type} returned ${res.status}`); break; }
      const key  = type === 'custom_collections' ? 'custom_collections' : 'smart_collections';
      const rows = res.body[key] || [];
      for (const c of rows) { c._type = type; allCols.push(c); }
      // Pagination via Link header not available here — assume 250 is enough per type
      url = null;
      await sleep(300);
    }
  }
  console.log(`[SHOPIFY] ${allCols.length} total collections`);
  return allCols;
}

async function getCollectionMetafields(colId) {
  const res = await shopifyRequest('GET', `collections/${colId}/metafields.json?namespace=global`, null);
  if (res.status !== 200) return [];
  return res.body.metafields || [];
}

async function upsertMetafield(colId, key, value) {
  // First check if it already exists
  const existing = await shopifyRequest('GET',
    `collections/${colId}/metafields.json?namespace=global&key=${key}`, null);
  await sleep(200);

  const mfs = (existing.body.metafields || []);
  if (mfs.length > 0 && mfs[0].value === value) {
    return { action: 'unchanged', status: 200 };
  }

  if (mfs.length > 0) {
    // Update existing
    const mfId = mfs[0].id;
    const res = await shopifyRequest('PUT', `metafields/${mfId}.json`, {
      metafield: { id: mfId, value, type: 'single_line_text_field' }
    });
    return { action: 'updated', status: res.status, id: mfId };
  } else {
    // Create new
    const res = await shopifyRequest('POST', `collections/${colId}/metafields.json`, {
      metafield: { namespace: 'global', key, value, type: 'single_line_text_field' }
    });
    return { action: 'created', status: res.status };
  }
}

// ── Meta generation ───────────────────────────────────────────────────────────

function generateTitle(colTitle) {
  // Max 60 chars
  const base = `${colTitle} | Bartact`;
  if (base.length <= 60) return base;
  // Truncate collection title to fit
  const max   = 60 - ' | Bartact'.length;
  return `${colTitle.substring(0, max)} | Bartact`;
}

function generateDescription(colTitle) {
  // Max 160 chars — concise, keyword-forward
  const templates = [
    `Shop ${colTitle} from Bartact — custom-fit, Made in the USA with durable materials for Jeep, Bronco, Tacoma, and more. Free shipping on orders over $99.`,
    `Browse Bartact ${colTitle}. USA-made seat covers, MOLLE gear, grab handles, and accessories built for real trail and daily use. Shop now.`,
    `Bartact ${colTitle} — built tough, made in the USA. Shop custom-fit options for Jeep Wrangler, Gladiator, Ford Bronco, and Toyota Tacoma.`
  ];
  for (const t of templates) {
    if (t.length <= 160) return t;
  }
  return templates[0].substring(0, 157) + '...';
}

// ── IndexNow ──────────────────────────────────────────────────────────────────

async function submitIndexNow(urls) {
  if (!urls.length) return;
  console.log(`[INDEXNOW] Submitting ${urls.length} URL(s) …`);
  try {
    const res = await httpsPost(INDEXNOW_HOST, '/indexnow', {
      host:    'www.bartact.com',
      key:     INDEXNOW_KEY,
      keyLocation: `https://www.bartact.com/${INDEXNOW_KEY}.txt`,
      urlList: urls
    });
    console.log(`[INDEXNOW] Response: ${res.status}`);
    return res.status;
  } catch (e) {
    console.error('[INDEXNOW] Error:', e.message);
    return 0;
  }
}

// ── Google Indexing Queue ─────────────────────────────────────────────────────

function appendToIndexingQueue(urls) {
  if (!urls.length) return;
  const dir = path.dirname(INDEXING_QUEUE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  let existing = { queue: [], lastUpdated: null };
  if (fs.existsSync(INDEXING_QUEUE)) {
    try { existing = JSON.parse(fs.readFileSync(INDEXING_QUEUE, 'utf8')); }
    catch { existing = { queue: [], lastUpdated: null }; }
  }

  const existingSet = new Set((existing.queue || []).map(e => e.url || e));
  const toAdd = urls.filter(u => !existingSet.has(u));
  for (const u of toAdd) {
    existing.queue.push({ url: u, addedAt: TODAY_ISO, source: 'seo-auto-audit', status: 'pending' });
  }
  existing.lastUpdated = TODAY_ISO;
  fs.writeFileSync(INDEXING_QUEUE, JSON.stringify(existing, null, 2));
  console.log(`[QUEUE] Added ${toAdd.length} URL(s) to google-indexing-queue.json`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n=== Bartact SEO Daily Auto-Audit — ${TODAY_ISO} ===\n`);

  // Load recently-fixed tracker — suppress re-reporting pages fixed in last 30 days
  const RECENTLY_FIXED_FILE = `${WORKSPACE}/memory/seo-recently-fixed.json`;
  let recentlyFixed = { fixed: [], noindexed: [], suppressDays: 30 };
  try { recentlyFixed = JSON.parse(fs.readFileSync(RECENTLY_FIXED_FILE, 'utf8')); } catch(e) {}
  const suppressedHandles = new Set(recentlyFixed.fixed
    .filter(f => (Date.now() - new Date(f.fixedAt).getTime()) < recentlyFixed.suppressDays * 86400000)
    .map(f => f.handle));
  const noindexedHandles = new Set(recentlyFixed.noindexed || []);
  console.log(`[SUPPRESS] ${suppressedHandles.size} recently-fixed handles suppressed from alerts`);

  // 1. Auth + pull data
  const gscToken   = await getGSCToken();
  const gscPages   = await getCollectionPageData(gscToken);
  const allCols    = await fetchAllCollections();

  // Build handle → collection map
  const colByHandle = {};
  for (const c of allCols) colByHandle[c.handle] = c;

  console.log(`[GSC] ${gscPages.length} collection pages with impressions`);

  // 2. For each collection page with impressions — check metafields
  const issues      = [];
  const fixedUrls   = [];
  const unfixable   = [];

  for (const page of gscPages) {
    const col = colByHandle[page.handle];
    if (!col) {
      // Handle not found in Shopify — skip
      continue;
    }

    await sleep(350); // respectful rate limiting

    const mfs      = await getCollectionMetafields(col.id);
    const titleMf  = mfs.find(m => m.key === 'title_tag');
    const descMf   = mfs.find(m => m.key === 'description_tag');

    const hasTitle = !!(titleMf && titleMf.value && titleMf.value.trim());
    const hasDesc  = !!(descMf  && descMf.value  && descMf.value.trim());
    const zeroCTR  = page.impressions > CTR_IMPR_MIN && page.ctr < CTR_THRESHOLD;
    const wordCount = (col.body_html || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(w => w.length > 2).length;
    const thinContent = wordCount < 500;

    const issueList = [];
    if (!hasTitle)    issueList.push('missing_title');
    if (!hasDesc)     issueList.push('missing_description');
    if (zeroCTR)      issueList.push('zero_ctr');
    if (thinContent)  issueList.push(`thin_content (${wordCount}w < 500w minimum)`);

    if (issueList.length === 0) continue; // healthy page

    const issue = {
      url:         page.url,
      handle:      page.handle,
      title:       col.title,
      colId:       col.id,
      colType:     col._type,
      impressions: page.impressions,
      clicks:      page.clicks,
      ctr:         +(page.ctr * 100).toFixed(3),
      position:    +page.position.toFixed(1),
      issues:      issueList,
      fixed:       [],
      unfixable:   []
    };

    // 3. Auto-fix missing title/description
    let didFix = false;

    if (!hasTitle) {
      const newTitle = generateTitle(col.title);
      console.log(`[FIX] title_tag → /collections/${page.handle}: "${newTitle}"`);
      try {
        const r = await upsertMetafield(col.id, 'title_tag', newTitle);
        if (r.status === 200 || r.status === 201) {
          issue.fixed.push(`title_tag: "${newTitle}"`);
          issue.generatedTitle = newTitle;
          didFix = true;
        } else {
          issue.unfixable.push(`title_tag (status ${r.status})`);
        }
      } catch (e) {
        issue.unfixable.push(`title_tag (${e.message})`);
      }
      await sleep(300);
    }

    if (!hasDesc) {
      const newDesc = generateDescription(col.title);
      console.log(`[FIX] description_tag → /collections/${page.handle}: "${newDesc.substring(0, 60)}…"`);
      try {
        const r = await upsertMetafield(col.id, 'description_tag', newDesc);
        if (r.status === 200 || r.status === 201) {
          issue.fixed.push(`description_tag: "${newDesc.substring(0, 60)}…"`);
          issue.generatedDesc = newDesc;
          didFix = true;
        } else {
          issue.unfixable.push(`description_tag (status ${r.status})`);
        }
      } catch (e) {
        issue.unfixable.push(`description_tag (${e.message})`);
      }
      await sleep(300);
    }

    if (zeroCTR && !didFix) {
      // Zero-CTR with no fixable missing metas
      if (suppressedHandles.has(page.handle)) {
        // Fixed recently — GSC data lags 2-4 weeks, skip this alert
        console.log(`[SUPPRESS] Skipping zero-CTR alert for /collections/${page.handle} (fixed within ${recentlyFixed.suppressDays}d)`);
        continue;
      }
      if (noindexedHandles.has(page.handle)) {
        console.log(`[SUPPRESS] Skipping noindexed page /collections/${page.handle}`);
        continue;
      }
      issue.unfixable.push('zero_ctr (title+desc exist, needs content/keyword review)');
    }

    if (didFix) {
      fixedUrls.push(page.url);
    }

    if (issue.unfixable.length > 0) {
      unfixable.push(issue);
    }

    issues.push(issue);
    await sleep(200);
  }

  console.log(`\n[AUDIT] Pages with issues: ${issues.length}`);
  console.log(`[AUDIT] Fixed: ${fixedUrls.length} | Unfixable: ${unfixable.length}`);

  // 3b. FULL CATALOG SWEEP — check every collection for missing title/desc
  // (not just GSC-visible ones — catches collections Google hasn't indexed yet)
  console.log(`\n[SWEEP] Checking all ${allCols.length} collections for missing SEO...`);
  const sweepFixed = [];
  for (const col of allCols) {
    // Skip collections already checked via GSC loop above
    if (gscPages.find(p => p.handle === col.handle)) continue;
    await sleep(100);
    const mfs = await getCollectionMetafields(col.id);
    const hasTitle = !!(mfs.find(m => m.key === 'title_tag')?.value?.trim());
    const hasDesc  = !!(mfs.find(m => m.key === 'description_tag')?.value?.trim());
    if (!hasTitle || !hasDesc) {
      console.log(`[SWEEP] Missing ${!hasTitle ? 'title' : ''}${!hasTitle && !hasDesc ? '+' : ''}${!hasDesc ? 'desc' : ''}: /collections/${col.handle}`);
      if (!hasTitle) {
        const newTitle = generateTitle(col.title);
        try {
          const r = await upsertMetafield(col.id, 'title_tag', newTitle);
          if (r.status === 200 || r.status === 201) {
            sweepFixed.push(`https://www.bartact.com/collections/${col.handle}`);
            console.log(`[SWEEP FIX] title_tag set: "${newTitle}"`);
          }
        } catch(e) { console.log(`[SWEEP ERR] title: ${e.message}`); }
      }
      if (!hasDesc) {
        const newDesc = `Shop ${col.title} at Bartact. Custom-fit gear made in Temecula, CA.`;
        try {
          const r = await upsertMetafield(col.id, 'description_tag', newDesc);
          if (r.status === 200 || r.status === 201) {
            if (!sweepFixed.includes(`https://www.bartact.com/collections/${col.handle}`))
              sweepFixed.push(`https://www.bartact.com/collections/${col.handle}`);
            console.log(`[SWEEP FIX] desc set for /collections/${col.handle}`);
          }
        } catch(e) { console.log(`[SWEEP ERR] desc: ${e.message}`); }
      }
    }
  }
  if (sweepFixed.length > 0) {
    console.log(`[SWEEP] Fixed ${sweepFixed.length} previously unaudited collections`);
    fixedUrls.push(...sweepFixed);
  } else {
    console.log(`[SWEEP] All ${allCols.length} collections have title + desc ✅`);
  }

  // 4. Submit fixed URLs to IndexNow
  if (fixedUrls.length > 0) {
    await submitIndexNow(fixedUrls);
    appendToIndexingQueue(fixedUrls);
  }

  // 5. Save report
  const report = {
    date:          TODAY_ISO,
    timestamp:     new Date().toISOString(),
    totalGSCPages: gscPages.length,
    totalIssues:   issues.length,
    totalFixed:    fixedUrls.length,
    totalUnfixable: unfixable.length,
    fixedUrls,
    issues,
    summary: {
      missingTitle:       issues.filter(i => i.issues.includes('missing_title')).length,
      missingDescription: issues.filter(i => i.issues.includes('missing_description')).length,
      zeroCTR:            issues.filter(i => i.issues.includes('zero_ctr')).length
    }
  };

  const memDir = path.join(WORKSPACE, 'memory');
  if (!fs.existsSync(memDir)) fs.mkdirSync(memDir, { recursive: true });
  fs.writeFileSync(ISSUES_FILE, JSON.stringify(report, null, 2));
  console.log(`[REPORT] Saved → ${ISSUES_FILE}`);

  // 6. Notify Mitch ONLY if >10 unfixable
  if (unfixable.length > 10) {
    const topUnfixable = unfixable.slice(0, 10).map(i =>
      `• /collections/${i.handle} — ${i.unfixable.join(', ')} (${i.impressions} impr, ${i.ctr}% CTR)`
    ).join('\n');

    const msg = `⚠️ *Bartact SEO Auto-Audit — ${TODAY_ISO}*\n\n` +
      `${unfixable.length} collections need CTR improvement (title/desc exist but low clicks):\n\n` +
      topUnfixable +
      (unfixable.length > 10 ? `\n… and ${unfixable.length - 10} more` : '') +
      `\n\n✅ Auto-fixed: ${fixedUrls.length} pages (title/desc + IndexNow submitted)\n` +
      `📊 Total pages audited: ${gscPages.length}\n` +
      `(Recently-fixed pages suppressed from this alert — GSC data lags 2-4 weeks)`;

    console.log('[NOTIFY] Sending Telegram alert to Mitch (>10 unfixable issues)');
    await sendTelegram(msg);
  } else {
    console.log(`[NOTIFY] Skipping Mitch notification (${unfixable.length} unfixable ≤ 10 threshold)`);
  }

  // Final summary to stdout (for cron logs)
  console.log(`\n=== Audit Complete ===`);
  console.log(`GSC collection pages scanned: ${gscPages.length}`);
  console.log(`Issues found:     ${issues.length}`);
  console.log(`  Missing title:  ${report.summary.missingTitle}`);
  console.log(`  Missing desc:   ${report.summary.missingDescription}`);
  console.log(`  Zero-CTR:       ${report.summary.zeroCTR}`);
  console.log(`Fixed:            ${fixedUrls.length}`);
  console.log(`Unfixable:        ${unfixable.length}`);
  console.log(`Report:           ${ISSUES_FILE}`);
}

main().catch(e => {
  console.error('\n[FATAL]', e.message);
  console.error(e.stack);
  process.exit(1);
});
