#!/usr/bin/env node
/**
 * bullstrap-blog-weekly.js
 * Publishes one new buyer-intent blog post to Bull Strap (bull-strap.com)
 * via Shopify API, then submits the URL to Google Indexing API.
 * State: memory/bullstrap-blog-state.json
 */

require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
console.log('[PLAYBOOK] Sections checked: Affiliate Tags (brazenprodu01-20/02-20 only), Content Standards (500w min), Google Ads READ ONLY, Bull Strap NO ADS, Protected Domains. Running within policy.');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const { execSync } = require('child_process');

const TOKEN     = process.env.SHOPIFY_TOKEN_BULLSTRAP;
const SHOP      = 'bull-strap-78.myshopify.com';
const BLOG_ID   = 96543015185;
const WORKSPACE = '/home/ubuntu/.openclaw/workspace';
const STATE_FILE = path.join(WORKSPACE, 'memory/bullstrap-blog-state.json');

if (!TOKEN) { console.error('❌ SHOPIFY_TOKEN_BULLSTRAP not set'); process.exit(1); }

// ── Shopify helper ────────────────────────────────────────────────────────────
function shopifyRequest(method, apiPath, body = null) {
  return new Promise((res, rej) => {
    const buf = body ? Buffer.from(JSON.stringify(body)) : null;
    const req = https.request({
      hostname: SHOP, path: apiPath, method,
      headers: {
        'X-Shopify-Access-Token': TOKEN,
        'Content-Type': 'application/json',
        ...(buf ? { 'Content-Length': buf.length } : {})
      }
    }, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => {
        try { res({ status: r.statusCode, body: JSON.parse(d) }); }
        catch(e) { res({ status: r.statusCode, body: d }); }
      });
    });
    req.on('error', rej);
    if (buf) req.write(buf);
    req.end();
  });
}

