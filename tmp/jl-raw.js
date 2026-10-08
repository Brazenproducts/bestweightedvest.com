const { GoogleAdsApi } = require('google-ads-api');
const fs = require('fs');
require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const creds = JSON.parse(fs.readFileSync('/home/ubuntu/.openclaw/workspace/.google-ads-credentials.json'));
const client = new GoogleAdsApi({ client_id: creds.client_id, client_secret: creds.client_secret, developer_token: creds.developer_token });
const customer = client.Customer({ customer_id: '1770651698', refresh_token: creds.refresh_token });

(async () => {
  const cid = 24265126942; // JL Seat Covers PMax

  // RAW asset group dump
  console.log('=== RAW ASSET GROUP(S) for JL ===');
  const ag = await customer.query(`SELECT asset_group.id, asset_group.name, asset_group.final_urls, asset_group.final_mobile_urls, asset_group.path1, asset_group.path2, asset_group.status FROM asset_group WHERE campaign.id = ${cid}`);
  console.log(JSON.stringify(ag, null, 2));

  console.log('\n=== RAW LISTING GROUP FILTERS for JL ===');
  const lg = await customer.query(`SELECT asset_group_listing_group_filter.id, asset_group_listing_group_filter.type, asset_group_listing_group_filter.vertical, asset_group_listing_group_filter.case_value FROM asset_group_listing_group_filter WHERE campaign.id = ${cid}`);
  console.log(JSON.stringify(lg, null, 2));

  console.log('\n=== AD GROUP AD / assets count ===');
  const assets = await customer.query(`SELECT asset_group_asset.field_type, asset_group_asset.status FROM asset_group_asset WHERE campaign.id = ${cid}`);
  const byType = {};
  for (const x of assets) { const t = x.assetGroupAsset.fieldType; byType[t] = (byType[t]||0)+1; }
  console.log(JSON.stringify(byType, null, 2));
})().catch(e => console.error('ERR', e.message, e.stack ? e.stack.slice(0,200) : ''));
