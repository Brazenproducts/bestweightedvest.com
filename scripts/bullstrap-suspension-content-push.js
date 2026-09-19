#!/usr/bin/env node
/**
 * bullstrap-suspension-content-push.js
 * Writes unique SEO content to Bull Strap suspension-adjacent collection pages
 * and creates buyer-intent blog posts. These collections get real impressions
 * and cross-sell Bull Strap limit straps as the essential companion product.
 */

require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const https = require('https');
const fs = require('fs');

const TOKEN = process.env.SHOPIFY_TOKEN_BULLSTRAP;
const SHOP = 'bull-strap-78.myshopify.com';
const BLOG_ID = null; // Will look up

if (!TOKEN) { console.error('No token'); process.exit(1); }

const sleep = ms => new Promise(r => setTimeout(r, ms));

function shopifyRequest(method, path, body = null) {
  return new Promise((res, rej) => {
    const buf = body ? Buffer.from(JSON.stringify(body)) : null;
    const req = https.request({
      hostname: SHOP, path, method,
      headers: {
        'X-Shopify-Access-Token': TOKEN,
        'Content-Type': 'application/json',
        ...(buf ? { 'Content-Length': buf.length } : {})
      }
    }, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => res({ status: r.statusCode, body: JSON.parse(d) })); });
    req.on('error', rej);
    if (buf) req.write(buf);
    req.end();
  });
}

