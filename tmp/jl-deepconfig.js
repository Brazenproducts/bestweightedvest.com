const { GoogleAdsApi } = require('google-ads-api');
const fs = require('fs');
require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const creds = JSON.parse(fs.readFileSync('/home/ubuntu/.openclaw/workspace/.google-ads-credentials.json'));
const client = new GoogleAdsApi({ client_id: creds.client_id, client_secret: creds.client_secret, developer_token: creds.developer_token });
const customer = client.Customer({ customer_id: '1770651698', refresh_token: creds.refresh_token });
async function q(query){ return await customer.query(query); }

function dig(obj, path) { return path.split('.').reduce((o,k)=> (o==null?undefined:o[k]), obj); }

(async () => {
  const JL = 'Jeep JL Seat Covers PMax';
  const GL = 'Gladiator PMax';

  for (const name of [JL, GL]) {
    console.log('\n================= ' + name + ' =================');
    const cr = await q(`SELECT campaign.id, campaign.name, campaign.advertising_channel_type, campaign.bidding_strategy_type, campaign.url_expansion_opt_out FROM campaign WHERE campaign.name = "${name}"`);
    const cid = cr[0].campaign.id;
    console.log('id=' + cid + ' | channel=' + cr[0].campaign.advertisingChannelType + ' | bid=' + cr[0].campaign.biddingStrategyType + ' | urlExpansionOptOut=' + cr[0].campaign.urlExpansionOptOut);

    // Shopping settings (merchant id / feed scope)
    try {
      const ss = await q(`SELECT campaign.shopping_setting.merchant_id, campaign.shopping_setting.feed_label, campaign.shopping_setting.sales_country FROM campaign WHERE campaign.id = ${cid}`);
      const s = ss[0].campaign.shoppingSetting || {};
      console.log('Shopping: merchant=' + s.merchantId + ' feedLabel=' + s.feedLabel + ' country=' + s.salesCountry);
    } catch(e){ console.log('shopping err: ' + e.message); }

    // Asset groups
    try {
      const ag = await q(`SELECT asset_group.id, asset_group.name, asset_group.status, asset_group.final_urls FROM asset_group WHERE campaign.id = ${cid}`);
      console.log('Asset groups: ' + ag.length);
      for (const x of ag) {
        const g = x.assetGroup;
        console.log('  [' + g.status + '] "' + g.name + '" → ' + JSON.stringify(g.finalUrls));
        // listing group filters for this asset group (what products)
        try {
          const lg = await q(`SELECT asset_group_listing_group_filter.type, asset_group_listing_group_filter.case_value.product_type.value, asset_group_listing_group_filter.case_value.product_brand.value FROM asset_group_listing_group_filter WHERE asset_group.id = ${g.id}`);
          console.log('     listing filters: ' + lg.length);
          for (const lf of lg.slice(0,6)) {
            const f = lf.assetGroupListingGroupFilter;
            console.log('       type=' + f.type + ' prodType=' + dig(f,'caseValue.productType.value') + ' brand=' + dig(f,'caseValue.productBrand.value'));
          }
        } catch(e){ console.log('     listing err: ' + e.message); }
      }
    } catch(e){ console.log('asset_group err: ' + e.message); }
  }
})().catch(e => console.error('FATAL', e.message));