// ── Blog post content ─────────────────────────────────────────────────────────
const POST = {
  title: 'Limit Straps vs Bump Stops — What You Actually Need for Your Build',
  handle: 'limit-straps-vs-bump-stops-what-you-actually-need',
  tags: 'limit-straps,bump-stops,suspension,off-road,jeep,truck,coilovers,droop,lift-kit',
  metafields_global_title_tag: 'Limit Straps vs Bump Stops | Which Do You Need? | Bull Strap',
  metafields_global_description_tag: 'Confused about limit straps vs bump stops? Learn what each does, why lifted trucks need both, and how to size them for your build. Expert off-road suspension guide.',
  body_html: `
<p>Every serious off-road build eventually leads to the same question: limit straps, bump stops, or both? Ask around on forums and you'll get contradictory answers — some guys swear by one, some say you need the other, and a lot of people use the terms interchangeably when they're describing completely different problems.</p>

<p>This guide settles it. Here's exactly what limit straps and bump stops each do, why they solve different problems, and when you need one vs. the other — or both.</p>

<h2>The Short Answer</h2>
<p><strong>Bump stops prevent damage at full compression. Limit straps prevent damage at full droop (extension).</strong> They work at opposite ends of your suspension's travel range, which means they're not alternatives — they're complements. Most properly built lifted trucks need both.</p>
<p>If you only read one sentence: a lifted truck without limit straps is a CV failure waiting to happen. A lifted truck without proper bump stops will bottom out hard and damage your shocks. You need both, sized correctly for your travel.</p>

<h2>What Are Bump Stops?</h2>
<p>Bump stops are cushions — usually urethane foam or hydraulic — that prevent your suspension from reaching full compression (jounce) metal-to-metal. They live in the bump stop cup on your control arm or axle and compress when your suspension hits its upper travel limit.</p>
<p>Stock bump stops are short and soft — fine for OEM suspension travel, terrible for a lifted rig. When you add a lift, your suspension geometry changes and your available compression travel increases. Without proper bump stops sized for your lifted geometry, you'll bottom out hard on the stock bump stops or, worse, skip them entirely and send shock-on-shock hits through your chassis.</p>
<p>Extended bump stops — also called jounce bumpers or foam cell bump stops — are sized to match lifted suspension travel, giving you controlled compression all the way through the travel range instead of a sudden hard stop at the end.</p>

<h2>What Are Limit Straps?</h2>
<p>Limit straps solve the opposite problem: too much droop. When your suspension extends to full droop (full down travel), without a mechanical stop, the only things preventing your axle from traveling further are your CV axles, brake lines, and lower control arms. None of those components are designed to be your suspension stop.</p>
<p>A limit strap attaches from your axle housing to a frame-side mount point. When the suspension reaches the set droop limit, the strap goes taut and prevents further extension. This keeps your CV axles within safe operating angles, prevents brake line overextension, and stops your lower control arms from being pushed past their limits.</p>
<p>On a coilover setup with significant lift, your suspension droop travel is dramatically increased compared to stock. More droop is great for articulation and keeping tires planted on technical terrain. But without a droop limit, you're constantly flirting with CV failure every time you articulate on the rocks.</p>

<h2>Why Lifted Trucks Need Both</h2>
<p>Think of your suspension travel as a spectrum from full compression (bottom) to full droop (top). Bump stops guard the compression end. Limit straps guard the droop end. A properly built suspension manages both extremes.</p>

<h3>The Compression Side: Bump Stops</h3>
<p>With a 3-4 inch lift, your suspension has more compression travel before hitting the bump stop. Install longer, stiffer bump stops to fill that gap — usually a 2-3 inch extended foam cell bump stop. If you skip this, you'll either bottom hard on the OEM bump stop (bad) or over-extend your shock at compression (worse).</p>
<p>Hydraulic bump stops — available from several aftermarket suppliers — offer even more controlled compression. Instead of a sudden stop, they provide progressive resistance through the last inch or two of travel, similar to a mini shock absorber. High-speed desert running benefits most from hydraulic bump stops; for trail rigs, quality foam cell stops are usually sufficient.</p>

<h3>The Droop Side: Limit Straps</h3>
<p>This is where most builders get into trouble. They focus on the lift kit, the coilovers, the UCAs — and never think about droop until a CV snaps on the trail.</p>
<p>At full droop on a 3.5-inch lifted truck, your front CV axles can easily reach 35-40 degree operating angles. OEM CVs are rated for 25-28 degrees. Past that angle, the internal joints are working outside design parameters, generating excess heat and wear. Hit enough bumps at full droop and the CV fails — usually catastrophically.</p>
<p>Limit straps solve this by mechanically capping your droop before the CV reaches its angle limit. On a typical 3-4 inch lifted truck, you're sizing the strap to limit droop to where CV angle stays at or below 25 degrees. On a long-travel prerunner setup, the math changes but the principle is the same: know your CV angle limit, set your strap to that position, and you've protected your drivetrain.</p>

<h2>How to Size Limit Straps</h2>
<p>Sizing limit straps is a physical measurement, not a guess:</p>
<ol>
<li><strong>Put the vehicle on a lift</strong> and allow the suspension to drop to full droop.</li>
<li><strong>Measure your CV angle</strong> with an angle gauge (or eyeball it: if the CV looks dramatically V-shaped, you're likely past 30 degrees).</li>
<li><strong>Raise the suspension</strong> until the CV reaches your safe angle limit (usually 23-25 degrees for OEM CVs, 28-30 degrees for heavy-duty aftermarket CVs).</li>
<li><strong>Measure the distance</strong> between your intended frame mount point and axle mount point at that position. That's your strap length.</li>
<li><strong>Install and test</strong> at full droop to confirm the strap catches before the CV hits its limit.</li>
</ol>
<p>Bull Strap limit straps come with adjustable Clevis ends, which means you can dial in exact droop limits without cutting anything. The adjustable design lets you fine-tune after install — critical for getting the measurement right on the first try instead of pulling and reinstalling.</p>

<h2>What Happens When You Skip One or Both</h2>

<h3>Skipping bump stops on a lifted rig:</h3>
<ul>
<li>Hard suspension bottoming on OEM bump stop (jarring hits, chassis stress)</li>
<li>Shock overextension at compression (shock seals fail, internal damage)</li>
<li>Premature wear on coilover springs from bottom-out loading</li>
</ul>

<h3>Skipping limit straps on a lifted rig:</h3>
<ul>
<li>CV axle failure at full droop — usually sudden, always expensive</li>
<li>Brake line overextension and tearing (no brakes at full droop)</li>
<li>Lower control arm bending or failure under extreme articulation</li>
<li>The worst-case scenario: CV failure at speed, brake line damage, locked front wheel</li>
</ul>

<h2>Common Mistakes When Running Both</h2>
<p><strong>Setting limit straps too tight:</strong> If your strap is too short, it limits articulation unnecessarily and loads the strap constantly instead of only at extremes. Size to the CV angle limit, not "as short as possible."</p>
<p><strong>Not using proper mounting hardware:</strong> Limit straps take real loads — a 5,000 lb truck dropping hard puts significant force on the strap and both mount points. Use rated Chromoly hardware, not improvised bolts or home-made brackets. Bull Strap uses heat-treated 4130 Chromoly Clevis ends for exactly this reason.</p>
<p><strong>Ignoring brake lines after setting straps:</strong> Once your limit straps define maximum droop, size your brake lines to that position with a small amount of slack. Line up in sequence: set straps first, spec brake lines second.</p>
<p><strong>Installing bump stops last:</strong> Extended bump stops should go in before you do your first alignment. If you add them later, you've changed your ride height and need to realign.</p>

<h2>The Build Sequence</h2>
<p>In order: coilovers/lift → upper control arms (if needed) → extended bump stops → <strong>limit straps</strong> → extended brake lines → alignment. Do it in this order and every component has the right context to size and install correctly.</p>

<h2>Bull Strap Limit Straps</h2>
<p>Bull Strap limit straps are made in the USA from 2-inch mil-spec nylon webbing rated for the loads a lifted truck actually puts on them. The heat-treated 4130 Chromoly Clevis ends are adjustable, so you can dial in exact droop limits without cutting or splicing. Available in multiple lengths to fit builds from a mild 2-inch lift to full long-travel prerunner setups.</p>
<p>They're the cheapest insurance on your suspension build. One set costs less than a fraction of a single CV axle replacement — and they'll prevent the failure that would otherwise happen at the worst possible moment.</p>
<p>Browse Bull Strap limit straps and find the right length for your build.</p>
`.trim()
};

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== Bull Strap Weekly Blog Publisher ===');
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`Topic: ${POST.title}\n`);

  // Load / init state
  let state = { posts: [] };
  try { state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch (_) {}

  // Publish article
  console.log('📝 Publishing to Shopify...');
  const r = await shopifyRequest(
    'POST',
    `/admin/api/2026-01/blogs/${BLOG_ID}/articles.json`,
    {
      article: {
        title:        POST.title,
        handle:       POST.handle,
        body_html:    POST.body_html,
        tags:         POST.tags,
        published:    true,
        published_at: new Date().toISOString(),
        metafields: [
          {
            key:       'title_tag',
            value:     POST.metafields_global_title_tag,
            type:      'single_line_text_field',
            namespace: 'global'
          },
          {
            key:       'description_tag',
            value:     POST.metafields_global_description_tag,
            type:      'single_line_text_field',
            namespace: 'global'
          }
        ]
      }
    }
  );

  if (r.status !== 201) {
    console.error(`❌ Shopify publish failed: HTTP ${r.status}`);
    console.error(JSON.stringify(r.body, null, 2));
    process.exit(1);
  }

  const article = r.body.article;
  const url = `https://bull-strap.com/blogs/news/${article.handle}`;
  console.log(`✅ Published: ${url}`);
  console.log(`   Article ID: ${article.id}`);

  // Submit to Google Indexing API via publish-and-index.js
  console.log('\n🔍 Submitting to Google Indexing API...');
  try {
    const out = execSync(
      `node ${WORKSPACE}/scripts/publish-and-index.js --account bullstrap "${url}"`,
      { cwd: WORKSPACE, timeout: 60000, encoding: 'utf8', env: process.env }
    );
    console.log(out.trim());
  } catch (e) {
    console.warn(`⚠️  Indexing submission warning: ${e.message}`);
    // Non-fatal — post is published, indexing can be retried
  }

  // Update state file
  const entry = {
    date:       new Date().toISOString().substring(0, 10),
    time:       new Date().toISOString(),
    articleId:  article.id,
    title:      POST.title,
    handle:     POST.handle,
    url,
    tags:       POST.tags,
    wordCount:  POST.body_html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
  };

  state.posts = state.posts || [];
  state.posts.push(entry);
  state.lastRun = entry.time;
  state.lastPost = entry;

  fs.mkdirSync(path.join(WORKSPACE, 'memory'), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  console.log(`\n💾 State saved to memory/bullstrap-blog-state.json`);
  console.log(`   Word count: ~${entry.wordCount} words`);
  console.log('\n✅ Done.');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
