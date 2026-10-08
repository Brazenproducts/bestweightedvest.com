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

(async () => {
  // Today (Oct 6 Pacific) orders by hour — raw, single page, no dedup issues
  const min = '2026-10-06T00:00:00-07:00';
  const r = await get('/admin/api/2024-01/orders.json?status=any&created_at_min=' + min + '&limit=250&fields=id,created_at,total_price,financial_status');
  const orders = (r && r.orders) || [];

  const byHour = {};
  let total = 0;
  for (const o of orders) {
    const pac = new Date(o.created_at).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', hour12: false });
    const hour = pac.split(', ')[1].split(':')[0];
    byHour[hour] = (byHour[hour] || 0) + 1;
    total += parseFloat(o.total_price);
  }

  console.log('=== TODAY (Oct 6 Pacific) ORDERS BY HOUR ===\n');
  console.log('Total today: ' + orders.length + ' orders / $' + total.toFixed(0));
  const nowPac = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles', hour12: false });
  console.log('Current Pacific time: ' + nowPac + '\n');
  for (let h = 0; h < 24; h++) {
    const hh = String(h).padStart(2, '0');
    const n = byHour[hh] || 0;
    if (n > 0 || h <= parseInt(nowPac.split(', ')[1].split(':')[0])) {
      console.log(hh + ':00  ' + '#'.repeat(n) + ' ' + (n || ''));
    }
  }

  // last order timestamp
  if (orders.length) {
    const last = orders.map(o => o.created_at).sort().reverse()[0];
    const lastPac = new Date(last).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
    console.log('\nLast order: ' + lastPac + ' Pacific');
    const minsAgo = Math.round((Date.now() - new Date(last).getTime()) / 60000);
    console.log('That was ' + minsAgo + ' minutes ago.');
  }
})().catch(e => console.error('ERR', e.message));
