const fs = require('fs');
const { GoogleAdsApi } = require('google-ads-api');

const creds = JSON.parse(fs.readFileSync('/home/ubuntu/.openclaw/workspace/.google-ads-credentials.json', 'utf8'));

// Load Shopify token from .env
const envText = fs.readFileSync('/home/ubuntu/.openclaw/workspace/.env', 'utf8');
let SHOP_TOKEN = null;
for (const line of envText.split('\n')) {
  const m = line.match(/^\s*SHOPIFY_TOKEN_BARTACT\s*=\s*(.+)\s*$/);
  if (m) { SHOP_TOKEN = m[1].trim().replace(/^["']|["']$/g, ''); }
}

const CUSTOMER_ID = '1770651698';
const SHOP = 'bartact.myshopify.com';

const client = new GoogleAdsApi({
  client_id: creds.client_id,
  client_secret: creds.client_secret,
  developer_token: creds.developer_token || creds.dev_token,
});

const customer = client.Customer({
  customer_id: CUSTOMER_ID,
  refresh_token: creds.refresh_token,
  // NO login_customer_id per instructions
});

function fmt(n) { return (Math.round(n * 100) / 100).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2}); }

(async () => {
  const out = { campaigns: [], weekly: [], pmaxAssetGroups: [], convActions: [], errors: [] };

  // 1) Last 7 days per enabled campaign
  try {
    const rows = await customer.query(`
      SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type,
             metrics.cost_micros, metrics.conversions, metrics.conversions_value
      FROM campaign
      WHERE segments.date DURING LAST_7_DAYS
        AND campaign.status = 'ENABLED'
      ORDER BY metrics.cost_micros DESC
    `);
    for (const r of rows) {
      const spend = (r.metrics.cost_micros || 0) / 1e6;
      const conv = r.metrics.conversions || 0;
      const val = r.metrics.conversions_value || 0;
      const roas = spend > 0 ? val / spend : 0;
      out.campaigns.push({
        id: r.campaign.id, name: r.campaign.name,
        channel: r.campaign.advertising_channel_type,
        spend, conv, val, roas,
        bleeder: (spend > 30 && roas < 1.5)
      });
    }
  } catch (e) { out.errors.push('campaigns: ' + e.message); }

  // Weekly trend per campaign (3 weeks) - fetch by week segments
  try {
    const rows = await customer.query(`
      SELECT campaign.id, campaign.name, segments.week,
             metrics.cost_micros, metrics.conversions_value
      FROM campaign
      WHERE segments.date DURING LAST_30_DAYS
        AND campaign.status = 'ENABLED'
      ORDER BY campaign.name, segments.week
    `);
    const byCamp = {};
    for (const r of rows) {
      const name = r.campaign.name;
      byCamp[name] = byCamp[name] || [];
      const spend = (r.metrics.cost_micros||0)/1e6;
      const val = r.metrics.conversions_value||0;
      byCamp[name].push({ week: r.segments.week, roas: spend>0 ? val/spend : 0, spend, val });
    }
    out.weekly = byCamp;
  } catch (e) { out.errors.push('weekly: ' + e.message); }

  // Prior week (8-14 days ago) for recovery direction
  try {
    const rows = await customer.query(`
      SELECT metrics.cost_micros, metrics.conversions, metrics.conversions_value
      FROM campaign
      WHERE segments.date BETWEEN '${dateStr(14)}' AND '${dateStr(8)}'
        AND campaign.status = 'ENABLED'
    `);
    let spend=0, val=0, conv=0;
    for (const r of rows){ spend += (r.metrics.cost_micros||0)/1e6; val += r.metrics.conversions_value||0; conv += r.metrics.conversions||0; }
    out.priorWeek = { spend, val, conv, roas: spend>0?val/spend:0 };
  } catch (e) { out.errors.push('priorWeek: ' + e.message); }

  // 4) PMax asset groups + audience signals
  try {
    const rows = await customer.query(`
      SELECT campaign.id, campaign.name, asset_group.id, asset_group.name, asset_group.status
      FROM asset_group
      WHERE campaign.advertising_channel_type = 'PERFORMANCE_MAX'
        AND campaign.status = 'ENABLED'
    `);
    for (const r of rows) {
      out.pmaxAssetGroups.push({
        campaign: r.campaign.name, agId: r.asset_group.id,
        agName: r.asset_group.name, status: r.asset_group.status, hasSignal: false
      });
    }
    // Check audience signals via asset_group_signal
    try {
      const sigRows = await customer.query(`
        SELECT asset_group.id, asset_group_signal.audience.audience
        FROM asset_group_signal
        WHERE campaign.advertising_channel_type = 'PERFORMANCE_MAX'
          AND campaign.status = 'ENABLED'
      `);
      const sigSet = new Set();
      for (const r of sigRows) { sigSet.add(String(r.asset_group.id)); }
      for (const ag of out.pmaxAssetGroups) { ag.hasSignal = sigSet.has(String(ag.agId)); }
    } catch (e2) { out.errors.push('asset_group_signal: ' + e2.message); }
  } catch (e) { out.errors.push('asset_group: ' + e.message); }

  // Conversion tracking freshness
  try {
    const rows = await customer.query(`
      SELECT conversion_action.name, conversion_action.status, conversion_action.type,
             segments.date, metrics.conversions
      FROM conversion_action
      WHERE segments.date DURING LAST_7_DAYS
        AND metrics.conversions > 0
      ORDER BY segments.date DESC
    `);
    const byAction = {};
    for (const r of rows) {
      const n = r.conversion_action.name;
      if (!byAction[n] || r.segments.date > byAction[n].lastDate) {
        byAction[n] = { name: n, type: r.conversion_action.type, lastDate: r.segments.date };
      }
    }
    out.convActions = Object.values(byAction);
  } catch (e) { out.errors.push('conversion_action: ' + e.message); }

  console.log(JSON.stringify(out, null, 2));
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });

function dateStr(daysAgo) {
  const d = new Date(Date.now() - daysAgo*86400000);
  return d.toISOString().slice(0,10);
}
