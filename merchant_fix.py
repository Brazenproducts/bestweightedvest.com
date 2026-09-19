#!/usr/bin/env python3
"""
Bartact Google Merchant Center Disapproved Products Fixer
"""

import json
import os
import sys
import time
import requests
from datetime import datetime
from google.oauth2 import service_account
from google.auth.transport.requests import Request as GoogleAuthRequest

# ── Config ──────────────────────────────────────────────────────────────────
SA_FILE   = "/home/ubuntu/.openclaw/workspace/.gcp-service-account.json"
ADS_FILE  = "/home/ubuntu/.openclaw/workspace/.google-ads-credentials.json"
ENV_FILE  = "/home/ubuntu/.openclaw/workspace/.env"
LOG_FILE  = "/home/ubuntu/.openclaw/workspace/memory/merchant-center-fixes.json"
SCOPES    = ["https://www.googleapis.com/auth/content"]

SHOPIFY_STORE = "bartact.myshopify.com"
SHOPIFY_TOKEN = None  # loaded from .env

# ── Load env ─────────────────────────────────────────────────────────────────
env = {}
try:
    with open(ENV_FILE) as f:
        for line in f:
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, _, v = line.partition("=")
                env[k.strip()] = v.strip()
except Exception:
    pass

SHOPIFY_TOKEN = env.get("SHOPIFY_TOKEN_BARTACT", "")


def get_access_token():
    """Get OAuth2 access token via service account."""
    creds = service_account.Credentials.from_service_account_file(
        SA_FILE, scopes=SCOPES
    )
    creds.refresh(GoogleAuthRequest())
    return creds.token


def content_api(token, method, path, body=None, params=None):
    """Call Google Content API v2.1."""
    base = "https://shoppingcontent.googleapis.com/content/v2.1"
    url = f"{base}/{path}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    if method == "GET":
        r = requests.get(url, headers=headers, params=params or {})
    elif method == "POST":
        r = requests.post(url, headers=headers, json=body, params=params or {})
    elif method == "PUT":
        r = requests.put(url, headers=headers, json=body, params=params or {})
    elif method == "PATCH":
        r = requests.patch(url, headers=headers, json=body, params=params or {})
    else:
        raise ValueError(f"Unknown method {method}")
    return r


def shopify_get(path, params=None):
    """Call Shopify Admin API."""
    url = f"https://{SHOPIFY_STORE}/admin/api/2024-01/{path}"
    headers = {"X-Shopify-Access-Token": SHOPIFY_TOKEN, "Content-Type": "application/json"}
    r = requests.get(url, headers=headers, params=params or {})
    return r


def find_merchant_id(token):
    """List accessible Merchant Center accounts."""
    r = content_api(token, "GET", "accounts/authinfo")
    if r.status_code == 200:
        data = r.json()
        print("authinfo:", json.dumps(data, indent=2))
        return data
    else:
        print(f"authinfo error {r.status_code}: {r.text[:500]}")
        return None


def list_disapproved_products(token, merchant_id):
    """Fetch all products with disapproval issues."""
    products = []
    page_token = None
    page_num = 0
    while True:
        params = {"maxResults": 250}
        if page_token:
            params["pageToken"] = page_token
        r = content_api(token, "GET", f"{merchant_id}/productstatuses", params=params)
        if r.status_code != 200:
            print(f"productstatuses error {r.status_code}: {r.text[:500]}")
            break
        data = r.json()
        items = data.get("resources", [])
        page_num += 1
        print(f"  Page {page_num}: {len(items)} product statuses")
        for item in items:
            # Check if any destination has disapproved/pending status
            dests = item.get("destinationStatuses", [])
            item_issues = item.get("itemLevelIssues", [])
            has_issue = False
            for d in dests:
                if d.get("status") in ("disapproved", "pending_disapproval", "expiring"):
                    has_issue = True
            if item_issues:
                has_issue = True
            if has_issue:
                products.append(item)
        page_token = data.get("nextPageToken")
        if not page_token:
            break
        time.sleep(0.2)
    return products


def get_product_detail(token, merchant_id, product_id):
    """Get full product details."""
    r = content_api(token, "GET", f"{merchant_id}/products/{product_id}")
    if r.status_code == 200:
        return r.json()
    return None


