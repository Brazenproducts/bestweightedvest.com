#!/usr/bin/env node
// Wrangliator SEO — All 4 Tasks
// Task 1: Fix product SEO metafields (title_tag, description_tag)
// Task 2: Create collection + add products
// Task 3: Submit URLs to Google Indexing API
// Task 4: Write blog post

const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const WORKSPACE = '/home/ubuntu/.openclaw/workspace';
const TOKEN = (() => {
  const env = fs.readFileSync(path.join(WORKSPACE, '.env'), 'utf8');
  const m = env.match(/SHOPIFY_TOKEN_BARTACT=(.+)/);
  return m ? m[1].trim() : null;
})();
const SHOP = 'bartact.myshopify.com';
const API_VER = '2026-01';

const SA_PATH = path.join(WORKSPACE, '.bartact-indexing-service-account.json');
const sa = JSON.parse(fs.readFileSync(SA_PATH, 'utf8'));

const FRONT_ID = '7289126813739';
const REAR_ID = '7289412026411';

const LOG_FILE = path.join(WORKSPACE, 'memory/wrangliator-seo-done.md');
const results = [];

function log(msg) {
  console.log(msg);
  results.push(msg);
}

function httpsReq(options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function shopifyReq(method, endpoint, data) {
  const body = data ? JSON.stringify(data) : null;
  const opts = {
    hostname: SHOP,
    path: `/admin/api/${API_VER}${endpoint}`,
    method,
    headers: {
      'X-Shopify-Access-Token': TOKEN,
      'Content-Type': 'application/json'
    }
  };
  return httpsReq(opts, body);
}

// JWT for Google service account
function makeJWT() {
  const h = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const p = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  })).toString('base64url');
  const s = crypto.createSign('RSA-SHA256').update(h + '.' + p).sign(sa.private_key, 'base64url');
  return h + '.' + p + '.' + s;
}

async function getGoogleToken() {
  const jwt = makeJWT();
  const body = 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + jwt;
  const resp = await httpsReq({
    hostname: 'oauth2.googleapis.com',
    path: '/token',
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  }, body);
  const data = JSON.parse(resp.body);
  if (!data.access_token) throw new Error('Google token failed: ' + resp.body);
  return data.access_token;
}

