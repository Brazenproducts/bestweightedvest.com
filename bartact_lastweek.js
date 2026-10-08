const { GoogleAdsApi } = require('google-ads-api');
const fs = require('fs');
const creds = JSON.parse(fs.readFileSync('/home/ubuntu/.openclaw/workspace/.google-ads-credentials.json','utf8'));
const client = new GoogleAdsApi({ client_id: creds.client_id, client_secret: creds.client_secret, developer_token: creds.developer_token });
const customer = client.Customer({ customer_id: '1770651698', refresh_token: creds.refresh_token });

(async ()=>{
  // Prior 7d (days 8-14 ago): 2026-09-24 .. 2026-09-30
  const q = `
    SELECT metrics.cost_micros, metrics.conversions_value, metrics.conversions
    FROM campaign
    WHERE segments.date BETWEEN '2026-09-24' AND '2026-09-30'
      AND campaign.status = 'ENABLED'
  `;
  const rows = await customer.query(q);
  let cost=0,val=0,conv=0;
  for(const r of rows){ cost+=(Number(r.metrics.cost_micros)||0)/1e6; val+=Number(r.metrics.conversions_value)||0; conv+=Number(r.metrics.conversions)||0; }
  console.log('PRIOR WEEK (2026-09-24..09-30, enabled campaigns):');
  console.log(`spend $${cost.toFixed(2)} | conv ${conv.toFixed(1)} | value $${val.toFixed(2)} | ROAS ${cost>0?(val/cost).toFixed(2):0}x`);
})().catch(e=>console.error('ERR',e.message));
