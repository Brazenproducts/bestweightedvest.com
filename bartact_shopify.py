import json, urllib.request, urllib.parse, datetime, re, os

# Load token
tok=None
for line in open('/home/ubuntu/.openclaw/workspace/.env'):
    m=re.match(r'\s*SHOPIFY_TOKEN_BARTACT\s*=\s*(.+)\s*$', line)
    if m: tok=m.group(1).strip().strip('"').strip("'")
SHOP='bartact.myshopify.com'
API='2024-10'

# Last 7 days (reference 2026-10-07 15:00 UTC)
now=datetime.datetime(2026,10,7,15,0,0,tzinfo=datetime.timezone.utc)
since=(now-datetime.timedelta(days=7)).isoformat()

def fetch(url):
    req=urllib.request.Request(url, headers={'X-Shopify-Access-Token':tok,'Content-Type':'application/json'})
    r=urllib.request.urlopen(req, timeout=60)
    return r, r.read()

base=f'https://{SHOP}/admin/api/{API}/orders.json'
params={'status':'any','created_at_min':since,'limit':250,
        'fields':'id,created_at,total_price,note_attributes,landing_site,referring_site,source_name,financial_status'}
url=base+'?'+urllib.parse.urlencode(params)

all_orders=[]
pages=0
while url and pages<20:
    r,body=fetch(url)
    data=json.loads(body)
    all_orders.extend(data.get('orders',[]))
    pages+=1
    # pagination via Link header
    link=r.headers.get('Link','')
    nxt=None
    for part in link.split(','):
        if 'rel="next"' in part:
            nxt=part[part.find('<')+1:part.find('>')]
    url=nxt

def is_gads(o):
    # check landing_site and note_attributes for gclid, or utm_source=google & utm_medium=cpc
    ls=(o.get('landing_site') or '').lower()
    ref=(o.get('referring_site') or '').lower()
    blob=ls
    for na in (o.get('note_attributes') or []):
        blob+=' '+str(na.get('name','')).lower()+'='+str(na.get('value','')).lower()
    if 'gclid=' in blob: return True
    has_src = 'utm_source=google' in blob
    has_med = 'utm_medium=cpc' in blob
    if has_src and has_med: return True
    return False

gads=[o for o in all_orders if is_gads(o)]
total_all=sum(float(o.get('total_price') or 0) for o in all_orders)
total_gads=sum(float(o.get('total_price') or 0) for o in gads)

# financial status filter - count paid/authorized
paid_gads=[o for o in gads if o.get('financial_status') in ('paid','partially_paid','authorized',None)]
total_gads_paid=sum(float(o.get('total_price') or 0) for o in paid_gads)

print(json.dumps({
  'total_orders':len(all_orders),
  'total_revenue_all':round(total_all,2),
  'gads_orders':len(gads),
  'gads_revenue':round(total_gads,2),
  'gads_revenue_paid':round(total_gads_paid,2),
  'pages':pages,
  'sample_gads':[{'id':o['id'],'total':o['total_price'],'landing':(o.get('landing_site') or '')[:80]} for o in gads[:5]]
}, indent=2))