// Collection content — each positions limit straps as the essential companion
const COLLECTIONS = [
  {
    handle: 'coilovers',
    body_html: `<h2>Coilovers for Off-Road and Performance Builds</h2>
<p>Coilovers are the gold standard for serious suspension builds. Whether you're lifting a Jeep Wrangler for trail duty, building a prerunner, or dialing in street performance, coilovers give you the adjustability that OEM springs and shocks simply can't match. You control ride height, damping, and spring rate — which means you can tune for your specific use case instead of compromising.</p>

<h3>What Makes Coilovers Different</h3>
<p>Unlike a traditional shock and spring setup, coilovers integrate the shock absorber and spring into a single unit. This means the spring sits concentrically around the shock body, keeping the force path linear and eliminating the bending stress that causes premature wear in OEM setups. For lifted rigs, this is huge — you're not fighting geometry compromises that come with separating the spring and shock.</p>
<p>For off-road applications, look for coilovers with remote reservoirs. The reservoir houses additional oil and a floating piston that keeps the oil from cavitating under hard use. Without a reservoir, you get fade on long descents or repeated high-speed hits. With one, the system stays consistent from the first hit to the hundredth.</p>

<h3>Coilover Lift Heights and Limit Straps</h3>
<p>Here's the part most builders skip: when you install coilovers with significant lift, you dramatically increase the droop travel of your suspension. More droop travel is great — it keeps your tires planted and improves articulation. But there's a catch. Your CV axles, brake lines, and lower control arms all have a maximum droop limit. Exceed it and you're looking at snapped CVs, torn brake lines, or bent control arms.</p>
<p>That's exactly why <strong>limit straps are non-negotiable on any coilover build with real lift</strong>. Limit straps mechanically limit how far your suspension can droop, protecting your drivetrain components from reaching angles that cause failure. Bull Strap limit straps are made from military-spec webbing with heat-treated Chromoly clevis ends — built to take the load that a 5,000 lb truck puts on them when the suspension drops hard.</p>

<h3>Choosing the Right Coilover for Your Build</h3>
<p>The first question is application: street/track, mild off-road, or serious trail/desert running. Each calls for different specs:</p>
<ul>
<li><strong>Street/performance:</strong> Single-adjustable damping, lower spring rates, shorter stroke. Focus on handling improvement without sacrificing daily drivability.</li>
<li><strong>Mild off-road:</strong> Remote reservoir, moderate spring rates, 2-3 inches of lift. Works for overlanding, light trails, and improved articulation.</li>
<li><strong>Serious off-road/prerunner:</strong> Large-bore remote reservoir, high-travel stroke, stiffer springs for high-speed hits. Pair with bypass shocks at the rear for desert running.</li>
</ul>
<p>Whatever you choose, budget for the supporting components: upper control arms if you're lifting more than 2 inches, extended brake lines, and limit straps sized to your droop travel.</p>

<h3>Installation Tips</h3>
<p>Coilover installation varies by application but a few rules apply across the board. First, do a full corner-weight and alignment after install — coilovers let you adjust but only if you actually do it. Second, torque all hardware to spec and re-torque after 500 miles. Coilovers settle slightly after initial miles and loose hardware causes premature wear. Third, install your limit straps before you wheel the rig. Measure droop at full extension, subtract your safe CV angle limit, and size the straps accordingly.</p>
<p>Bull Strap's limit straps come in multiple lengths with adjustable Clevis ends so you can dial in exact droop limits without cutting and splicing webbing.</p>

<h3>Protect Your Investment</h3>
<p>Quality coilovers represent a serious investment. The suspension components they work with — CVs, brake lines, control arms — are equally serious. Limit straps are the cheapest insurance you can buy for that investment. A set of Bull Strap limit straps costs a fraction of a single CV axle replacement, and they'll prevent failures that would otherwise happen at the worst possible time — on the trail, far from help.</p>
<p>Browse our limit straps to find the right length and hardware for your build.</p>`
  },
  {
    handle: 'brake-line-kits',
    body_html: `<h2>Extended Brake Line Kits for Lifted Trucks and Off-Road Builds</h2>
<p>When you lift your truck or Jeep, your OEM brake lines become a liability. Stock brake lines are sized for stock suspension travel — add lift and droop and they'll pull tight, restrict movement, or tear completely. Extended brake line kits solve this by giving you the additional length you need to travel freely without binding or snapping under full droop.</p>

<h3>Why OEM Brake Lines Fail on Lifted Rigs</h3>
<p>OEM rubber brake lines are designed with minimal extra length — just enough for factory suspension travel. When you add a 2-4 inch lift, your suspension droop increases significantly. At full droop, your OEM brake line can reach maximum extension. This creates two problems: the line restricts suspension travel (limiting articulation), and repeated tension cycles fatigue the line until it cracks or tears. On the trail at full droop, a ruptured brake line means no brakes. That's not a recoverable situation.</p>
<p>Stainless steel braided lines solve both problems. The stainless braid is nearly inextensible, so the line won't stretch under pressure — giving you a firmer pedal feel and more consistent braking. And the added length eliminates tension at full droop.</p>

<h3>Matching Brake Line Length to Lift Height</h3>
<p>General guideline: for every inch of lift, add 1-1.5 inches of brake line length. A 3-inch lift needs 3-4.5 inches of additional line. Most aftermarket kits are sold by lift range (2-3 inch, 3-6 inch) — go with the kit that covers your specific lift height plus a little extra. Extra length is fine; too-short lines cause failures.</p>
<p>Also consider droop travel. If you've added a long-travel suspension or installed limit straps set to aggressive droop limits, factor that into your line length calculation. Your limit straps should be set before you finalize brake line length — the straps define your maximum droop, which defines how much line you need.</p>

<h3>The Limit Strap Connection</h3>
<p>Brake lines and limit straps work together in a properly built suspension. Limit straps define your maximum suspension droop. Brake lines need to be long enough to reach full droop without binding. If you haven't installed limit straps, your brake lines are sizing to infinite droop — which means you're either running lines that are too long and sag dangerously, or too short and will eventually snap.</p>
<p>The right build sequence: install coilovers or lift kit → set limit straps to protect CVs and axles → size brake lines to reach full droop with clearance. Bull Strap limit straps give you consistent, adjustable droop limits so you can spec your brake lines to exact measurements.</p>

<h3>Hardware and Fittings</h3>
<p>Most aftermarket brake line kits use AN fittings on the flex line ends with banjo bolts at the caliper. Make sure the kit you choose matches your vehicle's caliper thread pitch — most domestic trucks use 10mm-1.25 or 10mm-1.0 banjo bolts, while imports vary. Stainless steel fittings are worth the premium over aluminum for off-road use where constant flexing and debris exposure will corrode softer materials.</p>
<p>After installation, bleed your brakes completely and check for leaks at all connections. Road test before wheeling and recheck fittings after the first trail run.</p>

<h3>Don't Forget the Rest of the System</h3>
<p>Extended brake lines are part of a complete lifted-truck brake system upgrade. Also consider: braided stainless hard lines for the sections that run along the frame (OEM rubber can fatigue on rough terrain), caliper relocation brackets if your lift dramatically changes caliper position, and a brake proportioning valve adjustment if you've significantly changed front/rear weight distribution. Pair all of this with properly sized Bull Strap limit straps to protect your axles and CVs, and your lifted rig will stop as well as it goes.</p>`
  },
  {
    handle: 'coil-overs',
    body_html: '' // Skip if handle doesn't exist
  }
];

