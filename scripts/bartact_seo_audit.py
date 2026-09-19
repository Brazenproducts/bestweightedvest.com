#!/usr/bin/env python3
"""Bartact SEO Audit Script - READ ONLY"""

import json
import os
import re
import time
import datetime
import requests
from urllib.parse import urljoin, urlparse
from html.parser import HTMLParser

# ─── Credentials ────────────────────────────────────────────────────────────
SHOPIFY_TOKEN = "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"
SHOPIFY_STORE = "bartact.myshopify.com"
GCP_SA_FILE = "/home/ubuntu/.openclaw/workspace/.gcp-service-account.json"
GSC_PROPERTY = "https://www.bartact.com/"

# ─── HTML Parser helpers ─────────────────────────────────────────────────────
class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ""
        self.meta_description = ""
        self.h1_tags = []
        self.img_tags = []  # list of dicts with src, alt
        self.body_text_parts = []
        self._in_title = False
        self._in_body = False
        self._in_script = False
        self._in_style = False
        self._skip_tags = {"script", "style", "noscript", "head"}
        self._current_skip = []

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if tag == "title":
            self._in_title = True
        if tag == "meta":
            name = attrs_dict.get("name", "").lower()
            prop = attrs_dict.get("property", "").lower()
            if name == "description" or prop == "og:description":
                self.meta_description = attrs_dict.get("content", "")
        if tag == "h1":
            self._current_h1 = True
        if tag == "img":
            self.img_tags.append({
                "src": attrs_dict.get("src", ""),
                "alt": attrs_dict.get("alt", "")
            })
        if tag in self._skip_tags:
            self._current_skip.append(tag)

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        if tag in self._skip_tags:
            if self._current_skip and self._current_skip[-1] == tag:
                self._current_skip.pop()

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        elif not self._current_skip:
            stripped = data.strip()
            if stripped:
                self.body_text_parts.append(stripped)

    def get_body_word_count(self):
        full_text = " ".join(self.body_text_parts)
        words = full_text.split()
        return len(words)

    def get_h1_from_raw(self, html_content):
        """Extract H1 via regex since parser state is tricky for nested content"""
        h1_matches = re.findall(r'<h1[^>]*>(.*?)</h1>', html_content, re.IGNORECASE | re.DOTALL)
        return [re.sub(r'<[^>]+>', '', h).strip() for h in h1_matches]

def parse_page(html_content):
    parser = PageParser()
    parser.feed(html_content)
    h1s = parser.get_h1_from_raw(html_content)
    # Also try to get title via regex as fallback
    title_match = re.search(r'<title[^>]*>(.*?)</title>', html_content, re.IGNORECASE | re.DOTALL)
    title = re.sub(r'<[^>]+>', '', title_match.group(1)).strip() if title_match else parser.title.strip()
    # Meta description via regex
    meta_match = re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']*)["\']', html_content, re.IGNORECASE)
    if not meta_match:
        meta_match = re.search(r'<meta[^>]+content=["\']([^"\']*)["\'][^>]+name=["\']description["\']', html_content, re.IGNORECASE)
    meta_desc = meta_match.group(1).strip() if meta_match else parser.meta_description.strip()
    word_count = parser.get_body_word_count()
    images = parser.img_tags
    images_without_alt = [img for img in images if not img.get("alt", "").strip()]
    return {
        "title": title,
        "meta_description": meta_desc,
        "h1s": h1s,
        "word_count": word_count,
        "image_count": len(images),
        "images_without_alt": len(images_without_alt),
    }

# ─── Google Auth ─────────────────────────────────────────────────────────────
def get_gsc_token():
    import json
    import time
    import base64
    import hashlib
    import hmac

    with open(GCP_SA_FILE) as f:
        sa = json.load(f)

    # Build JWT
    now = int(time.time())
    header = base64.urlsafe_b64encode(json.dumps({"alg": "RS256", "typ": "JWT"}).encode()).rstrip(b'=').decode()
    payload = base64.urlsafe_b64encode(json.dumps({
        "iss": sa["client_email"],
        "scope": "https://www.googleapis.com/auth/webmasters.readonly",
        "aud": sa["token_uri"],
        "exp": now + 3600,
        "iat": now
    }).encode()).rstrip(b'=').decode()

    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import padding
    from cryptography.hazmat.backends import default_backend

    private_key = serialization.load_pem_private_key(
        sa["private_key"].encode(),
        password=None,
        backend=default_backend()
    )

    signing_input = f"{header}.{payload}".encode()
    signature = private_key.sign(signing_input, padding.PKCS1v15(), hashes.SHA256())
    sig_b64 = base64.urlsafe_b64encode(signature).rstrip(b'=').decode()
    jwt_token = f"{header}.{payload}.{sig_b64}"

    resp = requests.post(sa["token_uri"], data={
        "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
        "assertion": jwt_token
    })
    resp.raise_for_status()
    return resp.json()["access_token"]

