const d = require('./gads_out.json');

// Per-campaign ROAS + bleeder flags
let totSpend=0, totConv=0, totVal=0;
const rows = d.campaigns7d.map(c=>{
  const roas = c.spend>0 ? c.conv_value/c.spend : 0;
  totSpend+=c.spend; totConv+=c.conv; totVal+=c.conv_value;
  const bleeder = c.spend>30 && roas<1.5;
  return {name:c.name, spend:+c.spend.toFixed(2), conv:+c.conv.toFixed(1), val:+c.conv_value.toFixed(2), roas:+roas.toFixed(2), bleeder, channel:c.channel};
});
rows.sort((a,b)=>b.spend-a.spend);
console.log('=== PER CAMPAIGN (7d) ===');
rows.forEach(r=>{
  console.log(`${r.bleeder?'🔴BLEEDER':'       '} $${r.spend.toFixed(2).padStart(8)} | ${r.conv.toString().padStart(5)}c | $${r.val.toFixed(0).padStart(6)} | ${r.roas}x | ${r.name}`);
});

console.log('\n=== ACCOUNT TOTALS (7d) ===');
const acctRoas = totVal/totSpend;
console.log(`Spend: $${totSpend.toFixed(2)} | Conv: ${totConv.toFixed(1)} | Value: $${totVal.toFixed(2)} | ROAS: ${acctRoas.toFixed(2)}x`);

// Prev week comparison
const p = d.prevWeek[0];
const prevRoas = p.conv_value/p.spend;
console.log('\n=== PREV 7d (days 8-14) ===');
console.log(`Spend: $${p.spend.toFixed(2)} | Value: $${p.conv_value.toFixed(2)} | ROAS: ${prevRoas.toFixed(2)}x`);
console.log(`RECOVERY: ROAS ${acctRoas.toFixed(2)}x vs ${prevRoas.toFixed(2)}x = ${acctRoas>prevRoas?'BETTER ↑':'WORSE ↓'} (${((acctRoas-prevRoas)/prevRoas*100).toFixed(0)}%)`);

// Weekly trend collapse detection
console.log('\n=== WEEKLY TREND (collapse check) ===');
const byCamp = {};
d.weekly.forEach(w=>{
  if(!byCamp[w.name]) byCamp[w.name]={};
  if(!byCamp[w.name][w.week]) byCamp[w.name][w.week]={spend:0,val:0};
  byCamp[w.name][w.week].spend+=w.spend;
  byCamp[w.name][w.week].val+=w.conv_value;
});
Object.entries(byCamp).forEach(([name,weeks])=>{
  const ws = Object.keys(weeks).sort();
  const series = ws.map(wk=>{
    const r = weeks[wk].spend>0? weeks[wk].val/weeks[wk].spend:0;
    return {wk, roas:+r.toFixed(2), spend:+weeks[wk].spend.toFixed(0)};
  });
  // collapse: 3+ weeks, roas trending to near 0
  if(series.length>=3){
    const last3 = series.slice(-3);
    const collapse = last3[0].roas>=1.5 && last3[last3.length-1].roas<0.5 && last3[last3.length-1].spend>30;
    if(collapse || last3.some(x=>x.roas<0.5 && x.spend>50)){
      console.log(`${collapse?'⚠️COLLAPSE':'  weak   '} ${name}: ${series.map(s=>s.wk+'='+s.roas+'x($'+s.spend+')').join('  ')}`);
    }
  }
});
