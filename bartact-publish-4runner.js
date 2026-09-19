const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
const {GoogleAuth} = require('google-auth-library');

async function main() {
  // ─── 1. SHOPIFY AUTH (client_credentials) ───────────────────────────────
  const tokR = await fetch('https://bartact.myshopify.com/admin/oauth/access_token', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      client_id: '78fd9505a467f0795d035e5f4a6dfb06',
      client_secret: process.env.SHOPIFY_CLIENT_SECRET_BARTACT,
      grant_type: 'client_credentials'
    })
  });
  const {access_token: shopToken} = await tokR.json();
  if (!shopToken) throw new Error('Shopify auth failed');
  console.log('✓ Shopify auth OK');

  // ─── 2. ARTICLE METADATA ────────────────────────────────────────────────
  // Title: 59 chars ✓
  const articleTitle = "Toyota 4Runner 5th Gen Seat Covers — Complete Buyer's Guide";

  // Title tag: 44 chars ✓
  const titleTag = "Toyota 4Runner 5th Gen Seat Covers | Bartact";

  // Meta desc: 123 chars ✓
  const metaDesc = "Custom-fit tactical seat covers for the Toyota 4Runner 5th Gen (2010–2024). MOLLE pockets, dog-proof, made in Temecula, CA.";

  const imageUrl = "https://cdn.shopify.com/s/files/1/0936/7476/files/related-to-7264659046443-cpb-ordered-full-custom-tactical-front-toyota-4runner-seat-covers-5th-gen-2010-24-bartact-pair-customer-s-product-with-price-569-99-id-2zo8gzko-iowq54egfug7bdc-1214060974.webp?v=1767391388";
  const imageAlt = "Full Custom Tactical Front Toyota 4Runner Seat Covers 5th Gen 2010-24 | BARTACT (Pair)";

  // ─── 3. ARTICLE HTML ────────────────────────────────────────────────────
  const bodyHtml = `
<p>The Toyota 4Runner 5th Generation has been earning its reputation since 2010 — on desert trails, rocky mountain switchbacks, and suburban driveways in between. Whether you're running a 2010 SR5 or a 2024 TRD Pro, the factory seat upholstery was never engineered for what most 4Runner owners actually put their trucks through. Bartact's full custom tactical seat covers for the 5th Gen 4Runner give you a precise, vehicle-specific fit along with the rugged protection and trail organization you actually need on the trail.</p>

<img src="${imageUrl}" alt="${imageAlt}" style="max-width:100%;height:auto;border-radius:6px;" />

<h2>Built for the 5th Gen 4Runner — Not Just Any SUV</h2>

<p>A lot of seat covers claim to "fit most trucks." Bartact's approach is different. Each cover is patterned directly from the actual seat contours of the 5th Gen 4Runner, so the fit wraps tightly around the seat bolsters without pulling, bunching, or leaving frustrating gaps around the headrest base. The covers are available for the front pair and the full rear bench, and they're confirmed compatible across SR5, TRD Sport, TRD Off-Road, TRD Pro, Trail Edition, and Limited trims throughout the full 2010–2024 production run. This isn't a universal cover stretched to fit — it's a custom pattern built for your specific truck.</p>

<h2>MOLLE Panels: Functional Trail Organization Built In</h2>

<p>Every Bartact 4Runner seat cover ships with integrated MOLLE webbing panels built directly into the seatbacks. These aren't decorative stitching — they're load-bearing attachment points for MOLLE-compatible pouches, tool rolls, medical kits, hydration sleeves, map pouches, and recovery accessories. If you run your 4Runner as a trail rig or overlander, MOLLE seat organization fundamentally changes how you access critical gear on the move — no more digging through cargo bags for something that should be within arm's reach. Browse the full lineup of <a href="/collections/seat-covers">Bartact tactical seat covers</a> to see the complete range of color options, MOLLE panel configurations, and fitment details.</p>

<h2>Fitment Across the Full 5th Gen Range (2010–2024)</h2>

<ul>
  <li><strong>2010–2013 4Runner:</strong> Front pair and full rear bench — SR5, Trail, and Limited trims confirmed</li>
  <li><strong>2014–2019 4Runner:</strong> Covers accommodate heated seat function; TRD Pro, Trail Edition, and all SR5 variants</li>
  <li><strong>2020–2024 4Runner:</strong> Updated patterns covering the TRD Pro, 40th Anniversary Edition, and Venture Edition — no modifications needed</li>
</ul>

<p>Rear bench covers are designed for the split-fold configuration standard in 5th Gen models. If your 4Runner is equipped with seat-mounted side airbags, Bartact covers include properly positioned SRS seam construction that allows the airbag to deploy correctly in the event of a side impact. Always verify your specific trim's airbag configuration before installation.</p>

<h2>Your 4Runner, Your Dog, Your Seat Covers</h2>

<p>Let's be honest about who actually rides in the back of most 4Runners. The high ground clearance, capable suspension, and generous interior make the 5th Gen one of the best dog-hauling platforms on the market today. The factory seat fabric, on the other hand, was never designed for what dogs bring along on the trail.</p>

<p>Bartact 4Runner seat covers handle the full reality of dog ownership in a capable truck. Short-haired dogs shed directly into woven factory cloth — and it takes genuine effort to fully extract. Muddy paws after a creek crossing grind trail grit into every crease and stitch. Wet dogs after a lake swim make factory upholstery smell for days. A Bartact cover wipes clean with a damp cloth, doesn't hold odor the way factory upholstery does, and survives claw-to-surface contact that would destroy standard covers within a season.</p>

<p>The MOLLE webbing panel on the rear seatback is particularly useful for dog owners. It functions as a natural anchor point — clip a D-ring or carabiner to the MOLLE webbing and run your dog's harness directly to the seat without a separate barrier system. That same MOLLE panel holds a water bottle pouch for post-hike hydration, a treat bag for the drive home, or a small first-aid kit for trail emergencies. For working dogs or K9 handlers, the MOLLE accepts ID patches, agency panels, and other tactical accessories without any hardware required.</p>

<p>Whether you run a single retriever, a pair of cattle dogs, or the kind of giant, enthusiastic mountain dog who believes the entire rear seat is their personal territory, Bartact covers let you keep using your 4Runner the way you actually use it — without dreading the cleanup afterward.</p>

<h2>Color Options and Custom Configuration</h2>

<p>Bartact builds 4Runner seat covers across a full range of solid colors and tactical patterns, including multicam, coyote, OD green, all-black, and more. Front pair center panels and side bolsters can be configured independently — mix colors to personalize your setup, or run a clean all-black build. Each set is cut, hand-wrapped, stitched, and inspected at Bartact's production facility in Temecula, CA. These are American-made covers built for American trails, and the quality control shows in the fit.</p>

<h2>Get Your 4Runner Set Up Right</h2>

<p>The 5th Gen 4Runner is one of the last genuinely capable body-on-frame SUVs still in production. It goes everywhere, carries anything, and hauls whoever you need to bring along — dogs included. Your seat covers should be built to the same standard. Shop the full <a href="/collections/seat-covers">Bartact seat cover collection</a> and configure your front pair and rear bench set for the 2010–2024 5th Gen 4Runner today. Made in Temecula, CA — built for wherever your 4Runner takes you next.</p>
`.trim();

  // ─── 4. PUBLISH TO SHOPIFY ──────────────────────────────────────────────
  const publishR = await fetch('https://bartact.myshopify.com/admin/api/2024-01/blogs/19510597/articles.json', {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': shopToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      article: {
        title: articleTitle,
        body_html: bodyHtml,
        published: true,
        metafields: [
          {namespace: 'global', key: 'title_tag', value: titleTag, type: 'single_line_text_field'},
          {namespace: 'global', key: 'description_tag', value: metaDesc, type: 'single_line_text_field'}
        ]
      }
    })
  });
  const publishJson = await publishR.json();
  console.log('Shopify publish status:', publishR.status);
  if (!publishJson.article) {
    console.error('Publish error:', JSON.stringify(publishJson));
    throw new Error('Shopify publish failed');
  }
  const article = publishJson.article;
  console.log('✓ Published article ID:', article.id);
  console.log('✓ Handle:', article.handle);

  const articleUrl = `https://www.bartact.com/blogs/news/${article.handle}`;
  console.log('✓ URL:', articleUrl);

  // ─── 5. GSC SUBMISSION ──────────────────────────────────────────────────
  const auth = new GoogleAuth({
    keyFile: '/home/ubuntu/.openclaw/workspace/.gcp-service-account.json',
    scopes: ['https://www.googleapis.com/auth/indexing']
  });
  const gscClient = await auth.getClient();
  const gscTokenObj = await gscClient.getAccessToken();
  const gscToken = gscTokenObj.token;

  const gscR = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + gscToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({url: articleUrl, type: 'URL_UPDATED'})
  });
  const gscBody = await gscR.text();
  console.log('✓ GSC status:', gscR.status, '| body:', gscBody.substring(0, 200));

  // ─── 6. INDEXNOW SUBMISSION ─────────────────────────────────────────────
  const inR = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      host: 'www.bartact.com',
      key: 'b4f7e2a1c3d5e6f7a8b9c0d1e2f3a4b5',
      keyLocation: 'https://www.bartact.com/b4f7e2a1c3d5e6f7a8b9c0d1e2f3a4b5.txt',
      urlList: [articleUrl]
    })
  });
  console.log('✓ IndexNow status:', inR.status);

  return {
    title: articleTitle,
    handle: article.handle,
    url: articleUrl
  };
}

main().then(r => {
  console.log('DONE');
  console.log('RESULT:', JSON.stringify(r));
}).catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
