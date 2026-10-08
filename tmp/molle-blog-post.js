'use strict';
require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TOKEN = process.env.SHOPIFY_TOKEN_BARTACT;
const SHOP = 'bartact.myshopify.com';
const BLOG_ID = 19510597;
const WORKSPACE = '/home/ubuntu/.openclaw/workspace';

function shopifyRequest(method, apiPath, body = null) {
  return new Promise((res, rej) => {
    const buf = body ? Buffer.from(JSON.stringify(body)) : null;
    const req = https.request({
      hostname: SHOP,
      path: `/admin/api/2024-01/${apiPath}`,
      method,
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

const title = 'MOLLE Accessories for Jeep Wrangler — Trail Organization Guide';
const metaTitle = 'MOLLE Accessories for Jeep Wrangler | Bartact';
const metaDesc = 'MOLLE accessories for Jeep Wrangler JKU and JLU — pouches, nets, panels, and mounting solutions made in the USA by Bartact.';

const bodyHtml = `
<p>If you've spent any time on the trail, you know how fast a Jeep Wrangler's interior turns into a disaster zone. Gear shifts around on rough terrain, recovery equipment ends up buried under everything else, and finding what you need in a hurry gets harder the longer you're out there. MOLLE accessories solve that — and Bartact makes them specifically for the Wrangler's unique interior dimensions.</p>

<h2>What MOLLE Actually Is (and Why It Matters in Your JKU or JLU)</h2>
<p>MOLLE stands for Modular Lightweight Load-carrying Equipment. It started as a military standard for attaching pouches, tools, and gear to vests and packs using woven PALS webbing — parallel rows of nylon spaced exactly 1 inch apart, 1.5 inches center to center. Any MOLLE-compatible pouch clips into any MOLLE-compatible panel. That standardization is what makes the system worth using: once you have a MOLLE panel in your Wrangler, you can reconfigure it with whatever pouches you need for a given trip.</p>
<p>Bartact MOLLE accessories use true mil-spec PALS webbing — the same spacing as military gear, so everything fits and locks in correctly. We don't approximate the standard; we build to it.</p>

<h2>MOLLE Panels and Nets for JKU and JLU</h2>
<p>Bartact makes MOLLE panels and nets designed to fit the specific seat geometry of the Jeep Wrangler JKU (2007-2018) and JLU (2018-present). The rear bench seat upper area is a common mounting point — it's a large flat section that would otherwise go completely unused. A MOLLE net or velcro panel mounted there gives you organized, accessible storage for recovery gear, first aid kits, tools, or snacks without taking up floor space or blocking sightlines.</p>
<p>Browse the full selection at <a href="/collections/molle-accessories">Bartact MOLLE Accessories</a> — all made in the USA.</p>

<h2>MOLLE Pouches: What to Run and Where</h2>
<p>Bartact MOLLE pouches come in multiple sizes — from small utility pouches for tools and fire starters to large zippered pouches for first aid kits and recovery straps. The key is matching pouch size to the panel space available. JKU rear bench panels typically support two large pouches side by side with room to spare. JLU setups often run a combination of medium and large pouches depending on the seat configuration.</p>
<p>A few combinations that work well in Wranglers:</p>
<ul>
  <li><strong>Recovery setup:</strong> One large MOLLE pouch for straps + one IFAK pouch for first aid, mounted on the rear bench upper MOLLE net</li>
  <li><strong>Daily driver:</strong> Two medium pouches on the back of the front seat headrests for trail snacks, phone mounts, and small tools</li>
  <li><strong>Full overland rig:</strong> MOLLE panels on both front seat backs + rear bench upper net, with a mix of pouches and carabiner attachments</li>
</ul>

<h2>Your Wrangler, Your Dog, Your Gear</h2>
<p>A lot of Wrangler owners run their dogs on trail. MOLLE organization makes that cleaner — gear that's clipped in and locked down doesn't slide around when a 70-pound lab decides the back seat is a launching pad. MOLLE pouches keep recovery gear, first aid supplies, and dog gear separated and accessible without the whole interior becoming a pile. A waterproof MOLLE pouch on the rear bench is a solid spot for leash, collapsible bowl, and a first aid kit for the dog.</p>

<h2>MOLLE Attachments and Hardware</h2>
<p>Bartact also carries the full range of MOLLE attachment hardware — T-bars, swivel hooks, side release buckles, HK hooks — for field repairs and custom rigging. If you're building a custom MOLLE setup or repairing a pouch attachment that's taken a hit on trail, having the right hardware in a small zippered pouch can save a trip. See the full <a href="/collections/molle-accessories">MOLLE attachment hardware lineup</a> for sizes and configurations.</p>

<h2>Made in the USA — Built for Real Trail Use</h2>
<p>Every Bartact MOLLE accessory is cut and sewn at our facility in the United States. We build to mil-spec PALS webbing standards, use bar-tack stitching on all stress points, and test fit to actual Wrangler seat geometry before anything ships. If you have fitment questions about a specific JKU or JLU configuration, contact us before ordering — we'd rather answer questions than process returns.</p>
`;

async function main() {
  // Word count check
  const wordCount = bodyHtml.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(w => w.length > 2).length;
  console.log(`Word count: ${wordCount}`);
  if (wordCount < 450) { console.error('FAIL: Under 450 words'); process.exit(1); }

  // Meta length check
  if (metaTitle.length > 60) { console.error(`FAIL: Meta title ${metaTitle.length} chars (max 60)`); process.exit(1); }
  if (metaDesc.length > 160) { console.error(`FAIL: Meta desc ${metaDesc.length} chars (max 160)`); process.exit(1); }

  // Internal links check
  const internalLinks = (bodyHtml.match(/href="\/collections\//g) || []).length;
  if (internalLinks < 2) { console.error(`FAIL: Only ${internalLinks} internal links (need 2+)`); process.exit(1); }

  console.log(`✅ Quality gate passed: ${wordCount} words, ${internalLinks} internal links`);
  console.log(`   Meta title: ${metaTitle.length} chars`);
  console.log(`   Meta desc: ${metaDesc.length} chars`);

  // Forbidden checks
  const forbidden = ['1000D Cordura', 'free shipping', 'besttirepatch', 'Bartact invented'];
  for (const f of forbidden) {
    if (bodyHtml.toLowerCase().includes(f.toLowerCase())) {
      console.error(`FAIL: Forbidden phrase found: ${f}`);
      process.exit(1);
    }
  }
  console.log('✅ No forbidden phrases');

  // Publish
  const article = {
    title,
    author: 'Bartact',
    tags: 'bartact, molle, jeep-wrangler, off-road, tactical',
    body_html: bodyHtml,
    published: true,
    published_at: new Date().toISOString(),
    metafields: [
      { namespace: 'global', key: 'title_tag', value: metaTitle, type: 'single_line_text_field' },
      { namespace: 'global', key: 'description_tag', value: metaDesc, type: 'single_line_text_field' }
    ]
  };

  const r = await shopifyRequest('POST', `blogs/${BLOG_ID}/articles.json`, { article });
  if (r.status !== 201) {
    console.error('❌ Publish failed:', r.status, JSON.stringify(r.body).slice(0, 300));
    process.exit(1);
  }

  const a = r.body.article;
  const url = `https://www.bartact.com/blogs/news/${a.handle}`;
  console.log(`✅ Published: ${a.title} (ID: ${a.id})`);
  console.log(`   URL: ${url}`);

  // Submit to Google Indexing API + IndexNow
  console.log('\nSubmitting to indexing...');
  try {
    execSync(`node ${WORKSPACE}/scripts/bartact-publish-and-index.js --account bartact "${url}"`, { stdio: 'inherit' });
  } catch(e) {
    console.error('Indexing error (non-fatal):', e.message);
  }

  // Update blog calendar
  const calPath = `${WORKSPACE}/memory/bartact-blog-calendar.md`;
  if (fs.existsSync(calPath)) {
    let cal = fs.readFileSync(calPath, 'utf8');
    cal = cal.replace(
      '| PENDING | MOLLE Accessories for Jeep Wrangler — Trail Organization Guide',
      '| DONE | MOLLE Accessories for Jeep Wrangler — Trail Organization Guide'
    );
    fs.writeFileSync(calPath, cal);
    console.log('✅ Blog calendar updated');
  }
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