def get_shopify_product_by_sku(sku):
    """Look up Shopify product variant by SKU."""
    r = shopify_get("variants.json", {"sku": sku, "limit": 5})
    if r.status_code == 200:
        variants = r.json().get("variants", [])
        if variants:
            return variants[0]
    return None


def get_shopify_product_by_id(shopify_product_id):
    """Get Shopify product by ID."""
    r = shopify_get(f"products/{shopify_product_id}.json")
    if r.status_code == 200:
        return r.json().get("product")
    return None


def fix_product(token, merchant_id, product_id, current_data, issues, shopify_data):
    """Attempt to fix product issues and return (updated_data, fixes_applied)."""
    fixes = []
    updated = dict(current_data)

    issue_attrs = [i.get("attribute", "") for i in issues]
    issue_codes = [i.get("code", "") for i in issues]
    issue_descriptions = [i.get("description", "") for i in issues]
    
    print(f"    Issues: {issue_codes}")
    print(f"    Attrs:  {issue_attrs}")

    # ── Fix: missing GTIN ────────────────────────────────────────────────────
    if "gtin" in issue_attrs or any("gtin" in c.lower() or "identifier" in c.lower() for c in issue_codes):
        current_gtin = current_data.get("gtin", "")
        if not current_gtin and shopify_data:
            # Try barcode field from Shopify variant
            barcode = shopify_data.get("barcode", "")
            if barcode and len(barcode) in (8, 12, 13, 14):
                updated["gtin"] = barcode
                fixes.append(f"gtin: set from Shopify barcode → {barcode}")
            else:
                # Mark as no identifier exists if no GTIN available
                updated["identifierExists"] = False
                fixes.append("identifierExists: set to False (no GTIN available)")

    # ── Fix: missing MPN ────────────────────────────────────────────────────
    if "mpn" in issue_attrs:
        if not current_data.get("mpn") and shopify_data:
            sku = shopify_data.get("sku", "")
            if sku:
                updated["mpn"] = sku
                fixes.append(f"mpn: set from SKU → {sku}")

    # ── Fix: missing brand ───────────────────────────────────────────────────
    if "brand" in issue_attrs:
        if not current_data.get("brand"):
            updated["brand"] = "Bartact"
            fixes.append("brand: set to Bartact")

    # ── Fix: missing description ─────────────────────────────────────────────
    if "description" in issue_attrs:
        if not current_data.get("description") and shopify_data:
            # Try getting description from Shopify product
            product_id_shopify = shopify_data.get("product_id")
            if product_id_shopify:
                prod = get_shopify_product_by_id(product_id_shopify)
                if prod and prod.get("body_html"):
                    import re
                    desc = re.sub(r'<[^>]+>', ' ', prod["body_html"]).strip()
                    desc = ' '.join(desc.split())[:5000]
                    if desc:
                        updated["description"] = desc
                        fixes.append(f"description: set from Shopify body_html ({len(desc)} chars)")

    # ── Fix: missing image ───────────────────────────────────────────────────
    if "imageLink" in issue_attrs or "image_link" in issue_attrs:
        if not current_data.get("imageLink") and shopify_data:
            img = shopify_data.get("image_src") or shopify_data.get("image", {}).get("src", "")
            if img:
                updated["imageLink"] = img
                fixes.append(f"imageLink: set from Shopify → {img[:80]}")

    # ── Fix: missing availability ────────────────────────────────────────────
    if "availability" in issue_attrs:
        if not current_data.get("availability"):
            if shopify_data:
                qty = shopify_data.get("inventory_quantity", 0)
                updated["availability"] = "in_stock" if qty > 0 else "out_of_stock"
                fixes.append(f"availability: set to {updated['availability']}")
            else:
                updated["availability"] = "in_stock"
                fixes.append("availability: set to in_stock (default)")

    # ── Fix: missing condition ───────────────────────────────────────────────
    if "condition" in issue_attrs:
        if not current_data.get("condition"):
            updated["condition"] = "new"
            fixes.append("condition: set to new")

    # ── Fix: identifierExists inconsistency ─────────────────────────────────
    if any("identifier" in c.lower() for c in issue_codes):
        has_gtin = bool(updated.get("gtin"))
        has_mpn  = bool(updated.get("mpn"))
        has_brand = bool(updated.get("brand"))
        if not has_gtin and not has_mpn:
            updated["identifierExists"] = False
            fixes.append("identifierExists: False (no unique ID available)")
        elif has_gtin or (has_mpn and has_brand):
            if "identifierExists" in updated and updated["identifierExists"] == False:
                updated["identifierExists"] = True
                fixes.append("identifierExists: corrected to True")

    # ── Fix: price issues (fetch from Shopify) ───────────────────────────────
    if "price" in issue_attrs and shopify_data:
        shopify_price = shopify_data.get("price")
        if shopify_price:
            currency = current_data.get("price", {}).get("currency", "USD")
            new_price = {"value": str(shopify_price), "currency": currency}
            if updated.get("price") != new_price:
                updated["price"] = new_price
                fixes.append(f"price: updated to {shopify_price} {currency}")

    return updated, fixes


