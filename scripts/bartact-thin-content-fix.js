#!/usr/bin/env node
// bartact-thin-content-fix.js — Expand body_html for top thin content collections
// Run: node scripts/bartact-thin-content-fix.js

const https = require('https');

const CLIENT_ID     = '78fd9505a467f0795d035e5f4a6dfb06';
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET_BARTACT;
const SHOP          = 'bartact.myshopify.com';
const API_VER       = '2024-01';
const INDEXNOW_KEY  = 'b4f7e2a1c3d5e6f7a8b9c0d1e2f3a4b5';

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Auth ─────────────────────────────────────────────────────────────────────
let _cachedToken = null;
async function getToken() {
  if (_cachedToken) return _cachedToken;
  const r = await fetch('https://bartact.myshopify.com/admin/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: 'client_credentials' })
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('Shopify auth failed: ' + JSON.stringify(j));
  _cachedToken = j.access_token;
  return _cachedToken;
}

async function shopifyGet(path) {
  const token = await getToken();
  const r = await fetch(`https://${SHOP}/admin/api/${API_VER}/${path}`, {
    headers: { 'X-Shopify-Access-Token': token }
  });
  return r.json();
}

async function shopifyPut(path, body) {
  const token = await getToken();
  const r = await fetch(`https://${SHOP}/admin/api/${API_VER}/${path}`, {
    method: 'PUT',
    headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return { status: r.status, body: await r.json() };
}

// ── SEO Content Library ───────────────────────────────────────────────────────

const CONTENT = {
  'seat-covers': {
    colType: 'smart_collections',
    colId: 261740953643,
    html: `<h2>Premium Seat Covers Built to Last — Made in USA by Bartact</h2>
<p>Bartact seat covers are engineered for drivers who demand more than factory protection. Our American-made seat covers combine military-grade Cordura® nylon with precision craftsmanship to deliver protection that outlasts cheap alternatives by years. Whether you're off-roading, working a job site, or just protecting a daily driver, Bartact seat covers are the tactical choice built right here in the USA.</p>

<h3>Why Cordura® Beats Neoprene and Faux Leather</h3>
<p>Most seat covers on the market use neoprene — a material that traps heat, develops odors, and stretches out of shape over time. Faux leather cracks, peels, and fails under UV exposure. Bartact uses genuine Cordura® nylon because:</p>
<ul>
  <li><strong>Tear resistance</strong> — Cordura® is rated for extreme abrasion; neoprene is not</li>
  <li><strong>Breathability</strong> — stays cooler in summer, warmer in winter versus rubber-backed materials</li>
  <li><strong>Dimensional stability</strong> — holds its shape session after session, year after year</li>
  <li><strong>Easy cleaning</strong> — wipes down or machine washes; neoprene holds stains and bacteria</li>
  <li><strong>UV resistance</strong> — Cordura® doesn't fade, crack, or peel after sun exposure</li>
</ul>

<h3>Made in USA — What That Actually Means</h3>
<p>When Bartact says "Made in USA," every stitch happens in our US facility. Our workers cut, sew, and quality-check every seat cover before it ships. That means tighter tolerances, faster warranty resolution, and the knowledge that your purchase supports American manufacturing jobs.</p>

<h3>SRS Airbag Compatible</h3>
<p>Every Bartact seat cover is engineered with side-airbag deployment seams, so your vehicle's safety systems work exactly as designed. Never compromise airbag deployment for style.</p>

<h3>Frequently Asked Questions</h3>
<dl>
  <dt><strong>Are Bartact seat covers vehicle-specific?</strong></dt>
  <dd>Yes — we offer model-specific fits for Jeep Wrangler, Jeep Gladiator, Ford Bronco, Toyota Tacoma, Toyota 4Runner, and more. Each cover is patterned to your exact year and model.</dd>
  <dt><strong>Do they work with heated and ventilated seats?</strong></dt>
  <dd>Yes. Bartact seat covers are designed to maintain full functionality of heated and ventilated OEM seat systems.</dd>
  <dt><strong>Can I add MOLLE panels to my seat covers?</strong></dt>
  <dd>Absolutely. Our MOLLE seat back panels add tactical storage directly to the back of your front seats — compatible with standard MOLLE pouches and accessories.</dd>
  <dt><strong>How long do Bartact seat covers last?</strong></dt>
  <dd>With proper care, 5–10+ years. Cordura® doesn't degrade the way neoprene or faux leather does under daily use.</dd>
  <dt><strong>Do you offer a warranty?</strong></dt>
  <dd>Yes — Bartact backs every seat cover with a manufacturer's warranty and US-based customer support.</dd>
</dl>

<h3>Shop by Vehicle</h3>
<p>Find the right fit for your rig: <a href="/collections/jeep-wrangler-seat-covers">Jeep Wrangler Seat Covers</a> | <a href="/collections/jeep-gladiator-seat-covers-accessories-2019">Jeep Gladiator Seat Covers</a> | <a href="/collections/ford-bronco-seat-covers">Ford Bronco Seat Covers</a> | <a href="/collections/toyota-tacoma-seat-covers">Toyota Tacoma Seat Covers</a> | <a href="/collections/toyota-4runner-seat-covers">Toyota 4Runner Seat Covers</a></p>`
  },

  'jeep-wrangler-seat-covers': {
    colType: 'custom_collections',
    colId: 275720732715,
    html: `<h2>Jeep Wrangler Seat Covers — Tactical Protection, Made in USA</h2>
<p>Jeep Wrangler seat covers from Bartact are purpose-built for the Wrangler's demanding life: muddy trails, soaking rain, beach runs, and years of daily driving. Every Bartact Jeep Wrangler seat cover is cut and sewn in the USA using mil-spec Cordura® nylon — the same material trusted by military and law enforcement worldwide.</p>

<h3>Cordura® vs. Neoprene: No Contest</h3>
<p>Cheap neoprene Wrangler seat covers smell, stretch, and fail. Cordura® doesn't. Our fabric is abrasion-resistant, UV-stable, and stays dry — critical when you're hosing mud out of your Wrangler after a trail run.</p>
<ul>
  <li>5× more abrasion-resistant than neoprene</li>
  <li>Breathes in summer; doesn't sweat in heat</li>
  <li>Won't crack, peel, or delaminate like faux leather</li>
  <li>Machine washable for quick turnaround between adventures</li>
</ul>

<h3>Fits Every Wrangler Generation</h3>
<p>Bartact makes model-specific patterns for every Wrangler generation — no universal-fit slack, no bunching, no pressure points:</p>
<ul>
  <li><a href="/collections/jeep-wrangler-tj-seat-covers">Jeep Wrangler TJ Seat Covers (1997–2006)</a></li>
  <li><a href="/collections/jeep-wrangler-jk-jku-2007-18-accessories">Jeep Wrangler JK / JKU (2007–2018)</a></li>
  <li><a href="/collections/jeep-wrangler-jl-jlu-accessories-2018">Jeep Wrangler JL / JLU (2018+)</a></li>
</ul>

<h3>Side Airbag Safe — Every Time</h3>
<p>Wranglers with side-curtain and side-impact airbags need a seat cover that deploys correctly. Bartact patterns every Wrangler seat cover with SRS-compatible seams so your safety systems work exactly as Jeep intended.</p>

<h3>Add MOLLE Storage to Your Wrangler</h3>
<p>Pair your seat covers with Bartact MOLLE seat back panels to turn the back of your front seats into a gear-organization station. Mount pouches, tools, first aid kits, and recovery gear exactly where you need them.</p>

<h3>Frequently Asked Questions</h3>
<dl>
  <dt><strong>Will Bartact seat covers fit my Wrangler's fold-and-tumble rear seats?</strong></dt>
  <dd>Yes — our rear seat covers are designed to accommodate the Wrangler's fold-and-tumble function without needing to be removed first.</dd>
  <dt><strong>Do they work with Wrangler heated seats?</strong></dt>
  <dd>Yes. Our covers maintain full contact with OEM heated seat elements.</dd>
  <dt><strong>Are these covers waterproof?</strong></dt>
  <dd>Cordura® is water-resistant and dries quickly. For full waterproofing, pair with our waterproof seat cover option.</dd>
  <dt><strong>Can I install them myself?</strong></dt>
  <dd>Yes — most Wrangler owners install in under 30 minutes per seat with no tools required.</dd>
  <dt><strong>Where are these made?</strong></dt>
  <dd>Every Bartact Jeep Wrangler seat cover is cut and sewn in the USA.</dd>
</dl>

<h3>Related Collections</h3>
<p><a href="/collections/seat-covers">All Seat Covers</a> | <a href="/collections/molle-accessories">MOLLE Accessories</a> | <a href="/collections/grab-handles-for-jeep-wrangler-gladiator-ford-bronco-utvs-buggies-rails">Grab Handles</a> | <a href="/collections/jeep-wrangler-jl-jlu-accessories-2018">JL Accessories</a></p>`
  },

  'molle-accessories': {
    colType: 'smart_collections',
    colId: 137429778455,
    html: `<h2>MOLLE Accessories — Tactical Gear Organization for Off-Road Rigs</h2>
<p>MOLLE accessories from Bartact are designed for the off-road lifestyle — built tough, organized smart, and made in the USA. Whether you're mounting pouches to your seat backs, rolling bar, or tailgate, Bartact's MOLLE system turns your vehicle into a mobile tactical base.</p>

<h3>What Is MOLLE?</h3>
<p>MOLLE (Modular Lightweight Load-carrying Equipment) is the military-standard webbing system used on body armor, packs, and tactical vests. Bartact brings that same modular attachment system to your vehicle. Our Cordura® MOLLE panels mount to seat backs, roll bars, and doors — then accept any standard MOLLE-compatible pouch or accessory.</p>

<h3>Bartact MOLLE vs. Generic Options</h3>
<ul>
  <li><strong>American-made</strong> — sewn in our US facility, not overseas</li>
  <li><strong>Mil-spec Cordura®</strong> — won't stretch, sag, or tear under load</li>
  <li><strong>Vehicle-specific mounts</strong> — custom-fit panels for Jeep, Bronco, Tacoma, and more</li>
  <li><strong>Full MOLLE compatibility</strong> — works with all standard MOLLE pouches, tools, and accessories</li>
</ul>

<h3>Popular MOLLE Accessory Categories</h3>
<ul>
  <li><a href="/collections/molle-pouches-molle-accessories-gear-bags-by-bartact">MOLLE Pouches & Gear Bags</a> — storage solutions for trail gear, recovery tools, first aid</li>
  <li><a href="/collections/molle-buckles-attachments-accessories">MOLLE Buckles & Attachments</a> — expand and customize your MOLLE system</li>
  <li><a href="/collections/molle-seat-back-panel">MOLLE Seat Back Panels</a> — mount gear directly behind driver and passenger seats</li>
  <li><a href="/collections/roll-bar-accessories">Roll Bar Accessories</a> — maximize your Jeep's roll bar real estate</li>
</ul>

<h3>Compatible With Your Rig</h3>
<p>Bartact MOLLE accessories are designed to work with Jeep Wrangler (JK, JKU, JL, JLU, TJ), Jeep Gladiator, Ford Bronco, Toyota Tacoma, Toyota 4Runner, and UTVs. Our panels integrate directly with Bartact seat covers or mount independently.</p>

<h3>Frequently Asked Questions</h3>
<dl>
  <dt><strong>Will any MOLLE pouch work with Bartact panels?</strong></dt>
  <dd>Yes — our panels use standard MOLLE webbing spacing, so any MOLLE-compatible pouch, holster, or accessory from any brand will attach.</dd>
  <dt><strong>How are MOLLE seat back panels installed?</strong></dt>
  <dd>Our seat back panels typically slip over the headrest posts and secure with hook-and-loop or straps — no drilling required.</dd>
  <dt><strong>Can I run MOLLE on a Jeep with a roll bar?</strong></dt>
  <dd>Yes — Bartact makes dedicated roll bar MOLLE panels and accessory mounts sized for OEM and aftermarket bars.</dd>
  <dt><strong>Are these weatherproof?</strong></dt>
  <dd>Cordura® MOLLE panels are water-resistant and UV-stable for all-weather use.</dd>
  <dt><strong>Where are Bartact MOLLE accessories made?</strong></dt>
  <dd>All Bartact MOLLE gear is designed and sewn in the USA.</dd>
</dl>

<h3>Related Collections</h3>
<p><a href="/collections/jeep-wrangler-seat-covers">Jeep Wrangler Seat Covers</a> | <a href="/collections/grab-handles-for-jeep-wrangler-gladiator-ford-bronco-utvs-buggies-rails">Grab Handles</a> | <a href="/collections/roll-bar-accessories">Roll Bar Accessories</a> | <a href="/collections/seat-covers">All Seat Covers</a></p>`
  },

  'paracord-grab-handles': {
    colType: 'custom_collections',
    colId: 73832005,
    html: `<h2>Paracord Grab Handles — The Original Bartact Grab Handle</h2>
<p>Paracord grab handles by Bartact are the most recognized upgrade for Jeep Wrangler, Jeep Gladiator, Ford Bronco, and UTV roll bars. Handmade in the USA from military-spec Type III 550 paracord, these handles deliver the grip you need on the trail and the look that turns heads at the trailhead.</p>

<h3>Why Choose Paracord Over Factory Handles?</h3>
<p>OEM grab handles are plastic. They crack in cold weather, become slippery when wet, and offer poor ergonomics on aggressive terrain. Bartact paracord handles are woven from real 550 paracord — the same cord used in military applications:</p>
<ul>
  <li><strong>550 lb. tensile strength</strong> — won't snap under load</li>
  <li><strong>Non-slip woven surface</strong> — superior grip with gloves or wet hands</li>
  <li><strong>UV and weather resistant</strong> — won't crack, fade, or degrade</li>
  <li><strong>Made in USA</strong> — hand-tied in Bartact's facility, not mass-produced overseas</li>
  <li><strong>Available in dozens of colors</strong> — customize to match your build</li>
</ul>

<h3>Fits Your Roll Bar — Any Diameter</h3>
<p>Bartact paracord grab handles fit standard OEM and aftermarket roll bars across Jeep JK, JL, TJ, Gladiator, Ford Bronco, and most UTV cages. Installation is tool-free — wrap, tie, done.</p>

<h3>Popular Pairings</h3>
<p>Stack your build: pair paracord grab handles with <a href="/collections/molle-accessories">MOLLE roll bar accessories</a>, <a href="/collections/fire-extinguisher-roll-bar-mount">fire extinguisher roll bar mounts</a>, and <a href="/collections/roll-bar-accessories">other roll bar accessories</a> for a fully organized cab.</p>

<h3>Frequently Asked Questions</h3>
<dl>
  <dt><strong>What roll bar diameter do these fit?</strong></dt>
  <dd>Our grab handles are designed to wrap standard 1.75" OEM roll bar tubing and many 1.5"–2" aftermarket bars. Check product listings for exact sizing.</dd>
  <dt><strong>Are they easy to install?</strong></dt>
  <dd>Yes — completely tool-free. Each handle wraps around the bar and ties with the included paracord tails in under 5 minutes.</dd>
  <dt><strong>Will they work on a Ford Bronco?</strong></dt>
  <dd>Yes — Bartact paracord grab handles fit the Bronco's factory roll bar and most aftermarket Sport bars.</dd>
  <dt><strong>Can I get custom colors?</strong></dt>
  <dd>We offer a wide range of paracord colors. Check current availability on individual product listings.</dd>
  <dt><strong>Where are these made?</strong></dt>
  <dd>Every Bartact paracord grab handle is hand-tied in the USA.</dd>
</dl>

<h3>Related Collections</h3>
<p><a href="/collections/grab-handles-for-jeep-wrangler-gladiator-ford-bronco-utvs-buggies-rails">All Grab Handles</a> | <a href="/collections/roll-bar-accessories">Roll Bar Accessories</a> | <a href="/collections/molle-accessories">MOLLE Accessories</a> | <a href="/collections/jeep-wrangler-seat-covers">Jeep Wrangler Seat Covers</a></p>`
  },

  'ford-bronco-seat-covers': {
    colType: 'smart_collections',
    colId: 265140207659,
    html: `<h2>Ford Bronco Seat Covers — Tactical Protection for the Modern Trail Rig</h2>
<p>Ford Bronco seat covers from Bartact are engineered specifically for the 2021+ Bronco's demanding use case: topless trail runs, river crossings, and year-round adventure. Made in the USA from mil-spec Cordura® nylon, Bartact Bronco seat covers protect your investment without compromising comfort or safety.</p>

<h3>Built for the Bronco's Open-Air Lifestyle</h3>
<p>The Ford Bronco's removable roof and doors mean your interior is exposed to the elements constantly. Cheap neoprene covers absorb moisture, grow mildew, and degrade under UV exposure. Bartact's Cordura® covers:</p>
<ul>
  <li>Dry quickly after rain exposure with the roof off</li>
  <li>Resist UV fading and surface degradation</li>
  <li>Wipe clean from mud, sand, and trail debris</li>
  <li>Won't develop the neoprene smell after wet rides</li>
</ul>

<h3>SRS Airbag Compatible — Safety First</h3>
<p>Every Bartact Ford Bronco seat cover is patterned with side-airbag deployment seams. Your Bronco's safety systems deploy exactly as designed — always.</p>

<h3>Bronco-Specific Fit — No Universal Slack</h3>
<p>We pattern our covers directly from production Bronco seats — 2-door and 4-door configurations. The result is a factory-quality fit with no bunching, no pressure points, and no interference with seat adjusters or seatbelt buckles.</p>

<h3>Add MOLLE to Your Bronco</h3>
<p>Expand your Bronco's utility with <a href="/collections/ford-bronco-molle-accessories">Ford Bronco MOLLE accessories</a>. Our seat back panels mount MOLLE pouches directly behind the front seats — perfect for trail gear, first aid, and recovery tools. Pair with <a href="/collections/ford-bronco-grab-handles">Ford Bronco grab handles</a> and <a href="/collections/ford-bronco-door-storage-bags">door storage bags</a> for a fully organized rig.</p>

<h3>Frequently Asked Questions</h3>
<dl>
  <dt><strong>Do these fit both 2-door and 4-door Bronco?</strong></dt>
  <dd>Yes — Bartact offers seat covers for both Bronco 2-door and 4-door configurations with model-specific patterns.</dd>
  <dt><strong>Are they compatible with Bronco's heated/cooled seats?</strong></dt>
  <dd>Yes — our covers maintain full functionality of OEM heated and ventilated seat elements.</dd>
  <dt><strong>Will the Bronco's side airbags deploy correctly?</strong></dt>
  <dd>Absolutely. Every Bartact cover uses SRS-compatible seam routing for proper airbag deployment.</dd>
  <dt><strong>Can I use them with the top off?</strong></dt>
  <dd>Yes — Cordura® handles direct sun and rain exposure without degrading.</dd>
  <dt><strong>Where are Bartact Bronco seat covers made?</strong></dt>
  <dd>Cut and sewn in the USA.</dd>
</dl>

<h3>Related Collections</h3>
<p><a href="/collections/ford-bronco-accessories-2021-2022-2023">Ford Bronco Accessories</a> | <a href="/collections/ford-bronco-molle-accessories">Ford Bronco MOLLE</a> | <a href="/collections/ford-bronco-grab-handles">Bronco Grab Handles</a> | <a href="/collections/seat-covers">All Seat Covers</a></p>`
  },

  'jeep-wrangler-seat-covers-accessories': {
    colType: 'custom_collections',
    colId: 73831749,
    html: `<h2>Jeep Wrangler Seat Covers & Accessories — Complete Interior Outfitting</h2>
<p>Jeep Wrangler seat covers and accessories from Bartact give you everything you need to protect, organize, and upgrade your Wrangler's interior. From mil-spec Cordura® seat covers made in the USA to tactical MOLLE panels, grab handles, and storage solutions — Bartact is the complete source for Wrangler interior gear.</p>

<h3>The Bartact Wrangler Interior System</h3>
<p>Serious off-roaders don't buy one piece at a time. They build a system. Bartact's Wrangler accessories are designed to work together:</p>
<ul>
  <li><strong>Seat covers</strong> — Cordura® protection with MOLLE seat back panels built in</li>
  <li><strong>Grab handles</strong> — paracord and standard handles for every roll bar position</li>
  <li><strong>MOLLE pouches & panels</strong> — modular storage for gear, tools, and recovery equipment</li>
  <li><strong>Roll bar accessories</strong> — fire extinguisher mounts, padding, and attachments</li>
  <li><strong>Storage bags</strong> — door pockets, cargo organizers, and console covers</li>
</ul>

<h3>Why Bartact for Jeep Wrangler?</h3>
<p>Bartact has been outfitting Wranglers since the TJ era. Every product is vehicle-specific — not universal-fit afterthoughts. Our USA manufacturing means faster shipping, tighter quality control, and warranty support from people who answer the phone.</p>

<h3>SRS Safe, MOLLE Ready</h3>
<p>All Bartact seat covers are airbag-compatible. Add <a href="/collections/molle-accessories">MOLLE accessories</a> to the seat backs for tactical storage without sacrificing safety.</p>

<h3>Frequently Asked Questions</h3>
<dl>
  <dt><strong>Do Bartact accessories fit all Wrangler models?</strong></dt>
  <dd>We offer model-specific products for TJ (1997–2006), JK/JKU (2007–2018), and JL/JLU (2018+). Filter by year on individual collection pages.</dd>
  <dt><strong>Can I buy a complete interior package?</strong></dt>
  <dd>Yes — many customers bundle seat covers, grab handles, and MOLLE panels together. Contact us for bundle pricing.</dd>
  <dt><strong>Are Bartact products compatible with aftermarket seats?</strong></dt>
  <dd>Our seat covers are patterned for OEM Wrangler seats. Contact us if you've swapped to aftermarket seats.</dd>
  <dt><strong>What materials do you use?</strong></dt>
  <dd>Military-specification Cordura® nylon — the same fabric used in tactical gear and body armor systems.</dd>
  <dt><strong>Are these made in America?</strong></dt>
  <dd>Yes. Bartact designs, cuts, and sews every product in the USA.</dd>
</dl>

<h3>Shop by Wrangler Model</h3>
<p><a href="/collections/jeep-wrangler-tj-seat-covers">Wrangler TJ Seat Covers</a> | <a href="/collections/jeep-wrangler-jk-jku-2007-18-accessories">Wrangler JK/JKU</a> | <a href="/collections/jeep-wrangler-jl-jlu-accessories-2018">Wrangler JL/JLU</a> | <a href="/collections/molle-accessories">MOLLE Accessories</a> | <a href="/collections/paracord-grab-handles">Paracord Grab Handles</a></p>`
  },

  'ford-bronco-accessories-2021-2022-2023': {
    colType: 'smart_collections',
    colId: 174233223211,
    html: `<h2>Ford Bronco Accessories (2021+) — Tactical Gear for the Modern Bronco</h2>
<p>Ford Bronco accessories from Bartact are engineered for the 2021, 2022, 2023, and 2024+ Bronco's open-air, go-anywhere mission. We build tactical-grade seat covers, MOLLE panels, grab handles, storage bags, visor covers, and more — all made in the USA from materials that hold up to trail use and daily driving alike.</p>

<h3>What Sets Bartact Bronco Accessories Apart</h3>
<p>The Bronco aftermarket is flooded with generic accessories. Bartact is different:</p>
<ul>
  <li><strong>USA-made</strong> — cut, sewn, and assembled in our American facility</li>
  <li><strong>Mil-spec Cordura®</strong> — tougher than neoprene, more durable than faux leather or nylon blends</li>
  <li><strong>Bronco-specific fit</strong> — patterned for 2021+ 2-door and 4-door configurations</li>
  <li><strong>MOLLE-integrated</strong> — our system lets you add modular pouches and gear to seats, doors, and roll bars</li>
</ul>

<h3>Complete Bronco Interior Lineup</h3>
<ul>
  <li><a href="/collections/ford-bronco-seat-covers">Ford Bronco Seat Covers</a> — Cordura® protection, SRS airbag safe</li>
  <li><a href="/collections/ford-bronco-grab-handles">Ford Bronco Grab Handles</a> — paracord and rubber grip options</li>
  <li><a href="/collections/ford-bronco-door-storage-bags">Ford Bronco Door Storage Bags</a> — maximize door pocket storage</li>
  <li><a href="/collections/ford-bronco-molle-accessories">Ford Bronco MOLLE Accessories</a> — modular tactical storage panels</li>
  <li><a href="/collections/ford-bronco-visor-covers">Ford Bronco Visor Covers</a> — protect and organize your sun visors</li>
  <li><a href="/collections/ford-bronco-console-organizers">Ford Bronco Console Organizers</a> — tame center console clutter</li>
</ul>

<h3>Open-Air Durability</h3>
<p>The Bronco's removable doors and roof put your interior at the mercy of weather, UV, and trail debris. Bartact's Cordura® material is engineered to handle it: water-resistant, UV-stable, and wipeable between adventures.</p>

<h3>Frequently Asked Questions</h3>
<dl>
  <dt><strong>Do Bartact accessories fit the Bronco Raptor?</strong></dt>
  <dd>Many of our accessories are compatible with the Bronco Raptor — check individual product listings for Raptor-specific fit notes.</dd>
  <dt><strong>Will these work with my Bronco Sport?</strong></dt>
  <dd>Bronco Sport has a different platform and seat configuration. Check product listings — some accessories are cross-compatible.</dd>
  <dt><strong>Are the seat covers airbag safe?</strong></dt>
  <dd>Yes — all Bartact seat covers include SRS-compatible airbag deployment seams.</dd>
  <dt><strong>Do you ship quickly?</strong></dt>
  <dd>Yes — because we manufacture in the USA, most in-stock items ship within 1–3 business days.</dd>
  <dt><strong>Can I mix and match pieces?</strong></dt>
  <dd>Absolutely — Bartact's Bronco accessories are designed as a system you can build piece by piece.</dd>
</dl>

<h3>Related Collections</h3>
<p><a href="/collections/seat-covers">All Seat Covers</a> | <a href="/collections/molle-accessories">MOLLE Accessories</a> | <a href="/collections/grab-handles-for-jeep-wrangler-gladiator-ford-bronco-utvs-buggies-rails">All Grab Handles</a> | <a href="/collections/roll-bar-accessories">Roll Bar Accessories</a></p>`
  },

  'jeep-gladiator-seat-covers-accessories-2019': {
    colType: 'custom_collections',
    colId: 129358528535,
    html: `<h2>Jeep Gladiator Seat Covers & Accessories (2019+) — Built for the Truck That Works as Hard as You Do</h2>
<p>Jeep Gladiator seat covers and accessories from Bartact are engineered for the truck-bed Jeep's dual life: weekend warrior and daily hauler. Made in the USA from mil-spec Cordura® nylon, Bartact gives Gladiator owners the same tactical-grade interior protection trusted by military and law enforcement professionals.</p>

<h3>The Gladiator Demands More</h3>
<p>The Gladiator is the only Jeep with a bed — meaning owners use it differently than Wrangler drivers. Tools, cargo, and passengers cycle through constantly. Your seats need to hold up. Bartact Cordura® covers handle:</p>
<ul>
  <li>Heavy daily work use without premature wear</li>
  <li>Trail use — mud, water, abrasion — without degrading</li>
  <li>UV exposure from open-top driving</li>
  <li>Quick cleaning between work and weekend use</li>
</ul>

<h3>Why Cordura® Beats Neoprene for Gladiator Use</h3>
<p>Neoprene absorbs and holds moisture — a problem when you're hauling a wet dog or muddy gear. Cordura® dries fast, wipes clean, and maintains its structure under repeated stress. For a truck used as a truck, it's not a close comparison.</p>

<h3>Gladiator-Specific Accessories</h3>
<p>Beyond seat covers, Bartact builds accessories specifically for the Gladiator's unique configuration:</p>
<ul>
  <li><a href="/collections/jeep-gladiator-grab-handles">Jeep Gladiator Grab Handles</a> — paracord and grip options for Gladiator roll bars</li>
  <li><a href="/collections/molle-accessories">MOLLE Accessories</a> — tactical storage for the Gladiator cabin</li>
  <li><a href="/collections/jeep-gladiator-sun-shades">Gladiator Sun Shades</a> — protect your cab from UV when parked</li>
  <li><a href="/collections/jeep-gladiator-storage-bags-organizers">Storage Bags & Organizers</a> — maximize cabin storage</li>
</ul>

<h3>Frequently Asked Questions</h3>
<dl>
  <dt><strong>Do Bartact covers fit both Gladiator Sport and Rubicon?</strong></dt>
  <dd>Yes — our Gladiator seat covers are patterned for standard OEM Gladiator front and rear seats across Sport, Overland, Mojave, and Rubicon trims.</dd>
  <dt><strong>Are the rear seat covers compatible with the fold-and-tumble rear seats?</strong></dt>
  <dd>Yes — Bartact rear covers accommodate the Gladiator's fold-and-tumble function without removal.</dd>
  <dt><strong>Are they SRS airbag safe?</strong></dt>
  <dd>Absolutely — every Bartact cover includes airbag-compatible deployment seams.</dd>
  <dt><strong>Can I use MOLLE panels on the Gladiator's seat backs?</strong></dt>
  <dd>Yes — our MOLLE seat back panels are compatible with Gladiator front seats for tactical gear storage.</dd>
  <dt><strong>Where are these manufactured?</strong></dt>
  <dd>Designed and sewn in the USA by Bartact.</dd>
</dl>

<h3>Related Collections</h3>
<p><a href="/collections/seat-covers">All Seat Covers</a> | <a href="/collections/jeep-wrangler-seat-covers">Jeep Wrangler Seat Covers</a> | <a href="/collections/molle-accessories">MOLLE Accessories</a> | <a href="/collections/grab-handles-for-jeep-wrangler-gladiator-ford-bronco-utvs-buggies-rails">All Grab Handles</a></p>`
  },

  'grab-handles-for-jeep-wrangler-gladiator-ford-bronco-utvs-buggies-rails': {
    colType: 'smart_collections',
    colId: 265141485611,
    html: `<h2>Grab Handles for Jeep Wrangler, Gladiator, Ford Bronco & UTVs — Made in USA</h2>
<p>Grab handles from Bartact are the tactical upgrade for your roll bar — handmade in the USA from military-spec paracord and heavy-duty materials designed for real trail use. Whether you're running a Jeep Wrangler, Gladiator, Ford Bronco, UTV, or buggy, Bartact has the handle that fits your rig and your style.</p>

<h3>Paracord Grab Handles — The Bartact Classic</h3>
<p>Our signature <a href="/collections/paracord-grab-handles">paracord grab handles</a> are hand-tied in our US facility from Type III 550 paracord — 550 lb. rated tensile strength, UV-resistant, and available in dozens of color combinations. No hardware store grab handle comes close.</p>

<h3>Why Upgrade Your Grab Handles?</h3>
<ul>
  <li>OEM handles are plastic — they crack, slip, and fail at the worst moments</li>
  <li>Paracord provides a tactical, non-slip woven surface — better grip wet or dry, with or without gloves</li>
  <li>Made in USA — quality you can feel vs. overseas-sourced OEM replacements</li>
  <li>Color customization — match your rig's build color scheme</li>
  <li>Fit any roll bar diameter — Jeep, Bronco, UTV cage, buggy rail</li>
</ul>

<h3>Vehicle Compatibility</h3>
<ul>
  <li><strong>Jeep Wrangler</strong> — TJ, JK, JKU, JL, JLU all roll bar configurations</li>
  <li><strong>Jeep Gladiator</strong> — factory and aftermarket roll bars</li>
  <li><strong>Ford Bronco (2021+)</strong> — OEM sport bar and aftermarket options</li>
  <li><strong>UTVs</strong> — standard cage tubing on Polaris RZR, Can-Am, and similar</li>
  <li><strong>Buggies & Rails</strong> — custom cage diameters accommodated</li>
</ul>

<h3>Frequently Asked Questions</h3>
<dl>
  <dt><strong>What roll bar sizes do these fit?</strong></dt>
  <dd>Standard grab handles fit 1.5"–1.75" tubing standard on most Jeep, Bronco, and UTV roll bars. See individual listings for exact specs.</dd>
  <dt><strong>Are paracord handles as strong as the OEM plastic ones?</strong></dt>
  <dd>Significantly stronger. Type III 550 paracord is rated to 550 lbs. tensile — OEM plastic handles are not rated at all.</dd>
  <dt><strong>How do I install them?</strong></dt>
  <dd>Tool-free. Wrap around the bar, tie off with the tails — done in under 5 minutes per handle.</dd>
  <dt><strong>Can I pair them with MOLLE accessories on the same roll bar?</strong></dt>
  <dd>Yes — grab handles and MOLLE roll bar accessories are fully co-compatible on the same bar section.</dd>
  <dt><strong>Do you make grab handles for UTVs with larger cage tubing?</strong></dt>
  <dd>We offer options for various tubing diameters. Contact us if you need a custom size.</dd>
</dl>

<h3>Related Collections</h3>
<p><a href="/collections/paracord-grab-handles">Paracord Grab Handles</a> | <a href="/collections/roll-bar-accessories">Roll Bar Accessories</a> | <a href="/collections/molle-accessories">MOLLE Accessories</a> | <a href="/collections/jeep-wrangler-seat-covers">Jeep Wrangler Seat Covers</a></p>`
  },

  'fire-extinguisher-roll-bar-mount': {
    colType: 'custom_collections',
    colId: 137430597655,
    html: `<h2>Fire Extinguisher Roll Bar Mount — Tactical Safety for Off-Road Rigs</h2>
<p>A fire extinguisher roll bar mount from Bartact puts your safety equipment exactly where you need it: within arm's reach inside the cab, secured to your roll bar, ready to deploy in seconds. Made in the USA from military-spec Cordura® and hardware, Bartact mounts are designed for real off-road use — not just to look the part.</p>

<h3>Why Mount Your Extinguisher on the Roll Bar?</h3>
<p>In an emergency, you need your fire extinguisher accessible immediately — not buried under a seat or in a storage bag. A roll bar mount keeps it:</p>
<ul>
  <li>Visible and reachable from the driver's seat</li>
  <li>Secure during off-road driving — no sliding, rattling, or tipping</li>
  <li>Protected from the elements while remaining instantly deployable</li>
  <li>Out of cargo areas where it could be blocked or buried</li>
</ul>

<h3>Compatible with Standard Fire Extinguisher Sizes</h3>
<p>Our roll bar mounts are designed to fit standard 1 lb., 2.5 lb., and 5 lb. dry chemical and ABC fire extinguisher cylinders — the most common sizes carried in off-road vehicles. Check individual product listings for exact cylinder diameter compatibility.</p>

<h3>Roll Bar Diameter Compatibility</h3>
<p>Bartact fire extinguisher roll bar mounts fit standard 1.5"–1.75" roll bar tubing used on Jeep Wrangler (TJ, JK, JL), Jeep Gladiator, Ford Bronco, and most UTVs and buggies.</p>

<h3>Built in the USA for Trail Use</h3>
<p>Every mount uses Cordura® webbing and corrosion-resistant hardware — materials that hold up when your Jeep is upside down in a creek or baking in the Arizona sun. Not the kind of product where you want to discover quality issues in an emergency.</p>

<h3>Frequently Asked Questions</h3>
<dl>
  <dt><strong>What size fire extinguisher fits this mount?</strong></dt>
  <dd>Our mounts accommodate standard 1 lb., 2.5 lb., and 5 lb. cylinder sizes. See specific product listings for cylinder diameter specs.</dd>
  <dt><strong>Will it hold on rough trails?</strong></dt>
  <dd>Yes — the mount uses a positive-retention strap system that keeps the extinguisher secure under severe vibration and side loads.</dd>
  <dt><strong>Can I mount it anywhere on the roll bar?</strong></dt>
  <dd>The mount works anywhere on a compatible-diameter roll bar tube — B-pillar, A-pillar, overhead section, or rear bar.</dd>
  <dt><strong>Is it compatible with both Jeep and Bronco roll bars?</strong></dt>
  <dd>Yes — fits standard OEM and most aftermarket bars on Jeep Wrangler, Gladiator, and Ford Bronco.</dd>
  <dt><strong>Made in the USA?</strong></dt>
  <dd>Yes. Every Bartact fire extinguisher mount is manufactured in our US facility.</dd>
</dl>

<h3>Related Collections</h3>
<p><a href="/collections/fire-extinguishers-mounts">Fire Extinguishers & Mounts</a> | <a href="/collections/roll-bar-accessories">Roll Bar Accessories</a> | <a href="/collections/molle-accessories">MOLLE Accessories</a> | <a href="/collections/grab-handles-for-jeep-wrangler-gladiator-ford-bronco-utvs-buggies-rails">Grab Handles</a></p>`
  }
};

// ── IndexNow ──────────────────────────────────────────────────────────────────
async function submitIndexNow(urls) {
  const body = { host: 'www.bartact.com', key: INDEXNOW_KEY, urlList: urls };
  const r = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return { status: r.status };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n=== Bartact Thin Content Fix — ${new Date().toISOString().slice(0,10)} ===\n`);

  const updated = [];
  const errors  = [];

  for (const [handle, cfg] of Object.entries(CONTENT)) {
    const { colType, colId, html } = cfg;
    const endpoint = `${colType}/${colId}.json`;
    const bodyKey  = colType === 'custom_collections' ? 'custom_collection' : 'smart_collection';

    console.log(`[FIX] ${handle} (${colId})…`);

    // Check current content first
    try {
      const current = await shopifyGet(endpoint);
      const existing = current[bodyKey]?.body_html || '';
      const wordCount = existing.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;

      if (wordCount >= 400) {
        console.log(`  → Already has ${wordCount} words — skipping`);
        continue;
      }

      // Update
      const payload = { [bodyKey]: { id: colId, body_html: html } };
      const result  = await shopifyPut(endpoint, payload);

      if (result.status === 200) {
        console.log(`  ✅ Updated (was ${wordCount}w, now ~${html.replace(/<[^>]+>/g,' ').trim().split(/\s+/).filter(Boolean).length}w)`);
        updated.push(`https://www.bartact.com/collections/${handle}`);
      } else {
        console.log(`  ⚠️  HTTP ${result.status}: ${JSON.stringify(result.body).slice(0,120)}`);
        errors.push({ handle, status: result.status, body: result.body });
      }
    } catch (err) {
      console.log(`  ❌ Error: ${err.message}`);
      errors.push({ handle, error: err.message });
    }

    await sleep(600); // rate-limit friendly
  }

  // IndexNow submission
  let indexNowStatus = 'skipped';
  if (updated.length > 0) {
    console.log(`\n[INDEXNOW] Submitting ${updated.length} URLs…`);
    const inResult = await submitIndexNow(updated);
    indexNowStatus = `HTTP ${inResult.status}`;
    console.log(`  → ${indexNowStatus}`);
  }

  // Summary
  console.log(`\n=== Summary ===`);
  console.log(`Updated: ${updated.length}`);
  for (const u of updated) console.log(`  ✅ ${u}`);
  if (errors.length) {
    console.log(`Errors: ${errors.length}`);
    for (const e of errors) console.log(`  ❌ ${e.handle}: ${e.status || e.error}`);
  }
  console.log(`IndexNow: ${indexNowStatus}`);

  // Save result
  const result = {
    runDate: new Date().toISOString(),
    updated,
    errors,
    indexNowStatus
  };
  require('fs').writeFileSync(
    require('path').join(__dirname, '../memory/bartact-thin-content-fix-result.json'),
    JSON.stringify(result, null, 2)
  );
  console.log(`\nResult saved → memory/bartact-thin-content-fix-result.json`);

  return result;
}

main().catch(console.error);
