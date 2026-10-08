const { GoogleAdsApi } = require('google-ads-api');
const fs = require('fs');
require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const creds = JSON.parse(fs.readFileSync('/home/ubuntu/.openclaw/workspace/.google-ads-credentials.json'));
const client = new GoogleAdsApi({ client_id: creds.client_id, client_secret: creds.client_secret, developer_token: creds.developer_token });
const customer = client.Customer({ customer_id: '1770651698', refresh_token: creds.refresh_token });

// The product-category Search campaigns I deleted Oct 2 that cover real JL/Wrangler products
const deleted = [
  'Fire Extinguisher Holders - Search',
  'MOLLE Accessories - Search',
  'Paracord Grab Handles Wrangler JL - Search',
  'Jeep Wrangler Seat Covers - SRCH',
  'Wrangler Seat Covers - Search',
  'Paracord Grab Handles JK - Search',
  'Paracord Grab Handles TJ - Search',
  'Paracord Grab Handles Gladiator - Search',
  'Paracord Grab Handles Bronco - Search',
  'Jeep Wrangler Seat Covers Search v2',
  'Wrangler Storage PMax',
  'Wrangler Storage - Search NEW',
  'Gladiator Storage - Search NEW',
  'Bronco Storage PMax'
];

async function hist(name, s, e) {
  const q = `SELECT metrics.cost_micros, metrics.conversions, metrics.conversions_value FROM campaign WHERE campaign.name = "${name}" AND segments.date BETWEEN "${s}" AND "${e}"`;
  try {
    const r = await customer.query(q);
    let c=0,cv=0,v=0; for (const x of r){c+=x.metrics.cost_micros/1e6;cv+=x.metrics.conversions;v+=x.metrics.conversions_value;}
    return { c, cv, v };
  } catch(e){ return null; }
}

(async () => {
  console.log('=== LIFETIME PERFORMANCE OF CAMPAIGNS I DELETED OCT 2 ===\n');
  console.log('Campaign                                    | 2026 (Jan-Oct)           | Best quarter');
  console.log('-'.repeat(95));
  for (const name of deleted) {
    // full-ish year + quarters
    const full = await hist(name, '2026-01-01', '2026-10-01');
    const quarters = [
      await hist(name,'2026-01-01','2026-04-01'),
      await hist(name,'2026-04-01','2026-07-01'),
      await hist(name,'2026-07-01','2026-10-01')
    ];
    let best = { roas: 0, label: 'never' };
    ['Q1','Q2','Q3'].forEach((lbl,i)=>{ const q=quarters[i]; if(q && q.c>20){ const r=q.v/q.c; if(r>best.roas){best={roas:r,label:lbl+' '+r.toFixed(1)+'x ($'+q.c.toFixed(0)+')'};}}});
    const fstr = full ? ('$'+full.c.toFixed(0)+' spend, '+full.cv.toFixed(0)+' conv, '+(full.c>0?(full.v/full.c).toFixed(2):'0')+'x') : 'no data';
    console.log(name.slice(0,43).padEnd(43) + ' | ' + fstr.padEnd(24) + ' | ' + best.label);
  }
})().catch(e => console.error('ERR', e.message));