// Blog posts for high-intent queries
const BLOG_POSTS = [
  {
    title: 'Do I Need Limit Straps With Coilovers? Yes — Here\'s Why',
    tags: 'limit-straps,coilovers,suspension,jeep,truck',
    body_html: `<p>You just dropped serious money on a coilover kit. New shocks, adjustable perches, maybe a remote reservoir setup. Your suspension droop is dramatically better than stock. You can finally articulate on the rocks without a tire lifting.</p>
<p>Then someone at the trailhead asks: "Are you running limit straps?" You're not. And suddenly that investment feels exposed.</p>
<p>Here's the truth: <strong>if you're running coilovers with more than 1.5 inches of lift, you need limit straps.</strong> Full stop. Here's why.</p>

<h2>What Limit Straps Actually Do</h2>
<p>Limit straps are exactly what they sound like: they mechanically limit how far your suspension can droop. One end attaches to the axle, the other to the frame. When the suspension reaches full extension, the strap goes taut and prevents further travel.</p>
<p>This sounds simple, but the implications are significant. Without a droop limit, the only thing stopping your suspension from traveling to its maximum extent is your CV axle, brake line, or lower control arm — whichever fails first. None of those are designed to be your suspension stop.</p>

<h2>Why Coilovers Make This More Important, Not Less</h2>
<p>Stock suspension has built-in droop limits through bump stops and geometry. Coilovers, especially long-travel setups, dramatically increase available droop travel. That's a feature — more droop means better articulation and tire contact.</p>
<p>But more droop travel means more opportunity for your CV axles to reach critical angles. Most OEM CVs are designed for angles up to about 25-30 degrees. On a long-travel coilover setup at full droop, you can easily hit 40+ degrees. That's when CVs snap. And they don't snap gently — they let go hard, taking out adjacent components.</p>
<p>A set of Bull Strap limit straps set to keep your CVs at safe angles costs a fraction of a single CV replacement. The math isn't complicated.</p>

<h2>How to Size Limit Straps for a Coilover Build</h2>
<p>You need to know two measurements: your suspension droop distance, and your maximum safe CV angle.</p>
<ol>
<li>With the vehicle on a lift, drop the suspension to full droop and measure CV angle. If you don't have an angle gauge, the visual test: if the CV looks dramatically V-shaped, you're past safe limits.</li>
<li>Measure the distance from the axle mounting point to the frame mounting point at the angle where your CV is at its limit.</li>
<li>That measurement is your strap length. Bull Strap offers adjustable Clevis-end limit straps so you can dial in exact droop limits without permanent modification.</li>
</ol>
<p>The general rule of thumb: most builds with 3-5 inch lift want to limit droop to where CV angle stays under 25 degrees. Your specific geometry will vary — measure first, strap second.</p>

<h2>What Happens Without Limit Straps</h2>
<p>Best case: you get away with it for a while and snap a CV on the trail. Worst case: the CV failure happens at speed, takes out the brake line, and you're doing 40 mph with no brakes. Neither scenario is acceptable.</p>
<p>The suspension components you've upgraded are worth protecting. Limit straps are the cheapest, most effective insurance in off-road building. Install them before your first run on the new coilovers.</p>

<h2>Bull Strap Limit Straps</h2>
<p>Bull Strap limit straps are made from 2-inch mil-spec webbing with heat-treated 4130 Chromoly Clevis ends. They're built to handle the load of a full-size truck at full droop — repeatedly, in the dirt, in extreme temperatures. The adjustable Clevis design lets you set exact droop limits without cutting or splicing.</p>
<p>Available in multiple lengths to fit any build from mild daily-driven 2-inch lift to hardcore long-travel prerunner setups.</p>`
  },
  {
    title: 'The Complete Suspension Build Checklist: What to Buy, What Order to Buy It',
    tags: 'suspension,limit-straps,coilovers,lift-kit,jeep,truck,off-road',
    body_html: `<p>A proper suspension build isn't a single purchase — it's a system. Every component affects every other component. Buy them in the wrong order and you'll be reinstalling things you already installed, or worse, finding out on the trail that something doesn't fit.</p>
<p>This is the order of operations for a serious lifted suspension build, from planning to first trail run.</p>

<h2>Phase 1: Define Your Build Goals</h2>
<p>Before you order a single part, know what you're building toward. There's a significant difference between a mild 2-inch lift for daily driving with occasional trails, a 4-inch mid-travel setup for weekend wheeling, and a long-travel prerunner build. Each calls for completely different components at completely different price points.</p>
<p>Your build goal determines: lift height, coilover vs leaf spring vs coilover + bypass, whether you need UCAs, what size tires you can fit, and what the total cost will actually be.</p>

<h2>Phase 2: Coilovers / Main Suspension</h2>
<p>This is the heart of the build. Whether you're running coilovers, a leaf spring pack, or a coilover + leaf combination, this determines your ride height, travel, and overall capability.</p>
<p>For coilovers: match your coilover stroke to your intended droop travel. A 14-inch stroke coilover gives you up to 14 inches of travel — but your limit straps (see below) will set the actual droop limit based on CV angle, not the full stroke.</p>
<p>For leaf springs: progressive-rate packs give better street manners. Add an add-a-leaf for more lift. Consider replacing full-length springs if you want significantly more lift without losing flex.</p>

<h2>Phase 3: Upper Control Arms (if applicable)</h2>
<p>Any lift over 2 inches on an independent front suspension (IFS) truck typically requires aftermarket upper control arms. OEM UCAs are designed for OEM geometry — add lift and the ball joint angles get extreme. Aftermarket UCAs are designed for lifted geometry, moving the ball joint to restore proper angles at ride height.</p>
<p>Install UCAs before you set your droop limits, because they directly affect where your suspension sits at various points in travel.</p>

<h2>Phase 4: Limit Straps — Do This Before You Wheel It</h2>
<p>This is the step most builders skip, then pay for later. Limit straps mechanically limit suspension droop to protect your CV axles, brake lines, and lower control arms from reaching angles that cause failure.</p>
<p>The sizing process: with the vehicle on a lift, drop the suspension and watch your CV angles. When the CV reaches its safe limit (typically 25 degrees), measure from axle mount to frame mount. That's your strap length.</p>
<p>Bull Strap limit straps install in 15 minutes and cost a fraction of the components they protect. Do this before the first trail run, not after the first CV failure.</p>

<h2>Phase 5: Extended Brake Lines</h2>
<p>Now that your limit straps are set and you know your exact droop limit, size your brake lines. Extended stainless steel braided lines need to reach full droop (as defined by your limit straps) with a small amount of slack — not tension, not excess sag.</p>
<p>Install these before wheeling. Snapped brake lines on the trail are not a recoverable situation.</p>

<h2>Phase 6: Alignment and Setup</h2>
<p>Every suspension change needs an alignment. After major lift kit installation, get a full 4-wheel alignment with caster correction if your vehicle allows it. Added caster improves high-speed stability on lifted rigs.</p>
<p>Also set your coilover perches (if adjustable) to dial in exact ride height before alignment — alignment needs to be set at ride height, not on a lift.</p>

<h2>Phase 7: First Drive and Inspection</h2>
<p>Drive 50 miles. Lift it back up and inspect every bolt for proper torque. Coilovers and control arms settle slightly after initial miles. Recheck limit strap attachment points. Check for brake line chafe. Look at CV angles at ride height and at full droop one more time.</p>
<p>Then drive 500 miles and repeat. After that, your build is settled and ready for serious use.</p>

<h2>Total Component List</h2>
<ul>
<li>Coilovers / lift springs (main suspension)</li>
<li>Upper control arms (IFS builds over 2 inches)</li>
<li><strong>Limit straps (every lifted build with coilovers)</strong></li>
<li>Extended brake lines (any lift that increases droop)</li>
<li>Alignment (mandatory after install)</li>
<li>Optional: bump stops, skid plates, differential drop brackets</li>
</ul>`
  }
];

