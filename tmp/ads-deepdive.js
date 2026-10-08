const { GoogleAdsApi } = require('google-ads-api');
const fs = require('fs');
require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const creds = JSON.parse(fs.readFileSync('/home/ubuntu/.openclaw/workspace/.google-ads-credentials.json'));
const client = new GoogleAdsApi({ client_id: creds.client_id, client_secret: creds.client_secret, developer_token: creds.developer_token });
const customer = client.Customer({ customer_id: '1770651698', refresh_token: creds.refresh_token });

async function pull(start, end) {
  const q = `SELECT campaign.name, metrics.cost_micros, metrics.conversions_value, metrics.conversions, metrics.clicks FROM campaign WHERE segments.date BETWEEN "${start}" AND "${end}" AND metrics.cost_micros > 0`;
  const res = await customer.query(q);
  const agg = {};
  for (const r of res) {
    const n = r.campaign.name;
    if (!agg[n]) agg[n] = { c: 0, v: 0, conv: 0, clk: 0 };
    agg[n].c += r.metrics.cost_micros / 1e6;
    agg[n].v += r.metrics.conversions_value;
    agg[n].conv += r.metrics.conversions;
    agg[n].clk += r.metrics.clicks;
  }
  return agg;
}

(async () => {
  // Window A: since Friday (Oct 2-5, 4 days)
  const A = await pull('2026-10-02', '2026-10-05');
  // Window B: 2 weeks ago comparable (Sep 18-21, the 4 days before the collapse accelerated)
  const B = await pull('2026-09-18', '2026-09-21');
  // Window C: full 2-week trailing (Sep 22 - Oct 5)
  const C = await pull('2026-09-22', '2026-10-05');

  const names = new Set([...Object.keys(A), ...Object.keys(B), ...Object.keys(C)]);

  console.log('=== CAMPAIGN DEEP DIVE — SIDE BY SIDE ===');
  console.log('SINCE FRIDAY = Oct 2-5 (4d) | PRIOR = Sep 18-21 (4d, pre-collapse) | 2WK = Sep 22-Oct 5\n');
  console.log('Campaign'.padEnd(42) + ' | Fri ROAS ($sp)   | Prior ROAS ($sp) | 2wk ROAS ($sp)');
  console.log('-'.repeat(110));

  const rows = [...names].map(n => {
    const a = A[n] || {c:0,v:0}, b = B[n] || {c:0,v:0}, c = C[n] || {c:0,v:0};
    return { n, a, b, c, aRoas: a.c>0?a.v/a.c:0 };
  }).sort((x, y) => y.a.c - x.a.c);

  const fmt = (o) => o.c > 0 ? (o.v/o.c).toFixed(2) + 'x ($' + o.c.toFixed(0) + ')' : '—';

  let tAc=0,tAv=0,tBc=0,tBv=0,tCc=0,tCv=0;
  for (const r of rows) {
    tAc+=r.a.c; tAv+=r.a.v; tBc+=r.b.c; tBv+=r.b.v; tCc+=r.c.c; tCv+=r.c.v;
    console.log(r.n.slice(0,42).padEnd(42) + ' | ' + fmt(r.a).padEnd(16) + ' | ' + fmt(r.b).padEnd(16) + ' | ' + fmt(r.c));
  }
  console.log('-'.repeat(110));
  console.log('ACCOUNT TOTAL'.padEnd(42) + ' | ' + (tAv/tAc).toFixed(2)+'x ($'+tAc.toFixed(0)+')' + '   | ' + (tBc>0?(tBv/tBc).toFixed(2):'0')+'x ($'+tBc.toFixed(0)+')' + '  | ' + (tCv/tCc).toFixed(2)+'x ($'+tCc.toFixed(0)+')');
})().catch(e => console.error('ERR', e.message));
