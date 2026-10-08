const { GoogleAdsApi } = require('google-ads-api');
const fs = require('fs');
require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const creds = JSON.parse(fs.readFileSync('/home/ubuntu/.openclaw/workspace/.google-ads-credentials.json'));
const client = new GoogleAdsApi({ client_id: creds.client_id, client_secret: creds.client_secret, developer_token: creds.developer_token });
const customer = client.Customer({ customer_id: '1770651698', refresh_token: creds.refresh_token });

async function daySpend(d) {
  const q = `SELECT metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions, metrics.conversions_value FROM customer WHERE segments.date = "${d}"`;
  const res = await customer.query(q);
  let c=0,clk=0,imp=0,conv=0,val=0;
  for (const r of res){ c+=r.metrics.cost_micros/1e6; clk+=r.metrics.clicks; imp+=r.metrics.impressions; conv+=r.metrics.conversions; val+=r.metrics.conversions_value; }
  return { c, clk, imp, conv, val };
}

(async () => {
  console.log('=== GOOGLE ADS: did SPEND crater Wed, or just recorded revenue? ===\n');
  for (const d of ['2026-10-06', '2026-10-07', '2026-10-08']) {
    const x = await daySpend(d);
    console.log(d + ': spent $' + x.c.toFixed(0) + ' | ' + x.clk + ' clicks | ' + x.imp + ' impr | ' + x.conv.toFixed(1) + ' conv | $' + x.val.toFixed(0) + ' recorded value (ROAS ' + (x.c>0?(x.val/x.c).toFixed(2):'0') + 'x)');
  }
  console.log('\nKey: if Wed SPEND was normal but recorded value low = tracking lag (will fill in).');
  console.log('If Wed SPEND itself dropped = budget/serving problem (controllable).');
})().catch(e => console.error('ERR', e.message));
