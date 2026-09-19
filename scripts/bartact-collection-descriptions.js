#!/usr/bin/env node
'use strict';
const https = require('https');
const fs = require('fs');

function getEnv() {
  const e = {};
  try {
    fs.readFileSync('/home/ubuntu/.openclaw/workspace/.env', 'utf8').split('\n').forEach(l => {
      const [k, ...v] = l.split('=');
      if (k && v.length) e[k.trim()] = v.join('=').trim();
    });
  } catch (err) {
    console.error('❌ Failed to read .env file:', err.message);
    process.exit(1);
  }
  return e;
}

const ENV = getEnv();
const TOKEN = ENV.SHOPIFY_TOKEN_BARTACT;

if (!TOKEN) {
  console.error('❌ SHOPIFY_TOKEN_BARTACT not found in .env');
  process.exit(1);
}

function shopifyPut(id, body_html) {
  return new Promise((res, rej) => {
    const body = JSON.stringify({ smart_collection: { id, body_html } });
    const req = https.request({
      hostname: 'bartact.myshopify.com',
      path: '/admin/api/2024-01/smart_collections/' + id + '.json',
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': TOKEN,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 20000
    }, resp => {
      let b = '';
      resp.on('data', d => b += d);
      resp.on('end', () => {
        try { res({ s: resp.statusCode, b: JSON.parse(b) }); }
        catch (e) { res({ s: resp.statusCode, b }); }
      });
    });
    req.on('error', rej);
    req.write(body);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// MATERIAL HIERARCHY - ALWAYS LEAD WITH STANDARD
// 1. STANDARD material: proprietary UV-protected waterproof-backed polyester (ALWAYS LEAD)
// 2. Cordura nylon = upgrade option only (never first, secondary only)

const updates = [
  {
    id: 688348921899,
    handle: 'ford-bronco-grab-handles',
    kw: 'ford bronco grab handles',
    body_html: '<p><strong>Ford Bronco grab handles</strong> from Bartact are the most durable, USA-made upgrade you can bolt onto your Bronco\'s roll bar — built tough enough to match the trails your rig was born for. Whether you\'re crawling through Moab or white-knuckling a Michigan two-track, a solid set of grab handles gives passengers a secure grip and keeps everyone stable when the going gets rough.</p>\n\n<h2>Why Bartact Grab Handles Outlast the Competition</h2>\n<p>Bartact Ford Bronco grab handles are constructed from <strong>proprietary UV-protected waterproof-backed polyester</strong> — a durable standard material engineered for long-term outdoor exposure. The fabric resists fading, sheds water reliably, and maintains its structure under load. Select colors (Coyote, Olive Drab, ACU Camo, and Multicam) are made from USA-made Cordura® nylon — please note these colors do not include UV inhibitors, so the anti-fade warranty does not apply to them. All other colors are UV-treated polyester.</p>\n<ul>\n<li><strong>Standard material: UV-protected waterproof-backed polyester</strong> — reliable all-season protection</li>\n<li><strong>Select colors in Cordura® nylon</strong>: Coyote, Olive Drab, ACU Camo, Multicam (no anti-fade warranty on these colors)</li>\n<li><strong>High-tensile webbing loop</strong> — rated for serious pulling loads</li>\n<li><strong>Reinforced stitching</strong> — triple-stitched stress points, not just the seams</li>\n<li><strong>Multiple color options</strong> — match your interior or go tactical</li>\n</ul>\n<h2>Made in the USA — Every Single One</h2>\n<p>Every Bartact grab handle is cut, sewn, and quality-checked at our facility in the United States. We don\'t outsource the stitching or skip the QC. When you order from Bartact, you\'re getting a product that American hands built to American standards — not a container-ship special with mystery materials and no customer support.</p>\n<h2>Direct Bolt-On Fit for Ford Bronco</h2>\n<p>Our Ford Bronco grab handles are designed to slip directly over your factory roll bar without drilling, cutting, or modifications. The mounting sleeve wraps the bar snugly and secures with a hook-and-loop closure reinforced by a retention strap. Installation takes under five minutes and requires zero tools. Removal is equally fast for those days when you pull the doors and top and want a cleaner look.</p>\n<h2>Frequently Asked Questions</h2>\n<dl>\n<dt><strong>Will these fit both the 2-door and 4-door Ford Bronco?</strong></dt>\n<dd>Yes. Our Bronco grab handles fit all 2021-and-newer Ford Bronco models, including both 2-door and 4-door configurations. The roll bar diameter is the same across both body styles.</dd>\n<dt><strong>How do the standard polyester and Cordura® options compare?</strong></dt>\n<dd>Our standard UV-protected polyester offers excellent protection and is the most popular choice for everyday off-road use. Cordura® is our premium upgrade for extreme conditions and provides enhanced abrasion resistance. Both options provide reliable performance — Cordura® simply adds mil-spec durability if you need maximum toughness.</dd>\n<dt><strong>Can I wash Bartact grab handles?</strong></dt>\n<dd>Absolutely. Spot-clean with a damp cloth and mild soap, or remove them and hand-wash. They air-dry quickly thanks to the waterproof backing. Do not machine-dry.</dd>\n<dt><strong>Do they come in matching colors for my Bronco seat covers?</strong></dt>\n<dd>Yes — we offer the same color palette across grab handles, seat covers, and roll bar pads so you can build a fully coordinated interior. Check our available colors in the product options above.</dd>\n<dt><strong>What\'s the return policy if they don\'t fit?</strong></dt>\n<dd>We stand behind our fitment. If something doesn\'t work for your specific Bronco build, contact us and we\'ll make it right — exchange, refund, or credit, your choice.</dd>\n</dl>\n<h2>Complete Your Bronco Interior</h2>\n<p>Grab handles are just the start. Pair them with our <a href="/collections/ford-bronco-seat-covers">Ford Bronco seat covers</a>, <a href="/collections/ford-bronco-storage-bags">Ford Bronco storage bags</a>, <a href="/collections/roll-bar-pads">roll bar pads</a>, and <a href="/collections/jeep-grab-handles">Jeep grab handles</a> if you run both rigs. Everything is made in the same facility from premium materials — so it all holds up the same way, for years.</p>'
  },
  {
    id: 688348856363,
    handle: 'jeep-wrangler-grab-handles',
    kw: 'jeep wrangler grab handles',
    body_html: '<p><strong>Jeep Wrangler grab handles</strong> from Bartact give your passengers a bomber grip point that holds up mile after mile — whether you\'re wheeling Rubicon, hitting the dunes, or just keeping a nervous first-time passenger calm on a steep descent. These are not decoration. They\'re functional safety hardware for serious off-roaders.</p>\n<h2>Built From Quality Materials — Standard or Upgrade to Cordura®</h2>\n<p>Bartact Jeep grab handles are engineered from <strong>proprietary UV-protected waterproof-backed polyester</strong> as our standard material — proven to resist trail abuse, UV exposure, and sweat over years of real off-road use. Select colors (Coyote, Olive Drab, ACU Camo, and Multicam) are USA-made Cordura® nylon — note these do not include UV inhibitors, so the anti-fade warranty does not apply.</p>\n<ul>\n<li><strong>Standard material: UV-protected waterproof-backed polyester</strong> — proven durability and weather resistance</li>\n<li><strong>Select colors in Cordura® nylon</strong>: Coyote, Olive Drab, ACU Camo, Multicam (no anti-fade warranty)</li>\n<li><strong>High-tensile strap core</strong> — the pull strength is built into the loop, not just the outer shell</li>\n<li><strong>Triple-stitched stress points</strong> — where the webbing anchors, the stitching doubles and triples</li>\n<li><strong>UV-resistant color</strong> — stays vibrant even parked in the Arizona sun all summer</li>\n<li><strong>Multiple Jeep-specific colorways</strong> — from stealth black to tan to coyote</li>\n</ul>\n<h2>Made in America — Not Overseas</h2>\n<p>Every grab handle Bartact ships is sewn by our team in the USA. That means real quality control, real accountability, and real customer service when you need it. We\'re not a dropship operation. We\'re a manufacturer, and we stand behind what we make.</p>\n<h2>Fits JK, JL, and JT — No Drilling Required</h2>\n<p>Our Jeep Wrangler grab handles mount directly to factory roll bars on JK (2007–2018), JL (2018–present), and JT Gladiator platforms. The sleeve slides over the bar and locks with a reinforced hook-and-loop closure. No tools, no drilling, no permanent modification. Takes about three minutes to install and comes off just as fast when you want a clean interior look.</p>\n<h2>Frequently Asked Questions</h2>\n<dl>\n<dt><strong>Do these fit both JK and JL Wranglers?</strong></dt>\n<dd>Yes. Our Jeep Wrangler grab handles are designed to fit the JK (2007–2018) and JL (2018–present) roll bar diameters. Select your year/model in the product options to confirm compatibility for your specific platform.</dd>\n<dt><strong>When should I choose Cordura® over the standard material?</strong></dt>\n<dd>The standard UV-protected polyester is our recommended material for typical off-road use and handles everything most customers throw at it. Choose Cordura® if you\'re running extreme expeditions, working in professional guide services, or simply want maximum mil-spec durability at any cost.</dd>\n<dt><strong>Are they safe for kids and smaller passengers?</strong></dt>\n<dd>Absolutely. The handles are sized and positioned to be comfortable for adults and older kids alike. The webbing loop is wide enough for a firm full-hand grip without cutting into fingers.</dd>\n<dt><strong>Do you make matching roll bar pads?</strong></dt>\n<dd>Yes — we make padded roll bar covers in the same materials (standard polyester and Cordura® upgrade options) that pair perfectly with these grab handles. Grab handles + roll bar pads is the most popular combination for Wrangler interiors.</dd>\n<dt><strong>How do I clean them after muddy trail days?</strong></dt>\n<dd>Pull them off the bar, rinse with a hose, scrub with mild soap if needed, and hang to air dry. Our materials dry fast and don\'t hold odors.</dd>\n</dl>\n<h2>Build Out the Rest of Your Interior</h2>\n<p>Grab handles are one piece of the puzzle. Explore our full Jeep Wrangler interior lineup: <a href="/collections/jeep-wrangler-seat-covers">Jeep Wrangler seat covers</a>, <a href="/collections/roll-bar-pads">roll bar pads</a>, <a href="/collections/jeep-wrangler-storage-bags-organizers">storage bags and organizers</a>, and <a href="/collections/paracord-grab-handles">paracord grab handles</a> for a different grip texture. All Bartact products are made in the USA from quality materials.</p>'
  },
  {
    id: 137430564887,
    handle: 'winch-covers',
    kw: 'winch cover',
    body_html: '<p>A quality <strong>winch cover</strong> from Bartact is one of the most overlooked — and most important — pieces of recovery gear protection you can add to your rig. Your winch is a serious investment. Leaving it exposed to UV, rain, trail mud, and road grime degrades the finish, seizes the drum, and shortens motor life. A well-made winch cover costs almost nothing compared to a winch replacement. Bartact\'s are made right, made in the USA, and built to last.</p>\n<h2>Material & Protection — Standard Polyester or Cordura® Upgrade</h2>\n<p>Bartact winch covers are built from <strong>proprietary UV-protected waterproof-backed polyester</strong> — engineered to shed water, resist fading, and provide reliable protection in all weather conditions. This is our standard, proven material. For professional guide services and extreme expeditions where maximum durability matters, we also offer <strong>1000-denier Cordura® nylon</strong> as an upgrade option.</p>\n<ul>\n<li><strong>Standard material: UV-protected waterproof-backed polyester</strong> — weather-resistant and reliable</li>\n<li><strong>Upgrade option: 1000D Cordura® nylon</strong> — mil-spec durability for maximum protection</li>\n<li><strong>Reinforced seams</strong> — stitched to handle repeated on-trail install/removal</li>\n<li><strong>Elastic retention band</strong> — keeps the cover snug even at highway speeds</li>\n<li><strong>Hook-and-loop closure</strong> — fast on, fast off, no fumbling with zippers in cold weather</li>\n<li><strong>Multiple sizes</strong> — fits most 8,000–17,500 lb. winches from Warn, Smittybilt, Superwinch, and more</li>\n<li><strong>Color options</strong> — black, tan, coyote, and more to match your build</li>\n</ul>\n<h2>Made in the USA</h2>\n<p>Every Bartact winch cover is cut and sewn by our team in the United States. Not outsourced. Not drop-shipped from a warehouse you\'ve never heard of. We make them here, we inspect them here, and we back them with real customer support. That matters when you\'re on a trail three hours from the nearest parts store.</p>\n<h2>Simple Installation — On or Off in Seconds</h2>\n<p>Our winch covers slip over the drum housing and secure with an elastic band and hook-and-loop strap. No tools. No straps to thread. No clips to break. When you\'re at the trailhead and need the winch ready fast, you pull it off in one motion. When you\'re done, it goes back on just as quickly. That\'s the design — get out of the way when you need the winch, protect it the rest of the time.</p>\n<h2>Frequently Asked Questions</h2>\n<dl>\n<dt><strong>Will this fit my specific winch model?</strong></dt>\n<dd>We size our winch covers to cover the most common winch footprints on the market. Check the dimensions listed in each product option against your winch\'s housing width and depth. Contact us with your winch model before ordering if you have fitment questions.</dd>\n<dt><strong>Can I leave the cover on while I use the winch?</strong></dt>\n<dd>No — remove the cover before rigging up for a recovery. The cover protects the winch during storage and transit. During use, you want full access to the drum, hawse, and controls without obstruction.</dd>\n<dt><strong>Should I choose Cordura® for my winch cover?</strong></dt>\n<dd>The standard UV-protected polyester is our recommended choice and handles all typical off-road conditions. Cordura® is an upgrade for professional operations or extreme expeditions where maximum protection is worth the extra cost.</dd>\n<dt><strong>Is the cover road-legal for highway driving?</strong></dt>\n<dd>Yes — the elastic retention band keeps the cover in place at highway speeds without flapping or coming loose. Thousands of Bartact customers drive daily-driven rigs on the highway with this cover on between trail days.</dd>\n<dt><strong>Do you make other recovery accessories?</strong></dt>\n<dd>Yes — we also make storage bags and organizers for your full recovery kit, all in the same material quality and build standard. Everything stows your gear cleanly and protects it on the trail.</dd>\n</dl>\n<h2>Gear Up the Rest of Your Recovery Kit</h2>\n<p>A winch cover is step one. Protect the rest of your recovery gear with Bartact\'s full lineup: <a href="/collections/jeep-wrangler-storage-bags-organizers">Jeep storage bags and organizers</a>, <a href="/collections/ford-bronco-storage-bags">Ford Bronco storage bags</a>, <a href="/collections/molle-accessories">MOLLE accessories</a>, and <a href="/collections/jeep-wrangler-suspension-limit-straps">limit straps</a>. All made in the USA from quality materials.</p>'
  },
  {
    id: 265140207659,
    handle: 'ford-bronco-seat-covers',
    kw: 'best ford bronco seat covers',
    body_html: '<p>The <strong>best Ford Bronco seat covers</strong> aren\'t the ones with the lowest price tag — they\'re the ones still looking great and holding their shape after three seasons of trail dust, rain, kids, dogs, and wet gear. Bartact\'s Ford Bronco seat covers are made in the USA from quality materials and engineered to fit the Bronco\'s factory seats precisely, so you get protection that actually works and an interior that looks intentional, not jury-rigged.</p>\n<h2>Material: UV-Protected Polyester (select colors in Cordura® nylon)</h2>\n<p>Bartact Ford Bronco seat covers are constructed from <strong>proprietary UV-protected waterproof-backed polyester</strong> as our standard, proven material. It sheds water, resists UV fading, and maintains its appearance through years of hard use. Select colors (Coyote, Olive Drab, ACU Camo, and Multicam) are USA-made Cordura® nylon. Note: Cordura colors do not include UV inhibitors, so the anti-fade warranty does not apply to those colors.</p>\n<ul>\n<li><strong>Standard material: UV-protected waterproof-backed polyester</strong> — reliable protection and long lifespan</li>\n<li><strong>Select colors in Cordura® nylon</strong>: Coyote, Olive Drab, ACU Camo, Multicam (no anti-fade warranty)</li>\n<li><strong>Precise Ford Bronco-specific patterns</strong> — not a universal fit stretched and tucked; a pattern made for your exact seats</li>\n<li><strong>Side airbag compatibility</strong> — our covers are designed with proper seam placement so your seat-mounted airbags deploy correctly</li>\n<li><strong>Waterproof backing</strong> — moisture protection without trapping heat or odor</li>\n</ul>\n<h2>Made in the USA — Every Cover, Every Stitch</h2>\n<p>Bartact seat covers are cut, sewn, and inspected at our facility in the United States by a team that\'s been doing this for years. We\'re not a marketing company that sources from overseas. We\'re a manufacturer. That means real quality control, real lead times we can stand behind, and real customer support when you need it. When something\'s not right, you talk to the people who made it.</p>\n<h2>Fits 2021+ Ford Bronco — 2-Door and 4-Door</h2>\n<p>Our covers are patterned specifically for the 2021-and-newer Ford Bronco across both body styles. Front covers wrap the buckets without bunching at the bolster. Rear covers account for the 60/40 split fold without leaving exposed gaps. Installation uses the factory headrest posts and tucked attachment points — no visible clips, no loose Velcro slapping around.</p>\n<h2>Frequently Asked Questions</h2>\n<dl>\n<dt><strong>Should I choose the standard material or Cordura® upgrade?</strong></dt>\n<dd>Our standard UV-protected polyester is durable, affordable, and recommended for most off-road use. Cordura® is our premium upgrade if you want maximum mil-spec abrasion resistance and don\'t mind paying extra for the absolute toughest material available.</dd>\n<dt><strong>Will they work with my Bronco\'s seat-mounted side airbags?</strong></dt>\n<dd>Yes. All Bartact Bronco seat covers are designed with airbag-compatible seam placement. The side airbag deployment panel is not permanently sewn over — it\'s designed to allow proper airbag function in the event of a collision.</dd>\n<dt><strong>Do they fit heated seat Broncos?</strong></dt>\n<dd>Yes. Both our standard polyester and Cordura® fabrics are thin enough to allow heat transfer from factory heated seats without blocking the warming effect.</dd>\n<dt><strong>Can I wash Ford Bronco seat covers from Bartact?</strong></dt>\n<dd>Yes — remove them and hand-wash or machine-wash on a gentle cycle in cold water. Air dry only. Both materials are colorfast and won\'t shrink. Most customers do a quick hose-off after muddy trail days and let them dry before reinstalling.</dd>\n<dt><strong>How long does installation take?</strong></dt>\n<dd>First install typically takes 30–45 minutes for front and rear. After the first time, reinstall after washing takes 15–20 minutes. No special tools required.</dd>\n</dl>\n<h2>Complete Your Bronco Interior</h2>\n<p>Seat covers are the foundation of a protected Bronco interior. Round it out with <a href="/collections/ford-bronco-grab-handles">Ford Bronco grab handles</a>, <a href="/collections/ford-bronco-storage-bags">Ford Bronco storage bags</a>, <a href="/collections/roll-bar-pads">roll bar pads</a>, and <a href="/collections/molle-accessories">MOLLE accessories</a>. Every product in the Bartact lineup is made in the USA from quality materials — so they coordinate visually and hold up the same way, for years.</p>'
  }
];

async function run() {
  const results = [];
  const failures = [];
  
  console.log(`\n🚀 Starting Bartact collection description audit (${new Date().toISOString()})\n`);
  console.log(`📋 Enforcing material hierarchy:`);
  console.log(`   ✓ STANDARD: UV-protected waterproof-backed polyester (ALWAYS LEAD)\n   ✓ Cordura nylon: upgrade option only (secondary)\n`);
  
  for (const col of updates) {
    process.stdout.write(`📝 ${col.handle} ... `);
    try {
      const r = await shopifyPut(col.id, col.body_html);
      if (r.s === 200) {
        console.log('✅');
        results.push({ handle: col.handle, kw: col.kw, status: 'updated', code: 200 });
      } else {
        console.log(`❌ HTTP ${r.s}`);
        failures.push({ handle: col.handle, kw: col.kw, status: 'error', code: r.s, response: JSON.stringify(r.b).slice(0, 200) });
        results.push({ handle: col.handle, kw: col.kw, status: 'error', code: r.s });
      }
    } catch (e) {
      console.log(`❌ ${e.message}`);
      failures.push({ handle: col.handle, kw: col.kw, status: 'error', error: e.message });
      results.push({ handle: col.handle, kw: col.kw, status: 'error', error: e.message });
    }
    await sleep(700);
  }
  
  const summary = {
    timestamp: new Date().toISOString(),
    total: results.length,
    succeeded: results.filter(r => r.status === 'updated').length,
    failed: failures.length,
    results,
    failures: failures.length > 0 ? failures : []
  };
  
  console.log(`\n\n${'='.repeat(60)}`);
  console.log(`📊 Collection Description Audit Summary`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Total collections: ${summary.total}`);
  console.log(`✅ Updated: ${summary.succeeded}`);
  console.log(`❌ Failed: ${summary.failed}`);
  console.log(`${'='.repeat(60)}\n`);
  
  if (summary.failed > 0) {
    console.log(`⚠️  FAILURES DETECTED:\n`);
    failures.forEach(f => {
      console.log(`  • ${f.handle}`);
      console.log(`    ${f.error || `HTTP ${f.code}: ${f.response}`}\n`);
    });
  } else {
    console.log(`✅ All collections updated successfully with correct material hierarchy\n`);
  }
  
  // Save to memory
  fs.writeFileSync('/home/ubuntu/.openclaw/workspace/memory/bartact-seo-updates.md', `# Bartact Collection Description Audit

**Run Time:** ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC
**Date:** Thursday, September 3rd, 2026

## Material Hierarchy Enforcement

✓ **STANDARD Material:** UV-protected waterproof-backed polyester (always leads)  
✓ **Cordura Option:** 1000-denier nylon (secondary/upgrade only)

## Results

| Collection | Keyword | Status |
|-----------|---------|--------|
${results.map(r => `| \`${r.handle}\` | ${r.kw} | ${r.status === 'updated' ? '✅' : '❌'} |`).join('\n')}

## Summary

- **Total:** ${summary.total}
- **Updated:** ${summary.succeeded}
- **Failed:** ${summary.failed}

${summary.failed > 0 ? `\n## Failures\n\n${failures.map(f => `- **${f.handle}**: ${f.error || f.response}`).join('\n')}\n\n⚠️ Action needed: Fix and re-run.` : '\n✅ All collections updated successfully.'}

---
*Audit completed by bartact-collection-descriptions.js*
`);
  
  console.log(`💾 Results saved to memory/bartact-seo-updates.md`);
  
  process.exit(summary.failed > 0 ? 1 : 0);
}

run().catch(e => {
  console.error('❌ Fatal error:', e);
  process.exit(1);
});
