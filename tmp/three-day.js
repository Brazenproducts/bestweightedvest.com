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
  const r = await get('/admin/api/2024-01/orders.json?status=any&created_at_min=' + d + 'T00:00:00-07:00&created_at_max=' + d + 'T23:59:59-07:00&limit=250&fields=created_at,total_price,referring_site,landing_site');
  const o = (r && r.orders) || [];
  let rev = 0, gads = 0, big = 0;
  for (const x of o) {
    const amt = parseFloat(x.total_price); rev += amt;
    const ref = ((x.referring_site || '') + ' ' + (x.landing_site || '')).toLowerCase();
    if (ref.includes('gclid=') || ref.includes('gad_')) gads += amt;
    if (amt > 200) big++;
  }
  return { n: o.length, rev, gads, big };
}

(async () => {
  const days = [
    ['2026-10-08', 'TODAY Thu'],
    ['2026-10-07', 'Wed'],
    ['2026-10-06', 'Tue'],
    ['2026-10-05', 'Mon'],
    ['2026-10-04', 'Sun'],
    ['2026-10-03', 'Sat']
  ];
  const nowH = parseInt(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles', hour12: false }).split(', ')[1].split(':')[0]);
  console.log('Now: ' + nowH + ':00 Pacific\n');
  console.log('Day         | Orders | Revenue | GAds $ | $200+ orders');
  console.log('-'.repeat(60));
  for (const [d, label] of days) {
    const x = await day(d);
    const note = label.startsWith('TODAY') ? ' (through ' + nowH + ':00)' : '';
    console.log(label.padEnd(11) + ' | ' + String(x.n).padStart(6) + ' | $' + x.rev.toFixed(0).padStart(5) + ' | $' + x.gads.toFixed(0).padStart(4) + ' | ' + x.big + note);
  }
})().catch(e => console.error('ERR', e.message));
