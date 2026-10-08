#!/usr/bin/env python3
"""
Bartact Weekly Zero-CTR Meta Fix — Oct 5 2026 run
Fixes title_tag + description_tag metafields on Shopify for zero-CTR pages
(>100 impr, <0.5% CTR), submits to IndexNow, updates google-indexing-queue.json.
Handles products AND collections. Resolves IDs by handle.
"""
import json, requests, time
from datetime import datetime, timezone

TOKEN = "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"  # SHOPIFY_TOKEN_BARTACT from .env
DOMAIN = "bartact.myshopify.com"
H = {"X-Shopify-Access-Token": TOKEN, "Content-Type": "application/json"}
INDEXNOW_KEY = "b4f7e2a1c3d5e6f7a8b9c0d1e2f3a4b5"
BWT_API_KEY = "0a35c8d451e348e099fe46c4533a9f12"
QUEUE_FILE = "/home/ubuntu/.openclaw/workspace/indexing/google-indexing-queue.json"
API = "2024-01"

def now():
    return datetime.now(timezone.utc).isoformat()

# Load zero-CTR pages from the report
with open("/tmp/bartact_seo_report.json") as f:
    report = json.load(f)

# Optimized meta by handle (product + collection). Keyword-led, benefit-driven, <60 char titles, <155 char desc.
META = {
    # ---- PRODUCTS ----
    "products/bronco-seat-covers-front-tactical-seat-covers-for-ford-bronco-full-size-2021-2022-2023-2024-2025-for-2-door-or-4-door-bartact": {
        "title_tag": "Ford Bronco Seat Covers 2021-2025 | Tactical MOLLE | Bartact\u00ae",
        "description_tag": "Bartact front tactical seat covers for Ford Bronco 2021-2025, 2-door & 4-door. MOLLE-ready, SRS airbag-safe, 1000D Cordura. Made in USA. Shop now."},
    "products/barktact-tactical-dog-vest-k9-harness-bartact": {
        "title_tag": "Tactical Dog Vest & K9 Harness | MOLLE Barktact | Bartact\u00ae",
        "description_tag": "Barktact tactical dog vest & K9 harness by Bartact. MOLLE panels, padded, adjustable, rugged 1000D Cordura. Built for working & adventure dogs."},
    "products/front-tactical-seat-covers-for-jeep-wrangler-tj-lj-2003-06-bartact-pair-w-molle-bartact": {
        "title_tag": "Jeep Wrangler TJ/LJ Seat Covers 2003-06 | MOLLE | Bartact\u00ae",
        "description_tag": "Bartact tactical front seat covers for Jeep Wrangler TJ/LJ 2003-2006. MOLLE panel pair, 1000D Cordura, custom fit. Built tough. Shop Bartact."},
    "products/winch-cover-for-warn-zeon-10-and-12-patent-pending-bartact": {
        "title_tag": "Warn Zeon 10 & 12 Winch Cover | Weatherproof | Bartact\u00ae",
        "description_tag": "Patent-pending Bartact winch cover for Warn Zeon 10 & 12. Heavy-duty UV & weather protection, perfect fit, fast install. Order yours today."},
    "products/kids-size-minecraft-inspired-creeper-mask-minecraft-face-mask-reversible-2-ply-polyester-reusable-washable-face-mask-covers-w-filter-slot-by-bartact": {
        "title_tag": "Kids Creeper Face Mask | Reversible Washable | Bartact\u00ae",
        "description_tag": "Kids reversible 2-ply creeper-inspired face mask by Bartact. Washable, reusable, filter slot included. Fun fit for pixel-game fans. Shop now."},
    "products/paracord-grab-handles-bolt-on-for-jeep-wrangler-jl-jlu-2018-made-in-usa-550-paracord-bartact-1": {
        "title_tag": "Jeep JL/JLU Paracord Grab Handles 2018+ | Bartact\u00ae",
        "description_tag": "Bolt-on 550 paracord grab handles for Jeep Wrangler JL/JLU 2018+. Made in USA, no-drill install, multiple colors. Easy upgrade. Shop Bartact."},
    "products/front-seat-covers-for-jeep-wrangler-tj-1997-02-pair-bartact-base-line-performance": {
        "title_tag": "Jeep Wrangler TJ Seat Covers 1997-02 | Base Line | Bartact\u00ae",
        "description_tag": "Bartact Base Line front seat covers for Jeep Wrangler TJ 1997-2002. Custom-fit pair, durable, easy install. Protect your seats. Shop now."},
    "products/bronco-accessories-door-storage-pocket-bags-for-ford-bronco-2021-full-size-front-door-interior-storage-bartact-pat-pending": {
        "title_tag": "Ford Bronco Door Storage Pockets 2021+ | Bartact\u00ae",
        "description_tag": "Patent-pending Bartact front door storage pocket bags for Ford Bronco 2021+ full size. Add interior storage, MOLLE-ready. Made in USA. Shop now."},
    "products/front-tactical-seat-covers-for-toyota-tacoma-trd-2005-08-bartact-pair-w-molle": {
        "title_tag": "Toyota Tacoma TRD Seat Covers 2005-08 | MOLLE | Bartact\u00ae",
        "description_tag": "Bartact tactical front seat covers for Toyota Tacoma TRD 2005-2008. MOLLE pair, 1000D Cordura, custom fit. Rugged off-road protection. Shop now."},
    "products/front-tactical-seat-covers-for-jeep-wrangler-2007-10-jk-jku-bartact-pair-srs-air-bag-compliant": {
        "title_tag": "Jeep Wrangler JK Seat Covers 2007-10 | MOLLE Pair | Bartact\u00ae",
        "description_tag": "Bartact tactical seat covers for Jeep Wrangler JK/JKU 2007-2010. SRS airbag-compliant pair, MOLLE-ready, 1000D Cordura. Built tough. Shop now."},
    "products/tj-door-handles-paracord-jeep-grab-handles-for-jeep-wrangler-tj-lj-97-06-interior-door-pull-handles-550-paracord-grab-handles-w-grommets-pair-bartact": {
        "title_tag": "Jeep TJ/LJ Paracord Door Pull Handles 97-06 | Bartact\u00ae",
        "description_tag": "550 paracord interior door pull handles for Jeep Wrangler TJ/LJ 1997-2006. Grommeted pair, made in USA, multiple colors. Shop Bartact."},
    "products/paracord-grab-handles-for-roll-bars-set-of-4-for-jeep-wrangler-jl-jlu-tj-yj-cj-gladiator-utv-rzr-x3-front-and-rear-bartact": {
        "title_tag": "Jeep Roll Bar Paracord Grab Handles Set of 4 | Bartact\u00ae",
        "description_tag": "Bartact 550 paracord roll bar grab handles, set of 4 for Jeep JL JLU TJ YJ CJ Gladiator & UTV. Front & rear, made in USA. Shop now."},
    "products/console-cover-for-toyota-tacoma-2016-24-standard-and-trd-padded-by-bartact": {
        "title_tag": "Toyota Tacoma Console Cover 2016-24 | Padded | Bartact\u00ae",
        "description_tag": "Padded center console cover for Toyota Tacoma 2016-2024 (Standard & TRD) by Bartact. Custom fit, protects armrest. Made in USA. Shop now."},
    "products/front-tactical-seat-covers-for-jeep-wrangler-tj-1997-02-pair-w-molle-bartact": {
        "title_tag": "Jeep Wrangler TJ Seat Covers 1997-02 | MOLLE Pair | Bartact\u00ae",
        "description_tag": "Bartact tactical front seat covers for Jeep Wrangler TJ 1997-2002. MOLLE pair, 1000D Cordura, custom fit. Rugged interior upgrade. Shop now."},
    "products/front-tactical-seat-covers-for-toyota-tacoma-2020-23-all-models-w-electric-driver-manual-passenger-seat-trd-non-trd-bartact-w-molle-pair-1": {
        "title_tag": "Toyota Tacoma Seat Covers 2020-23 | MOLLE Pair | Bartact\u00ae",
        "description_tag": "Bartact tactical seat covers for Toyota Tacoma 2020-2023, all models (electric driver/manual passenger). MOLLE pair, 1000D Cordura. Shop now."},
    "products/front-tactical-seat-covers-for-toyota-tacoma-2009-15-trd-bartact-pair-w-molle": {
        "title_tag": "Toyota Tacoma TRD Seat Covers 2009-15 | MOLLE | Bartact\u00ae",
        "description_tag": "Bartact tactical front seat covers for Toyota Tacoma TRD 2009-2015. MOLLE pair, 1000D Cordura, custom fit. Off-road ready. Shop Bartact."},
    "products/front-tactical-seat-covers-for-jeep-wrangler-jk-jku-2011-12-bartact-pair-w-molle-non-srs-air-bag-compliant": {
        "title_tag": "Jeep Wrangler JK Seat Covers 2011-12 | MOLLE Pair | Bartact\u00ae",
        "description_tag": "Bartact tactical seat covers for Jeep Wrangler JK/JKU 2011-2012. MOLLE pair, 1000D Cordura, custom fit. Non-SRS airbag. Built tough. Shop now."},
    "products/molle-attachments-by-bartact-pals-molle-d-ring-acetal-every-which-way-quick-side-release-buckle-kit-pair-of-2-1": {
        "title_tag": "MOLLE D-Ring Quick Release Buckle Kit (2) | Bartact\u00ae",
        "description_tag": "Bartact PALS MOLLE acetal D-ring quick side-release buckle kit, pair of 2. Attach gear anywhere on MOLLE panels. Made in USA. Shop now."},
    "products/paracord-grab-handles-bolt-on-for-jeep-gladiator-2019-front-pair-made-in-usa-550-paracord-bartact": {
        "title_tag": "Jeep Gladiator Paracord Grab Handles 2019+ | Bartact\u00ae",
        "description_tag": "Bolt-on 550 paracord front grab handles for Jeep Gladiator JT 2019+. Made in USA pair, no-drill install, multiple colors. Shop Bartact."},
    "products/rear-bench-tactical-seat-covers-for-jeep-wrangler-jku-2011-12-4-door-w-molle-bartact": {
        "title_tag": "Jeep Wrangler JKU Rear Seat Covers 2011-12 | MOLLE | Bartact\u00ae",
        "description_tag": "Bartact rear bench tactical seat cover for Jeep Wrangler JKU 2011-2012 4-door. MOLLE-ready, 1000D Cordura, custom fit. Shop now."},
    "products/door-limiting-strap-stainless-steel-footman-loops-brackets-pair-of-2-compatible-with-jeep-wrangler-1976-06-cj-yj-tj-bartact": {
        "title_tag": "Jeep Door Limiting Strap Footman Loops (2) | Bartact\u00ae",
        "description_tag": "Stainless steel footman loop brackets, pair of 2, for Jeep Wrangler CJ YJ TJ 1976-2006 door limiting straps. Rust-proof. Made in USA. Shop now."},
    "products/molle-attachments-pals-molle-dual-snap-bar-fast-clips-field-repair-side-release-buckle-kit-1-male-female-bartact": {
        "title_tag": "MOLLE Dual Snap Bar Fast Clips Buckle Kit | Bartact\u00ae",
        "description_tag": "Bartact PALS MOLLE dual snap bar fast clips, field-repair side-release buckle kit (male/female). Fix gear fast anywhere. Made in USA. Shop now."},
    # ---- COLLECTIONS ----
    "collections/jeep-wrangler-jl-jlu-accessories-2018": {
        "title_tag": "Jeep Wrangler JL/JLU Accessories 2018+ | Bartact\u00ae",
        "description_tag": "Shop Bartact Jeep Wrangler JL/JLU accessories for 2018+: tactical seat covers, grab handles, MOLLE storage & more. Made in USA. Free ship $75+."},
    "collections/toyota-tacoma-seat-covers": {
        "title_tag": "Toyota Tacoma Seat Covers | Tactical MOLLE | Bartact\u00ae",
        "description_tag": "Shop Bartact tactical Toyota Tacoma seat covers, 2005-2024. MOLLE-ready, SRS-safe, 1000D Cordura, custom fit. Made in USA. Free ship $75+."},
    "collections/fire-extinguisher-roll-bar-mount": {
        "title_tag": "Roll Bar Fire Extinguisher Mounts | MOLLE | Bartact\u00ae",
        "description_tag": "Shop Bartact roll bar fire extinguisher mounts for Jeep, Bronco, UTV & more. MOLLE-ready, quick access, rugged build. Made in USA. Shop now."},
    "collections/car-truck-suv-utv-boat-fire-extinguishers-mounts": {
        "title_tag": "Fire Extinguisher Mounts for Car, Truck, UTV & Boat | Bartact\u00ae",
        "description_tag": "Bartact fire extinguisher mounts for car, truck, SUV, UTV & boat. MOLLE & roll bar options, quick-release, rugged. Made in USA. Shop now."},
    "collections/jeep-wrangler-jk-jku-2007-18-accessories": {
        "title_tag": "Jeep Wrangler JK/JKU Accessories 2007-18 | Bartact\u00ae",
        "description_tag": "Shop Bartact Jeep Wrangler JK/JKU accessories 2007-2018: tactical seat covers, grab handles, MOLLE storage & more. Made in USA. Free ship $75+."},
    "collections/bull-strap": {
        "title_tag": "Bull Strap Tie-Downs & Recovery Straps | Bartact\u00ae",
        "description_tag": "Shop Bartact Bull Strap tie-downs & heavy-duty recovery straps. Adjustable, chromoly hardware, built for off-road & hauling. Made in USA. Shop now."},
    # ---- BLOGS (handled separately below as articles) ----
}

