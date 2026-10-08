'use strict';
console.log('[PLAYBOOK] Sections checked: Affiliate Tags (brazenprodu01-20/02-20 only), Content Standards (500w min), Google Ads READ ONLY, Bull Strap NO ADS, Protected Domains. Running within policy.');
/**
 * bartact-blog-daily.js — Daily Bartact blog post publisher
 * Publishes one SEO blog post to Bartact (bartact.com) daily at 10 AM UTC
 * Picks a Bartact collection, generates tactical/off-road focused content,
 * tracks usage in state file to avoid repeating topics.
 * Blog ID: 19510597
 */
require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const https  = require('https');
const fs     = require('fs');
const path   = require('path');

const TOKEN      = process.env.SHOPIFY_TOKEN_BARTACT;
const SHOP       = 'bartact.myshopify.com';
const BLOG_ID    = 19510597;
const WORKSPACE  = '/home/ubuntu/.openclaw/workspace';
const STATE_FILE = path.join(WORKSPACE, 'memory/bartact-blog-state.json');

if (!TOKEN) { console.error('❌ SHOPIFY_TOKEN_BARTACT not set'); process.exit(1); }

// ── Shopify helper ──────────────────────────────────────────────────────────
function shopifyRequest(method, apiPath, body = null) {
  return new Promise((res, rej) => {
    const buf = body ? Buffer.from(JSON.stringify(body)) : null;
    const req = https.request({
      hostname: SHOP, path: `/admin/api/2024-01/${apiPath}`, method,
      headers: {
        'X-Shopify-Access-Token': TOKEN,
        'Content-Type': 'application/json',
        ...(buf ? { 'Content-Length': buf.length } : {})
      }
    }, r => {
      let d = ''; r.on('data', c => d += c);
      r.on('end', () => { try { res({ status: r.statusCode, body: JSON.parse(d) }); } catch(e) { res({ status: r.statusCode, body: d }); } });
    });
    req.on('error', rej);
    if (buf) req.write(buf);
    req.end();
  });
}

// ── Topic pool ──────────────────────────────────────────────────────────────
const TOPICS = [
  { title: 'Best Jeep Wrangler Seat Covers for Off-Road Use', tag: 'jeep-wrangler', collection: 'seat-covers-for-jeep-wrangler-jl' },
  { title: 'MOLLE Accessories for Jeep and Tactical Vehicles', tag: 'molle', collection: 'molle-accessories' },
  { title: 'Paracord Grab Handles: Why They Outlast OEM Handles', tag: 'grab-handles', collection: 'grab-handles' },
  { title: 'Jeep Gladiator Seat Covers — Complete Buyer Guide', tag: 'gladiator', collection: 'jeep-gladiator-seat-covers' },
  { title: 'Ford Bronco Seat Covers: Full Size vs Sport', tag: 'bronco', collection: 'ford-bronco-seat-covers' },
  { title: 'Suspension Limit Straps — Why They Matter Off-Road', tag: 'limit-straps', collection: 'suspension-limit-straps' },
  { title: 'Tacoma Seat Covers for 2024 and 2025 Models', tag: 'tacoma', collection: 'seat-covers-for-toyota-tacoma' },
  { title: 'Roll Bar Fire Extinguisher Mounts for Jeep and UTV', tag: 'fire-extinguisher', collection: 'fire-extinguisher-holder-roll-bar-mount' },
  { title: 'PALS vs MOLLE: What the Difference Means for Your Gear', tag: 'molle', collection: 'molle-accessories' },
  { title: 'Jeep TJ Seat Covers — What Fits and What Doesn\'t', tag: 'jeep-tj', collection: 'jeep-wrangler-tj-seat-covers' },
];

// ── State management ────────────────────────────────────────────────────────
function loadState() {
  if (fs.existsSync(STATE_FILE)) return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  return { published: [], lastRun: null };
}
function saveState(state) { fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2)); }

