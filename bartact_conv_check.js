const fs = require('fs');
const { GoogleAdsApi } = require('google-ads-api');
const creds = JSON.parse(fs.readFileSync('/home/ubuntu/.openclaw/workspace/.google-ads-credentials.json','utf8'));
const client = new GoogleAdsApi({client_id:creds.client_id,client_secret:creds.client_secret,developer_token:creds.developer_token});
const customer = client.Customer({customer_id:'1770651698',refresh_token:creds.refresh_token});

(async()=>{
  // conversions by date at account level, last 10 days
  const q=`SELECT segments.date, metrics.conversions, metrics.conversions_value
    FROM customer WHERE segments.date DURING LAST_14_DAYS ORDER BY segments.date DESC`;
  const rows = await customer.query(q);
  console.log('=== ACCOUNT CONVERSIONS BY DATE (last 14d) ===');
  let last=null;
  rows.forEach(r=>{
    const c=r.metrics.conversions||0;
    console.log(`${r.segments.date}: conv ${c.toFixed(2)} | val $${(r.metrics.conversions_value||0).toFixed(2)}`);
    if(c>0 && (!last||r.segments.date>last)) last=r.segments.date;
  });
  const today=new Date('2026-10-03');
  const diff = last? Math.round((today-new Date(last))/864e5) : null;
  console.log(`\nMost recent conversion date: ${last} (${diff} days ago) ${diff!=null&&diff>2?'🔴 STALE':'✅ fresh'}`);
})().catch(e=>{console.error('ERR',e.message);process.exit(1);});
