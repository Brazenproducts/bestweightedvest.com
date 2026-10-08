const { GoogleAdsApi } = require('google-ads-api');
const fs = require('fs');
require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const creds = JSON.parse(fs.readFileSync('/home/ubuntu/.openclaw/workspace/.google-ads-credentials.json'));
const client = new GoogleAdsApi({ client_id: creds.client_id, client_secret: creds.client_secret, developer_token: creds.developer_token });
const customer = client.Customer({ customer_id: '1770651698', refresh_token: creds.refresh_token });

async function q(query) { return await customer.query(query); }

(async () => {
  console.log('========== BARTACT GOOGLE ADS — COMPLETE AUDIT ==========\n');

  // 1. 30-day account trend by week — is the whole account declining?
  console.log('### 1. ACCOUNT WEEKLY TREND (conv-value ROAS) ###');
  const weeks = [['2026-09-10','2026-09-16'],['2026-09-17','2026-09-23'],['2026-09-24','2026-09-30'],['2026-10-01','2026-10-06']];
  for (const [s,e] of weeks) {
    const r = await q(`SELECT metrics.cost_micros, metrics.conversions_value, metrics.conversions, metrics.clicks FROM customer WHERE segments.date BETWEEN "${s}" AND "${e}"`);
    let c=0,v=0,cv=0,clk=0; for(const x of r){c+=x.metrics.cost_micros/1e6;v+=x.metrics.conversions_value;cv+=x.metrics.conversions;clk+=x.metrics.clicks;}
    console.log('  '+s+'→'+e+': $'+c.toFixed(0)+' spend | '+(v/c).toFixed(2)+'x | '+cv.toFixed(0)+' conv | '+clk+' clicks | CVR '+(cv/clk*100).toFixed(2)+'%');
  }

  // 2. Conversion tracking health — Google conv vs actual Shopify (the big question)
  console.log('\n### 2. CONVERSION TRACKING — Google-recorded vs reality ###');
  const r2 = await q(`SELECT segments.conversion_action_name, metrics.conversions, metrics.conversions_value FROM customer WHERE segments.date BETWEEN "2026-10-01" AND "2026-10-06"`);
  const actions = {};
  for (const x of r2) { const n=x.segments.conversion_action_name; if(!actions[n])actions[n]={c:0,v:0}; actions[n].c+=x.metrics.conversions; actions[n].v+=x.metrics.conversions_value; }
  for (const [n,d] of Object.entries(actions)) if(d.c>0||d.v>0) console.log('  '+n+': '+d.c.toFixed(1)+' conv, $'+d.v.toFixed(0)+' value');

  // 3. Top wasted-spend search terms (money going to junk queries)
  console.log('\n### 3. TOP WASTED SEARCH TERMS (spend, 0 conv, last 14d) ###');
  try {
    const r3 = await q(`SELECT search_term_view.search_term, campaign.name, metrics.cost_micros, metrics.conversions, metrics.clicks FROM search_term_view WHERE segments.date BETWEEN "2026-09-24" AND "2026-10-06" AND metrics.conversions = 0 AND metrics.cost_micros > 2000000 ORDER BY metrics.cost_micros DESC LIMIT 15`);
    for (const x of r3) console.log('  $'+(x.metrics.cost_micros/1e6).toFixed(0)+' | '+x.metrics.clicks+'clk 0conv | "'+x.search_term_view.search_term+'" ('+x.campaign.name.slice(0,25)+')');
  } catch(e){ console.log('  search term query err: '+e.message); }

  // 4. Bidding strategy + budget per enabled campaign
  console.log('\n### 4. BID STRATEGY + tROAS per ENABLED campaign ###');
  const r4 = await q(`SELECT campaign.name, campaign.bidding_strategy_type, campaign.maximize_conversion_value.target_roas, campaign_budget.amount_micros FROM campaign WHERE campaign.status = "ENABLED" ORDER BY campaign_budget.amount_micros DESC`);
  for (const x of r4) {
    const t = x.campaign.maximizeConversionValue && x.campaign.maximizeConversionValue.targetRoas;
    console.log('  $'+((x.campaignBudget.amountMicros||0)/1e6).toFixed(0)+'/day | '+x.campaign.biddingStrategyType+' | tROAS '+(t?(t*100).toFixed(0)+'%':'none')+' | '+x.campaign.name);
  }
})().catch(e => console.error('FATAL', e.message));