# Blog articles: can't set metafields the same way; track for internal-link action only.
BLOG_FIXES = [p["page"] for p in report["zero_ctr_pages"] if "/blogs/" in p["page"]]

def get_product_id_by_handle(handle):
    r = requests.get(f"https://{DOMAIN}/admin/api/{API}/products.json?handle={handle}&fields=id", headers=H)
    items = r.json().get("products", [])
    return items[0]["id"] if items else None

def get_collection_id_by_handle(handle):
    r = requests.get(f"https://{DOMAIN}/admin/api/{API}/custom_collections.json?handle={handle}&fields=id", headers=H)
    items = r.json().get("custom_collections", [])
    if not items:
        r = requests.get(f"https://{DOMAIN}/admin/api/{API}/smart_collections.json?handle={handle}&fields=id", headers=H)
        items = r.json().get("smart_collections", [])
    return items[0]["id"] if items else None

def set_metafield(resource_type, rid, key, value):
    url = f"https://{DOMAIN}/admin/api/{API}/{resource_type}/{rid}/metafields.json?namespace=global&key={key}"
    r = requests.get(url, headers=H)
    existing = r.json().get("metafields", [])
    if existing:
        mf_id = existing[0]["id"]
        body = {"metafield": {"id": mf_id, "value": value, "type": "single_line_text_field"}}
        r2 = requests.put(f"https://{DOMAIN}/admin/api/{API}/{resource_type}/{rid}/metafields/{mf_id}.json", json=body, headers=H)
        return r2.status_code, "updated"
    else:
        body = {"metafield": {"namespace": "global", "key": key, "value": value, "type": "single_line_text_field"}}
        r2 = requests.post(f"https://{DOMAIN}/admin/api/{API}/{resource_type}/{rid}/metafields.json", json=body, headers=H)
        return r2.status_code, "created"

