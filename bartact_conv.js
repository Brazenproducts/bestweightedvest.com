const fs = require('fs');
const { GoogleAdsApi } = require('google-ads-api');
const creds = JSON.parse(fs.readFileSync('/home/ubuntu/.openclaw/workspace/.google-ads-credentials.json', 'utf8'));
const client = new GoogleAdsApi({
  client_id: creds.client_id, client_secret: creds.client_secret,
  developer_token: creds.developer_token || creds.dev_token,
});
const customer = client.Customer({ customer_id: '1770651698', refresh_token: creds.refresh_token });

(async () => {
  const res = {};
  // Current 7d totals
  try {
    const rows = await customer.query(`
      SELECT metrics.cost_micros, metrics.conversions, metrics.conversions_value
      FROM campaign WHERE segments.date DURING LAST_7_DAYS AND campaign.status='ENABLED'`);
    let s=0,c=0,v=0; for(const r of rows){s+=(r.metrics.cost_micros||0)/1e6;c+=r.metrics.conversions||0;v+=r.metrics.conversions_value||0;}
    res.current = {spend:s,conv:c,val:v,roas:s>0?v/s:0};
  } catch(e){ res.currentErr = e.message; }

  // Conversion freshness - date-segmented, purchase actions
  try {
    const rows = await customer.query(`
      SELECT conversion_action.name, conversion_action.category, segments.date, metrics.conversions
      FROM conversion_action WHERE segments.date DURING LAST_14_DAYS`);
    const byAction={};
    for(const r of rows){
      const n=r.conversion_action.name; const cv=r.metrics.conversions||0;
      if(cv<=0) continue;
      const dt=r.segments.date;
      if(!byAction[n]||dt>byAction[n].lastDate) byAction[n]={name:n,cat:r.conversion_action.category,lastDate:dt};
    }
    res.convActions = Object.values(byAction);
  } catch(e){ res.convErr = e.message; }

  console.log(JSON.stringify(res,null,2));
})().catch(e=>{console.error('FATAL',e.message);process.exit(1);});
