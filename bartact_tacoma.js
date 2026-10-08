const fs=require('fs');
const {GoogleAdsApi}=require('google-ads-api');
const creds=JSON.parse(fs.readFileSync('/home/ubuntu/.openclaw/workspace/.google-ads-credentials.json','utf8'));
const client=new GoogleAdsApi({client_id:creds.client_id,client_secret:creds.client_secret,developer_token:creds.developer_token});
const customer=client.Customer({customer_id:'1770651698',refresh_token:creds.refresh_token});
(async()=>{
  // Tacoma daily last 14d: clicks, cost, conversions
  const q=`SELECT campaign.name, segments.date, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.conversions_value
    FROM campaign WHERE campaign.id=24143838404 OR campaign.name LIKE '%Tacoma%'
    AND segments.date DURING LAST_14_DAYS`;
  // simpler: filter by name only
  const q2=`SELECT campaign.name, segments.date, metrics.clicks, metrics.impressions, metrics.cost_micros, metrics.conversions
    FROM campaign WHERE campaign.name = 'Tacoma PMax' AND segments.date DURING LAST_14_DAYS ORDER BY segments.date`;
  const rows=await customer.query(q2);
  console.log('=== Tacoma PMax daily (14d) ===');
  rows.forEach(r=>console.log(`${r.segments.date}: clicks ${r.metrics.clicks} imp ${r.metrics.impressions} cost $${(r.metrics.cost_micros/1e6).toFixed(2)} conv ${(r.metrics.conversions||0).toFixed(2)}`));
})().catch(e=>{console.error('ERR',e.message);process.exit(1);});