fixed_urls = []
fix_log = []
skipped = []

# Map zero-CTR page URLs to meta entries
ctr_by_url = {p["page"]: p for p in report["zero_ctr_pages"]}

print("\U0001f527 Fixing zero-CTR pages...")
for url, pagedata in ctr_by_url.items():
    path = url.replace("https://www.bartact.com/", "").rstrip("/")
    if path not in META:
        if "/blogs/" in url:
            skipped.append((url, "blog-article-no-metafield"))
        else:
            skipped.append((url, "no-meta-defined"))
        continue
    meta = META[path]
    if path.startswith("products/"):
        handle = path.split("products/")[1]
        rid = get_product_id_by_handle(handle)
        rtype = "products"
    else:
        handle = path.split("collections/")[1]
        rid = get_collection_id_by_handle(handle)
        rtype = "collections"
    if not rid:
        skipped.append((url, "id-not-found"))
        print(f"  \u26a0\ufe0f  {path[:60]} -> ID not found")
        continue
    res = {}
    for field in ("title_tag", "description_tag"):
        st, act = set_metafield(rtype, rid, field, meta[field])
        res[field] = f"{act} ({st})"
        time.sleep(0.25)
    ok = all("(200" in v or "(201" in v for v in res.values())
    print(f"  {'\u2705' if ok else '\u26a0\ufe0f'} {path[:58]} | {res['title_tag']} / {res['description_tag']}")
    if ok:
        fixed_urls.append(url)
        fix_log.append({
            "url": url, "type": rtype, "impressions": pagedata["impressions"],
            "ctr_was": pagedata["ctr"], "position": pagedata["position"],
            "new_title": meta["title_tag"], "new_desc": meta["description_tag"],
            "fixed_at": now(),
        })