async function pushCollectionContent(collection) {
  if (!collection.body_html) return;
  
  // Find collection by handle
  const r = await shopifyRequest('GET', `/admin/api/2026-01/collections.json?handle=${collection.handle}&limit=5`);
  if (!r.body.collections || !r.body.collections.length) {
    console.log(`Collection not found: ${collection.handle}`);
    return;
  }
  
  const coll = r.body.collections[0];
  const collId = coll.id;
  const collType = coll.admin_graphql_api_id?.includes('CustomCollection') || coll.hasOwnProperty('sort_order') ? 'custom_collections' : 'smart_collections';
  
  // Update collection body
  const upd = await shopifyRequest('PUT', `/admin/api/2026-01/${collType}/${collId}.json`, {
    [collType.replace('_collections', '_collection')]: {
      id: collId,
      body_html: collection.body_html
    }
  });
  
  if (upd.status === 200) {
    console.log(`✅ ${collection.handle} — content updated (${Math.round(collection.body_html.length/5)} words approx)`);
  } else {
    console.log(`❌ ${collection.handle} — HTTP ${upd.status}`);
  }
  await sleep(600);
}

async function pushBlogPost(post) {
  // Get blog ID
  const blogs = await shopifyRequest('GET', '/admin/api/2026-01/blogs.json?limit=5');
  const blog = (blogs.body.blogs || []).find(b => b.handle === 'news' || b.title.toLowerCase().includes('news'));
  if (!blog) { console.log('Blog not found'); return; }
  
  const r = await shopifyRequest('POST', `/admin/api/2026-01/blogs/${blog.id}/articles.json`, {
    article: {
      title: post.title,
      body_html: post.body_html,
      tags: post.tags,
      published: true,
      published_at: new Date().toISOString()
    }
  });
  
  if (r.status === 201) {
    console.log(`✅ Blog: "${post.title.substring(0,60)}..." — published`);
  } else {
    console.log(`❌ Blog failed: HTTP ${r.status}`);
  }
  await sleep(800);
}

async function main() {
  console.log('=== Bull Strap Suspension Content Push ===');
  
  // Push collection content
  console.log('\n--- Collection Pages ---');
  for (const coll of COLLECTIONS) {
    if (coll.body_html) await pushCollectionContent(coll);
  }
  
  // Push blog posts
  console.log('\n--- Blog Posts ---');
  for (const post of BLOG_POSTS) {
    await pushBlogPost(post);
  }
  
  console.log('\nDone. Queue these URLs for Google indexing tonight.');
}

main().catch(e => console.error('Fatal:', e.message));
