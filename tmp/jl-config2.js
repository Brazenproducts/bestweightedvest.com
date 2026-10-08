const { GoogleAdsApi } = require('google-ads-api');
const fs = require('fs');
require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const creds = JSON.parse(fs.readFileSync('/home/ubuntu/.openclaw/workspace/.google-ads-credentials.json'));
const client = new GoogleAdsApi({ client_id: creds.client_id, client_secret: creds.client_secret, developer_token: creds.developer_token });
const customer = client.Customer({ customer_id: '1770651698', refresh_token: creds.refresh_token });

async function tryQ(label, query) {
  try {
    const r = await customer.query(query);
    console.log('--- ' + label + ' (' + r.length + ' rows) ---');
    return r;
  } catch (e) {
    console.log('--- ' + label + ': ERROR ' + (e.message || JSON.stringify(e).slice(0,100)) + ' ---');
    return [];
  }
}

(async () => {
  // basic campaign
  const c = await tryQ('campaign basic', `SELECT campaign.id, campaign.name, campaign.advertising_channel_type, campaign.status FROM campaign WHERE campaign.name = "Jeep JL Seat Covers PMax"`);
  if (!c.length) return;
  const cid = c[0].campaign.id;
  console.log('   id=' + cid + ' channel=' + c[0].campaign.advertisingChannelType + ' status=' + c[0].campaign.status + '\n');

  // shopping setting
  const ss = await tryQ('shopping_setting', `SELECT campaign.shopping_setting.merchant_id, campaign.shopping_setting.feed_label FROM campaign WHERE campaign.id = ${cid}`);
  if (ss.length) console.log('   merchant=' + JSON.stringify(ss[0].campaign.shoppingSetting) + '\n');

  // asset groups - minimal
  const ag = await tryQ('asset_group', `SELECT asset_group.id, asset_group.name, asset_group.status FROM asset_group WHERE campaign.id = ${cid}`);
  for (const x of ag) console.log('   AG [' + x.assetGroup.status + '] ' + x.assetGroup.name + ' (id ' + x.assetGroup.id + ')');

  // asset group final urls separately
  const agu = await tryQ('asset_group urls', `SELECT asset_group.name, asset_group.final_urls FROM asset_group WHERE campaign.id = ${cid}`);
  for (const x of agu) console.log('   URL: ' + x.assetGroup.name + ' → ' + JSON.stringify(x.assetGroup.finalUrls));

  // listing group filters
  const lg = await tryQ('listing_group_filters', `SELECT asset_group.name, asset_group_listing_group_filter.type, asset_group_listing_group_filter.case_value.product_type.value FROM asset_group_listing_group_filter WHERE campaign.id = ${cid}`);
  for (const x of lg) {
    const f = x.assetGroupListingGroupFilter;
    const pt = f.caseValue && f.caseValue.productType && f.caseValue.productType.value;
    console.log('   FILTER: ' + x.assetGroup.name + ' | type=' + f.type + ' | productType=' + (pt || '(all/none)'));
  }
})().catch(e => console.error('OUTER', e.message));
