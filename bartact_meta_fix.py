#!/usr/bin/env python3
"""
Bartact Zero-CTR Page Meta Fix
Updates title_tag + description_tag metafields on Shopify for zero-CTR pages.
Then submits to IndexNow and updates google-indexing-queue.json.
"""

import json, requests, time, os
from datetime import datetime

TOKEN = "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"
DOMAIN = "bartact.myshopify.com"
H = {"X-Shopify-Access-Token": TOKEN, "Content-Type": "application/json"}
INDEXNOW_KEY = "b4f7e2a1c3d5e6f7a8b9c0d1e2f3a4b5"
QUEUE_FILE = "/home/ubuntu/.openclaw/workspace/indexing/google-indexing-queue.json"

# ─── Product fixes (optimized titles + descriptions) ───────────────────────
PRODUCT_FIXES = [
    {
        "id": 6635477827627,
        "handle": "bronco-seat-covers-front-tactical-seat-covers-for-ford-bronco-full-size-2021-2022-2023-2024-2025-for-2-door-or-4-door-bartact",
        "url": "https://www.bartact.com/products/bronco-seat-covers-front-tactical-seat-covers-for-ford-bronco-full-size-2021-2022-2023-2024-2025-for-2-door-or-4-door-bartact",
        "impressions": 1999, "ctr_was": "0.40%",
        "title_tag": "Ford Bronco Seat Covers 2021-2025 | Tactical MOLLE | Bartact®",
        "description_tag": "Shop Bartact's Ford Bronco front seat covers for 2021-2025 2-door & 4-door. Tactical MOLLE, SRS airbag-compliant, made in USA. Free shipping over $75.",
    },
    {
        "id": 1420814469,
        "handle": "front-tactical-seat-covers-for-jeep-wrangler-2007-10-jk-jku-bartact-pair-srs-air-bag-compliant",
        "url": "https://www.bartact.com/products/front-tactical-seat-covers-for-jeep-wrangler-2007-10-jk-jku-bartact-pair-srs-air-bag-compliant",
        "impressions": 956, "ctr_was": "0.21%",
        "title_tag": "Jeep Wrangler TJ Seat Covers | Tactical MOLLE Pair | Bartact®",
        "description_tag": "Bartact tactical seat covers for Jeep Wrangler JK/JKU 2007-2010. MOLLE panel ready, SRS airbag-compliant, 1000D Cordura. Ships fast. Shop now.",
    },
    {
        "id": 8633593168,
        "handle": "winch-cover-for-warn-zeon-10-and-12-patent-pending-bartact",
        "url": "https://www.bartact.com/products/winch-cover-for-warn-zeon-10-and-12-patent-pending-bartact",
        "impressions": 913, "ctr_was": "0.44%",
        "title_tag": "Warn Zeon 10 & 12 Winch Cover | Weather Protect | Bartact®",
        "description_tag": "Patent-pending Bartact winch cover for Warn Zeon 10 and 12. Heavy-duty UV & weather protection. Perfect fit, quick install. Order yours today.",
    },
    {
        "id": 3497888251927,
        "handle": "front-tactical-seat-covers-for-jeep-gladiator-2019-jt-bartact-pair-w-molle-not-for-mojave-or-392-edition",
        "url": "https://www.bartact.com/products/front-tactical-seat-covers-for-jeep-gladiator-2019-jt-bartact-pair-w-molle-not-for-mojave-or-392-edition",
        "impressions": 888, "ctr_was": "0.34%",
        "title_tag": "Jeep Gladiator Seat Covers 2019+ | MOLLE Tactical Pair | Bartact®",
        "description_tag": "Bartact tactical seat covers for Jeep Gladiator JT 2019+. Includes MOLLE panel, SRS-compliant, 1000D Cordura fabric. Not for Mojave or 392. Shop now.",
    },
    {
        "id": 8492299088,
        "handle": "front-tactical-seat-covers-for-toyota-tacoma-2009-15-non-trd-bartact-pair-w-molle",
        "url": "https://www.bartact.com/products/front-tactical-seat-covers-for-toyota-tacoma-2009-15-non-trd-bartact-pair-w-molle",
        "impressions": 789, "ctr_was": "0.13%",
        "title_tag": "Toyota Tacoma Seat Covers 2009-2015 | Tactical MOLLE | Bartact®",
        "description_tag": "Tactical seat covers for Toyota Tacoma 2009-2015 (Non-TRD). MOLLE-ready, rugged 1000D Cordura, custom fit pair. Built tough for off-road. Shop Bartact.",
    },
    {
        "id": 3948249481239,
        "handle": "paracord-grab-handles-for-roll-bars-set-of-4-for-jeep-wrangler-jl-jlu-tj-yj-cj-gladiator-utv-rzr-x3-front-and-rear-bartact",
        "url": "https://www.bartact.com/products/paracord-grab-handles-for-roll-bars-set-of-4-for-jeep-wrangler-jl-jlu-tj-yj-cj-gladiator-utv-rzr-x3-front-and-rear-bartact",
        "impressions": 668, "ctr_was": "0.15%",
        "title_tag": "Jeep Roll Bar Paracord Grab Handles Set of 4 | Bartact®",
        "description_tag": "Bartact paracord grab handles for Jeep Wrangler JL, JLU, TJ, YJ, CJ, Gladiator & UTV roll bars. Set of 4, front & rear. Multiple colors. Shop now.",
    },
    {
        "id": 7141810503723,
        "handle": "tactical-seat-covers-for-jeep-wrangler-jl-jlu-2024-not-for-mojave-or-392-edition-front-pair-bartact",
        "url": "https://www.bartact.com/products/tactical-seat-covers-for-jeep-wrangler-jl-jlu-2024-not-for-mojave-or-392-edition-front-pair-bartact",
        "impressions": 515, "ctr_was": "0.39%",
        "title_tag": "Jeep Wrangler JLU Seat Covers 2018-2024 | Tactical MOLLE | Bartact®",
        "description_tag": "Bartact tactical seat covers for Jeep Wrangler JL & JLU 2018-2024+. MOLLE panel, 1000D Cordura, SRS-compliant. Not for Mojave or 392. Ships fast.",
    },
]

