const { GoogleAdsApi } = require('google-ads-api');
const fs = require('fs');
require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const creds = JSON.parse(fs.readFileSync('/home/ubuntu/.openclaw/workspace/.google-ads-credentials.json'));
const client = new GoogleAdsApi({ client_id: creds.client_id, client_secret: creds.client_secret, developer_token: creds.developer_token });
const customer = client.Customer({ customer_id: '1770651698', refresh_token: creds.refresh_token });

async function q(query) { return await customer.query(query); }

(async () => {
  const names = ['Gladiator PMax', 'Jeep JL Seat Covers PMax'];

  for (const name of names) {
    console.log('\n========== ' + name + ' ==========');

    // 14-day performance
    const perf = await q(`SELECT metrics.cost_micros, metrics.conversions_value, metrics.conversions, metrics.clicks, metrics.impressions FROM campaign WHERE campaign.name = "${name}" AND segments.date BETWEEN "2026-09-24" AND "2026-10-06"`);
    let c=0,v=0,cv=0,clk=0,imp=0; for(const x of perf){c+=x.metrics.cost_micros/1e6;v+=x.metrics.conversions_value;cv+=x.metrics.conversions;clk+=x.metrics.clicks;imp+=x.metrics.impressions;}
    console.log('14d: $'+c.toFixed(0)+' spend | '+(c>0?(v/c).toFixed(2):'0')+'x | '+cv.toFixed(1)+' conv | '+clk+' clicks | '+imp+' impr | CVR '+(clk>0?(cv/clk*100).toFixed(2):'0')+'%');

    // What products/listing groups is it actually advertising? (shopping listing)
    try {
      const lg = await q(`SELECT segments.product_title, metrics.cost_micros, metrics.conversions FROM campaign WHERE campaign.name = "${name}" AND segments.date BETWEEN "2026-09-24" AND "2026-10-06" AND metrics.cost_micros > 1000000 ORDER BY metrics.cost_micros DESC LIMIT 8`);
      console.log('Top products it spent on:');
      let any=false;
      for (const x of lg) { any=true; console.log('  $'+(x.metrics.cost_micros/1e6).toFixed(0)+' | '+x.metrics.conversions.toFixed(1)+'conv | '+(x.segments.productTitle||'(no title)').slice(0,60)); }
      if(!any) console.log('  (no product-level data)');
    } catch(e){ console.log('  product query err: '+e.message); }
  }
})().catch(e => console.error('FATAL', e.message));
