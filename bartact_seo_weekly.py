#!/usr/bin/env python3
"""
Bartact Weekly SEO Report — 14-day GSC window
Pulls keyword + page data, identifies zero-CTR pages, near-misses.
"""

import json
import os
import requests
from datetime import datetime, timedelta
from google.oauth2 import service_account
from googleapiclient.discovery import build

SA_FILE = "/home/ubuntu/.openclaw/workspace/.gcp-service-account.json"
SITE_URL = "https://www.bartact.com/"
SHOPIFY_TOKEN = "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"
SHOPIFY_DOMAIN = "bartact.myshopify.com"
INDEXNOW_KEY = None  # will load from env
QUEUE_FILE = "/home/ubuntu/.openclaw/workspace/indexing/google-indexing-queue.json"

# 14-day window ending yesterday
END_DATE = (datetime(2026, 9, 7) - timedelta(days=1)).strftime("%Y-%m-%d")  # 2026-09-06
START_DATE = (datetime(2026, 9, 7) - timedelta(days=14)).strftime("%Y-%m-%d")  # 2026-08-24

print(f"📅 GSC window: {START_DATE} → {END_DATE}")

# --- Auth ---
creds = service_account.Credentials.from_service_account_file(
    SA_FILE,
    scopes=["https://www.googleapis.com/auth/webmasters.readonly"]
)
service = build("searchconsole", "v1", credentials=creds, cache_discovery=False)

def gsc_query(dimensions, row_limit=500, filters=None):
    body = {
        "startDate": START_DATE,
        "endDate": END_DATE,
        "dimensions": dimensions,
        "rowLimit": row_limit,
        "startRow": 0,
    }
    if filters:
        body["dimensionFilterGroups"] = filters
    resp = service.searchanalytics().query(siteUrl=SITE_URL, body=body).execute()
    return resp.get("rows", [])

# =====================================================================
# 1. TOP 30 KEYWORDS BY IMPRESSIONS
# =====================================================================
print("\n🔍 Pulling top keywords...")
kw_rows = gsc_query(["query"], row_limit=200)
kw_rows.sort(key=lambda r: r["impressions"], reverse=True)

top30_kw = []
for r in kw_rows[:30]:
    top30_kw.append({
        "query": r["keys"][0],
        "impressions": r["impressions"],
        "clicks": r["clicks"],
        "ctr": round(r["ctr"] * 100, 2),
        "position": round(r["position"], 1)
    })

print(f"  ✅ Got {len(kw_rows)} total keywords, top 30 captured")

# =====================================================================
# 2. ZERO-CTR KEYWORDS (>100 impressions, <0.5% CTR)
# =====================================================================
zero_ctr_kw = []
for r in kw_rows:
    if r["impressions"] > 100 and r["ctr"] < 0.005:
        zero_ctr_kw.append({
            "query": r["keys"][0],
            "impressions": r["impressions"],
            "clicks": r["clicks"],
            "ctr": round(r["ctr"] * 100, 2),
            "position": round(r["position"], 1)
        })

print(f"  ⚠️  Zero-CTR keywords: {len(zero_ctr_kw)}")

# =====================================================================
# 3. ALL PAGES DATA
# =====================================================================
print("\n📄 Pulling page-level data...")
page_rows = gsc_query(["page"], row_limit=500)
page_rows.sort(key=lambda r: r["impressions"], reverse=True)

print(f"  ✅ Got {len(page_rows)} pages")

# =====================================================================
# 4. PAGE 2 NEAR-MISSES (position 11-20, >50 impressions)
# =====================================================================
near_misses = []
for r in page_rows:
    if 11 <= r["position"] <= 20 and r["impressions"] > 50:
        near_misses.append({
            "page": r["keys"][0],
            "impressions": r["impressions"],
            "clicks": r["clicks"],
            "ctr": round(r["ctr"] * 100, 2),
            "position": round(r["position"], 1)
        })

near_misses.sort(key=lambda x: x["impressions"], reverse=True)
print(f"  📈 Near-miss pages (pos 11-20, >50 impr): {len(near_misses)}")

# =====================================================================
# 5. TOP 20 COLLECTION PAGES
# =====================================================================
collection_pages = []
for r in page_rows:
    url = r["keys"][0]
    if "/collections/" in url and not "/products/" in url:
        collection_pages.append({
            "page": url,
            "impressions": r["impressions"],
            "clicks": r["clicks"],
            "ctr": round(r["ctr"] * 100, 2),
            "position": round(r["position"], 1)
        })

top20_collections = collection_pages[:20]
print(f"  🗂️  Collection pages: {len(collection_pages)}")

# =====================================================================
# 6. TOP 20 PRODUCT PAGES
# =====================================================================
product_pages = []
for r in page_rows:
    url = r["keys"][0]
    if "/products/" in url:
        product_pages.append({
            "page": url,
            "impressions": r["impressions"],
            "clicks": r["clicks"],
            "ctr": round(r["ctr"] * 100, 2),
            "position": round(r["position"], 1)
        })

top20_products = product_pages[:20]
print(f"  📦 Product pages: {len(product_pages)}")

# =====================================================================
# 7. ZERO-CTR PAGES (>100 impressions, <0.5% CTR) — need meta fixes
# =====================================================================
zero_ctr_pages = []
for r in page_rows:
    if r["impressions"] > 100 and r["ctr"] < 0.005:
        zero_ctr_pages.append({
            "page": r["keys"][0],
            "impressions": r["impressions"],
            "clicks": r["clicks"],
            "ctr": round(r["ctr"] * 100, 2),
            "position": round(r["position"], 1)
        })

print(f"  🔴 Zero-CTR pages (>100 impr): {len(zero_ctr_pages)}")

# Save all data
report_data = {
    "generated": datetime.utcnow().isoformat(),
    "window": {"start": START_DATE, "end": END_DATE},
    "top30_keywords": top30_kw,
    "zero_ctr_keywords": zero_ctr_kw,
    "near_miss_pages": near_misses,
    "top20_collections": top20_collections,
    "top20_products": top20_products,
    "zero_ctr_pages": zero_ctr_pages,
    "total_pages_seen": len(page_rows),
    "total_keywords_seen": len(kw_rows),
}

with open("/tmp/bartact_seo_report.json", "w") as f:
    json.dump(report_data, f, indent=2)

print("\n✅ Data saved to /tmp/bartact_seo_report.json")
print(f"\n📊 SUMMARY:")
print(f"  Keywords analyzed: {len(kw_rows)}")
print(f"  Pages analyzed: {len(page_rows)}")
print(f"  Zero-CTR keywords (>100 impr): {len(zero_ctr_kw)}")
print(f"  Zero-CTR pages (>100 impr): {len(zero_ctr_pages)}")
print(f"  Near-miss pages (pos 11-20): {len(near_misses)}")