async function submitToIndexingAPI(gToken, url) {
  const body = JSON.stringify({ url, type: 'URL_UPDATED' });
  const resp = await httpsReq({
    hostname: 'indexing.googleapis.com',
    path: '/v3/urlNotifications:publish',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${gToken}`,
      'Content-Type': 'application/json'
    }
  }, body);
  return { status: resp.status, body: resp.body };
}

async function setMetafield(productId, key, value) {
  // First get existing metafields to see if we need to update or create
  const getResp = await shopifyReq('GET', `/products/${productId}/metafields.json?namespace=global&key=${key}`);
  const existing = JSON.parse(getResp.body).metafields || [];
  
  if (existing.length > 0) {
    // Update existing
    const mfId = existing[0].id;
    const putResp = await shopifyReq('PUT', `/products/${productId}/metafields/${mfId}.json`, {
      metafield: { id: mfId, value, type: 'single_line_text_field' }
    });
    return { status: putResp.status, body: putResp.body, action: 'updated', mfId };
  } else {
    // Create new
    const postResp = await shopifyReq('POST', `/products/${productId}/metafields.json`, {
      metafield: { namespace: 'global', key, value, type: 'single_line_text_field' }
    });
    return { status: postResp.status, body: postResp.body, action: 'created' };
  }
}

const BLOG_POST_BODY = `
<p>Let's clear something up right away: if you're looking for a way to <strong>store your removed Jeep doors</strong> somewhere in your garage or on your rig, that's a different product entirely. What we're talking about here is something even more useful on the trail — <strong>storage bags mounted <em>inside</em> your Jeep doors</strong>, right there while you're driving. That's what the Wrangliator is all about.</p>

<h2>What Are the Wrangliator Door Storage Bags?</h2>

<p>The <strong>Wrangliator door storage bags by Bartact</strong> are purpose-built interior door organizers designed specifically for the Jeep Wrangler JL, JLU, and Gladiator. These aren't generic cargo bags with some straps thrown on — they're precision-engineered to fit the interior door panel of your exact vehicle with zero modifications required.</p>

<p>If you've been hunting for a <strong>Jeep JL door pocket organizer</strong> that actually fits like it belongs there, you've found it. No adapters, no universal fit compromises — just a bag designed from the ground up for your JL/JLU or Gladiator door.</p>

<h2>The Best Storage Location on Your Rig</h2>

<p>Think about it. When you're on the trail, where's the easiest place to reach? Your door. It's right there at arm's length without taking your eyes off the terrain. The <strong>Wrangliator turns that dead space into clutch storage</strong> — the kind of storage you can access without unbuckling, without reaching into the back seat, without stopping.</p>

<p>Whether you're stuffing in a water bottle, trail maps, your phone, snacks, recovery gear essentials, or anything else you want within arm's reach, the Wrangliator delivers that as a true <strong>Jeep Wrangler door interior storage</strong> solution. It's not bolted to the floor. It's not mounted to the roll cage. It's right where you need it.</p>

<h2>No Drill. No Mods. No Nonsense.</h2>

<p>One of the most impressive things about the Wrangliator design is how it attaches. This bag uses your Jeep's <strong>stock hardware</strong> — no drilling required, no holes in your door panels, no permanent modifications whatsoever. That means you can install it, remove it, and reinstall it without any trace.</p>

<p>And the install time? <strong>About 5 minutes per door.</strong> You read that right. Five minutes from opening the box to having fully functional <strong>storage bags inside your Jeep door</strong>. If you've ever spent a weekend trying to rig up some DIY storage solution, you'll appreciate how refreshing that is.</p>

<h2>Built to Survive the Trail</h2>

<p>Bartact doesn't make gear for weekend warriors who stay on pavement. Their products are built for actual off-road use, and the Wrangliator is no different.</p>

<h3>Waterproof With Double Lockable Zippers</h3>

<p>The Wrangliator features <strong>water-resistant, double lockable zippers</strong> — the kind that keep your gear dry when you're fording a stream or getting caught in a downpour with the top off. These aren't the zippers you'll find on a $15 grocery bag organizer. These are heavy-duty closures designed for the Jeep lifestyle.</p>

<h3>Won't Fade</h3>

<p>Sun, UV rays, years of abuse — the Wrangliator holds its color. The materials are selected specifically to resist fading even when your doors are off and the interior is exposed to direct sunlight for extended periods. Your bags will still look sharp years from now.</p>

<h3>Huge Internal Storage Area</h3>

<p>The main compartment isn't just a pouch — it's a <strong>genuinely large internal storage area</strong> that can handle a serious haul. Think recovery straps, first aid essentials, a jacket, a hydration bladder, tools — whatever you need for a full day on the trail.</p>

<h2>Smart Pockets for Everyday Carry</h2>

<h3>Dedicated Cell Phone Pocket</h3>

<p>In the age of trail apps, GPS navigation, and communication on the trail, having your phone accessible matters. The Wrangliator includes a <strong>dedicated cell phone pocket</strong> so your phone is always within reach and protected. No more wedging it between the seat and console hoping it doesn't slide around.</p>

<h3>Extra Mesh Pocket</h3>

<p>Beyond the main compartment and the phone pocket, there's an <strong>additional mesh pocket</strong> for organizing smaller items. Quick-grab stuff like chapstick, sunscreen, a multi-tool, keys, or anything else you reach for constantly throughout the day.</p>

<h2>Jeep Gladiator Door Mounted Bag — It Fits That Too</h2>

<p>Don't have a Wrangler? If you're running a Gladiator, the Wrangliator has you covered as well. The same precision fit that works for the JLU translates directly to the Gladiator interior door. If you've been searching for a <strong>Jeep Gladiator door mounted bag</strong> that's purpose-built rather than jerry-rigged, this is it.</p>

<p>The Gladiator gets a lot of love from overlanders and truck campers who need serious cargo management. The Wrangliator fits right into that ecosystem — it's the interior organization piece that was missing from an otherwise fully kitted-out rig.</p>

<h2>MOLLE Compatible and Bartact Ecosystem Ready</h2>

<p>Bartact is known for their MOLLE-based accessories, and the Wrangliator plays well in that ecosystem. If you've already got Bartact seat covers or other MOLLE accessories, the Wrangliator integrates naturally with how you've already organized your rig. It's part of a cohesive system, not a one-off purchase.</p>

<h2>Multiple Bartact Logo Colors</h2>

<p>Bartact gives you <strong>multiple logo color options</strong> so the Wrangliator can match your rig's color scheme or personal style. Whether you're going stealth with a blacked-out look or want something that stands out, there's a color combination for you.</p>

<h2>Front and Rear — Complete Coverage</h2>

<p>The Wrangliator comes in two variants:</p>

<ul>
<li><strong>Front Door Storage Bags</strong> — for the front interior doors of the JL/JLU and Gladiator</li>
<li><strong>Rear Door Storage Bags</strong> — for the rear interior doors of the JLU and Gladiator (4-door models)</li>
</ul>

<p>Running the full set means you can outfit every door on your four-door Wrangler or Gladiator, turning all that wasted door panel space into serious <strong>Wrangler JLU door interior organizer</strong> real estate. The front bags keep the driver and passenger stocked; the rear bags give back-seat passengers and co-pilots their own organized space.</p>

<h2>Patent Pending — This Design is Unique</h2>

<p>The Wrangliator's design is patent-pending. That means nobody else is doing this the same way. Bartact invested serious engineering time to create a bag that fits the JL/JLU/Gladiator interior door properly and mounts securely using the factory hardware. You're not buying a knockoff or a generic solution. You're buying the original.</p>

<h2>Made in USA</h2>

<p>Bartact manufactures in the USA. When you buy Wrangliator bags, you're buying American-made gear from a company that stands behind their products. For a lot of Jeep owners who care about where their gear comes from, that matters.</p>

<h2>Why Wrangliator? The Bottom Line</h2>

<p>If we had to sum it up: these are, without a doubt, <strong>the most awesome storage bags in existence for the Wrangler JL/JLU/Gladiator</strong>. That's not marketing fluff — it's what happens when a company that actually understands Jeeps designs a product specifically for Jeep owners who demand quality.</p>

<p>Here's the complete rundown:</p>

<ul>
<li>✅ Precision fit for JL/JLU/Gladiator doors — not a generic bag</li>
<li>✅ Clutch storage at the easiest-access location on your rig</li>
<li>✅ Zero drilling — uses stock factory hardware</li>
<li>✅ 5-minute install per door</li>
<li>✅ UV and fade resistant materials</li>
<li>✅ Waterproof with double lockable water-resistant zippers</li>
<li>✅ Dedicated cell phone pocket</li>
<li>✅ Extra mesh organizational pocket</li>
<li>✅ Huge internal storage area for trail essentials</li>
<li>✅ Multiple Bartact logo colors available</li>
<li>✅ Patent pending, Made in USA</li>
</ul>

<p>Whether you're a daily driver who occasionally hits dirt roads, a hardcore trail runner who lives for the weekend, or an overlander who needs every cubic inch optimized — the Wrangliator belongs on your doors.</p>

<p>Stop dealing with loose gear rattling around your floor, your console, and your lap. Put it where it belongs: <strong>right in your door, right within reach</strong>.</p>

<p><a href="/products/wrangliator-front-door-storage-bags-for-jeep-wrangler-jl-jlu-and-gladiator-patent-pending-bartact">Shop Wrangliator Front Door Storage Bags →</a></p>
<p><a href="/products/wrangliator-rear-door-storage-bags-for-jeep-wrangler-jlu-and-gladiator-patent-pending-bartact">Shop Wrangliator Rear Door Storage Bags →</a></p>
`.trim();

async function main() {
  log('# Wrangliator SEO Execution Log');
  log(`Generated: ${new Date().toISOString()}`);
  log('');

  // =============================================
  // TASK 1: Fix Product SEO Metafields
  // =============================================
  log('## Task 1: Product SEO Metafields');
  log('');

  const metafieldUpdates = [
    {
      id: FRONT_ID,
      name: 'FRONT',
      title_tag: 'Jeep Wrangler JL Door Storage Bags | Wrangliator | Bartact',
      description_tag: 'Patent-pending Wrangliator door storage bags for Jeep Wrangler JL/JLU & Gladiator. No-drill install, waterproof zippers, MOLLE compatible. Made in USA.'
    },
    {
      id: REAR_ID,
      name: 'REAR',
      title_tag: 'Jeep Wrangler JLU & Gladiator Door Storage Bags | Wrangliator | Bartact',
      description_tag: 'Patent-pending Wrangliator rear door storage bags for Jeep Wrangler JLU & Gladiator. No-drill, waterproof, cell phone pocket. Made in USA by Bartact.'
    }
  ];

  for (const p of metafieldUpdates) {
    log(`### ${p.name} Product (ID: ${p.id})`);
    
    // title_tag
    log(`  title_tag (${p.title_tag.length} chars): "${p.title_tag}"`);
    const titleResult = await setMetafield(p.id, 'title_tag', p.title_tag);
    log(`  title_tag → ${titleResult.action}, HTTP ${titleResult.status}`);
    
    // description_tag
    log(`  description_tag (${p.description_tag.length} chars): "${p.description_tag}"`);
    const descResult = await setMetafield(p.id, 'description_tag', p.description_tag);
    log(`  description_tag → ${descResult.action}, HTTP ${descResult.status}`);
    log('');
  }

  // =============================================
  // TASK 2: Create Collection
  // =============================================
  log('## Task 2: Create Collection');
  log('');

  const collectionBody = `<h2>Interior Door Storage Bags for Jeep Wrangler JL, JLU &amp; Gladiator</h2>
<p>If you're looking to store your removed Jeep doors, that's a different product. If you want gear storage mounted inside your door while you're on the trail, this is it.</p>
<p>The Wrangliator door storage bags by Bartact are the most awesome storage bags in existence for the Wrangler JL/JLU/Gladiator. Patent-pending design built specifically for JL/JLU/Gladiator interior doors — not a generic bag, a precision fit for your exact vehicle.</p>
<h3>Why Wrangliator?</h3>
<ul>
<li>Specific fit for JL/JLU/Gladiator doors — no modifications needed</li>
<li>Clutch storage in the easiest access location on your rig</li>
<li>No drilling required — uses stock hardware</li>
<li>5 minute install each</li>
<li>Won't fade</li>
<li>Waterproof with water resistant double lockable zippers</li>
<li>Cell phone pocket</li>
<li>Extra mesh pocket</li>
<li>Huge internal storage area</li>
<li>Multiple Bartact logo colors available</li>
</ul>
<h3>Target Keywords</h3>
<p>Jeep JL door pocket organizer, Jeep Wrangler door interior storage, Jeep Gladiator door mounted bag, storage bag inside Jeep door, Wrangler JLU door interior organizer</p>`;

  const collectionData = {
    custom_collection: {
      title: 'Jeep Wrangler JL Door Interior Storage Bags',
      handle: 'jeep-wrangler-jl-door-storage-bags',
      body_html: collectionBody,
      metafields: [
        {
          namespace: 'global',
          key: 'title_tag',
          value: 'Jeep Wrangler JL Door Storage Bags | Interior Organizer | Bartact',
          type: 'single_line_text_field'
        },
        {
          namespace: 'global',
          key: 'description_tag',
          value: 'Patent-pending Wrangliator door storage bags for Jeep Wrangler JL, JLU & Gladiator. No-drill, waterproof, MOLLE compatible. Made in USA by Bartact.',
          type: 'single_line_text_field'
        }
      ]
    }
  };

  const collResp = await shopifyReq('POST', '/custom_collections.json', collectionData);
  let collectionId = null;

  if (collResp.status === 201 || collResp.status === 200) {
    const collData = JSON.parse(collResp.body);
    collectionId = collData.custom_collection.id;
    log(`Collection created! ID: ${collectionId}, Handle: ${collData.custom_collection.handle}`);
    log(`HTTP Status: ${collResp.status}`);
  } else {
    log(`Collection creation failed! HTTP ${collResp.status}`);
    log(`Response: ${collResp.body}`);
    // Try to find existing collection with same handle
    const searchResp = await shopifyReq('GET', '/custom_collections.json?handle=jeep-wrangler-jl-door-storage-bags');
    const found = JSON.parse(searchResp.body).custom_collections || [];
    if (found.length > 0) {
      collectionId = found[0].id;
      log(`Found existing collection with same handle. ID: ${collectionId}`);
    }
  }

  // Add products to collection
  if (collectionId) {
    log('');
    log(`Adding products to collection ${collectionId}...`);
    for (const productId of [FRONT_ID, REAR_ID]) {
      const collectResp = await shopifyReq('POST', '/collects.json', {
        collect: { product_id: parseInt(productId), collection_id: collectionId }
      });
      log(`  Product ${productId} → HTTP ${collectResp.status}: ${collectResp.status === 201 ? 'Added' : collectResp.body}`);
    }
  }
  log('');

  // =============================================
  // TASK 3: Google Indexing API
  // =============================================
  log('## Task 3: Google Indexing API');
  log('');

  let gToken;
  try {
    gToken = await getGoogleToken();
    log('Google auth token: OK');
  } catch (e) {
    log(`Google auth FAILED: ${e.message}`);
  }

  if (gToken) {
    const urlsToIndex = [
      'https://www.bartact.com/products/wrangliator-front-door-storage-bags-for-jeep-wrangler-jl-jlu-and-gladiator-patent-pending-bartact',
      'https://www.bartact.com/products/wrangliator-rear-door-storage-bags-for-jeep-wrangler-jlu-and-gladiator-patent-pending-bartact',
    ];
    if (collectionId) {
      urlsToIndex.push('https://www.bartact.com/collections/jeep-wrangler-jl-door-storage-bags');
    }

    for (const url of urlsToIndex) {
      const result = await submitToIndexingAPI(gToken, url);
      log(`  [${result.status}] ${url}`);
      if (result.status !== 200) {
        log(`       Response: ${result.body}`);
      }
      // Small delay between requests
      await new Promise(r => setTimeout(r, 500));
    }
  }
  log('');

  // =============================================
  // TASK 4: Blog Post
  // =============================================
  log('## Task 4: Blog Post');
  log('');

  // Find the "news" blog
  const blogsResp = await shopifyReq('GET', '/blogs.json');
  const blogs = JSON.parse(blogsResp.body).blogs || [];
  log(`Found ${blogs.length} blogs: ${blogs.map(b => `${b.id}="${b.handle}"`).join(', ')}`);
  
  const newsBlog = blogs.find(b => b.handle === 'news') || blogs[0];
  if (!newsBlog) {
    log('ERROR: No blog found!');
  } else {
    log(`Using blog: ${newsBlog.id} "${newsBlog.title}" (${newsBlog.handle})`);
    
    const articleData = {
      article: {
        title: 'Why Wrangliator Bags Are the Best Interior Door Storage Upgrade for Your Jeep JL/JLU/Gladiator',
        body_html: BLOG_POST_BODY,
        blog_id: newsBlog.id,
        published: true,
        tags: 'wrangliator, jeep-wrangler-jl, door-storage, jeep-gladiator',
        metafields: [
          {
            namespace: 'global',
            key: 'title_tag',
            value: 'Best Jeep JL Door Storage Bags: Wrangliator Interior Organizer Review | Bartact',
            type: 'single_line_text_field'
          },
          {
            namespace: 'global',
            key: 'description_tag',
            value: 'Discover why the Wrangliator by Bartact is the best interior door storage upgrade for Jeep JL, JLU & Gladiator. No-drill, patent-pending, waterproof. Made in USA.',
            type: 'single_line_text_field'
          }
        ]
      }
    };

    const articleResp = await shopifyReq('POST', `/blogs/${newsBlog.id}/articles.json`, articleData);
    
    if (articleResp.status === 201 || articleResp.status === 200) {
      const articleData2 = JSON.parse(articleResp.body);
      const article = articleData2.article;
      log(`Blog post created! ID: ${article.id}`);
      log(`Title: ${article.title}`);
      log(`Published: ${article.published_at}`);
      log(`URL: https://www.bartact.com/blogs/${newsBlog.handle}/${article.handle}`);
      
      // Also submit blog URL to indexing
      if (gToken) {
        const blogUrl = `https://www.bartact.com/blogs/${newsBlog.handle}/${article.handle}`;
        log('');
        log(`Submitting blog post to Google Indexing API...`);
        const idxResp = await submitToIndexingAPI(gToken, blogUrl);
        log(`  [${idxResp.status}] ${blogUrl}`);
      }
    } else {
      log(`Blog post creation FAILED! HTTP ${articleResp.status}`);
      log(`Response: ${articleResp.body}`);
    }
  }

  log('');
  log('## Summary');
  log(`Completed at: ${new Date().toISOString()}`);
  log('All tasks executed. See details above.');

  // Write log file
  fs.writeFileSync(LOG_FILE, results.join('\n') + '\n');
  console.log(`\nLog written to: ${LOG_FILE}`);
}

main().catch(e => {
  console.error('FATAL ERROR:', e);
  fs.appendFileSync(LOG_FILE, '\n\nFATAL ERROR: ' + e.message + '\n' + e.stack + '\n');
  process.exit(1);
});
