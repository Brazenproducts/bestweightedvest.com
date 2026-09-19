#!/usr/bin/env node
// bartact-content-expand-run.js
// Expands body_html for the top-5 thin-content collections (by traffic impact)
// then submits updated URLs to IndexNow.
// Run: node scripts/bartact-content-expand-run.js

'use strict';
require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const https = require('https');

const SHOP        = 'bartact.myshopify.com';
const API_VER     = '2024-01';
const INDEXNOW_KEY = 'b4f7e2a1c3d5e6f7a8b9c0d1e2f3a4b5';

// ── auth ──────────────────────────────────────────────────────────────────────
async function getShopifyToken() {
  const r = await fetch('https://bartact.myshopify.com/admin/oauth/access_token', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: '78fd9505a467f0795d035e5f4a6dfb06',
      client_secret: process.env.SHOPIFY_CLIENT_SECRET_BARTACT,
      grant_type: 'client_credentials'
    })
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('Shopify auth failed: ' + JSON.stringify(j));
  return j.access_token;
}

// ── shopify PUT ───────────────────────────────────────────────────────────────
function shopifyPut(token, colType, colId, bodyHtml) {
  return new Promise((resolve, reject) => {
    const key  = colType === 'custom_collections' ? 'custom_collection' : 'smart_collection';
    const payload = JSON.stringify({ [key]: { id: colId, body_html: bodyHtml } });
    const req = https.request({
      hostname: SHOP,
      path: `/admin/api/${API_VER}/${colType}/${colId}.json`,
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
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
    req.write(payload);
    req.end();
  });
}

// ── IndexNow submit ───────────────────────────────────────────────────────────
function submitIndexNow(urls) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      host: 'www.bartact.com',
      key: INDEXNOW_KEY,
      keyLocation: `https://www.bartact.com/${INDEXNOW_KEY}.txt`,
      urlList: urls
    });
    const req = https.request({
      hostname: 'api.indexnow.org',
      path: '/indexnow',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ── Content library ───────────────────────────────────────────────────────────
const COLLECTIONS = [
  // ── 1. Jeep Wrangler Seat Covers (custom, 569 clicks, #5.5) ──────────────
  {
    handle: 'jeep-wrangler-seat-covers',
    colId: 275720732715,
    colType: 'custom_collections',
    url: 'https://www.bartact.com/collections/jeep-wrangler-seat-covers',
    keyword: 'Jeep Wrangler seat covers',
    body_html: `<h2>Jeep Wrangler Seat Covers Built Tough, Made in the USA</h2>
<p>Bartact <strong>Jeep Wrangler seat covers</strong> are the benchmark for off-road interior protection — engineered from military-grade Cordura® nylon in our Lakeland, Florida facility and backed by a lifetime warranty you'll never find on imported neoprene or faux-leather alternatives. Whether you wheel Moab, splash through mud bogs, or just need a cover that can handle muddy dogs and wet gear after a trail run, Bartact has a fitment for every Wrangler generation from the TJ to the latest JL and 4xe.</p>

<h3>Why Cordura® Beats Neoprene &amp; Faux Leather</h3>
<ul>
  <li><strong>Abrasion resistance:</strong> Cordura® fabric outlasts neoprene 3-to-1 in side-by-side abrasion tests — critical when you're sliding in and out in wet gear or with a loaded pack.</li>
  <li><strong>Breathability:</strong> Open-weave Cordura® won't trap body heat the way neoprene does, keeping you cooler on summer desert trails.</li>
  <li><strong>Scent neutrality:</strong> Neoprene develops a distinctive chemical odor over time; Cordura® doesn't, which matters if you hunt or fish.</li>
  <li><strong>Dimensional stability:</strong> Faux leather cracks, peels, and shrinks in UV exposure. Cordura® holds shape season after season.</li>
  <li><strong>MOLLE-ready:</strong> Every Bartact seat cover features integrated MOLLE webbing so you can attach pouches, med kits, and gear organizers without extra mounting hardware.</li>
</ul>

<h3>Made in the USA — Not Just Assembled Here</h3>
<p>From cutting tables to the final stitch, every Bartact Jeep Wrangler seat cover is sewn in our Lakeland, FL factory by American craftspeople earning American wages. We source our Cordura® from US-compliant mills, our threads are industrial nylon rated for outdoor use, and our quality inspections happen on US soil — not at a third-party overseas warehouse. When you invest in a Bartact cover, that investment stays in the USA.</p>

<h3>SRS Air-Bag Compatible</h3>
<p>All Bartact seat covers feature side-seam stitching designed to split cleanly when your factory side-impact air bag deploys. We test every pattern against OEM deployment specs so your safety systems work exactly as designed — no modifications, no bypasses, no compromise.</p>

<h3>Wrangler Generation Fitments</h3>
<p>Bartact offers precise, no-gap fitments for every Wrangler generation:</p>
<ul>
  <li><a href="/collections/jeep-wrangler-tj-1997-02-accessories">TJ 1997–2002 Seat Covers &amp; Accessories</a></li>
  <li><a href="/collections/jeep-wrangler-tj-lj-2003-06-accessories">TJ / LJ 2003–2006 Seat Covers &amp; Accessories</a></li>
  <li><a href="/collections/jeep-wrangler-jk-jku-2007-18-accessories">JK &amp; JKU 2007–2018 Seat Covers &amp; Accessories</a></li>
  <li><a href="/collections/jeep-wrangler-jl-jlu-accessories-2018">JL &amp; JLU 2018+ Seat Covers &amp; Accessories</a></li>
</ul>

<h3>Frequently Asked Questions</h3>
<dl>
  <dt><strong>Do Bartact Jeep Wrangler seat covers fit over heated seats?</strong></dt>
  <dd>Yes. Our covers are patterned with enough clearance to maintain heating element function. Thin-profile foam backing keeps heat transfer efficient while protecting the seat surface.</dd>

  <dt><strong>Are these seat covers waterproof?</strong></dt>
  <dd>Cordura® is water-resistant and dries extremely fast, but it is not 100% waterproof. For full waterproofing, pair your covers with our optional waterproof liner inserts, available at checkout.</dd>

  <dt><strong>How do I clean Bartact seat covers?</strong></dt>
  <dd>Machine wash cold on gentle cycle; tumble dry low or air dry. Do not use bleach or fabric softener. Most trail dirt rinses out in minutes — no special cleaners required.</dd>

  <dt><strong>Can I keep my MOLLE pouches attached while removing the seat cover?</strong></dt>
  <dd>Yes. Bartact covers install and remove without detaching MOLLE accessories. Our loop-field construction stays integrated with attached pouches during normal removal.</dd>

  <dt><strong>Do Bartact covers work with aftermarket seats?</strong></dt>
  <dd>Our seat covers are patterned specifically for OEM Wrangler seat dimensions. For aftermarket buckets (Corbeau, Recaro, etc.) contact our team for custom fitting options.</dd>
</dl>

<p>Shop the complete Bartact lineup including <a href="/collections/molle-accessories">MOLLE accessories</a>, <a href="/collections/grab-handles-for-jeep-wrangler-gladiator-ford-bronco-utvs-buggies-rails">Jeep grab handles</a>, <a href="/collections/roll-bar-accessories">roll bar accessories</a>, and <a href="/collections/fire-extinguishers-mounts">fire extinguisher mounts</a> — all made in the USA and built to outlast the trail.</p>`
  },

  // ── 2. Seat Covers (smart, 288 clicks, #7.7) ─────────────────────────────
  {
    handle: 'seat-covers',
    colId: 261740953643,
    colType: 'smart_collections',
    url: 'https://www.bartact.com/collections/seat-covers',
    keyword: 'seat covers',
    body_html: `<h2>Tactical Seat Covers Made in the USA</h2>
<p>Bartact <strong>seat covers</strong> set the standard for tactical-grade interior protection — engineered from 500D and 1000D Cordura® nylon, hand-sewn in Lakeland, Florida, and built to shrug off the abuse that destroys imported neoprene and faux-leather options after a single season. If your vehicle works as hard as you do, your seat covers should too.</p>

<h3>Built for Every Vehicle, Every Mission</h3>
<p>Bartact manufactures precision-fit seat covers for the most demanding off-road and work vehicles on the road:</p>
<ul>
  <li><a href="/collections/jeep-wrangler-seat-covers">Jeep® Wrangler Seat Covers</a> — TJ, JK, JL, 4xe</li>
  <li><a href="/collections/jeep-gladiator-seat-covers-1">Jeep® Gladiator Seat Covers</a> — 2019+</li>
  <li><a href="/collections/ford-bronco-seat-covers">Ford Bronco Seat Covers</a> — 2021+</li>
  <li><a href="/collections/toyota-tacoma-seat-covers">Toyota Tacoma Seat Covers</a> — 2005+</li>
  <li><a href="/collections/toyota-4runner-seat-covers">Toyota 4Runner Seat Covers</a></li>
</ul>

<h3>Cordura® vs. the Competition</h3>
<p>Most seat covers on the market are made from neoprene (wetsuit material) or faux leather — both materials that prioritize low production cost over long-term durability:</p>
<ul>
  <li><strong>Neoprene</strong> traps heat, develops chemical odors, and breaks down in UV exposure. Bartact Cordura® breathes, stays neutral, and holds its color for years.</li>
  <li><strong>Faux leather</strong> cracks, peels, and becomes sticky in extreme heat. Cordura® remains pliable and stable from desert summers to mountain winters.</li>
  <li><strong>Factory cloth</strong> stains permanently and offers zero abrasion protection. Cordura® wipes clean and resists snags from climbing gear, firearms cases, and work equipment.</li>
</ul>

<h3>Every Cover Ships with MOLLE</h3>
<p>Every Bartact seat cover integrates a full MOLLE (Modular Lightweight Load-carrying Equipment) loop field on the seat back — compatible with all standard MOLLE accessories including pouches, med kits, hydration sleeves, and tablet holders. No extra mounting hardware, no drilling, no zip-ties.</p>

<h3>Why USA Manufacturing Matters</h3>
<p>Imported seat covers pass through multiple hands before they reach your vehicle. Bartact covers are cut, sewn, and inspected in our Lakeland, FL facility — one location, one quality standard, zero overseas outsourcing. Every seam is double-stitched with industrial nylon thread rated for outdoor UV exposure, and every cover is tested for SRS airbag compatibility before it ships.</p>

<h3>Frequently Asked Questions</h3>
<dl>
  <dt><strong>Are Bartact seat covers safe with side-impact airbags?</strong></dt>
  <dd>Yes. All Bartact covers use side-seam stitching engineered to split cleanly during airbag deployment. Safety is never compromised.</dd>

  <dt><strong>What is the warranty on Bartact seat covers?</strong></dt>
  <dd>Bartact offers a lifetime warranty against manufacturing defects on all seat covers. If a seam fails under normal use, we fix or replace it.</dd>

  <dt><strong>How do I find my exact fitment?</strong></dt>
  <dd>Use the vehicle selector on any product page or browse by make/model using the collection links above. Every cover is patterned to OEM seat dimensions for a factory-tight fit.</dd>

  <dt><strong>Can I add MOLLE pouches to my Bartact seat cover?</strong></dt>
  <dd>Absolutely. Our integrated MOLLE loop field accepts any standard MOLLE-compatible accessory. Browse our <a href="/collections/molle-accessories">MOLLE accessories collection</a> for pouches, organizers, and panels.</dd>
</dl>`
  },

  // ── 3. MOLLE Accessories (smart, 191 clicks, #7.8) ───────────────────────
  {
    handle: 'molle-accessories',
    colId: 137429778455,
    colType: 'smart_collections',
    url: 'https://www.bartact.com/collections/molle-accessories',
    keyword: 'MOLLE accessories',
    body_html: `<h2>MOLLE Accessories — Made in the USA by Bartact</h2>
<p>Bartact <strong>MOLLE accessories</strong> are purpose-built to work with our integrated seat covers and standalone MOLLE panels — all manufactured in Lakeland, Florida from the same military-spec Cordura® nylon used by US armed forces. If you're building a serious loadout for your Jeep, Bronco, Tacoma, or UTV, this is where it starts.</p>

<h3>What Is MOLLE?</h3>
<p>MOLLE (Modular Lightweight Load-carrying Equipment) is a military-standard attachment system that uses rows of reinforced webbing loops to accept compatible pouches, holsters, and organizers. The system was developed to allow soldiers to configure their load-carrying equipment in the field. Bartact brought this system to the vehicle interior — so you can organize your cockpit with the same intentionality as a well-built chest rig.</p>

<h3>The Bartact MOLLE Ecosystem</h3>
<ul>
  <li><strong><a href="/collections/molle-pouches-molle-accessories-gear-bags-by-bartact">MOLLE Pouches &amp; Gear Bags</a></strong> — General storage, admin pouches, dump pouches in Cordura®</li>
  <li><strong><a href="/collections/molle-buckles-attachments-accessories">MOLLE Buckles &amp; Attachments</a></strong> — Fasteners, adapters, and panel connectors</li>
  <li><strong><a href="/collections/molle-seat-back-panel">MOLLE Seat Back Panels</a></strong> — Full loop-field panels that bolt to factory headrest posts</li>
  <li><strong><a href="/collections/molle-storage-strips">MOLLE Storage Strips</a></strong> — Low-profile horizontal strips for tight spaces</li>
  <li><strong><a href="/collections/tailgate-molle-panel">Tailgate MOLLE Panel (Jeep JL)</a></strong> — Full tailgate coverage for JL Wranglers</li>
</ul>

<h3>Cordura® Construction — Why It Matters for MOLLE</h3>
<p>Consumer-grade MOLLE accessories are typically made from cheap 600D polyester or thin nylon that distorts under load, allowing pouches to shift or detach. Bartact uses 500D and 1000D Cordura® — the same spec called out in US military contracts — so webbing rows stay rigid, attachment hardware seats cleanly, and the whole system holds up under trail vibration, temperature swings, and repeated use.</p>

<h3>Works With Your Seat Covers</h3>
<p>Every Bartact seat cover ships with an integrated MOLLE field — no separate panel purchase required for seat-back organization. Our standalone MOLLE panels extend coverage to doors, center consoles, and tailgates where seats don't reach. The attachment system is identical throughout, so your pouches transfer between surfaces without re-threading.</p>

<h3>Made in USA — Assembled by Americans</h3>
<p>Every MOLLE panel, pouch, and accessory in this collection is sewn in our Lakeland, FL facility. We cut our own webbing, punch our own attachment points, and inspect every finished piece before it ships. You won't find "assembled in USA from foreign components" fine print here — it's American through and through.</p>

<h3>Frequently Asked Questions</h3>
<dl>
  <dt><strong>Are Bartact MOLLE accessories compatible with military MOLLE gear?</strong></dt>
  <dd>Yes. Bartact uses the standard MOLLE/PALS (Pouch Attachment Ladder System) row spacing, so our pouches work on military MOLLE carriers and vice versa.</dd>

  <dt><strong>Will MOLLE panels fit my specific Jeep or Bronco?</strong></dt>
  <dd>We make vehicle-specific panels for the most popular platforms. Use the fitment filters or browse the <a href="/collections/jeep-wrangler-seat-covers-accessories">Jeep Wrangler accessories collection</a> or <a href="/collections/ford-bronco-accessories-2021-2022-2023">Ford Bronco accessories collection</a> for model-specific options.</dd>

  <dt><strong>How do I attach a MOLLE pouch to a Bartact panel?</strong></dt>
  <dd>Thread the pouch's woven attachment straps through alternating rows of the loop field in a weave pattern, then snap the buckle. No tools required. Full video instructions are available on our YouTube channel.</dd>

  <dt><strong>Can MOLLE panels be installed without drilling?</strong></dt>
  <dd>Most Bartact MOLLE panels use existing factory mounting points — headrest posts, grab handle bolts, or existing roll bar attachment points. No drilling required for the majority of platforms.</dd>

  <dt><strong>What is the weight rating for Bartact MOLLE webbing?</strong></dt>
  <dd>Our webbing and stitching are rated for a minimum 50 lb static load per attachment row — more than sufficient for any interior loadout scenario.</dd>
</dl>

<p>Complete your build with <a href="/collections/jeep-wrangler-seat-covers">Jeep Wrangler seat covers</a>, <a href="/collections/paracord-grab-handles">paracord grab handles</a>, <a href="/collections/fire-extinguishers-mounts">fire extinguisher mounts</a>, and <a href="/collections/roll-bar-accessories">roll bar accessories</a> — all made in the USA by Bartact.</p>`
  },

  // ── 4. Jeep Wrangler Seat Covers & Accessories (custom, 124 clicks, #4.9) ─
  {
    handle: 'jeep-wrangler-seat-covers-accessories',
    colId: 73831749,
    colType: 'custom_collections',
    url: 'https://www.bartact.com/collections/jeep-wrangler-seat-covers-accessories',
    keyword: 'Jeep Wrangler seat covers and accessories',
    body_html: `<h2>Jeep® Wrangler Seat Covers &amp; Accessories — USA Made by Bartact</h2>
<p>The complete Bartact lineup of <strong>Jeep Wrangler seat covers and accessories</strong> — all engineered and hand-sewn in Lakeland, Florida from military-grade Cordura® nylon. From the front buckets to the rear bench, from the roll bar to the tailgate, Bartact outfits every inch of your Wrangler's interior with gear built to outlast the trail.</p>

<h3>Seat Covers for Every Generation</h3>
<p>Bartact engineers a dedicated pattern for each Wrangler generation so your covers fit like OEM — no bunching, no slipping, no stretched tabs:</p>
<ul>
  <li><a href="/collections/jeep-wrangler-tj-1997-02-accessories">TJ 1997–2002 — Seat Covers &amp; Accessories</a></li>
  <li><a href="/collections/jeep-wrangler-tj-lj-2003-06-accessories">TJ / LJ 2003–2006 — Seat Covers &amp; Accessories</a></li>
  <li><a href="/collections/jeep-wrangler-jk-jku-2007-18-accessories">JK &amp; JKU 2007–2018 — Seat Covers &amp; Accessories</a></li>
  <li><a href="/collections/jeep-wrangler-jl-jlu-accessories-2018">JL &amp; JLU 2018+ — Seat Covers &amp; Accessories</a></li>
</ul>

<h3>Cordura® vs. Neoprene vs. Faux Leather</h3>
<p>Most Jeep seat covers on the market are made from neoprene (wetsuit rubber) or faux leather — materials chosen because they're cheap to manufacture, not because they're good for off-road use:</p>
<ul>
  <li><strong>Neoprene</strong> holds body heat, develops an odor, and degrades with UV and ozone exposure over 2–3 seasons.</li>
  <li><strong>Faux leather</strong> cracks and peels in temperature extremes — a common failure point in hot southern states and cold northern winters.</li>
  <li><strong>Bartact Cordura®</strong> breathes, resists abrasion at 3× the rate of neoprene, stays odor-neutral, and maintains structural integrity for the life of the vehicle.</li>
</ul>

<h3>The Full Wrangler Accessories Ecosystem</h3>
<p>Seat covers are just the beginning. Bartact builds a complete accessory suite for every Wrangler:</p>
<ul>
  <li><strong><a href="/collections/grab-handles-for-jeep-wrangler-gladiator-ford-bronco-utvs-buggies-rails">Grab Handles</a></strong> — Paracord and tube-style for JK, JL, TJ, and Gladiator</li>
  <li><strong><a href="/collections/molle-accessories">MOLLE Accessories</a></strong> — Seat-back panels, pouches, and organizers</li>
  <li><strong><a href="/collections/roll-bar-accessories">Roll Bar Accessories</a></strong> — Fire extinguisher mounts, storage bags, padding</li>
  <li><strong><a href="/collections/fire-extinguishers-mounts">Fire Extinguisher Mounts</a></strong> — Roll bar and floor mounts for 1 lb, 2.5 lb, and 5 lb extinguishers</li>
  <li><strong><a href="/collections/visor-covers">Visor Covers</a></strong> — MOLLE-integrated sun visor covers in Cordura®</li>
</ul>

<h3>SRS Airbag Safety — Standard on Every Cover</h3>
<p>Every Bartact seat cover includes side-seam stitching engineered to split cleanly during side-impact airbag deployment. This isn't optional — it's built into every single cover we ship, because no interior accessory should ever compromise your vehicle's passive safety systems.</p>

<h3>Lifetime Warranty, No Fine Print</h3>
<p>Bartact covers every seat cover with a lifetime warranty against manufacturing defects. If a seam fails under normal use — ever — we make it right. That confidence is possible only because we control every step of production in our US facility.</p>

<h3>Frequently Asked Questions</h3>
<dl>
  <dt><strong>Do Bartact Wrangler seat covers require any modification to install?</strong></dt>
  <dd>No. All covers install using existing seat mounting points and OEM hardware. Average installation is under 30 minutes per seat.</dd>

  <dt><strong>Are Bartact covers compatible with the Wrangler 4xe heated seats?</strong></dt>
  <dd>Yes. Our thin-profile foam backing maintains efficient heat transfer through the cover material. Seat heating function remains fully operational.</dd>

  <dt><strong>Can I get matching front and rear seat covers?</strong></dt>
  <dd>Yes. We sell matching front bucket and rear bench/split-bench sets so your interior has a consistent look across all seating positions.</dd>
</dl>`
  },

  // ── 5. Paracord Grab Handles (custom, 95 clicks, #4.9) ───────────────────
  {
    handle: 'paracord-grab-handles',
    colId: 73832005,
    colType: 'custom_collections',
    url: 'https://www.bartact.com/collections/paracord-grab-handles',
    keyword: 'paracord grab handles',
    body_html: `<h2>Paracord Grab Handles for Jeep, Bronco, and Off-Road Vehicles — Made in the USA</h2>
<p>Bartact <strong>paracord grab handles</strong> are the go-to upgrade for Jeep Wrangler, Gladiator, Ford Bronco, and UTV riders who want a confidence-inspiring grip that won't fail when the trail gets steep. Woven from 550-rated paracord on custom aluminum cores and knotted by American craftspeople in Lakeland, Florida, these handles are built to hold, look great, and outlast the factory plastic loops by years.</p>

<h3>Why Paracord?</h3>
<p>Type III 550 paracord — the same 7-strand nylon construction used by military paratroopers — has a minimum breaking strength of 550 lbs per cord. Bartact's four-strand knot pattern multiplies that per-handle, giving you a handle with a working load far beyond anything you'd stress on trail. Unlike factory plastic grab handles that crack with age and UV exposure, paracord gains character and remains fully functional for the life of your vehicle.</p>

<h3>Material Advantages Over Plastic &amp; Rubber</h3>
<ul>
  <li><strong>Grip:</strong> Woven paracord provides natural texture grip even with wet or gloved hands — far superior to smooth plastic or molded rubber handles.</li>
  <li><strong>Durability:</strong> Nylon paracord is UV-resistant, water-resistant, and won't crack, fade, or become sticky in extreme temperatures.</li>
  <li><strong>Customization:</strong> Available in dozens of color combinations to match or contrast your Cordura® seat cover and interior scheme.</li>
  <li><strong>Weight:</strong> Lighter than OEM handles, with no meaningful flex under grip loads.</li>
</ul>

<h3>Vehicle-Specific Fitments</h3>
<p>Bartact makes bolt-in paracord grab handles for the most popular off-road platforms:</p>
<ul>
  <li><a href="/collections/jeep-wrangler-jl-jlu-accessories-2018">Jeep Wrangler JL &amp; JLU (2018+)</a></li>
  <li><a href="/collections/jeep-wrangler-jk-jku-2007-18-accessories">Jeep Wrangler JK &amp; JKU (2007–2018)</a></li>
  <li><a href="/collections/jeep-wrangler-tj-1997-02-accessories">Jeep Wrangler TJ (1997–2006)</a></li>
  <li><a href="/collections/jeep-gladiator-seat-covers-accessories-2019">Jeep® Gladiator (2019+)</a></li>
  <li><a href="/collections/ford-bronco-accessories-2021-2022-2023">Ford Bronco (2021+)</a></li>
</ul>

<h3>Made in the USA — Every Handle, Every Knot</h3>
<p>Bartact's paracord grab handles are hand-knotted in our Lakeland, Florida facility. We source our 550 paracord from US-compliant manufacturers, machine the aluminum mounting hardware domestically, and assemble every handle in-house. You're not getting a container-load import — you're getting something made by a person, in America, with care.</p>

<h3>Easy Bolt-In Installation</h3>
<p>All Bartact paracord grab handles are direct replacements for factory grab handles — they use existing OEM mounting holes and hardware. No drilling, no modification, no tools beyond a screwdriver. Installation typically takes under 10 minutes per handle.</p>

<h3>Pair With Your Interior Build</h3>
<p>Paracord grab handles are the finishing touch on a complete Bartact interior build. Shop the full lineup:</p>
<ul>
  <li><a href="/collections/jeep-wrangler-seat-covers">Jeep Wrangler Seat Covers</a></li>
  <li><a href="/collections/molle-accessories">MOLLE Accessories &amp; Panels</a></li>
  <li><a href="/collections/roll-bar-accessories">Roll Bar Accessories</a></li>
  <li><a href="/collections/fire-extinguishers-mounts">Fire Extinguisher Mounts</a></li>
</ul>

<h3>Frequently Asked Questions</h3>
<dl>
  <dt><strong>What paracord colors are available?</strong></dt>
  <dd>We stock handles in coyote tan, OD green, black, ranger green, multicam, and several custom color combinations. Check individual product listings for current availability.</dd>

  <dt><strong>How do I install Bartact paracord grab handles?</strong></dt>
  <dd>Remove the two factory screws from the OEM handle, lift out the old handle, seat the Bartact handle using the same holes, and reinstall the screws. No drilling or modification required. Full instructions ship with every handle.</dd>

  <dt><strong>Are these handles rated for passenger weight?</strong></dt>
  <dd>Yes. Our handles are rated well above the forces a passenger exerts during normal off-road use. The 550 paracord and aluminum core combination provides a wide safety margin.</dd>

  <dt><strong>Do you make matching grab handles for the rear seat?</strong></dt>
  <dd>Yes. We offer both front A-pillar and rear B-pillar handle sets. Matching sets are sold individually or as a complete interior kit.</dd>

  <dt><strong>Can I get custom color combinations?</strong></dt>
  <dd>Yes — contact our team directly for custom two-tone or branded color combinations. Minimum quantities apply for fully custom orders.</dd>
</dl>`
  }
];

// ── main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`\n=== Bartact Content Expansion — ${new Date().toISOString().slice(0,10)} ===\n`);

  const token = await getShopifyToken();
  console.log('[AUTH] Shopify token acquired ✅');

  const updatedUrls = [];
  const results = [];

  for (const col of COLLECTIONS) {
    const wordCount = col.body_html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    console.log(`\n[UPDATE] ${col.handle} — ${wordCount} words`);

    try {
      const res = await shopifyPut(token, col.colType, col.colId, col.body_html);
      if (res.status === 200) {
        console.log(`  ✅ Updated (HTTP ${res.status})`);
        updatedUrls.push(col.url);
        results.push({ handle: col.handle, url: col.url, words: wordCount, status: 'updated' });
      } else {
        console.error(`  ❌ Failed (HTTP ${res.status}):`, JSON.stringify(res.body).slice(0, 200));
        results.push({ handle: col.handle, url: col.url, words: wordCount, status: `failed_${res.status}` });
      }
    } catch (err) {
      console.error(`  ❌ Error: ${err.message}`);
      results.push({ handle: col.handle, url: col.url, words: wordCount, status: 'error', error: err.message });
    }

    // polite pause between Shopify API calls
    await new Promise(r => setTimeout(r, 800));
  }

  // ── IndexNow ────────────────────────────────────────────────────────────────
  if (updatedUrls.length > 0) {
    console.log(`\n[INDEXNOW] Submitting ${updatedUrls.length} URLs …`);
    try {
      const idx = await submitIndexNow(updatedUrls);
      console.log(`  IndexNow response: HTTP ${idx.status} — ${idx.body.slice(0, 100)}`);
    } catch (err) {
      console.error(`  IndexNow error: ${err.message}`);
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  const updated = results.filter(r => r.status === 'updated');
  const failed  = results.filter(r => r.status !== 'updated');

  console.log('\n=== Content Expansion Complete ===');
  console.log(`Updated: ${updated.length} | Failed: ${failed.length}`);
  for (const r of results) {
    const icon = r.status === 'updated' ? '✅' : '❌';
    console.log(`  ${icon} ${r.handle} — ${r.words} words — ${r.status}`);
  }

  // write results for Telegram summary
  const fs = require('fs');
  fs.writeFileSync(
    '/home/ubuntu/.openclaw/workspace/memory/bartact-content-expand-results.json',
    JSON.stringify({ date: new Date().toISOString(), results, updatedUrls }, null, 2)
  );
  console.log('\nResults saved → memory/bartact-content-expand-results.json');
})();
