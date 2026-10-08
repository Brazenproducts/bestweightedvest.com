const fs=require('fs');
// load SHOPIFY_TOKEN_BARTACT from .env
const env=fs.readFileSync('/home/ubuntu/.openclaw/workspace/.env','utf8');
const m=env.match(/^SHOPIFY_TOKEN_BARTACT=(.+)$/m);
if(!m){ console.error('No SHOPIFY_TOKEN_BARTACT'); process.exit(1); }
const TOKEN=m[1].trim();
const STORE='bartact.myshopify.com';
const API='2024-10';

// last 7 days window ending now (2026-10-06 15:00 UTC)
const now=new Date('2026-10-06T15:00:00Z');
const since=new Date(now.getTime()-7*24*3600*1000);
const createdMin=since.toISOString();

function matchGclid(o){
  const ls=(o.landing_site||'')+' '+(o.referring_site||'');
  const na=(o.note_attributes||[]).map(a=>`${a.name}=${a.value}`).join(' ');
  const blob=(ls+' '+na).toLowerCase();
  const hasGclid = blob.includes('gclid=');
  const hasUtm = (blob.includes('utm_source=google') && blob.includes('utm_medium=cpc'));
  return hasGclid || hasUtm;
}

(async()=>{
  let url=`https://${STORE}/admin/api/${API}/orders.json?status=any&created_at_min=${encodeURIComponent(createdMin)}&limit=250&fields=id,name,created_at,total_price,current_total_price,financial_status,landing_site,referring_site,note_attributes,source_name,cancelled_at`;
  let all=[];
  let page=0;
  while(url && page<20){
    const res=await fetch(url,{headers:{'X-Shopify-Access-Token':TOKEN,'Content-Type':'application/json'}});
    if(!res.ok){ console.error('HTTP',res.status,await res.text()); process.exit(1); }
    const data=await res.json();
    all=all.concat(data.orders||[]);
    const link=res.headers.get('link')||'';
    const nm=link.match(/<([^>]+)>;\s*rel="next"/);
    url=nm?nm[1]:null;
    page++;
  }
  // exclude cancelled
  const valid=all.filter(o=>!o.cancelled_at);
  const gclidOrders=valid.filter(matchGclid);
  const sum=arr=>arr.reduce((s,o)=>s+parseFloat(o.current_total_price||o.total_price||0),0);
  const totalRev=sum(valid);
  const gclidRev=sum(gclidOrders);
  console.log(JSON.stringify({
    window:{since:createdMin,until:now.toISOString()},
    totalOrders:valid.length,
    totalRevenueAllSources:+totalRev.toFixed(2),
    gclidOrders:gclidOrders.length,
    gclidRevenue:+gclidRev.toFixed(2),
    sampleGclid:gclidOrders.slice(0,5).map(o=>({name:o.name,total:o.current_total_price||o.total_price,source:o.source_name,landing:(o.landing_site||'').slice(0,120)}))
  },null,2));
})().catch(e=>{console.error('FATAL',e.message);process.exit(1);});