def get_gsc_data(token):
    """Pull top 50 keywords from GSC (last 14 days, ending 3 days ago)"""
    end_date = (datetime.date.today() - datetime.timedelta(days=3)).isoformat()
    start_date = (datetime.date.today() - datetime.timedelta(days=17)).isoformat()

    url = f"https://www.googleapis.com/webmasters/v3/sites/{requests.utils.quote(GSC_PROPERTY, safe='')}/searchAnalytics/query"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    body = {
        "startDate": start_date,
        "endDate": end_date,
        "dimensions": ["query", "page"],
        "rowLimit": 50,
        "orderType": "impressions"  # note: field is different
    }
    # GSC API sorts by clicks desc by default; we can sort by impressions
    body2 = {
        "startDate": start_date,
        "endDate": end_date,
        "dimensions": ["query", "page"],
        "rowLimit": 50,
        "orderBy": [{"fieldName": "impressions", "sortOrder": "DESCENDING"}]
    }
    resp = requests.post(url, headers=headers, json=body2)
    if resp.status_code != 200:
        print(f"GSC error: {resp.status_code} {resp.text}")
        # Try without orderBy
        resp = requests.post(url, headers=headers, json={
            "startDate": start_date,
            "endDate": end_date,
            "dimensions": ["query", "page"],
            "rowLimit": 50,
        })
    resp.raise_for_status()
    data = resp.json()
    rows = data.get("rows", [])
    results = []
    for row in rows:
        keys = row.get("keys", [])
        results.append({
            "keyword": keys[0] if len(keys) > 0 else "",
            "page": keys[1] if len(keys) > 1 else "",
            "clicks": row.get("clicks", 0),
            "impressions": row.get("impressions", 0),
            "ctr": row.get("ctr", 0),
            "position": row.get("position", 0),
        })
    return results

# ─── Shopify API ─────────────────────────────────────────────────────────────
def shopify_get(endpoint, params=None):
    url = f"https://{SHOPIFY_STORE}/admin/api/2024-04/{endpoint}"
    headers = {"X-Shopify-Access-Token": SHOPIFY_TOKEN}
    resp = requests.get(url, headers=headers, params=params)
    resp.raise_for_status()
    return resp.json(), resp.headers

def get_all_products():
    products = []
    params = {"limit": 250, "fields": "id,title,handle,metafields"}
    while True:
        data, headers = shopify_get("products.json", params)
        batch = data.get("products", [])
        products.extend(batch)
        link = headers.get("Link", "")
        if 'rel="next"' not in link:
            break
        # Extract next page_info
        next_match = re.search(r'page_info=([^&>]+)[^>]*>;\s*rel="next"', link)
        if not next_match:
            break
        params = {"limit": 250, "fields": "id,title,handle", "page_info": next_match.group(1)}
        time.sleep(0.5)
    return products

def get_all_collections():
    collections = []
    for col_type in ["custom_collections", "smart_collections"]:
        params = {"limit": 250, "fields": "id,title,handle,body_html,metafields"}
        while True:
            data, headers = shopify_get(f"{col_type}.json", params)
            batch = data.get(col_type.replace("_collections", "_collections") if "_" in col_type else col_type, [])
            # Handle key name
            key = "custom_collections" if col_type == "custom_collections" else "smart_collections"
            batch = data.get(key, [])
            collections.extend(batch)
            link = headers.get("Link", "")
            if 'rel="next"' not in link:
                break
            next_match = re.search(r'page_info=([^&>]+)[^>]*>;\s*rel="next"', link)
            if not next_match:
                break
            params = {"limit": 250, "fields": "id,title,handle,body_html", "page_info": next_match.group(1)}
            time.sleep(0.5)
    return collections

def get_product_metafields(product_id):
    try:
        data, _ = shopify_get(f"products/{product_id}/metafields.json")
        return data.get("metafields", [])
    except:
        return []

def get_collection_metafields(collection_id):
    try:
        data, _ = shopify_get(f"collections/{collection_id}/metafields.json")
        return data.get("metafields", [])
    except:
        return []

