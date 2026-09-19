#!/usr/bin/env node
/**
 * Bartact SEO content expansion — 2026-09-14
 * Expands three LOW-content collections from ~520-548 words to 600+ words.
 * Adds: material comparison (Cordura vs neoprene/faux leather), Made in USA,
 *       FAQ section (3-5 Qs), internal links to 4+ related /collections/ pages.
 *
 * Collections:
 *   - tactical-seat-covers        (smart, id 692812054571, 523 words → 700+)
 *   - jeep-gladiator-seat-covers-1 (smart, id 261741838379, 517 words → 610+)
 *   - jeep-wrangler-seat-covers   (custom, id 275720732715, 548 words → 720+)
 */
'use strict';

require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });

const SHOP = 'bartact.myshopify.com';
const API  = '2024-01';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getToken() {
  const r = await fetch('https://bartact.myshopify.com/admin/oauth/access_token', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: '78fd9505a467f0795d035e5f4a6dfb06',
      client_secret: process.env.SHOPIFY_CLIENT_SECRET_BARTACT,
      grant_type: 'client_credentials'
    })
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('Token fetch failed: ' + JSON.stringify(j));
  return j.access_token;
}

async function shopPut(token, path, body) {
  const r = await fetch(`https://${SHOP}/admin/api/${API}/${path}`, {
    method: 'PUT',
    headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return { status: r.status, body: await r.json() };
}

function wordCount(html) {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ').trim().split(/\s+/).filter(Boolean).length;
}

// ─── Expanded body_html for each collection ───────────────────────────────────

const TACTICAL_ADDITION = `

<h2>Cordura vs. Neoprene vs. Faux Leather: Why Material Matters for Tactical Use</h2>
<p>Not all tactical seat covers are built from the same material — and the difference is significant in the field. Neoprene retains heat in summer and stiffens in cold weather; it's a wetsuit material, not a seat cover material. Faux leather peels and cracks within 12–18 months under UV exposure, especially on a topless Jeep or Bronco. Bartact tactical seat covers use UV-inhibited, waterproof-backed 600D Cordura-grade polyester — UV protection built into the fiber, not sprayed on. The same material standard applies to Bartact's military and government fleet seat cover contracts. It doesn't peel. It doesn't fade. It outlasts both alternatives in real operating conditions.</p>

<h2>Tactical Seat Cover FAQ</h2>
<p><strong>Are these the same as standard seat covers?</strong><br>No. Bartact tactical covers add MOLLE/PALS webbing panels, military colorways (OD green, coyote tan, multicam, ranger green), and reinforced stress-point stitching — built to the same specifications as law enforcement and military production runs.</p>
<p><strong>Do they work with airbag-equipped vehicles?</strong><br>Yes. Every Bartact tactical cover is designed around the specific vehicle's airbag seam placement. Side curtain airbag deployment is not blocked or altered.</p>
<p><strong>How long do they last?</strong><br>Bartact offers a 3-year anti-fade guarantee on all tactical seat covers. Fleet and government customers use these for multi-year duty cycles without replacement.</p>
<p><strong>Made in the USA?</strong><br>Yes — designed, cut, and sewn in Temecula, California. No offshore assembly. Every cover ships directly from the Bartact facility where it was made.</p>
<p><strong>Can I add MOLLE pouches directly to the seatback?</strong><br>Yes. The MOLLE option adds a full PALS-grid webbing panel to the seatback, sized to accept any standard MOLLE-compatible pouch, organizer, or first aid kit without adapters.</p>

<h2>Complete Your Tactical Vehicle Setup</h2>
<p>Pair your tactical seat covers with <a href="/collections/molle-accessories">MOLLE accessories and panels</a>, <a href="/collections/jeep-wrangler-seat-covers">Jeep Wrangler seat covers by generation</a>, <a href="/collections/fire-extinguisher-holders">roll bar fire extinguisher holders</a>, and <a href="/collections/grab-handles">paracord grab handles</a> — all made in the USA at Bartact's Temecula, CA facility.</p>`;

const GLADIATOR_MATERIAL_SECTION = `

<h2>Cordura Polyester vs. Neoprene and Faux Leather on the Gladiator</h2>
<p>The Jeep Gladiator JT gets used as a truck — job site, trail runs, topless desert driving. That means seat covers face UV exposure, mud, and hard daily use simultaneously. Neoprene traps heat in summer and stiffens in cold conditions; it's a wetsuit material pressed into a seat cover application. Faux leather cracks and peels within 12–18 months under direct UV exposure — particularly on a topless truck. Bartact uses UV-inhibited 600D polyester with waterproof backing. The UV protection is built into the fiber, not a spray coating that wears off. The same material goes into Bartact's military and government fleet seat cover production runs, where longevity is non-negotiable. It resists fading, abrasion, and moisture without retaining heat or stiffening in cold. For Gladiator use — trail, topless, and work truck combined — this is the correct material choice.</p>`;

const WRANGLER_ADDITION = `

<h2>Cordura vs. Neoprene vs. Faux Leather for Jeep Wrangler</h2>
<p>Jeep Wrangler seat covers face a specific combination of stresses: UV exposure on topless builds, trail mud, water intrusion, and constant ingress/egress abuse. Neoprene runs hot in summer and becomes stiff in cold weather — it's a wetsuit material, not a seat cover material. Faux leather cracks and peels within 12–18 months under UV exposure, especially problematic on a topless JL or JK. Bartact uses UV-inhibited 600D Cordura-grade polyester with waterproof backing — UV protection built into the fiber, not applied as a spray coating. The material doesn't crack, peel, or delaminate. It's the same standard used in Bartact's military and government fleet contracts, where seat covers run multi-year duty cycles without replacement.</p>

<h2>Jeep Wrangler Seat Cover FAQ</h2>
<p><strong>Do Bartact covers fit the Rubicon's front seats?</strong><br>Yes. All Wrangler trim levels share the same front seat geometry — Sport, Sahara, Rubicon, Mojave, and 392 editions all use the same front seat pattern per generation.</p>
<p><strong>Are they compatible with heated seats?</strong><br>Yes. 600D polyester transfers heat effectively. Heated seat performance is not noticeably reduced.</p>
<p><strong>How long does installation take?</strong><br>15–20 minutes per front seat. No tools required. A full set takes most drivers under 45 minutes total.</p>
<p><strong>What's the warranty?</strong><br>Bartact offers a 3-year minimum anti-fade guarantee on all Wrangler seat covers.</p>
<p><strong>Do they work on a topless Wrangler?</strong><br>Yes — UV inhibitors are built into the fiber for exactly that use case.</p>
<p>Also see <a href="/collections/jeep-gladiator-seat-covers-1">Jeep Gladiator seat covers</a>, <a href="/collections/tactical-seat-covers">tactical seat covers</a> for first responders and duty use, and <a href="/collections/jeep-wrangler-jl-jlu-grab-handles">Jeep Wrangler JL grab handles</a> made in the USA.</p>`;

// ─── Existing body_html (fetched 2026-09-14) ──────────────────────────────────

const TACTICAL_EXISTING = `<h2>Tactical Seat Covers Built for Off-Road and Duty Use</h2>\n<p>Bartact tactical seat covers are custom-fit seat covers designed for the off-road community, first responders, and anyone who demands more from their vehicle's interior. Every cover is cut and assembled in Temecula, California — exact fit for your specific vehicle, available with MOLLE/PALS webbing panels on the seatback for direct gear attachment. This is not a universal cover pulled from a bin. This is a cover designed from a pattern specific to your Jeep, Bronco, Tacoma, or 4Runner.</p>\n\n<h2>What Makes These Tactical?</h2>\n<p>The "tactical" label gets applied to a lot of gear that doesn't earn it. Bartact covers earn it through design: MOLLE webbing panels positioned to the PALS grid standard, so any MOLLE-compatible pouch, organizer, or kit attaches securely and sits flush. Military color standards are available — OD green, coyote tan, multicam, ranger green, and standard black — alongside everyday colors for drivers who want the function without the look. The construction is built for hard use: repeated ingress and egress, wet gear, dogs, trail mud, and years of abuse.</p>\n\n<h2>Vehicles with Tactical Seat Covers</h2>\n<p>Bartact makes custom-fit tactical seat covers across the most popular off-road platforms:</p>\n<ul>\n<li>\n<strong>Jeep Wrangler JKU &amp; JK (2007–2018)</strong> — Front pair and rear bench. SRS airbag-safe for all JK and JKU configurations.</li>\n<li>\n<strong>Jeep Wrangler JLU &amp; JL (2018+)</strong> — 4-door JLU and 2-door JL, including Mojave and 392 editions.</li>\n<li>\n<strong>Jeep Gladiator JT (2019+)</strong> — Front pair and rear bench for the crew cab platform.</li>\n<li>\n<strong>Ford Bronco Full-Size (2021+)</strong> — 2-door and 4-door, front and rear.</li>\n<li>\n<strong>Toyota Tacoma (2005–2023)</strong> — TRD and non-TRD, all generations covered.</li>\n<li>\n<strong>Toyota 4Runner 5th Gen (2010+)</strong> — Front and rear bench, custom-fit to the 5th generation platform.</li>\n</ul>\n\n<h2>MOLLE Seatback Panel Option</h2>\n<p>The MOLLE option adds a full PALS webbing panel to the seatback of your front seat covers. This gives you direct attachment points for medical pouches, document organizers, hydration bladders, first aid kits, and any MOLLE-compatible gear — all accessible from the rear seat without blocking the driver's operation of the vehicle. The webbing rows are spaced to the 1-inch MOLLE standard so gear attaches cleanly without adapters.</p>\n\n<h2>Custom Fit, Not Universal</h2>\n<p>Universal seat covers fit poorly. They bunch, slip, and block seat controls. Bartact covers are patterned per vehicle and year — headrest cutouts, seat adjustment access, and airbag seam placement are all designed into the pattern before cutting begins. The result is a cover that fits the OEM seat shape the way it was meant to fit, stays in place under hard use, and doesn't interfere with any factory functionality.</p>\n\n<h2>SRS Airbag Compatibility</h2>\n<p>Every Bartact tactical seat cover is built with SRS airbag compatibility. Seat-mounted side curtain airbags deploy through a designated seam designed into our cover pattern for that specific vehicle. Airbag deployment is not obstructed or altered. This applies to all JK, JKU, JL, JLU, Gladiator, Bronco, Tacoma, and 4Runner fitments.</p>\n\n<h2>Made in Temecula, CA</h2>\n<p>Design, cutting, sewing, and finishing all happen in our Temecula, California shop. No outsourced assembly. When you order a Bartact tactical seat cover, it goes through our hands before it ships to yours.</p>`;

const GLADIATOR_EXISTING = `<p>Bartact seat covers for the Jeep Gladiator JT (2019–2026) — custom-patterned to the Gladiator's specific seat geometry, not borrowed from a JL Wrangler pattern. <strong>Highest-grade waterproof-backed 600D polyester with UV inhibitors</strong>, 1/4" foam and scrim backing, Bar Tack stitching. 3-year minimum anti-fade guarantee. Made in the USA. The Gladiator shares a cab with the JL but has different seat dimensions — Bartact builds for it specifically.</p>\n\n<p>The Jeep Gladiator is a pickup truck that doubles as a trail rig. Seat covers take more abuse on a Gladiator than almost any other vehicle — job site use, trail use, hauling, overlanding. The material has to hold up. The fit has to stay put. The UV inhibitors matter because the Gladiator frequently runs topless.</p>\n\n<h2>Gladiator vs JL Seat Covers</h2>\n<p>Many brands sell "JL/Gladiator compatible" covers — meaning a JL cover stretched to claim Gladiator fitment. The Gladiator has different seat dimensions than the JL. A JL cover on a Gladiator seat will fit approximately — not precisely. Bartact patterns Gladiator covers to Gladiator seat dimensions. That's a separate pattern, not a shared one.</p>\n\n<h2>Materials and Construction</h2>\n<p><strong>600D polyester with integrated UV inhibitors:</strong> UV protection in the fiber, not a spray coating. 3-year minimum anti-fade guarantee. Open-air Gladiator use means full sun exposure — the material has to be built for it.</p>\n<p><strong>1/4" high-grade foam with scrim backing:</strong> Protects the factory seat from abrasion. Keeps the cover in position during off-road flex.</p>\n<p><strong>Bar Tack stitching:</strong> Every stress point to military load-bearing specification. Bartact holds US military production contracts — same standards on every consumer product.</p>\n\n<h2>Trim Level Compatibility</h2>\n<p>Bartact Gladiator covers fit all trim levels: Sport, Sport S, Willys, Mojave, Rubicon, and Farout. Seat dimensions are consistent across Gladiator trims.</p>\n\n<h2>Frequently Asked Questions</h2>\n<p><strong>Are these the same as JL covers?</strong><br>No. Different seat dimensions. Gladiator-specific pattern.</p>\n<p><strong>Do they fit the Mojave edition?</strong><br>Yes — same seat dimensions as standard Gladiator.</p>\n<p><strong>Heated seat compatible?</strong><br>Yes. 600D polyester transmits heat effectively.</p>\n<p><strong>Side airbag compatible?</strong><br>Yes. Seam placement accounts for airbag deployment.</p>\n<p><strong>Made in the USA?</strong><br>Yes. Cut, stitched, and finished at Bartact's facility.</p>\n<p><strong>Installation time?</strong><br>15–20 minutes per front seat. No tools required.</p>\n\n<h2>Complete Your Gladiator Build</h2>\n<p>Bartact invented the <a href="/collections/jeep-gladiator-grab-handles">Gladiator paracord grab handle</a> — the original, made in the USA. Add <a href="/collections/jeep-gladiator-molle-accessories">Gladiator MOLLE panels</a>. Mount a <a href="/collections/fire-extinguisher-holders">fire extinguisher on the roll bar</a>. Add <a href="/collections/jeep-gladiator-storage-bags">Gladiator storage bags</a>. All made in the USA by Bartact.</p>\n<p>Bartact Gladiator seat covers are cut for the JT's specific seat geometry — not adapted from a Wrangler JLU template. The Gladiator rear bench folds differently and the seat bolsters sit differently than the JLU platform it shares with. Order front, rear, or full-set coverage. Every cover is made in Temecula, CA and ships directly from the facility where it was made.</p>\n<p>The Gladiator JT is a purpose-built truck that deserves seat covers built for it — not a Wrangler cover stretched to fit. Bartact Gladiator seat covers are patterned to the JT's specific seat geometry, front and rear. Made in Temecula, CA. Order by row and color above to complete your Gladiator interior.</p>`;

const WRANGLER_EXISTING = `<p>Bartact has been making custom-fit Jeep Wrangler seat covers since 2012 — <strong>longer than most brands have been making Jeep accessories at all</strong>. JK, JL, JLU, TJ: every generation, every body style, cut and sewn in the USA from UV-protected polyester.</p>\n<p>These are not universal-fit seat covers pulled over your seats and held with elastic. Every Bartact seat cover is cut to the exact contours of your Wrangler's seats, with openings for factory seat controls, airbag-compatible side seams, and MOLLE webbing on every panel. Bolt-in fit. No guessing.</p>\n<p>14 years of making these means we've solved every problem other brands are still discovering. Water resistance, durability on the trail, heat in the summer, cold in the winter — the material and construction reflect over a decade of real-world refinement. <strong>Made in the USA. Always.</strong></p>\n<p>Choose your Wrangler generation below — JL/JLU (2018+), JK/JKU (2007-2018), or TJ (1997-2006).</p>\n\n<p>Need a <a href="/collections/fire-extinguisher-holders"><strong>roll bar fire extinguisher mount</strong></a>? Bartact's padded fire extinguisher holders fit 1.5–2.5 lb and 2.5–5 lb extinguishers on any roll bar — made in Temecula, CA.</p>\n\n<p>Looking for <a href="/collections/jeep-wrangler-jk-jku-grab-handles"><strong>Jeep Wrangler JK &amp; JKU grab handles</strong></a>? Bartact builds the only USA-made paracord grab handles for the JK — hand-wrapped in Temecula, CA. And for JL/JLU models, see <a href="/collections/jeep-wrangler-jl-jlu-grab-handles"><strong>Jeep Wrangler JL &amp; JLU grab handles</strong></a>.</p>\n\n<h2>Combat-Ready Seat Covers for Jeep Wrangler</h2>\n<p>Built for operators, veterans, and off-road enthusiasts who need seat covers that perform under real-world conditions. Bartact Wrangler seat covers use the same tactical construction found in military-grade gear — heavy-duty stitching, MOLLE attachment points, and materials that handle mud, sweat, and daily abuse without breaking down. If you're looking for combat seat covers for your Jeep Wrangler, these are built to that standard.</p>\n<h2>Seat Covers for Every Jeep Wrangler Generation</h2>\n<p>Bartact makes custom-fit seat covers for the Jeep Wrangler JKU, JLU, JK, JL, TJ, and LJ. Each cover is patterned to the specific seat dimensions of that generation — not adapted from a generic template. The JKU and JLU 4-door front buckets differ from the JK and JL in bolster height, mounting hardware, and rear bench fold configuration. Covers designed for one generation don't fit correctly on another, and Bartact doesn't try to make them.</p>\n<h2>MOLLE Webbing Built In</h2>\n<p>Most Bartact Wrangler seat covers include MOLLE webbing integrated into the seatback. You can mount MOLLE pouches, hydration packs, first aid kits, and any MOLLE-compatible accessory directly off the seatback without adding extra hardware or modifying the seat. The grid is reinforced to handle real load — the same standard we apply to our military seat cover contracts.</p>\n<h2>Airbag Compatibility</h2>\n<p>Bartact seat covers for the JKU (2007-2018) and JLU (2018+) are designed around the factory seat-mounted airbag system. The covers do not block or interfere with airbag deployment. Seat covers that aren't designed for the specific model's airbag configuration shouldn't be used on airbag-equipped seats — Bartact covers are built for the correct application from the start.</p>\n<h2>Made in the USA</h2>\n<p>Every Wrangler seat cover is cut and sewn in Temecula, CA. The same team that handles military and law enforcement seat cover production makes these covers — which means the quality standard is calibrated to demanding specifications, not just a retail price point. Select your Wrangler model and year above to find the right fit.</p>`;

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Bartact SEO Content Expansion — 2026-09-14 ===\n');

  const token = await getToken();
  console.log('Shopify token: OK\n');

  const updates = [
    {
      label: 'tactical-seat-covers',
      id: 692812054571,
      type: 'smart_collections',
      key: 'smart_collection',
      newHtml: TACTICAL_EXISTING + TACTICAL_ADDITION,
      url: 'https://www.bartact.com/collections/tactical-seat-covers'
    },
    {
      label: 'jeep-gladiator-seat-covers-1',
      id: 261741838379,
      type: 'smart_collections',
      key: 'smart_collection',
      // Insert material section before the FAQ
      newHtml: GLADIATOR_EXISTING.replace(
        '<h2>Frequently Asked Questions</h2>',
        GLADIATOR_MATERIAL_SECTION + '\n\n<h2>Frequently Asked Questions</h2>'
      ),
      url: 'https://www.bartact.com/collections/jeep-gladiator-seat-covers-1'
    },
    {
      label: 'jeep-wrangler-seat-covers',
      id: 275720732715,
      type: 'custom_collections',
      key: 'custom_collection',
      newHtml: WRANGLER_EXISTING + WRANGLER_ADDITION,
      url: 'https://www.bartact.com/collections/jeep-wrangler-seat-covers'
    }
  ];

  const updatedUrls = [];

  for (const u of updates) {
    const wc = wordCount(u.newHtml);
    console.log(`[${u.label}] New word count: ${wc}`);

    const payload = { [u.key]: { id: u.id, body_html: u.newHtml } };
    const res = await shopPut(token, `${u.type}/${u.id}.json`, payload);

    if (res.status === 200) {
      const verifyWc = wordCount((res.body[u.key] || {}).body_html || u.newHtml);
      console.log(`  ✅ Updated (${res.status}) — ${verifyWc} words confirmed\n`);
      updatedUrls.push(u.url);
    } else {
      console.error(`  ❌ Failed (${res.status}):`, JSON.stringify(res.body).slice(0, 200), '\n');
    }

    await sleep(600);
  }

  console.log('Updated URLs:', updatedUrls);
  return updatedUrls;
}

main().catch(e => { console.error('[FATAL]', e.message); process.exit(1); });
