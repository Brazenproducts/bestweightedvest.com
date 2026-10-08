import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const envContent = readFileSync('/home/ubuntu/.openclaw/workspace/.env', 'utf8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const t = line.trim();
  if (t && !t.startsWith('#')) { const i = t.indexOf('='); if (i>0) envVars[t.slice(0,i)]=t.slice(i+1); }
}
const https = require('https');
const token = envVars.SHOPIFY_TOKEN_BARTACT;
const BLOG_ID = 19510597;

function sReq(method, path, body) {
  return new Promise((res, rej) => {
    const data = body ? JSON.stringify(body) : null;
    const r = https.request({
      hostname: 'bartact.myshopify.com',
      path: `/admin/api/2024-01${path}`,
      method,
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
        ...(data ? {'Content-Length': Buffer.byteLength(data)} : {})
      }
    }, x => { let d=''; x.on('data',c=>d+=c); x.on('end',()=>{ try{res({status:x.statusCode,body:JSON.parse(d)})}catch(e){res({status:x.statusCode,body:d})} }); });
    r.on('error', rej);
    if (data) r.write(data);
    r.end();
  });
}

const now = new Date().toISOString();
const img = 'https://cdn.shopify.com/s/files/1/0936/7476/products/bartact-ford-bronco-seat-covers-black-blue-same-as-insert-color-bartact-tactical-front-seat-covers-for-ford-bronco-2021-2022-4-door-only-29018880802859.jpg?v=1762459918';

const bodyHtml = `
<p>If you drive a 2021-or-newer Ford Bronco, you already know the factory upholstery wasn't built for the life you actually give the truck. Sand off the dunes, mud from the two-track, wet dog, spilled coffee on the morning commute, and a cargo area that doubles as a gear closet - the Bronco's seats take abuse from day one. Tactical seat covers for the Ford Bronco are the fix: a custom-fit layer that protects the originals, adds trail-ready storage, and dials in the look you want. Here's the full guide to getting it right on the 2021+ full-size Bronco.</p>

<p><img src="${img}" alt="Ford Bronco tactical front seat covers 2021+ by Bartact" style="max-width:100%;height:auto;" /></p>

<h2>Why the 2021+ Bronco Needs Purpose-Built Covers</h2>
<p>Universal covers are a compromise - they bunch, they gap, and they fight your seat's bolsters. The modern Bronco has shaped buckets with aggressive side support, and in many trims the seats carry integrated functions you can't ignore. A custom-fit tactical cover is patterned specifically for the 2021+ full-size Bronco so it wraps the contours cleanly, stays put through hard cornering on the trail, and leaves every factory function working the way Ford intended. On seats with side airbags, the covers are engineered to deploy correctly, so you're protecting your interior without compromising occupant safety.</p>

<p>Just as important: coverage comes in a front pair and a rear bench so you can do the whole cabin in one go, or start up front and add the back later. The <a href="/collections/ford-bronco-seat-covers">Ford Bronco seat covers collection</a> carries both the front tactical set and the rear bench cover sized for the 2021+ four-door, so your fitment is matched end to end.</p>

<h2>The Tactical Advantage: Storage You Actually Use</h2>
<p>What separates a tactical cover from a plain slip-on is the webbing. PALS-style MOLLE panels on the seat backs turn dead space into organized storage - clip on a pouch for a first-aid kit, a radio, a flashlight, recovery gloves, or trail snacks, and reconfigure it whenever your load-out changes. For a Bronco that spends weekends off-pavement, that back-of-seat real estate is some of the most useful square footage in the truck. If you want to extend that system beyond the seats, pair your covers with the <a href="/collections/ford-bronco-molle-accessories">Ford Bronco MOLLE accessories</a> for visors, consoles, and more mounting points throughout the cabin.</p>

<h2>Front Pair vs. Rear Bench: What to Order</h2>
<p>Most Bronco owners start with the front pair - those are the seats you live in and the ones that wear first. The front set covers the driver and passenger buckets for both 2-door and 4-door configurations. If you've got a four-door and haul passengers, dogs, or gear in back, add the rear bench cover (sized for the no-armrest bench) so the whole interior matches and the second row is just as protected. Doing both at once gives you a uniform look and head-to-tail defense against the stuff that ruins factory fabric.</p>

<h2>Color and Style: Make It Yours</h2>
<p>Bronco interiors have personality, and your covers should too. Bartact offers multiple colorways so you can keep it blacked-out and stealthy or add a contrast insert that pops against the Bronco's cabin. Everything is built in the USA, so you're getting American-made construction designed to live outdoors and look good doing it. The result is an interior that reads intentional instead of improvised.</p>

<h2>Your Bronco, Your Dog, Your Seat Covers</h2>
<p>If your co-pilot has four legs, you understand the problem: nails, fur, drool, and the muddy post-hike shake-off all end up on your upholstery. Tactical seat covers for the Ford Bronco are a dog owner's best friend. The tough outer layer shrugs off claws and brushes clean of hair, so a quick wipe-down after the trail gets you back to showroom-looking seats. Put the rear bench cover on the 4-door's second row and let the dog ride in back with zero worry about what's happening underneath. When your pup makes a mess, the covers take the hit - not your factory seats. For adventure dogs who log as many trail miles as you do, it's the easiest interior upgrade you'll ever make.</p>

<h2>Installation and Fit</h2>
<p>Because these are patterned for the 2021+ Bronco, installation is straightforward - no wrestling a generic cover into submission. Follow the seat-specific fitment, route around the factory functions, and you're done in an afternoon. Once they're on, they stay on, holding their shape through daily driving and hard trail use alike.</p>

<h2>Bottom Line</h2>
<p>For the 2021+ full-size Ford Bronco, tactical seat covers are the upgrade that protects your investment, adds genuine trail utility, and makes the cabin yours. Start with the front pair, add the rear bench if you run a four-door, and build out your storage from there. Browse the full lineup in the <a href="/collections/ford-bronco-seat-covers">Ford Bronco seat covers collection</a> and get your interior ready for whatever the trail throws at it.</p>
`.trim();

