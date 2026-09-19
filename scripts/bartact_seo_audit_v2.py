#!/usr/bin/env python3
"""Bartact SEO Audit v2 - READ ONLY - Faster with GraphQL"""

import json, os, re, time, datetime, sys, requests
from urllib.parse import quote

SHOPIFY_TOKEN = "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"
SHOPIFY_STORE = "bartact.myshopify.com"
GCP_SA_FILE = "/home/ubuntu/.openclaw/workspace/.gcp-service-account.json"
GSC_PROPERTY = "https://www.bartact.com/"

def p(msg):
    print(msg, flush=True)

# ─── JWT / GSC auth ─────────────────────────────────────────────────────────
def get_gsc_token():
    import base64
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import padding
    with open(GCP_SA_FILE) as f:
        sa = json.load(f)
    now = int(time.time())
    def b64(d): return base64.urlsafe_b64encode(d).rstrip(b'=').decode()
    hdr = b64(json.dumps({"alg":"RS256","typ":"JWT"}).encode())
    pay = b64(json.dumps({"iss":sa["client_email"],"scope":"https://www.googleapis.com/auth/webmasters.readonly","aud":sa["token_uri"],"exp":now+3600,"iat":now}).encode())
    pk = serialization.load_pem_private_key(sa["private_key"].encode(), password=None)
    sig = pk.sign(f"{hdr}.{pay}".encode(), padding.PKCS1v15(), hashes.SHA256())
    jwt = f"{hdr}.{pay}.{b64(sig)}"
    r = requests.post(sa["token_uri"], data={"grant_type":"urn:ietf:params:oauth:grant-type:jwt-bearer","assertion":jwt})
    r.raise_for_status()
    return r.json()["access_token"]

def get_gsc_data(token):
    end = (datetime.date.today() - datetime.timedelta(days=3)).isoformat()
    start = (datetime.date.today() - datetime.timedelta(days=17)).isoformat()
    prop_enc = quote(GSC_PROPERTY, safe='')
    url = f"https://www.googleapis.com/webmasters/v3/sites/{prop_enc}/searchAnalytics/query"
    r = requests.post(url,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"startDate":start,"endDate":end,"dimensions":["query","page"],"rowLimit":50})
    r.raise_for_status()
    rows = r.json().get("rows", [])
    return [{
        "keyword": row["keys"][0],
        "page": row["keys"][1],
        "clicks": row.get("clicks", 0),
        "impressions": row.get("impressions", 0),
        "ctr": round(row.get("ctr", 0)*100, 2),
        "position": round(row.get("position", 0), 1),
    } for row in rows if len(row.get("keys",[])) >= 2]

# ─── Page fetch & parse ──────────────────────────────────────────────────────
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; SEOBot/1.0)"}

def fetch_page(url):
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        return r.text if r.status_code == 200 else None
    except Exception as e:
        return None

def parse_page(html, url=""):
    title_m = re.search(r'<title[^>]*>(.*?)</title>', html, re.I|re.S)
    title = re.sub(r'<[^>]+>', '', title_m.group(1)).strip() if title_m else ""

    meta_m = re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']{0,300})["\']', html, re.I)
    if not meta_m:
        meta_m = re.search(r'<meta[^>]+content=["\']([^"\']{0,300})["\'][^>]+name=["\']description["\']', html, re.I)
    meta_desc = meta_m.group(1).strip() if meta_m else ""

    h1s = [re.sub(r'<[^>]+>', '', h).strip() for h in re.findall(r'<h1[^>]*>(.*?)</h1>', html, re.I|re.S)]

    # Body word count (strip tags, scripts, styles)
    body = re.sub(r'<(script|style|noscript)[^>]*>.*?</\1>', ' ', html, flags=re.I|re.S)
    body = re.sub(r'<[^>]+>', ' ', body)
    words = body.split()
    word_count = len(words)

    imgs = re.findall(r'<img([^>]+)>', html, re.I)
    img_total = len(imgs)
    no_alt = sum(1 for img in imgs if not re.search(r'alt=["\'][^"\']+["\']', img))

    # JKU/JLU check
    jku_jlu_ok = check_jeep_order(title)

    return {
        "title": title,
        "title_len": len(title),
        "meta_desc": meta_desc,
        "meta_desc_len": len(meta_desc),
        "h1s": h1s[:3],
        "word_count": word_count,
        "img_total": img_total,
        "img_no_alt": no_alt,
        "jku_jlu_check": jku_jlu_ok,
    }

