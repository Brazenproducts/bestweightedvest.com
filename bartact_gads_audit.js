const fs = require('fs');
const { GoogleAdsApi } = require('google-ads-api');

const creds = JSON.parse(fs.readFileSync('/home/ubuntu/.openclaw/workspace/.google-ads-credentials.json','utf8'));

const client = new GoogleAdsApi({
  client_id: creds.client_id,
  client_secret: creds.client_secret,
  developer_token: creds.developer_token || creds.dev_token,
});

const customer = client.Customer({
  customer_id: '1770651698',
  refresh_token: creds.refresh_token,
  // NO login_customer_id per instructions
});

function dstr(d){ return d.toISOString().slice(0,10); }

(async () => {
  const out = {};
  try {
    // 1) Last 7 days per enabled campaign
    const camp7 = await customer.query(`
      SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type,
             metrics.cost_micros, metrics.conversions, metrics.conversions_value
      FROM campaign
      WHERE segments.date DURING LAST_7_DAYS
        AND campaign.status = 'ENABLED'
      ORDER BY metrics.cost_micros DESC
    `);
    out.campaigns7d = camp7.map(r => ({
      id: r.campaign.id,
      name: r.campaign.name,
      channel: r.campaign.advertising_channel_type,
      spend: (r.metrics.cost_micros||0)/1e6,
      conv: r.metrics.conversions||0,
      conv_value: r.metrics.conversions_value||0,
    }));
  } catch(e){ out.campaigns7d_error = String(e.message||e); console.error('camp7 err', e.message||e); }

  try {
    // Weekly trend: last 3 weeks per campaign (by week)
    const weekly = await customer.query(`
      SELECT campaign.id, campaign.name, segments.week,
             metrics.cost_micros, metrics.conversions_value
      FROM campaign
      WHERE segments.date DURING LAST_30_DAYS
        AND campaign.status = 'ENABLED'
      ORDER BY segments.week DESC
    `);
    out.weekly = weekly.map(r => ({
      id: r.campaign.id, name: r.campaign.name, week: r.segments.week,
      spend: (r.metrics.cost_micros||0)/1e6,
      conv_value: r.metrics.conversions_value||0,
    }));
  } catch(e){ out.weekly_error = String(e.message||e); console.error('weekly err', e.message||e); }

  try {
    // Prior week (days 8-14) for recovery comparison
    const today = new Date(Date.UTC(2026,9,5));
    const d1 = new Date(today); d1.setUTCDate(d1.getUTCDate()-14);
    const d2 = new Date(today); d2.setUTCDate(d2.getUTCDate()-8);
    const prev = await customer.query(`
      SELECT metrics.cost_micros, metrics.conversions, metrics.conversions_value
      FROM customer
      WHERE segments.date BETWEEN '${dstr(d1)}' AND '${dstr(d2)}'
    `);
    out.prevWeek = prev.map(r => ({
      spend:(r.metrics.cost_micros||0)/1e6,
      conv:r.metrics.conversions||0,
      conv_value:r.metrics.conversions_value||0,
    }));
  } catch(e){ out.prevWeek_error = String(e.message||e); console.error('prev err', e.message||e); }

  try {
    // 4a) PMax asset groups + audience signals
    const ag = await customer.query(`
      SELECT campaign.id, campaign.name, asset_group.id, asset_group.name, asset_group.status
      FROM asset_group
      WHERE campaign.status = 'ENABLED'
    `);
    out.assetGroups = ag.map(r=>({ campaign:r.campaign.name, agId:r.asset_group.id, agName:r.asset_group.name, status:r.asset_group.status }));
  } catch(e){ out.assetGroups_error = String(e.message||e); console.error('ag err', e.message||e); }

  try {
    // Audience signals on asset groups
    const sig = await customer.query(`
      SELECT asset_group.id, asset_group.name, asset_group_signal.audience.audience
      FROM asset_group_signal
    `);
    out.assetGroupSignals = sig.map(r=>({ agId:r.asset_group.id, agName:r.asset_group.name, audience:r.asset_group_signal && r.asset_group_signal.audience ? r.asset_group_signal.audience.audience : null }));
  } catch(e){ out.assetGroupSignals_error = String(e.message||e); console.error('sig err', e.message||e); }

  try {
    // 4b) Conversion tracking recency - last conversion action with recent stats
    const conv = await customer.query(`
      SELECT conversion_action.id, conversion_action.name, segments.date, metrics.conversions
      FROM conversion_action
      WHERE segments.date DURING LAST_14_DAYS AND metrics.conversions > 0
      ORDER BY segments.date DESC
    `);
    out.recentConversions = conv.slice(0,50).map(r=>({ name:r.conversion_action.name, date:r.segments.date, conv:r.metrics.conversions }));
  } catch(e){ out.recentConversions_error = String(e.message||e); console.error('conv err', e.message||e); }

  console.log(JSON.stringify(out,null,2));
})();
