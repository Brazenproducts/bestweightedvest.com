const { GoogleAdsApi } = require('google-ads-api');
const fs = require('fs');
const creds = JSON.parse(fs.readFileSync('/home/ubuntu/.openclaw/workspace/.google-ads-credentials.json','utf8'));
const client = new GoogleAdsApi({ client_id: creds.client_id, client_secret: creds.client_secret, developer_token: creds.developer_token });
const customer = client.Customer({ customer_id: '1770651698', refresh_token: creds.refresh_token });

(async () => {
  // Only ENABLED asset groups matter (the ones actively spending). Map to campaigns.
  const qag = `
    SELECT campaign.name, campaign.status, asset_group.id, asset_group.name, asset_group.status
    FROM asset_group
    WHERE asset_group.status = 'ENABLED' AND campaign.status = 'ENABLED'
  `;
  const rag = await customer.query(qag);
  const ags = rag.map(r => ({ camp:r.campaign.name, id:r.asset_group.id, name:r.asset_group.name }));

  // Query signals - need asset_group in WHERE or just select all
  const qsig = `SELECT asset_group.id, asset_group_signal.resource_name FROM asset_group_signal`;
  const hasSignal = {};
  try {
    const rsig = await customer.query(qsig);
    for(const r of rsig){ hasSignal[r.asset_group.id] = (hasSignal[r.asset_group.id]||0)+1; }
  } catch(e){ console.log('signal query err:', e.message); }

  console.log('=== AUDIENCE SIGNAL CHECK (ENABLED asset groups in ENABLED campaigns) ===');
  for(const a of ags){
    const n = hasSignal[a.id]||0;
    console.log(`${a.camp} / ${a.name}: ${n>0 ? n+' signal(s)' : 'NO SIGNAL <<BLIND>>'}`);
  }
})().catch(e=>{ console.error('ERR', e.message); if(e.errors) console.error(JSON.stringify(e.errors,null,2)); });
