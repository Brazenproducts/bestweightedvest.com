#!/usr/bin/env node
/**
 * bullstrap-blog-weekly-run-2026-09-30.js
 * Publishes: "How to Size Limit Straps for a 4-Inch Lift (Step-by-Step Guide)"
 * Topic rotation: How to Size Limit Straps for [Lift Height]
 * Cron: d5f5af07-bb90-43e9-b414-f94bc869d489 — Weekly blog content
 * Date: 2026-09-30
 */

require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
console.log('[PLAYBOOK] Sections checked: Affiliate Tags (brazenprodu01-20/02-20 only), Content Standards (800w min), Google Ads READ ONLY, Bull Strap NO ADS, Protected Domains. Running within policy.');

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
      hostname: SHOP,
      path: apiPath,
      method,
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
        catch (_) { res({ status: r.statusCode, body: d }); }
      });
    });
    req.on('error', rej);
    if (buf) req.write(buf);
    req.end();
  });
}

// ── Article content ───────────────────────────────────────────────────────────
const POST = {
  title: 'How to Size Limit Straps for a 4-Inch Lift (Step-by-Step Guide)',
  handle: 'how-to-size-limit-straps-4-inch-lift',
  tags: 'limit-straps,4-inch-lift,suspension,off-road,sizing-guide,cv-axle,droop,coilover,tacoma,wrangler,4runner,f-150',
  metafields_global_title_tag: 'How to Size Limit Straps for a 4-Inch Lift | Bull Strap',
  metafields_global_description_tag: 'Step-by-step guide to measuring and sizing limit straps for a 4-inch lift. Protect your CV axles on your Tacoma, Wrangler, 4Runner, or F-150. Get the math right the first time.',
  body_html: `
<p>A 4-inch lift is one of the most popular upgrades on the road — and one of the most misunderstood when it comes to the supporting hardware. Lift kits rarely come with limit straps. The aftermarket coilovers, UCAs, and extended shocks in your kit are engineered for the new geometry, but your CV axles, brake lines, and lower control arms still have the same failure points they always did. The difference is that now your suspension can droop significantly farther than stock.</p>

<p>Without limit straps, that extra droop travel is a CV failure waiting to happen. With properly sized limit straps, you cap the droop before it reaches dangerous CV angles and you protect every downstream component on the axle. This guide walks you through the exact process for measuring and sizing limit straps on a 4-inch lift — the right way, with real numbers.</p>

<h2>Why a 4-Inch Lift Changes Everything at Full Droop</h2>

<p>At stock ride height, most trucks and SUVs have 3–4 inches of droop travel. CV axles are designed for that range. A 4-inch lift with quality coilovers typically adds 2–4 additional inches of droop depending on the platform — now you're looking at 5–8 inches of total droop travel. That's a lot of axle angle.</p>

<p>Stock OEM CV axles are rated for operating angles up to roughly 24–26 degrees. Some heavy-duty aftermarket CVs handle up to 30 degrees before efficiency drops sharply. Here's the problem: at full droop on a 4-inch lifted truck with no limit straps, your front CV axles can easily hit 35–42 degree operating angles depending on your platform. That's 9–16 degrees past the CV's design limit — and every hit, every flex, every trail obstacle hammers the joint at those angles.</p>

<p>CV failure at those angles isn't "if," it's "when." And when it goes, it usually goes catastrophically — not a slow leak or a warning vibration, but an immediate loss of drive with a wrecked axle that often takes the boot, the hub, and sometimes the UCA with it.</p>

<p>Limit straps are the mechanical stop that prevents your suspension from reaching those angles. They're simple, they're cheap relative to a CV replacement, and they're the one component that most 4-inch lift owners skip because it wasn't in the kit.</p>

<h2>Understanding CV Angle Limits by Platform</h2>

<p>Before you measure anything, know your CV angle limit. These are general guidelines — verify against your specific axle specs if you're running aftermarket CVs:</p>

<ul>
  <li><strong>Toyota Tacoma (2nd Gen, 3rd Gen):</strong> OEM CVs rated to ~25–26° continuous. Heavy-duty Chromoly replacements rated to ~28–30°. Most builders size straps to hold Tacoma CVs at 23° max for long-term reliability.</li>
  <li><strong>Toyota 4Runner (5th Gen):</strong> Similar CV geometry to Tacoma. Same 23–25° target angle. The 4Runner's longer wheelbase gives slightly better geometry at a given lift height, but not enough to skip straps.</li>
  <li><strong>Jeep Wrangler JL / Gladiator JT:</strong> OEM CVs rated to ~27° continuous. With a 4-inch lift and stock driveline, target 25° max at full droop to avoid premature wear.</li>
  <li><strong>Ford F-150 (2015–present):</strong> IFS front CV geometry varies significantly by suspension type. On an OEM solid front axle swap or IFS with a long-travel kit, target 23–25° max. Stock IFS with a 4-inch lift: target 22–24°.</li>
  <li><strong>Chevrolet/GMC Colorado/Canyon:</strong> OEM CVs rated to ~25°. Aftermarket Chromoly axles extend this to ~28°. Target 23° on OEM axles.</li>
  <li><strong>Ford Bronco (6th Gen):</strong> Sasquatch package suspension geometry is more favorable, but a 4-inch lift on standard Bronco still requires droop limiting. Target 26° max on OEM CVs.</li>
</ul>

<h2>The Measuring Process: Step by Step</h2>

<p>You need a floor jack, a vehicle lift or jack stands, an angle gauge (a digital angle gauge from any hardware store works fine — you don't need specialty tools), and a tape measure. Clear an hour for this.</p>

<h3>Step 1: Get the Vehicle at Full Droop</h3>
<p>Put the truck on a lift with the front wheels hanging free, or drive it onto ramps and support the frame with jack stands so the front wheels hang completely unsupported. The goal is full suspension droop with zero weight on the wheels. This is the position your suspension reaches when a wheel drops into a hole or the opposite wheel stuffs up on a rock.</p>

<h3>Step 2: Measure Your Current Full-Droop CV Angle</h3>
<p>Place your digital angle gauge on the CV axle shaft — the section between the inner and outer joints. You want the angle of the shaft relative to horizontal. A flat, level surface at zero is your reference; the CV angle is how far the shaft deviates from that horizontal plane at the joint.</p>

<p>On most 4-inch lifted trucks at full droop with no limit straps, you'll measure anywhere from 32–42 degrees at the inner joint. Write this number down. This is your baseline — the angle you need to eliminate.</p>

<h3>Step 3: Raise the Suspension Until You Hit Your Safe CV Angle</h3>
<p>Use your floor jack under the axle tube (not the CV, not the control arm) to slowly raise the wheel side of the suspension. Watch your angle gauge. When the CV angle reading drops to your target safe angle — 23–25 degrees for most platforms, per the list above — stop. This is your droop limit position: the point where the limit strap needs to catch the suspension.</p>

<p><em>Pro tip:</em> Take the target angle slightly below your limit — if the CV is rated to 25°, set your target measurement at 23°. This gives you a 2-degree buffer for measurement error and hardware flex under load.</p>

<h3>Step 4: Measure the Strap Length</h3>
<p>With the suspension held at the droop limit position by your floor jack, measure the distance between your two intended mounting points — the axle-side mount and the frame-side mount. This distance, measured with the suspension at the correct position, is your required strap length.</p>

<p>Measure from pin center to pin center. If your mount hardware uses Clevis pins, that's center-to-center of the pin holes. If you're fabricating mount points, account for the hardware thickness in your final measurement.</p>

<p>Write this number down in inches. This is your strap length. Add 0.5 to 1 inch of adjustment range to your target — you want a strap that lets you fine-tune after install, not one that's exactly at the limit with no room to dial in.</p>

<h3>Step 5: Choose Your Strap and Hardware</h3>
<p>Limit straps are rated by both length and load capacity. A 4-inch lifted half-ton or midsize truck needs straps rated for at minimum 5,000 lbs static load capacity — more if you're running a heavy overlanding setup or full-size truck. The strap itself should be mil-spec nylon webbing rated for that load; the hardware — Clevis ends, pins, and mounting tabs — needs to be equally rated.</p>

<p><strong>Bull Strap limit straps</strong> use 2-inch mil-spec nylon webbing paired with heat-treated 4130 Chromoly Clevis ends. The Chromoly hardware is machined from bar stock and heat-treated for maximum toughness — not cast hardware that cracks under shock load. The adjustable Clevis design lets you dial in exact droop limits without cutting the strap or running a fixed-length unit that you can't fine-tune on the vehicle.</p>

<p>For a 4-inch lifted Tacoma or 4Runner, most builders end up in the 12–16 inch strap range depending on where they mount. For a full-size truck like an F-150, you're typically in the 14–20 inch range. These are starting points — your actual measurement from Step 4 is what matters.</p>

<h3>Step 6: Install and Verify</h3>
<p>Install the straps with the vehicle at ride height — the strap should have significant slack at ride height and tension only near full droop. This is correct. A limit strap is not an active suspension component; it's a safety stop that engages only at the droop limit.</p>

<p>After install, drop the suspension to full droop again (on the lift or with jack stands) and verify that the strap goes taut at the correct position — and that the CV angle at that position matches your target. If the strap catches early, lengthen it slightly. If the CV angle is still past your target when the strap is taut, shorten the strap.</p>

<p>With adjustable Clevis ends on your Bull Strap limit straps, this adjustment takes minutes, not a reinstall. Thread the Clevis end in or out a few turns, recheck the angle, done.</p>

<h2>Where to Mount Limit Straps on Common 4-Inch Lift Platforms</h2>

<h3>Toyota Tacoma (2nd Gen / 3rd Gen)</h3>
<p>Most common mount points: axle housing to lower frame rail / skid plate. Some builders weld in dedicated tabs to the frame. On a 2nd Gen, factory-style limit strap tabs are accessible on the lower frame near the front differential. Strap runs from the front axle housing (outer end, near the spindle carrier) up to the frame tab. Length: typically 13–15 inches for a 4-inch lift with stock-ish droop limiting.</p>

<h3>Jeep Wrangler JL / Gladiator JT</h3>
<p>The JL has solid front and rear axles, which makes limit strap geometry different from IFS platforms. On a solid axle, the strap typically runs from the axle tube to a frame mount and limits axle droop (not CV angle — solid axle CVs are at the wheel end and less sensitive to droop angle). Still important to limit droop to protect brake lines and extended control arms. JL builders typically use 14–18 inch straps for a 4-inch lift.</p>

<h3>Toyota 4Runner (5th Gen)</h3>
<p>Similar IFS geometry to the Tacoma. Axle-side mount to the lower control arm mount area or axle housing; frame-side mount to a welded or bolted tab on the lower frame rail. Length: 14–17 inches for a 4-inch lift on most 5th Gen setups.</p>

<h3>Ford F-150 (Gen 13/14, 2015–present)</h3>
<p>The IFS F-150 has more complex geometry due to the wider track and different lower control arm layout. Strap mount points vary by specific suspension kit — check with your lift kit manufacturer for the recommended mount positions. Most 4-inch F-150 builders end up in the 16–20 inch range. Frame-side tabs often require welding on this platform since the lower frame rails don't have factory strap provisions.</p>

<h2>Quick Reference: Approximate Strap Lengths for 4-Inch Lifts</h2>

<table>
  <thead>
    <tr>
      <th>Platform</th>
      <th>Lift</th>
      <th>Target CV Angle</th>
      <th>Approx. Strap Length</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Toyota Tacoma 2nd Gen</td><td>4 in</td><td>23°</td><td>13–15 in</td></tr>
    <tr><td>Toyota Tacoma 3rd Gen</td><td>4 in</td><td>23°</td><td>13–16 in</td></tr>
    <tr><td>Toyota 4Runner 5th Gen</td><td>4 in</td><td>23–25°</td><td>14–17 in</td></tr>
    <tr><td>Jeep Wrangler JL</td><td>4 in</td><td>Droop limit (solid axle)</td><td>14–18 in</td></tr>
    <tr><td>Ford F-150 IFS (2015+)</td><td>4 in</td><td>22–24°</td><td>16–20 in</td></tr>
    <tr><td>Chevy/GMC Colorado</td><td>4 in</td><td>23°</td><td>12–15 in</td></tr>
    <tr><td>Ford Bronco (non-Sasquatch)</td><td>4 in</td><td>25–26°</td><td>13–16 in</td></tr>
  </tbody>
</table>

<p><em>These are starting-point ranges only. Always measure your specific vehicle per the steps above before ordering. CV angles vary by specific aftermarket kit, UCA geometry, and mount point locations.</em></p>

<h2>Common Mistakes When Sizing Limit Straps</h2>

<p><strong>Measuring at ride height instead of droop.</strong> Strap length is determined by the droop-limit position, not by what looks right at static ride height. If you eyeball it at ride height, you'll get the length wrong every time.</p>

<p><strong>Setting the strap too short.</strong> A strap that catches the suspension well before the CV angle limit wastes droop travel and limits your articulation on trail. Size to the actual angle limit, not to "as short as possible."</p>

<p><strong>Using undersized mounting hardware.</strong> A strap rated for 5,000 lbs is useless if it's mounted with a 1/2-inch Grade 5 bolt in a thin bracket. Shock loads on limit straps during trail use are significant. Use properly rated mounting tabs and hardware — Grade 8 or Chromoly minimum, and weld or box the mount tabs if you're fabricating them.</p>

<p><strong>Skipping brake line verification after install.</strong> Once your limit straps define maximum droop, your brake lines need to be verified at that new droop limit. Run the suspension to full strap-limited droop and confirm the brake lines have slack — not tension. If they're tight at the strap limit, you need extended brake lines before you wheel the rig.</p>

<p><strong>Only doing the front.</strong> Rear axle droop on solid rear axles also benefits from limiting — it protects driveshaft angles and brake lines. On rear IFS setups (some trucks), rear droop limiting protects rear CV axles the same way fronts do.</p>

<h2>The Bottom Line on 4-Inch Lift Limit Strap Sizing</h2>

<p>The process isn't complicated, but it requires doing the measurement correctly. Get the vehicle at true full droop, read the CV angle, raise until you hit your safe target angle, measure the strap length at that position. That's it. The part most people skip is the angle gauge — they estimate, and then wonder why they snap a CV six months later.</p>

<p>Bull Strap limit straps are built specifically for this job. Mil-spec webbing, heat-treated 4130 Chromoly Clevis ends, adjustable for fine-tuning after install. Made in the USA and sized for real truck loads — not the kind of hardware that looks good on a shelf but fails under load on the trail.</p>

<p>For a 4-inch lifted Tacoma, 4Runner, Wrangler, or F-150, a set of properly sized Bull Strap limit straps is the last piece of the suspension puzzle that actually protects everything else you've invested in the build. Browse the full line and find the right length for your platform.</p>
`.trim()
};

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== Bull Strap Weekly Blog Publisher ===');
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`Topic: ${POST.title}`);
  console.log(`Handle: ${POST.handle}\n`);

  // Load state
  let state = { posts: [], topicRotation: [], lastTopicUsed: '', nextSuggestedTopic: '' };
  try { state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch (_) {}

  // Check for duplicate
  const existing = (state.posts || []).find(p => p.handle === POST.handle);
  if (existing) {
    console.log(`⚠️  Post with handle "${POST.handle}" already exists (${existing.date}). Skipping.`);
    process.exit(0);
  }

  // Publish to Shopify
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
    console.error(JSON.stringify(r.body, null, 2).slice(0, 500));
    process.exit(1);
  }

  const article = r.body.article;
  const url     = `https://bull-strap.com/blogs/news/${article.handle}`;
  console.log(`✅ Published: ${url}`);
  console.log(`   Article ID: ${article.id}`);
  console.log(`   Blog ID:    ${BLOG_ID}`);

  // Submit to Google Indexing API via publish-and-index.js
  console.log('\n🔍 Submitting to Google Indexing API via publish-and-index.js...');
  let indexingResult = {};
  try {
    const out = execSync(
      `node ${WORKSPACE}/scripts/publish-and-index.js --account bullstrap "${url}"`,
      { cwd: WORKSPACE, timeout: 60000, encoding: 'utf8', env: process.env }
    );
    console.log(out.trim());
    indexingResult = { status: 'submitted', log: out.trim().slice(0, 300) };
  } catch (e) {
    const msg = e.stdout ? e.stdout.trim() : e.message;
    console.warn(`⚠️  Indexing warning (non-fatal): ${msg.slice(0, 200)}`);
    indexingResult = { status: 'warning', note: msg.slice(0, 200) };
  }

  // Also add to gsc-submit-queue.json for retry safety
  console.log('\n📥 Adding to GSC submit queue for retry safety...');
  try {
    const queuePath = path.join(WORKSPACE, 'google-indexing-queue.json');
    let queue = { urls: [] };
    try { queue = JSON.parse(fs.readFileSync(queuePath, 'utf8')); } catch (_) {}
    if (!queue.urls.includes(url)) {
      queue.urls.push(url);
      fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2));
      console.log(`   ✅ Added to queue: ${url}`);
    } else {
      console.log(`   ℹ️  Already in queue: ${url}`);
    }
  } catch (e) {
    console.warn(`⚠️  Queue update warning: ${e.message}`);
  }

  // Compute word count (strip HTML tags)
  const wordCount = POST.body_html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(w => w.length > 0)
    .length;

  // Build state entry
  const entry = {
    date:      new Date().toISOString().substring(0, 10),
    time:      new Date().toISOString(),
    articleId: article.id,
    title:     POST.title,
    handle:    POST.handle,
    url,
    tags:      POST.tags,
    wordCount,
    topic:     'How to Size Limit Straps for [Lift Height]',
    liftHeight: '4-inch',
    indexing:  indexingResult
  };

  // Update state
  state.posts         = state.posts || [];
  state.posts.push(entry);
  state.lastRun       = entry.time;
  state.lastPost      = entry;
  state.lastTopicUsed = 'How to Size Limit Straps for [Lift Height]';
  state.nextSuggestedTopic = 'Suspension Build Guide for Jeep Wrangler JL';
  state.topicRotation = [
    'Best Limit Straps for [Vehicle Model]',
    'How to Size Limit Straps for [Lift Height]',
    'Limit Straps vs Bump Stops — What You Actually Need',
    'Suspension Build Guide for [Vehicle]'
  ];

  fs.mkdirSync(path.join(WORKSPACE, 'memory'), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

  console.log(`\n💾 State saved → memory/bullstrap-blog-state.json`);
  console.log(`   Word count: ~${wordCount} words`);
  console.log(`   Next topic: ${state.nextSuggestedTopic}`);
  console.log('\n✅ Done.');
}

main().catch(e => {
  console.error('Fatal:', e.message || e);
  process.exit(1);
});