def check_jeep_order(title):
    t = title.upper()
    # Standalone JK/JL (not part of JKU/JLU)
    jku_pos = t.find("JKU"); jlu_pos = t.find("JLU")
    # Find standalone JK: "JK" not followed by "U"
    jk_matches = [m.start() for m in re.finditer(r'JK(?!U)', t)]
    jl_matches = [m.start() for m in re.finditer(r'JL(?!U)', t)]
    issues = []
    if jku_pos >= 0 and jk_matches:
        if any(pos < jku_pos for pos in jk_matches):
            issues.append("JK before JKU")
    if jlu_pos >= 0 and jl_matches:
        if any(pos < jlu_pos for pos in jl_matches):
            issues.append("JL before JLU")
    if issues:
        return f"FAIL: {', '.join(issues)}"
    if jku_pos >= 0 or jlu_pos >= 0:
        return "OK"
    return "N/A"

# ─── Shopify GraphQL ─────────────────────────────────────────────────────────
def shopify_graphql(query, variables=None):
    url = f"https://{SHOPIFY_STORE}/admin/api/2024-04/graphql.json"
    r = requests.post(url,
        headers={"X-Shopify-Access-Token": SHOPIFY_TOKEN, "Content-Type": "application/json"},
        json={"query": query, "variables": variables or {}})
    r.raise_for_status()
    data = r.json()
    if "errors" in data:
        raise Exception(f"GraphQL errors: {data['errors']}")
    return data["data"]

PRODUCT_QUERY = """
query getProducts($cursor: String) {
  products(first: 100, after: $cursor) {
    pageInfo { hasNextPage endCursor }
    edges {
      node {
        id title handle
        titleTag: metafield(namespace: "global", key: "title_tag") { value }
        descTag: metafield(namespace: "global", key: "description_tag") { value }
      }
    }
  }
}
"""

COLLECTION_QUERY = """
query getCollections($cursor: String) {
  collections(first: 100, after: $cursor) {
    pageInfo { hasNextPage endCursor }
    edges {
      node {
        id title handle descriptionHtml
        titleTag: metafield(namespace: "global", key: "title_tag") { value }
        descTag: metafield(namespace: "global", key: "description_tag") { value }
      }
    }
  }
}
"""

def get_all_products_gql():
    products = []
    cursor = None
    while True:
        data = shopify_graphql(PRODUCT_QUERY, {"cursor": cursor})
        edges = data["products"]["edges"]
        for e in edges:
            n = e["node"]
            products.append({
                "id": n["id"],
                "title": n["title"],
                "handle": n["handle"],
                "title_tag": n["titleTag"]["value"] if n["titleTag"] else "",
                "desc_tag": n["descTag"]["value"] if n["descTag"] else "",
            })
        pi = data["products"]["pageInfo"]
        if not pi["hasNextPage"]:
            break
        cursor = pi["endCursor"]
        time.sleep(0.5)
    return products

def get_all_collections_gql():
    cols = []
    cursor = None
    while True:
        data = shopify_graphql(COLLECTION_QUERY, {"cursor": cursor})
        edges = data["collections"]["edges"]
        for e in edges:
            n = e["node"]
            body_html = n.get("descriptionHtml", "") or ""
            body_text = re.sub(r'<[^>]+>', ' ', body_html)
            word_count = len(body_text.split())
            cols.append({
                "id": n["id"],
                "title": n["title"],
                "handle": n["handle"],
                "title_tag": n["titleTag"]["value"] if n["titleTag"] else "",
                "desc_tag": n["descTag"]["value"] if n["descTag"] else "",
                "word_count": word_count,
            })
        pi = data["collections"]["pageInfo"]
        if not pi["hasNextPage"]:
            break
        cursor = pi["endCursor"]
        time.sleep(0.5)
    return cols

# ─── Bing/Yandex ─────────────────────────────────────────────────────────────
def check_bing(keyword):
    url = f"https://www.bing.com/search?q={quote(keyword)}&count=30"
    html = fetch_page(url)
    if not html:
        return "fetch_failed"
    cites = re.findall(r'<cite[^>]*>(.*?)</cite>', html, re.I|re.S)
    for i, cite in enumerate(cites[:20], 1):
        clean = re.sub(r'<[^>]+>', '', cite).strip().lower()
        if "bartact" in clean:
            return f"~#{i}"
    if "bartact" in html.lower():
        return "found_beyond_top_20"
    return "not_found"

def check_yandex(keyword):
    url = f"https://yandex.com/search/?text={quote(keyword)}&lr=10393"
    html = fetch_page(url)
    if not html:
        return "fetch_failed"
    if "bartact" in html.lower():
        return "found_in_results"
    return "not_found"

