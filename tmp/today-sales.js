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

async function day(d) {
  const r = await get('/admin/api/2024-01/orders.json?status=any&created_at_min=' + d + 'T00:00:00-07:00&created_at_max=' + d + 'T23:59:59-07:00&limit=250&fields=created_at,total_price');
  const o = (r && r.orders) || [];
  let rev = 0; for (const x of o) rev += parseFloat(x.total_price);
  return { n: o.length, rev, o };
}

(async () => {
  const today = await day('2026-10-07');
  const lastWed = await day('2026-09-30');
  const tue = await day('2026-10-06');
  const nowH = parseInt(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles', hour12: false }).split(', ')[1].split(':')[0]);
  console.log('Now: ' + nowH + ':00 Pacific\n');
  console.log('TODAY (Wed Oct 7):   ' + today.n + ' orders / $' + today.rev.toFixed(0) + ' (through ' + nowH + ':00)');
  console.log('Last Wed (Sep 30):   ' + lastWed.n + ' orders / $' + lastWed.rev.toFixed(0) + ' (full day)');
  console.log('Yesterday (Tue 10/6):' + tue.n + ' orders / $' + tue.rev.toFixed(0) + ' (full day)');
  console.log('\nToday order times (Pacific):');
  for (const x of today.o) {
    const p = new Date(x.created_at).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', hour12: false }).split(', ')[1];
    console.log('  ' + p + '  $' + parseFloat(x.total_price).toFixed(0));
  }
})().catch(e => console.error('ERR', e.message));