# ─── Page Fetcher ─────────────────────────────────────────────────────────────
def fetch_page(url):
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (compatible; SEOAuditBot/1.0; +https://bartact.com)"
        }
        resp = requests.get(url, headers=headers, timeout=15)
        if resp.status_code == 200:
            return resp.text
        return None
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def check_jku_jlu_before_jk_jl(title):
    """Check if JKU/JLU appears before JK/JL in title"""
    title_upper = title.upper()
    # Find positions
    jku_pos = title_upper.find("JKU")
    jlu_pos = title_upper.find("JLU")
    jk_pos = title_upper.find("JK")
    jl_pos = title_upper.find("JL")

    has_jku = jku_pos >= 0
    has_jlu = jlu_pos >= 0
    has_jk = jk_pos >= 0 and (jku_pos < 0 or jk_pos != jku_pos)  # JK not part of JKU
    has_jl = jl_pos >= 0 and (jlu_pos < 0 or jl_pos != jlu_pos)  # JL not part of JLU

    if not (has_jku or has_jlu) and not (has_jk or has_jl):
        return "N/A - No Jeep model refs"
    if not (has_jk or has_jl):
        return "OK - Only JKU/JLU present"

    # Both present - check order
    issues = []
    if has_jku and has_jk:
        # Find JK that's not part of JKU
        jk_standalone = [m.start() for m in re.finditer(r'\bJK\b', title_upper) if abs(m.start() - jku_pos) > 1]
        if jk_standalone and jku_pos > min(jk_standalone):
            issues.append("JK appears before JKU")
    if has_jlu and has_jl:
        jl_standalone = [m.start() for m in re.finditer(r'\bJL\b', title_upper) if abs(m.start() - jlu_pos) > 1]
        if jl_standalone and jlu_pos > min(jl_standalone):
            issues.append("JL appears before JLU")

    if issues:
        return f"ISSUE: {', '.join(issues)}"
    return "OK"

