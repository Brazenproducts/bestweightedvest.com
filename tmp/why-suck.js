const { GoogleAdsApi } = require('google-ads-api');
const fs = require('fs');
require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const creds = JSON.parse(fs.readFileSync('/home/ubuntu/.openclaw/workspace/.google-ads-credentials.json'));
const client = new GoogleAdsApi({ client_id: creds.client_id, client_secret: creds.client_secret, developer_token: creds.developer_token });
const customer = client.Customer({ customer_id: '1770651698', refresh_token: creds.refresh_token });

async function pull(name, s, e) {
  const q = `SELECT metrics.cost_micros, metrics.clicks, metrics.conversions, metrics.conversions_value, metrics.impressions FROM campaign WHERE campaign.name = "${name}" AND segments.date BETWEEN "${s}" AND "${e}"`;
  const r = await customer.query(q);
  let c=0,clk=0,cv=0,v=0,imp=0; for(const x of r){c+=x.metrics.cost_micros/1e6;clk+=x.metrics.clicks;cv+=x.metrics.conversions;v+=x.metrics.conversions_value;imp+=x.metrics.impressions;}
  return { c, clk, cv, v, imp, cvr: clk>0?cv/clk*100:0, roas: c>0?v/c:0, ctr: imp>0?clk/imp*100:0 };
}

(async () => {
  const enabled = await customer.query(`SELECT campaign.name FROM campaign WHERE campaign.status = "ENABLED"`);
  const names = enabled.map(x => x.campaign.name);

  console.log('=== LIVE CAMPAIGNS: BEFORE (Sep 10-23) vs NOW (Oct 1-7) ===');
  console.log('Campaign                              | BEFORE cvr/roas    | NOW cvr/roas       | verdict');
  console.log('-'.repeat(100));
  for (const name of names) {
    const b = await pull(name, '2026-09-10', '2026-09-23');
    const n = await pull(name, '2026-10-01', '2026-10-07');
    let verdict;
    if (b.cvr > 1.5 && n.cvr < 0.8) verdict = '🔴 CVR CRASHED (was fine, now broken)';
    else if (b.cvr < 0.8 && n.cvr < 0.8) verdict = '⚫ always bad';
    else if (n.roas >= 3) verdict = '✅ still good';
    else if (n.cvr >= 1) verdict = '⚠️ ok-ish';
    else verdict = '🔴 weak now';
    const fmt = (x) => x.cvr.toFixed(2)+'% / '+x.roas.toFixed(1)+'x ($'+x.c.toFixed(0)+')';
    console.log(name.slice(0,37).padEnd(37) + ' | ' + fmt(b).padEnd(18) + ' | ' + fmt(n).padEnd(18) + ' | ' + verdict);
  }
})().catch(e => console.error('ERR', e.message));