const article = {
  article: {
    title: 'Ford Bronco Tactical Seat Covers (2021+) | Bartact',
    author: 'Bartact',
    tags: 'bartact, seat-covers, ford-bronco, ford-bronco-2021, tactical, molle, off-road, made-in-usa',
    body_html: bodyHtml,
    published: true,
    published_at: now,
    image: { src: img }
  }
};

const create = await sReq('POST', `/blogs/${BLOG_ID}/articles.json`, article);
console.log('CREATE status:', create.status);
if (!create.body || !create.body.article) { console.log('RAW:', JSON.stringify(create.body).slice(0,600)); process.exit(1); }
let art = create.body.article;
console.log('Article ID:', art.id, '| published:', art.published_at ? true : false, '| handle:', art.handle);

// Verify / retry if draft
if (!art.published_at) {
  console.log('DRAFT detected, retrying publish...');
  const upd = await sReq('PUT', `/blogs/${BLOG_ID}/articles/${art.id}.json`, { article: { id: art.id, published: true, published_at: new Date().toISOString() } });
  console.log('RETRY status:', upd.status, '| published_at:', upd.body.article && upd.body.article.published_at);
  art = upd.body.article;
}

// Set SEO metafields (title tag + meta description)
const titleTag = 'Ford Bronco Tactical Seat Covers (2021+) | Bartact';
const metaDesc = 'Tactical seat covers for the 2021+ Ford Bronco: custom fit, MOLLE storage, dog-proof, made in the USA. Front pair and rear bench from Bartact.';
await sReq('POST', `/blogs/${BLOG_ID}/articles/${art.id}/metafields.json`, { metafield: { namespace:'global', key:'title_tag', value:titleTag, type:'single_line_text_field' } });
await sReq('POST', `/blogs/${BLOG_ID}/articles/${art.id}/metafields.json`, { metafield: { namespace:'global', key:'description_tag', value:metaDesc, type:'single_line_text_field' } });

const liveUrl = `https://www.bartact.com/blogs/news/${art.handle}`;
const wc = bodyHtml.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().split(' ').length;
console.log('LIVE_URL:', liveUrl);
console.log('WORD_COUNT:', wc);
console.log('TITLE_LEN:', titleTag.length, '| META_LEN:', metaDesc.length);
console.log('RESULT_JSON:' + JSON.stringify({ id: art.id, handle: art.handle, published: !!art.published_at, published_at: art.published_at, url: liveUrl, wordCount: wc }));
