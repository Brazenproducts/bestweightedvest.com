# Bull Strap Collection SEO — Blocker

**Status:** ❌ BLOCKED  
**Last Run:** 2026-09-09 04:56 UTC  
**Reason:** Shopify API 401 (unauthorized)

## Issue

All 5 brand collection creation attempts fail with HTTP 401:
- carli, aev, warn, rugged, smittybilt

Token loads correctly: `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`  
Store: `bull-strap-78.myshopify.com`

## Root Cause

The Shopify token is either:
1. **Expired** — needs regeneration
2. **Lacks scopes** — missing `write_products` or `write_custom_collections`
3. **Revoked** — access was removed

## Action Required

1. Go to Bull Strap Shopify admin
2. Settings > Apps & Integrations > Develop apps
3. Verify token scopes include:
   - `write_products`
   - `write_custom_collections`
4. Regenerate if needed
5. Update `.env` with new token

Once fixed, the script will:
- ✅ Create 5 brand collection pages
- ✅ Fix SEO meta (title_tag, description_tag)
- ✅ Submit URLs to Google/Bing/Yandex

---

**Cron job:** `Bull Strap Collection SEO`  
**Script:** `/home/ubuntu/.openclaw/workspace/scripts/bullstrap-collection-seo.js`  
**State:** `memory/bullstrap-collection-seo-state.json`