# ─── Main Audit ──────────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("BARTACT SEO AUDIT - READ ONLY")
    print("=" * 60)
    audit = {
        "gsc_keywords": [],
        "page_audits": {},
        "shopify_products_issues": [],
        "shopify_collections_issues": [],
        "bing_rankings": [],
        "yandex_rankings": [],
    }

    # ── 1. GSC Keywords ──────────────────────────────────────────────────────
    print("\n[1/5] Pulling GSC keyword data...")
    try:
        token = get_gsc_token()
        gsc_rows = get_gsc_data(token)
        audit["gsc_keywords"] = gsc_rows
        print(f"  → Got {len(gsc_rows)} keywords from GSC")
    except Exception as e:
        print(f"  ✗ GSC error: {e}")
        gsc_rows = []

    # ── 2. Page Audits ───────────────────────────────────────────────────────
    print("\n[2/5] Auditing ranking pages...")
    unique_pages = {}
    for row in gsc_rows:
        page = row["page"]
        if page not in unique_pages:
            unique_pages[page] = []
        unique_pages[page].append(row["keyword"])

    for page_url, keywords in list(unique_pages.items())[:30]:  # limit to top 30 unique pages
        print(f"  Fetching: {page_url}")
        html = fetch_page(page_url)
        if html:
            parsed = parse_page(html)
            parsed["keywords"] = keywords
            parsed["url"] = page_url
            # Check JKU/JLU rule
            parsed["jku_jlu_check"] = check_jku_jlu_before_jk_jl(parsed["title"])
            audit["page_audits"][page_url] = parsed
        else:
            audit["page_audits"][page_url] = {
                "url": page_url,
                "error": "Could not fetch page",
                "keywords": keywords
            }
        time.sleep(0.3)

    # ── 3. Shopify Products & Collections ────────────────────────────────────
    print("\n[3/5] Pulling Shopify products and collections...")
    try:
        products = get_all_products()
        print(f"  → Got {len(products)} products")

        for p in products[:500]:  # audit up to 500 products
            pid = p["id"]
            metafields = get_product_metafields(pid)
            meta_dict = {f"{m['namespace']}.{m['key']}": m['value'] for m in metafields}

            title_tag = meta_dict.get("global.title_tag", "")
            desc_tag = meta_dict.get("global.description_tag", "")

            issues = []
            if not title_tag:
                issues.append("missing_title_tag")
            elif len(title_tag) > 60:
                issues.append(f"title_tag_too_long:{len(title_tag)}")

            if not desc_tag:
                issues.append("missing_description_tag")
            elif len(desc_tag) > 160:
                issues.append(f"description_tag_too_long:{len(desc_tag)}")

            if issues:
                audit["shopify_products_issues"].append({
                    "id": pid,
                    "title": p["title"],
                    "handle": p.get("handle", ""),
                    "issues": issues,
                    "title_tag": title_tag[:80] if title_tag else "",
                    "desc_tag": desc_tag[:80] if desc_tag else "",
                })
            time.sleep(0.2)

        print(f"  → Products with issues: {len(audit['shopify_products_issues'])}")
    except Exception as e:
        print(f"  ✗ Shopify products error: {e}")

    try:
        collections = get_all_collections()
        print(f"  → Got {len(collections)} collections")

        for c in collections:
            cid = c["id"]
            metafields = get_collection_metafields(cid)
            meta_dict = {f"{m['namespace']}.{m['key']}": m['value'] for m in metafields}

            title_tag = meta_dict.get("global.title_tag", "")
            desc_tag = meta_dict.get("global.description_tag", "")
            body_html = c.get("body_html", "") or ""
            body_text = re.sub(r'<[^>]+>', ' ', body_html)
            word_count = len(body_text.split())

            issues = []
            if not title_tag:
                issues.append("missing_meta_title")
            elif len(title_tag) > 60:
                issues.append(f"meta_title_too_long:{len(title_tag)}")

            if not desc_tag:
                issues.append("missing_meta_description")
            elif len(desc_tag) > 160:
                issues.append(f"meta_description_too_long:{len(desc_tag)}")

            if word_count < 200:
                issues.append(f"thin_body_content:{word_count}_words")

            if issues:
                audit["shopify_collections_issues"].append({
                    "id": cid,
                    "title": c["title"],
                    "handle": c.get("handle", ""),
                    "issues": issues,
                    "word_count": word_count,
                })
            time.sleep(0.2)

        print(f"  → Collections with issues: {len(audit['shopify_collections_issues'])}")
    except Exception as e:
        print(f"  ✗ Shopify collections error: {e}")

    # ── 4. Bing Rankings ─────────────────────────────────────────────────────
    print("\n[4/5] Checking Bing rankings for top 10 keywords...")
    top_10_keywords = [r["keyword"] for r in gsc_rows[:10]]
    for kw in top_10_keywords:
        try:
            search_url = f"https://www.bing.com/search?q={requests.utils.quote(kw)}"
            html = fetch_page(search_url)
            if html:
                # Find bartact.com in results
                position = "Not found in top results"
                results = re.findall(r'<cite[^>]*>(https?://[^<]*bartact[^<]*)</cite>', html, re.IGNORECASE)
                if not results:
                    results = re.findall(r'((?:www\.)?bartact\.com[^\s<"\']*)', html, re.IGNORECASE)

                if results:
                    # Try to find ranking position
                    all_cites = re.findall(r'<cite[^>]*>(.*?)</cite>', html, re.IGNORECASE)
                    for i, cite in enumerate(all_cites[:20], 1):
                        if "bartact" in cite.lower():
                            position = f"~#{i} in Bing"
                            break
                    if position == "Not found in top results":
                        position = "Found but position unclear"

                audit["bing_rankings"].append({
                    "keyword": kw,
                    "bing_position": position
                })
            time.sleep(1.0)
        except Exception as e:
            audit["bing_rankings"].append({
                "keyword": kw,
                "bing_position": f"Error: {e}"
            })

    # ── 5. Yandex Rankings ───────────────────────────────────────────────────
    print("\n[5/5] Checking Yandex rankings for top 5 keywords...")
    top_5_keywords = [r["keyword"] for r in gsc_rows[:5]]
    for kw in top_5_keywords:
        try:
            search_url = f"https://yandex.com/search/?text={requests.utils.quote(kw)}"
            html = fetch_page(search_url)
            if html:
                position = "Not found in top results"
                if "bartact" in html.lower():
                    position = "Found in results"
                audit["yandex_rankings"].append({
                    "keyword": kw,
                    "yandex_position": position
                })
            else:
                audit["yandex_rankings"].append({
                    "keyword": kw,
                    "yandex_position": "Could not fetch"
                })
            time.sleep(1.0)
        except Exception as e:
            audit["yandex_rankings"].append({
                "keyword": kw,
                "yandex_position": f"Error: {e}"
            })

    # ── Save JSON ─────────────────────────────────────────────────────────────
    output_path = "/home/ubuntu/.openclaw/workspace/memory/seo-audit-raw-2026-09-07.json"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(audit, f, indent=2, default=str)
    print(f"\n✓ Raw audit data saved to: {output_path}")
    return audit

if __name__ == "__main__":
    main()
