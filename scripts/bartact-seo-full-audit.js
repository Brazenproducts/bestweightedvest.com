/**
 * Bartact Full SEO Audit
 * - Pulls top 50 GSC keywords + ranking pages
 * - Audits each ranking page: title, meta desc, H1, word count, images, alt text
 * - Audits all collections and products for missing/thin content
 * - Checks Bing ranking for top 10 keywords
 * - Saves full report to memory/seo-full-audit-YYYY-MM-DD.md
 * - Sends summary to Mitch via Telegram
 * READ ONLY — no changes made
 */
'use strict';

require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const fs = require('fs');
const { GoogleAuth } = require('google-auth-library');

const WORKSPACE = '/home/ubuntu/.openclaw/workspace';
const TODAY = new Date().toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
const REPORT_FILE = `${WORKSPACE}/memory/seo-full-audit-${new Date().toISOString().slice(0,10)}.md`;

async function fetchPage(url, timeoutMs = 12000) {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    const r = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BartactSEO/1.0)' } });
    clearTimeout(id);
    return { status: r.status, body: await r.text(), url };
  } catch (e) {
    return { status: 0, body: '', url, error: e.message };
  }
}

function extractMeta(html) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const h2Matches = [...html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/gi)].map(m => m[1].trim());
  const bodyText = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ').trim();
  const wordCount = bodyText.split(' ').filter(w => w.length > 2).length;
  const imgMatches = [...html.matchAll(/<img[^>]+>/gi)];
  const imgsNoAlt = imgMatches.filter(m => !m[0].includes('alt=') || /alt=["']\s*["']/.test(m[0])).length;
  const canonical = (html.match(/rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) || html.match(/href=["']([^"']+)["'][^>]+rel=["']canonical["']/i) || [])[1] || '';

  return {
    title: titleMatch ? titleMatch[1].trim() : '',
    titleLen: titleMatch ? titleMatch[1].trim().length : 0,
    metaDesc: metaDescMatch ? metaDescMatch[1].trim() : '',
    metaDescLen: metaDescMatch ? metaDescMatch[1].trim().length : 0,
    h1: h1Match ? h1Match[1].trim() : '',
    h2Count: h2Matches.length,
    wordCount,
    imgCount: imgMatches.length,
    imgsNoAlt,
    canonical
  };
}

async function getGSCData(token) {
  const end = new Date(); end.setUTCDate(end.getUTCDate() - 3);
  const start = new Date(end); start.setUTCDate(start.getUTCDate() - 14);
  const fmt = d => d.toISOString().split('T')[0];

  const [kwRes, pageRes] = await Promise.all([
    fetch('https://searchconsole.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fwww.bartact.com%2F/searchAnalytics/query', {
      method: 'POST',
      headers: { 'Authorization': '***' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: fmt(start), endDate: fmt(end), dimensions: ['query'], rowLimit: 50, orderBy: [{ fieldName: 'impressions', sortOrder: 'DESCENDING' }] })
    }),
    fetch('https://searchconsole.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fwww.bartact.com%2F/searchAnalytics/query', {
      method: 'POST',
      headers: { 'Authorization': '***' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: fmt(start), endDate: fmt(end), dimensions: ['page', 'query'], rowLimit: 100, orderBy: [{ fieldName: 'impressions', sortOrder: 'DESCENDING' }] })
    })
  ]);

  const kwData = (await kwRes.json()).rows || [];
  const pageData = (await pageRes.json()).rows || [];

  // Map top keyword → top URL for it
  const kwToUrl = {};
  pageData.forEach(row => {
    const kw = row.keys[1];
    const url = row.keys[0];
    if (!kwToUrl[kw] || row.impressions > kwToUrl[kw].impressions) {
      kwToUrl[kw] = { url, position: row.position, impressions: row.impressions };
    }
  });

  return { keywords: kwData, kwToUrl, period: `${fmt(start)} to ${fmt(end)}` };
}

async function getShopifyData(token) {
  async function fetchAll(endpoint) {
    let items = [], url = endpoint;
    while (url) {
      const r = await fetch(url, { headers: { 'X-Shopify-Access-Token': token } });
      const j = await r.json();
      const key = Object.keys(j).find(k => Array.isArray(j[k]));
      if (key) items = items.concat(j[key]);
      const link = r.headers.get('link') || '';
      const next = link.match(/<([^>]+)>;\s*rel="next"/);
      url = next ? next[1] : null;
      await new Promise(r => setTimeout(r, 200));
    }
    return items;
  }

  async function getMetafields(type, id) {
    const r = await fetch(`https://bartact.myshopify.com/admin/api/2024-01/${type}/${id}/metafields.json`, {
      headers: { 'X-Shopify-Access-Token': token }
    });
    return (await r.json()).metafields || [];
  }

  const [customCols, smartCols, products] = await Promise.all([
    fetchAll('https://bartact.myshopify.com/admin/api/2024-01/custom_collections.json?limit=250&fields=id,title,handle,body_html'),
    fetchAll('https://bartact.myshopify.com/admin/api/2024-01/smart_collections.json?limit=250&fields=id,title,handle,body_html'),
    fetchAll('https://bartact.myshopify.com/admin/api/2024-01/products.json?limit=250&status=active&fields=id,title,handle,body_html,images,product_type')
  ]);

  const allCols = [...customCols, ...smartCols];

  // Check metafields for a sample of top collections
  const topColHandles = ['seat-covers', 'jeep-wrangler-seat-covers', 'ford-bronco-accessories-2021-2022-2023',
    'jeep-gladiator-seat-covers-accessories-2019', 'grab-handles-for-jeep-wrangler-gladiator-ford-bronco-utvs-buggies-rails',
    'molle-accessories', 'toyota-tacoma-seat-covers', 'wrangliator-door-storage-bags'];

  const colMetaIssues = [];
  for (const handle of topColHandles) {
    const col = allCols.find(c => c.handle === handle);
    if (!col) continue;
    const mfs = await getMetafields('collections', col.id);
    const hasTitle = mfs.some(m => m.namespace === 'global' && m.key === 'title_tag' && m.value);
    const hasDesc = mfs.some(m => m.namespace === 'global' && m.key === 'description_tag' && m.value);
    const titleMf = mfs.find(m => m.namespace === 'global' && m.key === 'title_tag');
    const descMf = mfs.find(m => m.namespace === 'global' && m.key === 'description_tag');
    if (!hasTitle || !hasDesc || (titleMf && titleMf.value.length > 60) || (descMf && descMf.value.length > 160)) {
      colMetaIssues.push({
        handle,
        title: col.title,
        hasTitle,
        hasDesc,
        titleLen: titleMf ? titleMf.value.length : 0,
        descLen: descMf ? descMf.value.length : 0,
        titleVal: titleMf ? titleMf.value : ''
      });
    }
    await new Promise(r => setTimeout(r, 300));
  }

  // Collections analysis
  const colIssues = allCols.map(c => {
    const words = (c.body_html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(w => w.length > 2).length;
    return { handle: c.handle, title: c.title, words };
  }).filter(c => c.words < 500);

  // Products analysis
  const prodIssues = products.map(p => {
    const words = (p.body_html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(w => w.length > 2).length;
    const noImages = !p.images || p.images.length === 0;
    const noAlt = p.images && p.images.some(i => !i.alt || i.alt.trim() === '');
    return { handle: p.handle, title: p.title, words, noImages, noAlt, imgCount: p.images ? p.images.length : 0 };
  }).filter(p => p.words < 100 || p.noImages || p.noAlt);

  return { allCols, products, colIssues, prodIssues, colMetaIssues };
}

async function checkBingRankings(keywords) {
  const results = [];
  for (const kw of keywords.slice(0, 10)) {
    try {
      const searchUrl = 'https://www.bing.com/search?q=' + encodeURIComponent(kw) + '&count=20';
      const r = await fetchPage(searchUrl);
      const html = r.body;
      // Find bartact.com in results
      const links = [...html.matchAll(/href="(https?:\/\/(?:www\.)?bartact\.com[^"]*?)"/gi)];
      const bartactLinks = links.filter(l => !l[1].includes('bing.com'));
      // Estimate position by counting result blocks before bartact
      const allResults = [...html.matchAll(/li[^>]+class="[^"]*b_algo[^"]*"/gi)];
      let position = null;
      for (let i = 0; i < allResults.length; i++) {
        if (allResults[i][0] && html.indexOf('bartact.com', html.indexOf(allResults[i][0])) > 0) {
          position = i + 1;
          break;
        }
      }
      results.push({ kw, found: bartactLinks.length > 0, position, url: bartactLinks[0] ? bartactLinks[0][1] : null });
    } catch (e) {
      results.push({ kw, found: false, position: null, error: e.message });
    }
    await new Promise(r => setTimeout(r, 1500));
  }
  return results;
}

async function main() {
  console.log('Starting Bartact Full SEO Audit...\n');
  const lines = [`# Bartact Full SEO Audit — ${TODAY}\n`];

  // Auth
  const gscKey = JSON.parse(fs.readFileSync(`${WORKSPACE}/.gcp-service-account.json`));
  const auth = new GoogleAuth({ credentials: gscKey, scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });
  const gscClient = await auth.getClient();
  const gscTokenData = await gscClient.getAccessToken();
  const gscToken = gscTokenData.token;

  const tokR = await fetch('https://bartact.myshopify.com/admin/oauth/access_token', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: '78fd9505a467f0795d035e5f4a6dfb06', client_secret: process.env.SHOPIFY_CLIENT_SECRET_BARTACT, grant_type: 'client_credentials' })
  });
  const shopToken = (await tokR.json()).access_token;

  // 1. GSC Data
  console.log('Pulling GSC data...');
  const gscData = await getGSCData(gscToken);
  lines.push(`## GSC Top 50 Keywords (${gscData.period})\n`);
  gscData.keywords.forEach((row, i) => {
    lines.push(`${i+1}. #${row.position.toFixed(1)} | ${row.impressions} impr | ${row.clicks} clk | ${row.keys[0]}`);
  });
  lines.push('');

  // 2. Audit top 20 ranking pages
  console.log('Auditing ranking pages...');
  const auditedUrls = new Set();
  const pageIssues = [];
  lines.push('## Ranking Page Audits\n');

  for (const kwRow of gscData.keywords.slice(0, 30)) {
    const kw = kwRow.keys[0];
    const urlData = gscData.kwToUrl[kw];
    if (!urlData || auditedUrls.has(urlData.url)) continue;
    auditedUrls.add(urlData.url);

    const page = await fetchPage(urlData.url);
    if (page.status !== 200) {
      lines.push(`- ❌ ${urlData.url} returned ${page.status}`);
      continue;
    }

    const meta = extractMeta(page.body);
    const issues = [];
    if (!meta.title) issues.push('NO TITLE TAG');
    else if (meta.titleLen > 60) issues.push(`Title too long: ${meta.titleLen} chars`);
    if (!meta.metaDesc) issues.push('NO META DESC');
    else if (meta.metaDescLen > 160) issues.push(`Meta desc too long: ${meta.metaDescLen} chars`);
    if (!meta.h1) issues.push('NO H1');
    if (meta.wordCount < 300) issues.push(`Thin content: ${meta.wordCount} words`);
    if (meta.imgsNoAlt > 0) issues.push(`${meta.imgsNoAlt} images missing alt text`);

    const shortUrl = urlData.url.replace('https://www.bartact.com', '');
    const status = issues.length === 0 ? '✅' : '⚠️';
    lines.push(`${status} ${shortUrl}`);
    lines.push(`   Keyword: "${kw}" | Position: #${urlData.position.toFixed(1)}`);
    lines.push(`   Title (${meta.titleLen}ch): ${meta.title || 'MISSING'}`);
    lines.push(`   Meta desc (${meta.metaDescLen}ch): ${meta.metaDesc ? meta.metaDesc.substring(0, 80) + '...' : 'MISSING'}`);
    lines.push(`   H1: ${meta.h1 || 'MISSING'} | H2s: ${meta.h2Count} | Words: ${meta.wordCount} | Images: ${meta.imgCount} (${meta.imgsNoAlt} no alt)`);
    if (issues.length > 0) {
      lines.push(`   Issues: ${issues.join(' | ')}`);
      pageIssues.push({ url: shortUrl, kw, issues });
    }
    lines.push('');
    await new Promise(r => setTimeout(r, 500));
  }

  // 3. Shopify audit
  console.log('Auditing Shopify collections and products...');
  const shopData = await getShopifyData(shopToken);
  lines.push('## Shopify Collections — Thin Content (<200 words)\n');
  shopData.colIssues.slice(0, 20).forEach(c => {
    lines.push(`- ${c.words}w | /collections/${c.handle} — ${c.title}`);
  });
  if (shopData.colIssues.length > 20) lines.push(`... and ${shopData.colIssues.length - 20} more`);

  lines.push('\n## Top Collection Meta Audits (key pages)\n');
  if (shopData.colMetaIssues.length === 0) {
    lines.push('- ✅ All key collections have proper title and meta tags');
  } else {
    shopData.colMetaIssues.forEach(c => {
      const problems = [];
      if (!c.hasTitle) problems.push('NO title tag');
      if (!c.hasDesc) problems.push('NO meta desc');
      if (c.titleLen > 60) problems.push(`Title ${c.titleLen}ch (over 60)`);
      if (c.descLen > 160) problems.push(`Desc ${c.descLen}ch (over 160)`);
      lines.push(`- ⚠️ /collections/${c.handle}: ${problems.join(' | ')}`);
      if (c.titleVal) lines.push(`  Title: ${c.titleVal}`);
    });
  }

  lines.push('\n## Products with Issues\n');
  const noImgProds = shopData.prodIssues.filter(p => p.noImages);
  const noAltProds = shopData.prodIssues.filter(p => p.noAlt && !p.noImages);
  const thinProds = shopData.prodIssues.filter(p => p.words < 100 && !p.noImages);
  lines.push(`- Products with NO images: ${noImgProds.length}`);
  noImgProds.forEach(p => lines.push(`  - ${p.title.substring(0, 60)}`));
  lines.push(`- Products with images missing alt text: ${noAltProds.length}`);
  noAltProds.slice(0, 10).forEach(p => lines.push(`  - ${p.title.substring(0, 60)} (${p.imgCount} images)`));
  lines.push(`- Products with thin description (<100 words): ${thinProds.length}`);
  thinProds.slice(0, 10).forEach(p => lines.push(`  - ${p.words}w | ${p.title.substring(0, 60)}`));

  // 4. Bing check
  console.log('Checking Bing rankings...');
  const topKws = gscData.keywords.slice(0, 10).map(r => r.keys[0]);
  const bingResults = await checkBingRankings(topKws);
  lines.push('\n## Bing Rankings (top 10 keywords)\n');
  bingResults.forEach(b => {
    const status = b.found ? '✅' : '❌';
    lines.push(`${status} ${b.kw}: ${b.found ? 'Found' + (b.position ? ' ~pos #' + b.position : '') : 'NOT FOUND on Bing page 1'}`);
  });

  // Save report
  fs.writeFileSync(REPORT_FILE, lines.join('\n'));
  console.log('\nReport saved to: ' + REPORT_FILE);

  // Summary stats
  const totalPagesAudited = auditedUrls.size;
  const pagesWithIssues = pageIssues.length;
  const thinPages = pageIssues.filter(p => p.issues.some(i => i.includes('Thin'))).length;
  const missingMeta = pageIssues.filter(p => p.issues.some(i => i.includes('TITLE') || i.includes('META'))).length;
  const altIssues = pageIssues.filter(p => p.issues.some(i => i.includes('alt'))).length;
  const thinCols = shopData.colIssues.length;
  const bingNotFound = bingResults.filter(b => !b.found).length;

  // Top 3 most urgent
  const urgent = [];
  if (thinCols > 5) urgent.push(`${thinCols} collections have thin content (<200 words) — Google needs more text to rank these`);
  if (noAltProds.length > 50) urgent.push(`${noAltProds.length} products have images missing alt text — hurts image SEO on Google, Bing, and Yandex`);
  if (bingNotFound > 0) urgent.push(`${bingNotFound} of your top 10 keywords don't show Bartact on Bing page 1`);
  if (thinPages > 0) urgent.push(`${thinPages} ranking pages have thin content under 300 words`);

  // Send Telegram summary
  const msg = `📊 Bartact Full SEO Audit — ${TODAY}

Pages audited: ${totalPagesAudited}
Pages with issues: ${pagesWithIssues}
Missing/broken meta tags: ${missingMeta}
Thin content pages (<300 words): ${thinPages}
Collections with thin content: ${thinCols}
Products with missing alt text: ${noAltProds.length}
Keywords not found on Bing page 1: ${bingNotFound}/10

Top issues to fix:
${urgent.slice(0, 3).map((u, i) => `${i+1}. ${u}`).join('\n')}

Full report saved. Ask me for details on any specific page or keyword.`;

  const tgR = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN_BARTACT}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: '7550065844', text: msg })
  });
  console.log('Telegram:', (await tgR.json()).ok ? 'sent' : 'failed');
  console.log('\nAudit complete.');
}

main().catch(e => console.error('FATAL:', e.message));
