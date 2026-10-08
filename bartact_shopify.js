const fs = require('fs');
const https = require('https');

// load token from .env
const env = fs.readFileSync('/home/ubuntu/.openclaw/workspace/.env','utf8');
const m = env.match(/^SHOPIFY_TOKEN_BARTACT=(.+)$/m);
const TOKEN = m ? m[1].trim() : null;
if(!TOKEN){ console.error('No SHOPIFY_TOKEN_BARTACT'); process.exit(1); }
const STORE = 'bartact.myshopify.com';

function get(path){
  return new Promise((resolve,reject)=>{
    const opts = { hostname: STORE, path, method:'GET',
      headers:{ 'X-Shopify-Access-Token': TOKEN, 'Content-Type':'application/json' } };
    const req = https.request(opts, res=>{
      let d=''; res.on('data',c=>d+=c);
      res.on('end',()=>{
        resolve({ status: res.statusCode, headers: res.headers, body: d });
      });
    });
    req.on('error',reject); req.end();
  });
}

(async ()=>{
  // last 7 days window ending now (2026-10-08T15:00Z)
  const now = new Date('2026-10-08T15:00:00Z');
  const start = new Date(now); start.setUTCDate(start.getUTCDate()-7);
  const created_at_min = start.toISOString();

  let path = `/admin/api/2024-10/orders.json?status=any&created_at_min=${encodeURIComponent(created_at_min)}&limit=250&fields=id,created_at,total_price,current_total_price,note_attributes,landing_site,referring_site,source_name,financial_status`;
  let allOrders = [];
  let page = 0;
  while(path && page < 20){
    const res = await get(path);
    if(res.status !== 200){ console.error('HTTP', res.status, res.body.slice(0,300)); break; }
    const data = JSON.parse(res.body);
    allOrders = allOrders.concat(data.orders||[]);
    // pagination via Link header
    const link = res.headers['link'] || res.headers['Link'];
    let next = null;
    if(link){
      const parts = link.split(',');
      for(const p of parts){ if(p.includes('rel="next"')){ const mm = p.match(/<([^>]+)>/); if(mm) next = mm[1].replace(`https://${STORE}`,''); } }
    }
    path = next; page++;
  }

  console.log('Total orders in last 7d:', allOrders.length);

  let gclidRevenue = 0, gclidOrders = 0;
  let totalRevenue = 0;
  const matched = [];
  for(const o of allOrders){
    const price = parseFloat(o.current_total_price || o.total_price || 0);
    totalRevenue += price;
    const landing = (o.landing_site||'').toLowerCase();
    const referring = (o.referring_site||'').toLowerCase();
    let noteStr = '';
    if(Array.isArray(o.note_attributes)){
      noteStr = o.note_attributes.map(n=>`${n.name}=${n.value}`).join('&').toLowerCase();
    }
    const hay = landing + ' ' + noteStr;
    const hasGclid = hay.includes('gclid=');
    const isGoogleCpc = (hay.includes('utm_source=google') && hay.includes('utm_medium=cpc'));
    if(hasGclid || isGoogleCpc){
      gclidRevenue += price; gclidOrders++;
      matched.push({ id:o.id, price, created:o.created_at, why: hasGclid?'gclid':'utm_google_cpc' });
    }
  }

  console.log('\n=== SHOPIFY GOOGLE-ADS ATTRIBUTED (gclid / utm google+cpc) ===');
  console.log('Matched orders:', gclidOrders);
  console.log('Google-Ads Shopify revenue (7d): $' + gclidRevenue.toFixed(2));
  console.log('Total Shopify revenue all sources (7d): $' + totalRevenue.toFixed(2));
  console.log('\nMatched order detail:');
  for(const mm of matched){ console.log(` #${mm.id} $${mm.price.toFixed(2)} ${mm.created} [${mm.why}]`); }

  // Save for summary
  fs.writeFileSync('/home/ubuntu/.openclaw/workspace/bartact_shopify_out.json', JSON.stringify({gclidRevenue, gclidOrders, totalRevenue, orders: allOrders.length},null,2));
})().catch(e=>console.error('ERR', e.message));