def update_product(token, merchant_id, product_id, product_data):
    """Send product update to Merchant Center."""
    r = content_api(token, "PUT", f"{merchant_id}/products/{product_id}", body=product_data)
    return r.status_code, r.json() if r.content else {}


def main():
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    run_start = datetime.utcnow().isoformat()
    log = {
        "run_at": run_start,
        "merchant_id": None,
        "total_with_issues": 0,
        "attempted_fixes": 0,
        "successful_fixes": 0,
        "skipped": 0,
        "errors": [],
        "products": [],
        "summary_by_issue": {},
    }

    print("=== Bartact Merchant Center Fix ===")
    print(f"Started: {run_start}")

    # ── Auth ──────────────────────────────────────────────────────────────────
    print("\n[1] Authenticating with service account...")
    try:
        token = get_access_token()
        print(f"    Token acquired: {token[:30]}...")
    except Exception as e:
        log["errors"].append(f"Auth failed: {e}")
        json.dump(log, open(LOG_FILE, "w"), indent=2)
        print(f"    FATAL: {e}")
        return log

    # ── Find Merchant ID ──────────────────────────────────────────────────────
    print("\n[2] Finding Merchant Center account ID...")
    auth_info = find_merchant_id(token)
    merchant_id = None
    if auth_info:
        accs = auth_info.get("accountIdentifiers", [])
        if accs:
            # Prefer aggregator accounts; otherwise take first
            for acc in accs:
                if acc.get("aggregatorId"):
                    merchant_id = acc.get("aggregatorId") or acc.get("merchantId")
                    break
            if not merchant_id:
                merchant_id = accs[0].get("merchantId") or accs[0].get("aggregatorId")

    if not merchant_id:
        print("    Could not determine merchant ID from authinfo. Trying Google Ads customer ID as merchant ID...")
        merchant_id = "1770651698"  # fallback — try the Ads customer ID
    
    log["merchant_id"] = merchant_id
    print(f"    Merchant ID: {merchant_id}")

    # ── Fetch disapproved products ─────────────────────────────────────────────
    print("\n[3] Fetching products with issues...")
    try:
        issues_products = list_disapproved_products(token, merchant_id)
    except Exception as e:
        log["errors"].append(f"List products failed: {e}")
        json.dump(log, open(LOG_FILE, "w"), indent=2)
        print(f"    FATAL: {e}")
        return log

    log["total_with_issues"] = len(issues_products)
    print(f"    Found {len(issues_products)} products with issues")

    if not issues_products:
        log["status"] = "no_issues_found"
        json.dump(log, open(LOG_FILE, "w"), indent=2)
        print("    No issues found — all products approved!")
        return log

    # ── Tally issue types ──────────────────────────────────────────────────────
    issue_tally = {}
    for p in issues_products:
        for iss in p.get("itemLevelIssues", []):
            code = iss.get("code", "unknown")
            issue_tally[code] = issue_tally.get(code, 0) + 1
    log["summary_by_issue"] = issue_tally
    print(f"\n    Issue summary:")
    for code, cnt in sorted(issue_tally.items(), key=lambda x: -x[1]):
        print(f"      {code}: {cnt}")

    # ── Process each product ───────────────────────────────────────────────────
    print(f"\n[4] Processing {len(issues_products)} products...")
    # Limit to first 500 to avoid very long runs
    to_process = issues_products[:500]
    
    for idx, pstatus in enumerate(to_process):
        product_id = pstatus.get("productId", "")
        issues = pstatus.get("itemLevelIssues", [])
        
        # Skip if no item-level issues (only destination-level, which we can't fix)
        fixable_issues = [i for i in issues if i.get("servability") in ("disapproved", "demoted", "unaffected") 
                          or i.get("attribute")]
        
        if not fixable_issues:
            log["skipped"] += 1
            continue

        print(f"\n  [{idx+1}/{len(to_process)}] {product_id}")

        # Get full product data
        try:
            product_data = get_product_detail(token, merchant_id, product_id)
        except Exception as e:
            log["errors"].append(f"get_product {product_id}: {e}")
            continue

        if not product_data:
            log["errors"].append(f"get_product {product_id}: empty response")
            continue

        # Look up Shopify data
        shopify_variant = None
        sku = product_data.get("offerId", "")
        # offerId in MC is usually "shopify_{product_id}_{variant_id}" or just the SKU
        if sku and SHOPIFY_TOKEN:
            # Try to extract numeric IDs from offerId
            parts = sku.replace("shopify_", "").split("_")
            variant_id = parts[-1] if parts else ""
            if variant_id.isdigit():
                r = shopify_get(f"variants/{variant_id}.json")
                if r.status_code == 200:
                    shopify_variant = r.json().get("variant")
            if not shopify_variant:
                # Try by SKU from product data
                product_sku = product_data.get("mpn") or ""
                if product_sku:
                    shopify_variant = get_shopify_product_by_sku(product_sku)

        # Attempt fixes
        try:
            updated_data, fixes_applied = fix_product(
                token, merchant_id, product_id,
                product_data, fixable_issues, shopify_variant
            )
        except Exception as e:
            log["errors"].append(f"fix_product {product_id}: {e}")
            continue

        product_log = {
            "product_id": product_id,
            "offer_id": product_data.get("offerId"),
            "title": product_data.get("title", "")[:80],
            "issues": [{"code": i.get("code"), "attr": i.get("attribute"), "desc": i.get("description", "")[:120]} for i in fixable_issues],
            "fixes_applied": fixes_applied,
            "update_status": None,
        }

        if fixes_applied:
            log["attempted_fixes"] += 1
            print(f"    Fixes: {fixes_applied}")
            # Submit update
            try:
                status_code, resp = update_product(token, merchant_id, product_id, updated_data)
                product_log["update_status"] = status_code
                if status_code in (200, 204):
                    log["successful_fixes"] += 1
                    print(f"    ✓ Updated (HTTP {status_code})")
                else:
                    log["errors"].append(f"update {product_id}: HTTP {status_code} {str(resp)[:200]}")
                    print(f"    ✗ Update failed HTTP {status_code}: {str(resp)[:200]}")
            except Exception as e:
                log["errors"].append(f"update_product {product_id}: {e}")
                print(f"    ✗ Exception: {e}")
        else:
            log["skipped"] += 1
            product_log["update_status"] = "no_fixable_issues"
            print(f"    (no programmatic fix available for these issues)")

        log["products"].append(product_log)
        time.sleep(0.15)  # rate-limit friendly

    # ── Save log ───────────────────────────────────────────────────────────────
    log["completed_at"] = datetime.utcnow().isoformat()
    log["status"] = "completed"
    json.dump(log, open(LOG_FILE, "w"), indent=2)
    print(f"\n[5] Results saved to {LOG_FILE}")
    print(f"    Total with issues: {log['total_with_issues']}")
    print(f"    Attempted fixes:   {log['attempted_fixes']}")
    print(f"    Successful fixes:  {log['successful_fixes']}")
    print(f"    Skipped:           {log['skipped']}")
    print(f"    Errors:            {len(log['errors'])}")
    return log


if __name__ == "__main__":
    result = main()
    print("\nDone.")
