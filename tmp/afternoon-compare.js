require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const https = require('https');
const token = process.env.SHOPIFY_TOKEN_BARTACT;

function get(path) {
  return new Promise((res, rej) => {
    https.get({ hostname: 'bartact.myshopify.com', path, headers: { 'X-Shopify-Access-Token': token } }, r => {
      let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res(JSON.parse(b)); } catch (e) { res(null); } });
    }).on('error', rej);
  });
}

// afternoon = 12:00-17:00 Pacific
function afternoon(orders) {
  let n = 0, rev = 0;
  for (const o of orders) {
    const h = parseInt(new Date(o.created_at).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', hour12: false }).split(', ')[1].split(':')[0]);
    if (h >= 12 && h <= 17) { n++; rev += parseFloat(o.total_price); }
  }
  return { n, rev };
}

(async () => {
  const days = ['2026-10-06', '2026-10-05', '2026-10-04', '2026-10-03', '2026-10-02'];
  console.log('=== AFTERNOON (12pm-5pm Pacific) COMPARISON ===\n');
  for (const d of days) {
    const r = await get('/admin/api/2024-01/orders.json?status=any&created_at_min=' + d + 'T00:00:00-07:00&created_at_max=' + d + 'T23:59:59-07:00&limit=250&fields=created_at,total_price');
    const orders = (r && r.orders) || [];
    const aft = afternoon(orders);
    const dow = new Date(d + 'T12:00:00-07:00').toLocaleDateString('en-US', { weekday: 'short' });
    console.log(d + ' (' + dow + '): afternoon ' + aft.n + ' orders / $' + aft.rev.toFixed(0) + '  | full day ' + orders.length + ' orders');
  }
})().catch(e => console.error('ERR', e.message));
