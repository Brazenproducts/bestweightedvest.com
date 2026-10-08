const fs=require('fs');
const C=JSON.parse(fs.readFileSync('/home/ubuntu/.openclaw/workspace/.google-ads-credentials.json'));
const { GoogleAdsApi } = require('google-ads-api');
const client=new GoogleAdsApi({client_id:C.client_id,client_secret:C.client_secret,developer_token:C.developer_token});
const customer=client.Customer({customer_id:'1770651698',refresh_token:C.refresh_token});
const q=async s=>{try{return await customer.query(s);}catch(e){console.log('QERR',e.errors?JSON.stringify(e.errors).slice(0,150):e.message);return[];}};
(async()=>{
  // Pull 30d ROAS per enabled PMax to decide target per campaign (data-driven, not blanket)
  const perf=await q(`SELECT campaign.name,campaign.resource_name,metrics.cost_micros,metrics.conversions_value FROM campaign WHERE campaign.status='ENABLED' AND campaign.advertising_channel_type='PERFORMANCE_MAX' AND segments.date DURING LAST_30_DAYS`);
  const agg={};perf.forEach(r=>{const n=r.campaign.name;agg[n]=agg[n]||{res:r.campaign.resource_name,sp:0,val:0};agg[n].sp+=Number(r.metrics.cost_micros||0)/1e6;agg[n].val+=Number(r.metrics.conversions_value||0);});
  const ops=[];
  console.log('=== Per-campaign target decision (based on 30d actual ROAS) ===');
  Object.entries(agg).forEach(([n,a])=>{
    const roas=a.sp>0?a.val/a.sp:0;
    // set target just above proven performance to push profit without choking:
    // proven >=4x -> target 5.0 ; 3-4x -> 4.5 ; 2-3x -> 4.0 ; <2x -> 4.0 (floor, needs refinement)
    let tgt;
    if(roas>=4) tgt=5.0; else if(roas>=3) tgt=4.5; else tgt=4.0;
    ops.push({resource_name:a.res,maximize_conversion_value:{target_roas:tgt}});
    console.log(`  ${n}: 30d ${roas.toFixed(2)}x → target ${tgt.toFixed(1)}x`);
  });
  if(ops.length){try{await customer.campaigns.update(ops);console.log(`\n✅ Updated ${ops.length} PMax targets (data-driven, 400-500%)`);}catch(e){console.log('ERR',e.errors?JSON.stringify(e.errors).slice(0,250):e.message);}}
  const after=await q(`SELECT campaign.name,campaign.maximize_conversion_value.target_roas FROM campaign WHERE campaign.status='ENABLED' AND campaign.advertising_channel_type='PERFORMANCE_MAX'`);
  console.log('\n=== AFTER ===');after.forEach(r=>console.log(`  tROAS ${r.campaign.maximize_conversion_value?.target_roas||'-'} | ${r.campaign.name}`));
})();
