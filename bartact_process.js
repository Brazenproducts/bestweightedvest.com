const fs = require('fs');
const d = JSON.parse(fs.readFileSync('bartact_ads_raw.json','utf8'));

const CHAN = {2:'Search',3:'Display',4:'Shopping',6:'Video',10:'PMax',13:'Demand Gen'};

// 1) Campaigns last 7d
let totSpend=0, totConv=0, totVal=0;
const rows = d.campaigns.map(c => {
  const spend = c.metrics.cost_micros/1e6;
  const conv = c.metrics.conversions||0;
  const val = c.metrics.conversions_value||0;
  const roas = spend>0 ? val/spend : 0;
  totSpend+=spend; totConv+=conv; totVal+=val;
  const bleeder = spend>30 && roas<1.5;
  return {name:c.campaign.name, chan:CHAN[c.campaign.advertising_channel_type]||c.campaign.advertising_channel_type,
    spend:+spend.toFixed(2), conv:+conv.toFixed(1), val:+val.toFixed(2), roas:+roas.toFixed(2), bleeder};
});
rows.sort((a,b)=>b.spend-a.spend);

console.log('=== 7-DAY CAMPAIGN PERFORMANCE (ENABLED) ===');
rows.forEach(r=>{
  console.log(`${r.bleeder?'🩸':'  '} ${r.name} [${r.chan}] | $${r.spend} | conv ${r.conv} | val $${r.val} | ROAS ${r.roas}x${r.roas<3&&r.spend>10?' (UNDER breakeven)':''}`);
});
const acctRoas = totSpend>0 ? totVal/totSpend : 0;
console.log(`\nTOTALS: spend $${totSpend.toFixed(2)} | conv ${totConv.toFixed(1)} | val $${totVal.toFixed(2)} | Google ROAS ${acctRoas.toFixed(2)}x`);

const bleeders = rows.filter(r=>r.bleeder);
console.log(`\nBLEEDERS (>$30 & <1.5x): ${bleeders.length? bleeders.map(b=>`${b.name} ($${b.spend}, ${b.roas}x)`).join('; ') : 'NONE'}`);

// Weekly trend collapse detection (3 weeks)
console.log('\n=== WEEKLY TREND (per campaign, by week) ===');
const byCamp = {};
d.trend.forEach(t=>{
  const n=t.campaign.name;
  byCamp[n]=byCamp[n]||[];
  const spend=t.metrics.cost_micros/1e6;
  const val=t.metrics.conversions_value||0;
  byCamp[n].push({week:t.segments.week, spend:+spend.toFixed(2), roas: spend>0?+(val/spend).toFixed(2):0, val:+val.toFixed(2)});
});
const collapsing=[];
Object.entries(byCamp).forEach(([n,wks])=>{
  wks.sort((a,b)=>a.week<b.week?-1:1);
  if(wks.length>=3){
    const r = wks.map(w=>w.roas);
    // collapse: declining each week and last week far below first, with meaningful spend
    const declining = r[r.length-1] < r[0]*0.4 && wks[wks.length-1].spend>20 && r[0]>r[r.length-1];
    if(declining){
      collapsing.push(n);
      console.log(`⚠️ COLLAPSE: ${n} | ${wks.map(w=>`${w.week}:${w.roas}x($${w.spend})`).join(' → ')}`);
    }
  }
});
if(!collapsing.length) console.log('No 3-week collapse patterns detected.');

// Prev week comparison
let pS=0,pV=0;
(d.prevWeek||[]).forEach(c=>{pS+=c.metrics.cost_micros/1e6; pV+=c.metrics.conversions_value||0;});
const prevRoas = pS>0? pV/pS : 0;
console.log(`\n=== RECOVERY vs PRIOR WEEK (${d.prevRange.prevStart}..${d.prevRange.prevEnd}) ===`);
console.log(`Prior week: spend $${pS.toFixed(2)} | val $${pV.toFixed(2)} | ROAS ${prevRoas.toFixed(2)}x`);
console.log(`This week:  spend $${totSpend.toFixed(2)} | val $${totVal.toFixed(2)} | ROAS ${acctRoas.toFixed(2)}x`);
const dir = acctRoas>prevRoas ? 'BETTER ▲' : acctRoas<prevRoas ? 'WORSE ▼' : 'FLAT';
console.log(`Direction: ${dir} (${prevRoas.toFixed(2)}x → ${acctRoas.toFixed(2)}x)`);

// 4a) PMax asset group audience signals
console.log('\n=== PMAX AUDIENCE SIGNALS ===');
if(d.assetGroupError){ console.log('AG error:', d.assetGroupError); }
else {
  const ags = d.assetGroups||[];
  const sigs = d.assetGroupSignals||[];
  const sigByAg = {};
  sigs.forEach(s=>{ const id=s.asset_group.id; sigByAg[id]=(sigByAg[id]||0)+1; });
  const blind=[];
  ags.forEach(a=>{
    const id=a.asset_group.id;
    const has = sigByAg[id]>0;
    if(!has && a.asset_group.status===2) blind.push(`${a.campaign.name} / ${a.asset_group.name}`);
  });
  console.log(`Asset groups: ${ags.length}, with audience signal: ${Object.keys(sigByAg).length}`);
  console.log(blind.length? `🔴 BLIND (no audience signal): ${blind.join('; ')}` : '✅ All enabled PMax asset groups have audience signals.');
}

// 4b) Conversion recency
console.log('\n=== CONVERSION TRACKING RECENCY ===');
if(d.convError){ console.log('conv error:', d.convError); }
else {
  const ca=d.convActions||[];
  // find most recent date with conversions >0 for purchase-type actions
  let lastDate=null; const purchaseLike=[];
  ca.forEach(c=>{
    const conv=c.metrics.conversions||0;
    if(conv>0 && c.segments.date){
      if(!lastDate || c.segments.date>lastDate) lastDate=c.segments.date;
    }
  });
  console.log(`Most recent date with recorded conversions: ${lastDate||'NONE'}`);
  if(lastDate){
    const today=new Date('2026-10-03');
    const diff=Math.round((today-new Date(lastDate))/864e5);
    console.log(`Staleness: ${diff} day(s) ago. ${diff>2?'🔴 STALE (>2 days)':'✅ fresh'}`);
  }
}

// Save summary numbers for later
fs.writeFileSync('bartact_summary.json', JSON.stringify({
  totSpend:+totSpend.toFixed(2), totVal:+totVal.toFixed(2), acctRoas:+acctRoas.toFixed(2),
  prevRoas:+prevRoas.toFixed(2), dir, bleeders:bleeders.map(b=>({name:b.name,spend:b.spend,roas:b.roas})),
  collapsing
},null,2));
