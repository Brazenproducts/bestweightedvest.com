const { GoogleAdsApi } = require('google-ads-api');
const fs = require('fs');
require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const creds = JSON.parse(fs.readFileSync('/home/ubuntu/.openclaw/workspace/.google-ads-credentials.json'));
const client = new GoogleAdsApi({ client_id: creds.client_id, client_secret: creds.client_secret, developer_token: creds.developer_token });
const customer = client.Customer({ customer_id: '1770651698', refresh_token: creds.refresh_token });

// Use a trailing window where conversions are BAKED (Oct 1-6, excludes lagging last 2 days)
async function pull(start, end) {
  const q = `SELECT campaign.name, campaign.status, metrics.cost_micros, metrics.conversions_value FROM campaign WHERE segments.date BETWEEN "${start}" AND "${end}" AND campaign.status = "ENABLED"`;
  const res = await customer.query(q);
  const agg = {};
  for (const r of res) {
    const n = r.campaign.name;
    if (!agg[n]) agg[n] = { c: 0, v: 0 };
    agg[n].c += r.metrics.cost_micros / 1e6;
    agg[n].v += r.metrics.conversions_value;
  }
  return agg;
}

(async () => {
  // Oct 1-6: conversions mostly baked, excludes today+yesterday lag
  const d = await pull('2026-10-01', '2026-10-06');
  const rows = Object.entries(d).map(([n, x]) => ({ n, c: x.c, v: x.v, roas: x.c > 0 ? x.v / x.c : 0 })).filter(r => r.c > 5).sort((a, b) => a.roas - b.roas);
  console.log('=== ENABLED CAMPAIGNS — Oct 1-6 (conversions baked) — sorted WORST first ===\n');
  let wasteSpend = 0, wasteRev = 0, winSpend = 0, winRev = 0;
  for (const r of rows) {
    const tag = r.roas < 1 ? '🔴 LOSING' : r.roas < 3 ? '⚠️ under break-even' : '✅';
    console.log(r.roas.toFixed(2) + 'x | $' + r.c.toFixed(0).padStart(4) + ' spend → $' + r.v.toFixed(0).padStart(4) + ' | ' + r.n + '  ' + tag);
    if (r.roas < 1) { wasteSpend += r.c; wasteRev += r.v; }
    if (r.roas >= 3) { winSpend += r.c; winRev += r.v; }
  }
  console.log('\n--- Sub-1x (losing money) total: $' + wasteSpend.toFixed(0) + ' spend → $' + wasteRev.toFixed(0) + ' back = $' + (wasteSpend - wasteRev).toFixed(0) + ' NET LOSS over 6 days');
  console.log('--- 3x+ winners total: $' + winSpend.toFixed(0) + ' spend → $' + winRev.toFixed(0) + ' back');
})().catch(e => console.error('ERR', e.message));
