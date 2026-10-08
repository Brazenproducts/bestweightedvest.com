const { GoogleAdsApi } = require('google-ads-api');
const fs = require('fs');
require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const creds = JSON.parse(fs.readFileSync('/home/ubuntu/.openclaw/workspace/.google-ads-credentials.json'));
const client = new GoogleAdsApi({ client_id: creds.client_id, client_secret: creds.client_secret, developer_token: creds.developer_token });
const customer = client.Customer({ customer_id: '1770651698', refresh_token: creds.refresh_token });

(async () => {
  // 1. ALL campaigns (any status) mentioning JL/JLU/Wrangler/grab/door/fire/molle
  console.log('=== ALL CAMPAIGNS (any status) — JL/Wrangler/accessory related ===');
  const all = await customer.query(`SELECT campaign.id, campaign.name, campaign.status FROM campaign WHERE campaign.status != "REMOVED" ORDER BY campaign.name`);
  const removed = await customer.query(`SELECT campaign.id, campaign.name, campaign.status FROM campaign WHERE campaign.status = "REMOVED" ORDER BY campaign.name`);
  const rel = /jl|jlu|wrangler|grab|door|fire|molle|handle|storage|bag/i;
  console.log('\n-- ACTIVE/PAUSED --');
  for (const x of all) if (rel.test(x.campaign.name)) console.log('  [' + (x.campaign.status===2?'ENABLED':x.campaign.status===3?'PAUSED':x.campaign.status) + '] ' + x.campaign.name);
  console.log('\n-- REMOVED (deleted) --');
  for (const x of removed) if (rel.test(x.campaign.name)) console.log('  [REMOVED] ' + x.campaign.name);

  // 2. Change history last 28d — removals + status changes on JL-related campaigns
  console.log('\n=== CHANGE HISTORY (last 25d) — campaign status/removals ===');
  const start = new Date(Date.now()-25*86400000).toISOString().slice(0,10);
  const today = new Date().toISOString().slice(0,10);
  const ch = await customer.query(`SELECT change_event.change_date_time, change_event.changed_fields, change_event.old_resource, change_event.new_resource, change_event.user_email, campaign.name FROM change_event WHERE change_event.change_date_time >= "${start}" AND change_event.change_date_time <= "${today}" ORDER BY change_event.change_date_time DESC LIMIT 500`);
  let shown = 0;
  for (const x of ch) {
    const f = JSON.stringify(x.changeEvent.changedFields||{});
    if (!/status/i.test(f)) continue;
    const nw = JSON.stringify(x.changeEvent.newResource||{});
    if (nw.includes('sitelink')||nw.includes('text_asset')) continue;
    const nm = x.campaign && x.campaign.name ? x.campaign.name : '(non-campaign)';
    const oldS = JSON.stringify(x.changeEvent.oldResource||{});
    console.log('  ' + x.changeEvent.changeDateTime.slice(0,16) + ' | ' + nm + ' | old=' + oldS.slice(0,60) + ' new=' + nw.slice(0,60));
    if (++shown > 40) break;
  }
})().catch(e => console.error('ERR', e.message));