# ─── Collection fixes ────────────────────────────────────────────────────────
COLLECTION_FIXES = [
    {
        "handle": "kitchen-fire-extinguishers",
        "url": "https://www.bartact.com/collections/kitchen-fire-extinguishers",
        "impressions": 838, "ctr_was": "0.12%",
        "title_tag": "Kitchen Fire Extinguishers | MOLLE Mount Ready | Bartact®",
        "description_tag": "Shop Bartact kitchen fire extinguishers with tactical MOLLE mount options. Compact, effective, and ready to deploy. Free shipping on orders over $75.",
    },
]

def get_or_create_metafield(resource_type, resource_id, key, value):
    """Get existing metafield or create new one in global namespace."""
    url = f"https://{DOMAIN}/admin/api/2024-01/{resource_type}/{resource_id}/metafields.json?namespace=global&key={key}"
    r = requests.get(url, headers=H)
    existing = r.json().get("metafields", [])
    
    if existing:
        mf_id = existing[0]["id"]
        # Update
        body = {"metafield": {"id": mf_id, "value": value, "type": "single_line_text_field"}}
        r2 = requests.put(f"https://{DOMAIN}/admin/api/2024-01/{resource_type}/{resource_id}/metafields/{mf_id}.json", 
                          json=body, headers=H)
        return r2.status_code, "updated"
    else:
        # Create
        body = {"metafield": {"namespace": "global", "key": key, "value": value, "type": "single_line_text_field"}}
        r2 = requests.post(f"https://{DOMAIN}/admin/api/2024-01/{resource_type}/{resource_id}/metafields.json",
                           json=body, headers=H)
        return r2.status_code, "created"

def fix_product(fix):
    pid = fix["id"]
    results = {}
    for field in ["title_tag", "description_tag"]:
        status, action = get_or_create_metafield("products", pid, field, fix[field])
        results[field] = f"{action} ({status})"
        time.sleep(0.3)
    return results

def fix_collection(fix):
    handle = fix["handle"]
    r = requests.get(f"https://{DOMAIN}/admin/api/2024-01/custom_collections.json?handle={handle}&fields=id,title,handle", headers=H)
    colls = r.json().get("custom_collections", [])
    if not colls:
        r2 = requests.get(f"https://{DOMAIN}/admin/api/2024-01/smart_collections.json?handle={handle}&fields=id,title,handle", headers=H)
        colls = r2.json().get("smart_collections", [])
    
    if not colls:
        return {"error": "collection not found"}
    
    cid = colls[0]["id"]
    results = {}
    for field in ["title_tag", "description_tag"]:
        status, action = get_or_create_metafield("collections", cid, field, fix[field])
        results[field] = f"{action} ({status})"
        time.sleep(0.3)
    return results

