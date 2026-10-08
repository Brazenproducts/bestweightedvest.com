const { GoogleAdsApi } = require('google-ads-api');
const fs = require('fs');

const creds = JSON.parse(fs.readFileSync('/home/ubuntu/.openclaw/workspace/.google-ads-credentials.json','utf8'));

const client = new GoogleAdsApi({
  client_id: creds.client_id,
  client_secret: creds.client_secret,
  developer_token: creds.developer_token,
});

const customer = client.Customer({
  customer_id: '1770651698',
  refresh_token: creds.refresh_token,
  // NO login_customer_id per instructions
});

function dateStr(d){ return d.toISOString().slice(0,10); }

(async () => {
  try {
    // Last 7 days per enabled campaign
    const q7 = `
      SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type,
             metrics.cost_micros, metrics.conversions, metrics.conversions_value
      FROM campaign
      WHERE segments.date DURING LAST_7_DAYS
        AND campaign.status = 'ENABLED'
      ORDER BY metrics.cost_micros DESC
    `;
    const rows7 = await customer.query(q7);

    const campaigns = {};
    for (const r of rows7) {
      const id = r.campaign.id;
      if(!campaigns[id]) campaigns[id] = {
        name: r.campaign.name, type: r.campaign.advertising_channel_type,
        cost: 0, conv: 0, value: 0
      };
      campaigns[id].cost += (Number(r.metrics.cost_micros)||0)/1e6;
      campaigns[id].conv += Number(r.metrics.conversions)||0;
      campaigns[id].value += Number(r.metrics.conversions_value)||0;
    }

    console.log('=== GOOGLE ADS: LAST 7 DAYS PER ENABLED CAMPAIGN ===');
    let totalCost=0, totalVal=0, totalConv=0;
    for (const id in campaigns) {
      const c = campaigns[id];
      totalCost+=c.cost; totalVal+=c.value; totalConv+=c.conv;
      const roas = c.cost>0 ? c.value/c.cost : 0;
      const bleeder = (c.cost>30 && roas<1.5) ? ' <<BLEEDER>>' : '';
      console.log(`${c.name} [${c.type}] | spend $${c.cost.toFixed(2)} | conv ${c.conv.toFixed(1)} | value $${c.value.toFixed(2)} | ROAS ${roas.toFixed(2)}x${bleeder}`);
    }
    console.log(`\nTOTAL 7d: spend $${totalCost.toFixed(2)} | conv ${totalConv.toFixed(1)} | value $${totalVal.toFixed(2)} | ROAS ${totalCost>0?(totalVal/totalCost).toFixed(2):0}x`);

    // Weekly trend - last 3 weeks per campaign (by week)
    console.log('\n=== WEEKLY TREND (last 3 weeks) ===');
    const today = new Date('2026-10-08T15:00:00Z');
    const weeks = [];
    for(let w=0; w<3; w++){
      const end = new Date(today); end.setUTCDate(end.getUTCDate() - (w*7) - 1);
      const start = new Date(end); start.setUTCDate(start.getUTCDate()-6);
      weeks.push({label:`${dateStr(start)}..${dateStr(end)}`, start:dateStr(start), end:dateStr(end)});
    }
    const trend = {};
    for(let wi=0; wi<weeks.length; wi++){
      const wk = weeks[wi];
      const qw = `
        SELECT campaign.name, metrics.cost_micros, metrics.conversions_value
        FROM campaign
        WHERE segments.date BETWEEN '${wk.start}' AND '${wk.end}'
          AND campaign.status = 'ENABLED'
      `;
      const rw = await customer.query(qw);
      for(const r of rw){
        const n = r.campaign.name;
        if(!trend[n]) trend[n] = [ {c:0,v:0},{c:0,v:0},{c:0,v:0} ];
        trend[n][wi].c += (Number(r.metrics.cost_micros)||0)/1e6;
        trend[n][wi].v += Number(r.metrics.conversions_value)||0;
      }
    }
    console.log('(week0 = most recent 7d)');
    for(const n in trend){
      const t = trend[n];
      const roas = t.map(x => x.c>0 ? (x.v/x.c) : 0);
      const collapse = (roas[2]>2 && roas[0]<0.5) ? ' <<COLLAPSE>>' : '';
      console.log(`${n}: ROAS wk0 ${roas[0].toFixed(1)}x <- wk1 ${roas[1].toFixed(1)}x <- wk2 ${roas[2].toFixed(1)}x${collapse}`);
    }

    // PMax asset groups + audience signals
    console.log('\n=== PMAX ASSET GROUPS / AUDIENCE SIGNALS ===');
    try {
      const qag = `
        SELECT campaign.name, asset_group.id, asset_group.name, asset_group.status
        FROM asset_group
        WHERE asset_group.status != 'REMOVED'
      `;
      const rag = await customer.query(qag);
      const agIds = [];
      for(const r of rag){
        console.log(`PMax AG: ${r.campaign.name} / ${r.asset_group.name} [${r.asset_group.status}] id=${r.asset_group.id}`);
        agIds.push(r.asset_group.id);
      }
      // Check audience signals per asset group
      if(agIds.length){
        const qsig = `
          SELECT asset_group.id, asset_group.name, asset_group_signal.signal
          FROM asset_group_signal
        `;
        const rsig = await customer.query(qsig);
        const hasSignal = {};
        for(const r of rsig){ hasSignal[r.asset_group.id] = true; }
        console.log('\n-- Audience Signal Check --');
        for(const r of rag){
          const ok = hasSignal[r.asset_group.id];
          console.log(`${r.asset_group.name}: ${ok ? 'HAS SIGNAL' : 'NO SIGNAL <<BLIND>>'}`);
        }
      } else {
        console.log('No PMax asset groups found.');
      }
    } catch(e){ console.log('PMax asset group query error:', e.message); }

    // Conversion recency - last conversion date
    console.log('\n=== CONVERSION TRACKING RECENCY ===');
    try {
      const qconv = `
        SELECT segments.date, metrics.conversions
        FROM customer
        WHERE segments.date DURING LAST_14_DAYS
        ORDER BY segments.date DESC
      `;
      const rconv = await customer.query(qconv);
      let lastConvDate = null;
      for(const r of rconv){
        if((Number(r.metrics.conversions)||0) > 0 && !lastConvDate){
          lastConvDate = r.segments.date;
        }
      }
      console.log('Last date with recorded conversions:', lastConvDate || 'NONE in 14d');
      if(lastConvDate){
        const diff = Math.floor((today - new Date(lastConvDate+'T00:00:00Z'))/86400000);
        console.log('Days stale:', diff, diff>2 ? '<<STALE>>' : '(ok)');
      }
    } catch(e){ console.log('Conversion recency error:', e.message); }

  } catch (err) {
    console.error('ERROR:', err.message);
    if(err.errors) console.error(JSON.stringify(err.errors,null,2));
  }
})();
