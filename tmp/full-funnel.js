require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const https = require('https');
const token = process.env.SHOPIFY_TOKEN_BARTACT;

function get(path) {
  return new Promise((res, rej) => {
    https.get({ hostname: 'bartact.myshopify.com', path, headers: { 'X-Shopify-Access-Token': token } }, r => {
      let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res({ s: r.statusCode, d: JSON.parse(b) }); } catch (e) { res({ s: r.statusCode, d: null }); } });
    }).on('error', rej);
  });
}

function dayStr(n) { return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10); }

(async () => {
  // Pull all orders last 21 days, bucket by day + by source
  const since = dayStr(21) + 'T00:00:00Z';
  let all = [];
  let url = '/admin/api/2024-01/orders.json?status=any&created_at_min=' + since + '&limit=250&fields=created_at,total_price,referring_site,landing_site,source_name,financial_status';
  for (let i = 0; i < 6; i++) {
    const r = await get(url);
    if (!r.d || !r.d.orders) break;
    all = all.concat(r.d.orders);
    if (r.d.orders.length < 250) break;
  }

  // bucket by day
  const days = {};
  for (const o of all) {
    const day = o.created_at.slice(0, 10);
    if (!days[day]) days[day] = { orders: 0, rev: 0, gads: 0, gadsRev: 0, organic: 0, organicRev: 0, other: 0, otherRev: 0 };
    const amt = parseFloat(o.total_price);
    const ref = ((o.referring_site || '') + ' ' + (o.landing_site || '')).toLowerCase();
    days[day].orders++; days[day].rev += amt;
    if (ref.includes('gclid=') || ref.includes('gad_')) { days[day].gads++; days[day].gadsRev += amt; }
    else if (ref.includes('google')) { days[day].organic++; days[day].organicRev += amt; }
    else { days[day].other++; days[day].otherRev += amt; }
  }

  console.log('=== REVENUE BY DAY + CHANNEL (last 21 days) ===');
  console.log('Date       | Orders | TOTAL $ | GAds $ | Organic(goog) $ | Other $ | AOV');
  console.log('-'.repeat(88));
  const sorted = Object.keys(days).sort();
  for (const d of sorted) {
    const x = days[d];
    const aov = x.orders > 0 ? (x.rev / x.orders) : 0;
    console.log(d + ' | ' + String(x.orders).padStart(6) + ' | $' + x.rev.toFixed(0).padStart(5) + ' | $' + x.gadsRev.toFixed(0).padStart(4) + ' | $' + x.organicRev.toFixed(0).padStart(13) + ' | $' + x.otherRev.toFixed(0).padStart(5) + ' | $' + aov.toFixed(0));
  }

  // weekly rollup
  console.log('\n=== WEEKLY TOTALS ===');
  const weeks = {};
  for (const d of sorted) {
    const wk = Math.floor((Date.now() - new Date(d + 'T00:00:00Z').getTime()) / (7 * 86400000));
    if (!weeks[wk]) weeks[wk] = { orders: 0, rev: 0, days: 0 };
    weeks[wk].orders += days[d].orders; weeks[wk].rev += days[d].rev; weeks[wk].days++;
  }
  for (const wk of Object.keys(weeks).sort()) {
    const w = weeks[wk];
    console.log('~' + wk + 'wk ago: ' + w.orders + ' orders, $' + w.rev.toFixed(0) + ' over ' + w.days + ' days = $' + (w.rev/w.days).toFixed(0) + '/day avg');
  }
})().catch(e => console.error('ERR', e.message));