print(f"\n\u2705 Fixed {len(fixed_urls)} pages. Skipped {len(skipped)}.")

# ---- IndexNow ----
if fixed_urls:
    print("\n\U0001f4e1 Submitting to IndexNow...")
    payload = {"host": "www.bartact.com", "key": INDEXNOW_KEY,
               "keyLocation": f"https://www.bartact.com/{INDEXNOW_KEY}.txt", "urlList": fixed_urls}
    try:
        rb = requests.post("https://www.bing.com/indexnow", json=payload, headers={"Content-Type": "application/json"}, timeout=20)
        print(f"  Bing: HTTP {rb.status_code}")
        ry = requests.post("https://yandex.com/indexnow", json=payload, headers={"Content-Type": "application/json"}, timeout=20)
        print(f"  Yandex: HTTP {ry.status_code}")
        if rb.status_code == 403:
            bwt = {"siteUrl": "https://www.bartact.com/", "urlList": fixed_urls}
            rw = requests.post(f"https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlbatch?apikey={BWT_API_KEY}", json=bwt, headers={"Content-Type": "application/json"}, timeout=20)
            print(f"  BWT API: HTTP {rw.status_code} | {rw.text[:80]}")
    except Exception as e:
        print(f"  IndexNow error: {e}")

# ---- Update google-indexing-queue.json (flat string-array format) ----
print("\n\U0001f4cb Updating google-indexing-queue.json...")
try:
    with open(QUEUE_FILE) as f:
        queue = json.load(f)
except Exception:
    queue = {"urls": []}
if not isinstance(queue, dict):
    queue = {"urls": []}
urls = queue.get("urls", [])
existing = set(urls)
added = 0
for u in fixed_urls:
    if u not in existing:
        urls.append(u); existing.add(u); added += 1
queue["urls"] = urls
queue["lastUpdated"] = now()
with open(QUEUE_FILE, "w") as f:
    json.dump(queue, f, indent=2)
print(f"  Added {added} new URLs (queue total: {len(urls)})")

# ---- Save logs ----
with open("/tmp/bartact_meta_fixes_weekly.json", "w") as f:
    json.dump({"fixed": fix_log, "skipped": skipped, "blogs": BLOG_FIXES, "queue_added": added}, f, indent=2)
print(f"\n\u2705 Done. Fixed {len(fix_log)}, skipped {len(skipped)} (blogs: {len(BLOG_FIXES)}).")
for s in skipped:
    print(f"  skip: {s[1]} :: {s[0].replace('https://www.bartact.com','')}")
