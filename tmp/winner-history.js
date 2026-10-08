const { GoogleAdsApi } = require('google-ads-api');
const fs = require('fs');
require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const creds = JSON.parse(fs.readFileSync('/home/ubuntu/.openclaw/workspace/.google-ads-credentials.json'));
const client = new GoogleAdsApi({ client_id: creds.client_id, client_secret: creds.client_secret, developer_token: creds.developer_token });
const customer = client.Customer({ customer_id: '1770651698', refresh_token: creds.refresh_token });

async function roas(name, start, end) {
  const q = `SELECT metrics.cost_micros, metrics.conversions_value FROM campaign WHERE campaign.name = "${name}" AND segments.date BETWEEN "${start}" AND "${end}"`;
  const res = await customer.query(q);
  let c = 0, v = 0; for (const r of res) { c += r.metrics.cost_micros / 1e6; v += r.metrics.conversions_value; }
  return { c, v, roas: c > 0 ? v / c : 0 };
}

(async () => {
  const campaigns = ['Paracord Grab Handles JL PMax', 'MOLLE Accessories PMax'];
  const windows = [
    ['2026-10-04', '2026-10-05', 'Oct 4-5 (the "proof")'],
    ['2026-09-29', '2026-10-05', 'last 7d'],
    ['2026-09-22', '2026-10-05', 'last 14d'],
    ['2026-09-08', '2026-09-21', 'prior 14d'],
    ['2026-08-15', '2026-08-31', 'mid-Aug']
  ];
  for (const name of campaigns) {
    console.log('\n=== ' + name + ' ===');
    for (const [s, e, label] of windows) {
      const r = await roas(name, s, e);
      console.log('  ' + label.padEnd(22) + ': ' + (r.c > 5 ? r.roas.toFixed(2) + 'x ($' + r.c.toFixed(0) + ' spend, $' + r.v.toFixed(0) + ' val)' : 'minimal spend ($' + r.c.toFixed(0) + ')'));
    }
  }
})().catch(e => console.error('ERR', e.message));