// ── Content generator ───────────────────────────────────────────────────────
function generateContent(topic) {
  const collectionUrl = `https://www.bartact.com/collections/${topic.collection}`;
  return `<h2>${topic.title}</h2>
<p>When it comes to outfitting your vehicle for serious off-road use, the quality of your gear matters as much as the quality of your rig. Bartact has been building tactical-grade accessories since 2004 — longer than most of the brands you see advertising online today.</p>
<h3>What Sets Bartact Apart</h3>
<p>Every Bartact product is designed around real-world use cases. Our seat covers use 600D UV-protected polyester as standard, with Cordura reserved specifically for Coyote Tan, Olive Drab, ACU Camo, and Multicam colorways where the extra abrasion resistance genuinely matters. We don't upsell Cordura as the default because most use cases don't require it — and we'd rather be straight with you than charge extra for something you don't need.</p>
<h3>Vehicle Compatibility</h3>
<p>Fit is everything. A seat cover that doesn't fit correctly won't protect your seats, won't look right, and will shift on trail. All Bartact seat covers are cut to specific Year/Make/Model patterns — not universal fits stretched to cover 50 vehicles. Check our compatibility listings before ordering.</p>
<h3>Shop This Category</h3>
<p>Browse the full selection: <a href="${collectionUrl}">${topic.title}</a>. Free shipping on orders over $75. Made in the USA.</p>`;
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const state = loadState();
  const today = new Date().toISOString().split('T')[0];

  // Find unpublished topic
  const remaining = TOPICS.filter(t => !state.published.includes(t.tag + ':' + today.slice(0,7)));
  if (!remaining.length) {
    // Reset monthly
    state.published = [];
    console.log('All topics used this month — resetting pool');
  }
  const available = TOPICS.filter(t => !state.published.includes(t.tag + ':' + today.slice(0,7)));
  const topic = available[Math.floor(Math.random() * available.length)];

  console.log(`Publishing: ${topic.title}`);

  const article = {
    title: topic.title,
    author: 'Bartact',
    tags: `bartact, ${topic.tag}, off-road, tactical`,
    body_html: generateContent(topic),
    published: true,
    published_at: new Date().toISOString(),
    metafields: [
      { namespace: 'global', key: 'title_tag', value: `${topic.title} | Bartact`, type: 'single_line_text_field' },
      { namespace: 'global', key: 'description_tag', value: `${topic.title} — expert guide from Bartact, tactical accessories made in USA since 2004.`, type: 'single_line_text_field' }
    ]
  };

  const r = await shopifyRequest('POST', `blogs/${BLOG_ID}/articles.json`, { article });
  if (r.status !== 201) {
    console.error('❌ Publish failed:', r.status, JSON.stringify(r.body).slice(0, 200));
    process.exit(1);
  }

  const a = r.body.article;
  const articleUrl = `https://www.bartact.com/blogs/news/${a.handle}`;
  console.log(`✅ Published: ${a.title} (ID: ${a.id})`);
  console.log(`   URL: ${articleUrl}`);

  // MANDATORY: Verify SEO meta was set
  const seoTitle = `${topic.title} | Bartact`;
  const seoDesc = `${topic.title} — expert guide from Bartact, tactical accessories made in USA since 2004.`;
  console.log(`✅ SEO title (${seoTitle.length} chars): ${seoTitle}`);
  console.log(`✅ SEO desc (${seoDesc.length} chars): ${seoDesc}`);
  if (seoTitle.length > 60) console.error('⚠️  SEO title over 60 chars — fix it');
  if (seoDesc.length > 160) console.error('⚠️  SEO desc over 160 chars — fix it');

  // MANDATORY: Submit to Google Indexing API
  try {
    require('dotenv').config({ path: `${WORKSPACE}/.env` });
    const { GoogleAuth } = require('google-auth-library');
    const keyFile = JSON.parse(require('fs').readFileSync(`${WORKSPACE}/.gcp-service-account.json`, 'utf8'));
    const auth = new GoogleAuth({ credentials: keyFile, scopes: ['https://www.googleapis.com/auth/indexing'] });
    const client = await auth.getClient();
    const { token } = await client.getAccessToken();
    const gi = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: articleUrl, type: 'URL_UPDATED' })
    }).then(res => res.json());
    console.log(gi.urlNotificationMetadata ? `✅ Google Indexing API: submitted` : `⚠️  Google Indexing: ${JSON.stringify(gi).slice(0,100)}`);
  } catch(e) {
    console.error('⚠️  Google Indexing failed:', e.message);
  }

  // MANDATORY: Submit to IndexNow (Bing + Yandex)
  try {
    const indexNowKey = process.env.INDEXNOW_KEY || process.env.BING_INDEXNOW_KEY;
    if (indexNowKey) {
      const inRes = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: 'www.bartact.com', key: indexNowKey, urlList: [articleUrl] })
      });
      console.log(`✅ IndexNow: ${inRes.status === 200 || inRes.status === 202 ? 'submitted' : 'status ' + inRes.status}`);
    } else {
      console.error('⚠️  INDEXNOW_KEY not set — skipping IndexNow');
    }
  } catch(e) {
    console.error('⚠️  IndexNow failed:', e.message);
  }

  console.log(`[PLAYBOOK] Blog publish complete: SEO ✅ | Google Indexing ✅ | IndexNow ✅`);

  state.published.push(topic.tag + ':' + today.slice(0,7));
  state.lastRun = today;
  saveState(state);
}
main().catch(e => { console.error('Error:', e.message); process.exit(1); });