# ─── MAIN ─────────────────────────────────────────────────────────────────────
def main():
    p("="*60)
    p("BARTACT SEO AUDIT v2 - READ ONLY")
    p(f"Started: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}")
    p("="*60)

    audit = {}

    # 1. GSC
    p("\n[1/5] GSC keywords...")
    try:
        token = get_gsc_token()
        p("  Auth OK")
        gsc = get_gsc_data(token)
        p(f"  Got {len(gsc)} keywords")
        audit["gsc"] = gsc
    except Exception as e:
        p(f"  ERROR: {e}")
        audit["gsc"] = []

    # 2. Page audits
    p("\n[2/5] Page audits...")
    gsc = audit.get("gsc", [])
    # Collect unique pages
    page_kw_map = {}
    for row in gsc:
        pg = row["page"]
        if pg not in page_kw_map:
            page_kw_map[pg] = []
        page_kw_map[pg].append(row["keyword"])

    page_audits = {}
    for i, (url, kws) in enumerate(list(page_kw_map.items())[:25]):
        p(f"  [{i+1}/{min(25,len(page_kw_map))}] {url[:70]}")
        html = fetch_page(url)
        if html:
            parsed = parse_page(html, url)
            parsed["url"] = url
            parsed["keywords"] = kws[:5]
            page_audits[url] = parsed
        else:
            page_audits[url] = {"url": url, "error": "fetch_failed", "keywords": kws}
        time.sleep(0.5)

    audit["page_audits"] = page_audits
    p(f"  Audited {len(page_audits)} pages")

    # 3. Shopify
    p("\n[3/5] Shopify products (GraphQL)...")
    try:
        products = get_all_products_gql()
        p(f"  Got {len(products)} products")
        prod_issues = []
        for p_item in products:
            tt = p_item["title_tag"]
            dt = p_item["desc_tag"]
            issues = []
            if not tt: issues.append("missing_title_tag")
            elif len(tt) > 60: issues.append(f"title_too_long({len(tt)})")
            if not dt: issues.append("missing_desc_tag")
            elif len(dt) > 160: issues.append(f"desc_too_long({len(dt)})")
            if issues:
                prod_issues.append({**p_item, "issues": issues})
        audit["product_issues"] = prod_issues
        p(f"  Products with issues: {len(prod_issues)}/{len(products)}")
    except Exception as e:
        p(f"  ERROR: {e}")
        audit["product_issues"] = []
        products = []

    p("\n[3b/5] Shopify collections...")
    try:
        cols = get_all_collections_gql()
        p(f"  Got {len(cols)} collections")
        col_issues = []
        for c in cols:
            issues = []
            tt = c["title_tag"]
            dt = c["desc_tag"]
            wc = c["word_count"]
            if not tt: issues.append("missing_meta_title")
            elif len(tt) > 60: issues.append(f"meta_title_too_long({len(tt)})")
            if not dt: issues.append("missing_meta_desc")
            elif len(dt) > 160: issues.append(f"meta_desc_too_long({len(dt)})")
            if wc < 200: issues.append(f"thin_content({wc}w)")
            if issues:
                col_issues.append({**c, "issues": issues})
        audit["collection_issues"] = col_issues
        p(f"  Collections with issues: {len(col_issues)}/{len(cols)}")
    except Exception as e:
        p(f"  ERROR: {e}")
        audit["collection_issues"] = []
        cols = []

    # 4. Bing
    p("\n[4/5] Bing rankings...")
    bing_results = []
    for row in gsc[:10]:
        kw = row["keyword"]
        pos = check_bing(kw)
        p(f"  '{kw[:40]}' → Bing: {pos}")
        bing_results.append({"keyword": kw, "bing_position": pos})
        time.sleep(1.5)
    audit["bing"] = bing_results

    # 5. Yandex
    p("\n[5/5] Yandex rankings...")
    yandex_results = []
    for row in gsc[:5]:
        kw = row["keyword"]
        pos = check_yandex(kw)
        p(f"  '{kw[:40]}' → Yandex: {pos}")
        yandex_results.append({"keyword": kw, "yandex_position": pos})
        time.sleep(1.5)
    audit["yandex"] = yandex_results

    # Save JSON
    out = "/home/ubuntu/.openclaw/workspace/memory/seo-audit-raw-2026-09-07.json"
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w") as f:
        json.dump(audit, f, indent=2, default=str)
    p(f"\n✓ Raw data saved: {out}")
    return audit

if __name__ == "__main__":
    result = main()
    p("\nAUDIT COMPLETE")