# ─── Run fixes ───────────────────────────────────────────────────────────────
print("🔧 Fixing zero-CTR product meta tags...")
fixed_urls = []
fix_log = []

for fix in PRODUCT_FIXES:
    print(f"  → {fix['handle'][:50]}... ({fix['impressions']} impr, was {fix['ctr_was']} CTR)")
    result = fix_product(fix)
    print(f"     title_tag: {result.get('title_tag')} | desc: {result.get('description_tag')}")
    if "error" not in result:
        fixed_urls.append(fix["url"])
        fix_log.append({
            "url": fix["url"],
            "impressions": fix["impressions"],
            "old_ctr": fix["ctr_was"],
            "new_title": fix["title_tag"],
            "new_desc": fix["description_tag"],
            "fixed_at": datetime.utcnow().isoformat(),
        })

print("\n🔧 Fixing zero-CTR collection meta tags...")
for fix in COLLECTION_FIXES:
    print(f"  → {fix['handle']} ({fix['impressions']} impr, was {fix['ctr_was']} CTR)")
    result = fix_collection(fix)
    print(f"     title_tag: {result.get('title_tag')} | desc: {result.get('description_tag')}")
    if "error" not in result:
        fixed_urls.append(fix["url"])
        fix_log.append({
            "url": fix["url"],
            "impressions": fix["impressions"],
            "old_ctr": fix["ctr_was"],
            "new_title": fix["title_tag"],
            "new_desc": fix["description_tag"],
            "fixed_at": datetime.utcnow().isoformat(),
        })

print(f"\n✅ Fixed {len(fixed_urls)} pages")

# ─── IndexNow submission ─────────────────────────────────────────────────────
print("\n📡 Submitting to IndexNow (Bing)...")
indexnow_payload = {
    "host": "www.bartact.com",
    "key": INDEXNOW_KEY,
    "keyLocation": f"https://www.bartact.com/{INDEXNOW_KEY}.txt",
    "urlList": fixed_urls,
}

r_bing = requests.post(
    "https://www.bing.com/indexnow",
    json=indexnow_payload,
    headers={"Content-Type": "application/json"},
    timeout=15,
)
print(f"  Bing: HTTP {r_bing.status_code}")

# Yandex fallback
r_yandex = requests.post(
    "https://yandex.com/indexnow",
    json=indexnow_payload,
    headers={"Content-Type": "application/json"},
    timeout=15,
)
print(f"  Yandex: HTTP {r_yandex.status_code}")

# ─── BWT URL Submission API (Bing fallback if 403) ──────────────────────────
BWT_API_KEY = "0a35c8d451e348e099fe46c4533a9f12"
if r_bing.status_code == 403:
    print("  Bing 403 → falling back to BWT URL Submission API...")
    bwt_payload = {"siteUrl": "https://www.bartact.com/", "urlList": fixed_urls}
    r_bwt = requests.post(
        f"https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlbatch?apikey={BWT_API_KEY}",
        json=bwt_payload,
        headers={"Content-Type": "application/json"},
        timeout=15,
    )
    print(f"  BWT API: HTTP {r_bwt.status_code} | {r_bwt.text[:80]}")

# ─── Update google-indexing-queue.json ──────────────────────────────────────
print("\n📋 Updating google-indexing-queue.json...")
try:
    with open(QUEUE_FILE) as f:
        queue = json.load(f)
except:
    queue = []

existing_urls = {e.get("url") for e in queue}
added = 0
for url in fixed_urls:
    if url not in existing_urls:
        queue.append({"url": url, "queued_at": datetime.utcnow().isoformat(), "reason": "zero-ctr-meta-fix"})
        added += 1

with open(QUEUE_FILE, "w") as f:
    json.dump(queue, f, indent=2)

print(f"  Added {added} new URLs to queue (total: {len(queue)})")

# ─── Save fix log ─────────────────────────────────────────────────────────────
with open("/tmp/bartact_meta_fixes.json", "w") as f:
    json.dump(fix_log, f, indent=2)

print(f"\n✅ Meta fix log saved: {len(fix_log)} pages fixed")
print("Fixed pages:")
for f in fix_log:
    print(f"  • {f['url'].replace('https://www.bartact.com', '')}")
    print(f"    Title: {f['new_title']}")
    print(f"    Desc: {f['new_desc'][:80]}...")
