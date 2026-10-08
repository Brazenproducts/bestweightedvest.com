const { GoogleAdsApi } = require('google-ads-api');
const fs = require('fs');
require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const creds = JSON.parse(fs.readFileSync('/home/ubuntu/.openclaw/workspace/.google-ads-credentials.json'));
const client = new GoogleAdsApi({ client_id: creds.client_id, client_secret: creds.client_secret, developer_token: creds.developer_token });
const customer = client.Customer({ customer_id: '1770651698', refresh_token: creds.refresh_token });
async function q(query){ return await customer.query(query); }

(async () => {
  // Get JL campaign id
  const cr = await q(`SELECT campaign.id, campaign.name FROM campaign WHERE campaign.name = "Jeep JL Seat Covers PMax"`);
  const cid = cr[0] && cr[0].campaign.id;
  console.log('JL campaign id: ' + cid + '\n');

  // Asset groups + their final URLs
  console.log('### JL ASSET GROUPS + LANDING URLs ###');
  try {
    const ag = await q(`SELECT asset_group.name, asset_group.final_urls, asset_group.status FROM asset_group WHERE campaign.id = ${cid}`);
    for (const x of ag) {
      console.log('  [' + x.assetGroup.status + '] ' + x.assetGroup.name);
      console.log('     URLs: ' + JSON.stringify(x.assetGroup.finalUrls));
    }
  } catch(e){ console.log('  asset_group err: ' + e.message); }

  // Where is JL spend going by network/placement?
  console.log('\n### JL — where clicks come from (conversion by day to spot pattern) ###');
  const r = await q(`SELECT segments.date, metrics.clicks, metrics.conversions, metrics.cost_micros FROM campaign WHERE campaign.name = "Jeep JL Seat Covers PMax" AND segments.date BETWEEN "2026-10-01" AND "2026-10-07" ORDER BY segments.date`);
  for (const x of r) console.log('  ' + x.segments.date + ': ' + x.metrics.clicks + ' clk | ' + x.metrics.conversions.toFixed(1) + ' conv | $' + (x.metrics.cost_micros/1e6).toFixed(0));

  // Compare: Gladiator asset group URLs
  console.log('\n### Gladiator PMax asset group URLs (for comparison) ###');
  const gr = await q(`SELECT campaign.id FROM campaign WHERE campaign.name = "Gladiator PMax"`);
  const gid = gr[0] && gr[0].campaign.id;
  try {
    const gag = await q(`SELECT asset_group.name, asset_group.final_urls FROM asset_group WHERE campaign.id = ${gid}`);
    for (const x of gag) console.log('  ' + x.assetGroup.name + ' → ' + JSON.stringify(x.assetGroup.finalUrls));
  } catch(e){ console.log('  err: ' + e.message); }
})().catch(e => console.error('FATAL', e.message));
