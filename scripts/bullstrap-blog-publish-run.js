#!/usr/bin/env node
/**
 * bullstrap-blog-publish-run.js
 * One-shot: publishes today's weekly buyer-intent blog post to Bull Strap,
 * submits URL to Google Indexing API, and updates state.
 * Run: node scripts/bullstrap-blog-publish-run.js
 */

require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const https  = require('https');
const fs     = require('fs');
const path   = require('path');
const { execSync } = require('child_process');

const TOKEN      = process.env.SHOPIFY_TOKEN_BULLSTRAP;
const SHOP       = 'bull-strap-78.myshopify.com';
const BLOG_ID    = 96543015185;
const WORKSPACE  = '/home/ubuntu/.openclaw/workspace';
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

// ── Post content ──────────────────────────────────────────────────────────────
const POST = {
  title: 'Best Limit Straps for Toyota Tacoma (2nd & 3rd Gen)',
  handle: 'best-limit-straps-toyota-tacoma',
  tags: 'limit-straps,toyota-tacoma,off-road,suspension,lifted-tacoma,tacoma-build,droop,cv-axle,coilover',
  metaTitle: 'Best Limit Straps for Toyota Tacoma | 2nd & 3rd Gen Guide | Bull Strap',
  metaDesc: 'Find the best limit straps for your lifted Toyota Tacoma. Sizing guide for 2nd and 3rd gen trucks with 2–6 inch lifts, coilovers, and UCAs. Protect your CV axles.',
  body_html: `
<p>The Toyota Tacoma is the default off-road mid-size truck in North America for good reason: solid front axle articulation, available rear locking diff, a proven drivetrain, and an aftermarket so deep you can build anything from a mild overlander to a full pre-runner. But there's one part of the Tacoma suspension build that catches owners by surprise — and it usually catches them on the trail instead of in the garage.</p>

<p>Limit straps. If you've lifted your Tacoma and you're not running them, you're gambling with your CV axles every time your suspension hits full droop.</p>

<p>This guide covers exactly what limit straps do on a Tacoma, which sizes work for common lift heights, and what to look for when you're buying a set.</p>

<h2>Why Lifted Tacomas Need Limit Straps</h2>

<p>The Toyota Tacoma runs an independent front suspension (IFS) on all generations sold in North America. That means your front wheels each move independently, with CV axles transmitting power from the differential to the hub even as the wheel articulates up and down.</p>

<p>CV joints are designed to operate within a specific range of angles. OEM Toyota CV axles on a Tacoma are typically rated for safe operation up to about 25–27 degrees of angulation. At stock ride height with stock suspension travel, you never get close to that limit. The problem starts when you lift the truck.</p>

<p>A 3-inch lift changes your axle geometry at rest — but more critically, it increases your available droop travel. More droop is great for keeping your tires planted on uneven terrain. But without a mechanical droop stop, at full suspension drop your CV angle can easily exceed 35 degrees. Past that point, you're grinding through joint material with every rotation. Keep doing it and the CV fails — often at full droop, often with a loud snap, always at the worst possible time.</p>

<p>Limit straps attach from a frame-side mount point to your axle housing. When the suspension drops to the set limit, the strap goes taut and stops further droop extension. You retain all your articulation up to that limit, but you mechanically prevent the CV from reaching a destructive angle. It's simple, light, and dramatically cheaper than a CV replacement — or a tow out of the backcountry.</p>

<h2>2nd Gen Tacoma (2005–2015) Limit Strap Sizing</h2>

<p>The 2nd gen Tacoma runs a double-wishbone front suspension with a solid rear axle. Front CV protection via limit straps is the primary concern, though rear shock overextension on lifted rigs is also worth addressing.</p>

<h3>2–3 Inch Lift (stock UCAs or aftermarket UCAs)</h3>
<p>At a 2–3 inch lift on the 2nd gen, you're working with moderately increased droop travel. With stock UCAs, the factory geometry limits how much droop you can actually achieve — the upper arm hits its travel stop before the CV reaches a critical angle. With aftermarket UCAs (like ICON, SPC, or Total Chaos), you get more up-travel and more droop, which means CV angle management becomes more important.</p>
<p>For a 2nd gen with a 2–3 inch lift and stock or mild aftermarket UCAs, a <strong>12–14 inch limit strap</strong> is a common starting point. Measure from your intended frame mount point to the axle housing attachment point at your target droop position. Adjustable Clevis ends let you dial this in precisely without guesswork.</p>

<h3>3.5–4.5 Inch Lift with Aftermarket UCAs</h3>
<p>This is the most popular build range for 2nd gen Tacomas — coilovers up front (ICON, Deaver, Old Man Emu), extended UCAs, and 2–3 inches of rear lift. At this height, droop travel is significantly increased, and stock CV axles are operating near or past their angle limit at full droop.</p>
<p>Most builders in this range run <strong>14–16 inch limit straps</strong> at the front. The specific length depends on your UCA design, coilover travel, and mount point location. Many Tacoma builds also benefit from rear limit straps at this height to prevent shock overextension at full droop on the rear axle.</p>

<h3>5–6 Inch Lift (long travel setups)</h3>
<p>At 5–6 inches of lift on a 2nd gen Tacoma, you're typically running custom UCAs, extended travel coilovers, and possibly extended rear leaf packs or a coilover conversion. Droop travel is substantial. Upgraded heavy-duty CV axles (Carli, Deaver, or similar) are common at this lift height, and they tolerate more angle — but they still need limit straps.</p>
<p>Front strap lengths at this height vary more depending on the specific setup, but <strong>16–20 inch straps</strong> are common. Custom-length options are available for setups that don't fit standard increments.</p>

<h2>3rd Gen Tacoma (2016–2023) Limit Strap Sizing</h2>

<p>The 3rd gen Tacoma uses a revised front suspension with slightly different geometry. Importantly, the 3rd gen came factory with a bit more droop travel than the 2nd gen, which means the CV angle concern is even more relevant for lifted trucks.</p>

<h3>2–3 Inch Lift</h3>
<p>At mild lift heights on a 3rd gen Tacoma — running a leveling kit or a light lift like the Bilstein 5100 / Eibach Pro combo — limit straps are still a good idea but the urgency is lower. The factory geometry is more tolerant at moderate lifts. That said, if you're wheeling the truck (not just daily driving), protecting your CVs is worth the low cost.</p>
<p>Common front strap lengths in this range: <strong>12–14 inches</strong>.</p>

<h3>3.5–5 Inch Lift (the sweet spot build)</h3>
<p>This is where the 3rd gen Tacoma community lives. ICON Stage 4 and 5 coilover systems, Fox 2.5 coilovers, aftermarket UCAs — these setups dramatically increase droop travel and put real stress on CV axles at full extension. Stock 3rd gen CVs are vulnerable here.</p>
<p>Front limit straps in this range: <strong>14–17 inches</strong>, depending on specific UCA and coilover choice. The ICON Stage 4 system, for example, is commonly paired with 15–16 inch limit straps. Rear limit straps (16–18 inch) are also recommended to prevent shock overextension on the rear monotube setup.</p>

<h3>5.5–7 Inch Long Travel</h3>
<p>Full long-travel setups on the 3rd gen use extended lower control arms, custom UCAs, and long-travel coilovers. At this build level, limit straps are non-negotiable. Upgraded Chromoly CV axles are also standard, and they tolerate more angle — but the strap keeps them in that range.</p>
<p>Builders in this range often work with <strong>18–24 inch straps</strong> up front, with custom lengths available for one-off setups.</p>

<h2>How to Measure for Limit Straps on a Tacoma</h2>

<p>The cleanest way to measure for limit straps is to do it physically:</p>

<ol>
<li><strong>Put the truck on a lift</strong> and allow the front suspension to hang at full droop.</li>
<li><strong>Check your CV angle.</strong> If you have an angle gauge, measure the inner CV joint angle. Target: stay at or below 25 degrees for OEM CVs, 28–30 degrees for heavy-duty aftermarket CVs. If you're eyeballing it: if the CV looks dramatically kinked at the inner joint, you're likely past 30 degrees.</li>
<li><strong>Raise the wheel</strong> until your CV angle reaches the safe limit. Hold or block it at that position.</li>
<li><strong>Measure the distance</strong> between your planned frame mount point and the axle mount point at that wheel position. This is your strap length.</li>
<li><strong>Order and install.</strong> With adjustable Clevis ends, you get a range of adjustment so you don't need a perfect measurement — you can dial it in after install.</li>
</ol>

<p>For most 3rd gen Tacoma builds in the 3.5–5 inch lift range, measuring at 23–25 degree CV angle gives you a strap length in the 14–17 inch range. If your measurement comes out shorter, double-check your mount point locations — sometimes moving the frame mount point inboard or outboard by an inch changes the effective strap length significantly.</p>

<h2>What to Look for in a Tacoma Limit Strap</h2>

<p>Not all limit straps are created equal. A suspension component that catches your entire front axle at full articulation needs to be built to match that load — and cheap straps don't last.</p>

<p><strong>Webbing material:</strong> Look for 2-inch mil-spec nylon webbing. Nylon is the right material for limit straps — it has enough elasticity to absorb impact load without being bouncy, and it maintains strength across temperature ranges. Cheap straps use polyester webbing or undersized nylon and fail under repeated hard droop hits.</p>

<p><strong>Hardware:</strong> Clevis ends should be heat-treated steel or Chromoly — not mild steel, not aluminum. The Clevis connection takes concentrated load at the strap limits, and it needs rated hardware to hold. Bull Strap uses heat-treated 4130 Chromoly Clevis ends specifically because the load concentration at the pin connection is where cheap straps fail first.</p>

<p><strong>Adjustability:</strong> Adjustable Clevis ends let you dial in exact droop positions without cutting or modifying the strap. On a Tacoma where the right length varies by a few inches depending on your exact setup, adjustability means you get it right instead of guessing.</p>

<p><strong>Length range:</strong> Get straps that cover your target measurement with room on both ends for adjustment. If your measured length is 15 inches, a strap with adjustment range from 13 to 17 inches gives you the flexibility to fine-tune.</p>

<p><strong>Made in USA:</strong> Suspension safety components are not the place to save $15 buying overseas. Bull Strap limit straps are manufactured in the USA from domestic mil-spec materials. The quality difference is measurable — and the stakes on a lifted Tacoma on technical terrain are high enough to matter.</p>

<h2>The Bottom Line for Tacoma Owners</h2>

<p>If you've lifted your Tacoma — especially if you're running aftermarket UCAs, coilovers, or long-travel components — limit straps belong on your suspension. The cost is low, the install is straightforward, and they protect the most expensive and difficult-to-replace components in your front drivetrain.</p>

<p>CV axle replacements on a Tacoma run $300–600 per side for quality parts, plus labor. A set of Bull Strap limit straps costs a fraction of that — and they prevent the failure from happening in the first place. The math is simple.</p>

<p>Browse Bull Strap limit straps for Tacoma — available in multiple lengths with adjustable Clevis ends to fit 2nd and 3rd gen builds from mild lift to full long-travel setups.</p>
`.trim()
};

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== Bull Strap Weekly Blog Publisher ===');
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`Topic: ${POST.title}\n`);

  // Load state
  let state = { posts: [] };
  try { state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch (_) {}

  // Publish article via Shopify
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
            value:     POST.metaTitle,
            type:      'single_line_text_field',
            namespace: 'global'
          },
          {
            key:       'description_tag',
            value:     POST.metaDesc,
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

  // Submit to Google Indexing API
  console.log('\n🔍 Submitting to Google Indexing API...');
  let indexingResult = {};
  try {
    const out = execSync(
      `node ${WORKSPACE}/scripts/publish-and-index.js --account bullstrap "${url}"`,
      { cwd: WORKSPACE, timeout: 60000, encoding: 'utf8', env: process.env }
    );
    console.log(out.trim());
    indexingResult = { status: 'submitted', output: out.trim().slice(0, 300) };
  } catch (e) {
    const msg = (e.stdout || '') + (e.stderr || '') + e.message;
    console.warn(`⚠️  Indexing warning: ${msg.slice(0, 400)}`);
    indexingResult = { status: 'warning', note: msg.slice(0, 300) };
  }

  // Word count (strip HTML)
  const wordCount = POST.body_html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;

  // Update state
  const entry = {
    date:      new Date().toISOString().substring(0, 10),
    time:      new Date().toISOString(),
    articleId: article.id,
    title:     POST.title,
    handle:    POST.handle,
    url,
    tags:      POST.tags,
    wordCount,
    topic:     'Best Limit Straps for [Vehicle Model]',
    vehicle:   'Toyota Tacoma (2nd & 3rd Gen)',
    indexing:  indexingResult
  };

  state.posts = state.posts || [];
  state.posts.push(entry);
  state.lastRun        = entry.time;
  state.lastPost       = entry;
  state.lastTopicUsed  = 'Best Limit Straps for [Vehicle Model]';
  state.nextSuggestedTopic = 'How to Size Limit Straps for a 4-Inch Lift';

  fs.mkdirSync(path.join(WORKSPACE, 'memory'), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

  console.log(`\n💾 State saved → memory/bullstrap-blog-state.json`);
  console.log(`   Word count: ~${wordCount} words`);
  console.log(`   Next topic: ${state.nextSuggestedTopic}`);
  console.log('\n✅ Done.');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
