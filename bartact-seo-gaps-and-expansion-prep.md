# Bartact SEO Gaps & Expansion Prep — Sep 19, 2026

## Current Issues to Fix

### 1. Collection Page Meta Descriptions
**Problem:** Many collection pages likely still have generic or missing descriptions
**Fix:** Audit all collection pages and write benefit-driven descriptions
**Priority:** HIGH (affects CTR like homepage did)

### 2. Product Page Titles
**Problem:** Need to check if product titles follow format: "[Year] [Make] [Model] [Product] | Bartact"
**Fix:** Audit + standardize all product titles
**Priority:** MEDIUM

### 3. Internal Linking Structure
**Problem:** Not enough internal links between related products/collections
**Fix:** Add "Related Products" sections, contextual links in descriptions
**Priority:** MEDIUM

### 4. Image Alt Text
**Problem:** Probably missing or generic alt text on product images
**Fix:** Audit all product images, add descriptive alt text with keywords
**Priority:** MEDIUM (accessibility + image SEO)

### 5. Site Speed / Core Web Vitals
**Problem:** Haven't checked Lighthouse scores or Core Web Vitals
**Fix:** Run audit, optimize images (WebP), lazy loading
**Priority:** MEDIUM

### 6. Backlink Strategy
**Problem:** No active backlink building
**Fix:** 
- Outreach to Jeep/off-road forums for reviews
- Get listed on vehicle accessory directories
- Partner with YouTube reviewers
**Priority:** LOW (long-term)

### 7. Blog Content Gap
**Problem:** Blog posts exist but need more volume
**Fix:** Already have 2x/week automation - keep it running
**Priority:** ONGOING

---

## Expansion Prep (Ford, Ram, Chevy, etc.)

### Site Structure Recommendations

#### URL Structure (already good)
```
/collections/ford-f150-seat-covers
/collections/ram-1500-seat-covers
/collections/chevy-silverado-seat-covers
/products/ford-f150-seat-covers-tactical-series-2021-2024
```

#### Collection Template (CRITICAL)
**Create NOW before launch:**

1. **Vehicle-specific collection pages** with:
   - H1: "[Make] [Model] Tactical Seat Covers | Bartact"
   - Meta description template: "Custom-fit tactical seat covers for [Year] [Make] [Model]. Made in USA with military-grade materials. MOLLE panels, free shipping, lifetime warranty."
   - Intro paragraph explaining fit, features, Made in USA
   - FAQ section (fits which years? SRS airbag safe? dog-friendly?)
   
2. **Master collection hierarchy**:
   ```
   /collections/seat-covers (main hub)
     └─ /collections/ford-seat-covers (brand hub)
         ├─ /collections/ford-f150-seat-covers
         ├─ /collections/ford-f250-seat-covers
         └─ /collections/ford-bronco-seat-covers (existing)
     └─ /collections/ram-seat-covers (brand hub)
         ├─ /collections/ram-1500-seat-covers
         └─ /collections/ram-2500-seat-covers
     └─ /collections/chevy-seat-covers (brand hub)
         ├─ /collections/chevy-silverado-seat-covers
         └─ /collections/chevy-colorado-seat-covers
   ```

#### Product Naming Convention (CRITICAL)
**Standardize NOW:**
```
[Make] [Model] [Year-Range] Tactical Seat Covers - [Configuration]

Examples:
- Ford F-150 2021-2024 Tactical Seat Covers - Front Pair
- Ram 1500 2019-2023 Tactical Seat Covers - Full Set
- Chevy Silverado 2014-2018 Tactical Seat Covers - Rear Bench
```

#### Schema Markup (ALREADY DONE)
✅ Product schema is live - will auto-apply to new products

#### Google Merchant Center Prep
**DO THIS BEFORE LAUNCH:**

1. **Product feeds will auto-sync** from Shopify
2. **Pre-create custom labels** for new vehicle types:
   ```
   custom_label_0 = vehicle_make (Ford, Ram, Chevy)
   custom_label_1 = vehicle_model (F-150, 1500, Silverado)
   custom_label_2 = product_type (seat-covers, grab-handles)
   ```
3. **Campaign structure** (don't launch yet, just prep):
   ```
   Campaign: Bartact - Ford Accessories
     └─ Ad Group: Ford F-150 Seat Covers
     └─ Ad Group: Ford F-250 Seat Covers
   
   Campaign: Bartact - Ram Accessories
     └─ Ad Group: Ram 1500 Seat Covers
   ```

#### Indexing Strategy (CRITICAL - WON'T BURN QUOTA)
**Two-phase approach:**

**Phase 1: Pre-Launch (DO NOW)**
1. Create collection pages (Ford, Ram, Chevy brand hubs + model pages)
2. Add placeholder content ("Coming Soon - Ford F-150 tactical seat covers")
3. Submit to GSC **once** per collection (5-10 URLs total)
4. Let Google index the structure

**Phase 2: Product Launch (WHEN READY)**
1. Add products to Shopify
2. Shopify auto-submits to Google Merchant Center
3. Manual IndexNow submit for new product pages (1 batch)
4. GSC auto-discovers via sitemap (no extra quota needed)

**Why this works:**
- Pre-creates URL structure Google expects
- Avoids "thin content" penalty (pages have intro copy)
- When products go live, Google already knows the collections exist
- Shopify handles most indexing via sitemap (doesn't count against GSC quota)

#### Content Prep (DO BEFORE LAUNCH)
**Write these collection descriptions NOW:**

1. **Ford F-150 Seat Covers** (500 words)
   - Custom-fit for [years]
   - Built for work trucks + recreation
   - Dog-friendly, MOLLE panels, Made in USA
   
2. **Ram 1500 Seat Covers** (500 words)
   - Same template, Ram-specific
   
3. **Chevy Silverado Seat Covers** (500 words)
   - Same template, Chevy-specific

**Why now?**
- Google penalizes thin/empty collection pages
- Pre-written content = launch day is just adding products
- No scrambling to write copy when you're busy with inventory

---

## Action Plan

### THIS WEEK (Before Expansion)
1. ✅ Homepage meta fixed
2. ⬜ Audit all existing collection page metas
3. ⬜ Run Lighthouse audit on homepage + 3 product pages
4. ⬜ Check image alt text on top 20 products

### BEFORE EXPANSION LAUNCH
1. ⬜ Write Ford/Ram/Chevy collection descriptions (3-5 models each)
2. ⬜ Create collection pages in Shopify with "Coming Soon" content
3. ⬜ Submit new collection URLs to GSC (one-time, ~15 URLs)
4. ⬜ Set up Google Merchant Center custom labels
5. ⬜ Prep (but don't launch) Google Ads campaigns for new vehicles

### LAUNCH DAY
1. ⬜ Add products to Shopify
2. ⬜ Remove "Coming Soon" from collections
3. ⬜ IndexNow batch submit new product URLs
4. ⬜ Monitor GSC for indexing (autopilot via sitemap)
5. ⬜ Launch Google Ads campaigns (if/when approved)

---

## Quota / Token Concerns

**Google Search Console Indexing API:**
- Quota: 200 URLs/day
- Current usage: ~27/day (existing automation)
- **Safe for expansion:** Pre-launch collections (15 URLs one-time) + launch products (30-50 URLs one batch) = well within limits

**IndexNow:**
- No quota limits
- Use for product launches

**Shopify API:**
- No relevant limits for this work

**GSC Data API (rank checking, etc.):**
- Current usage: fine
- Expansion won't increase (same checks, just more keywords)

---

## Bottom Line

**Nothing will "fuck with Google" or burn tokens IF you:**
1. Pre-create collection pages with real content (not thin/empty pages)
2. Submit collections to GSC **once** before launch
3. Let Shopify auto-handle product indexing via sitemap
4. Use IndexNow for immediate visibility (no quota)

**You're safe to prep everything now.** The structure I outlined avoids:
- Thin content penalties
- Index bloat (only quality pages)
- Quota exhaustion (smart submission strategy)

**When you're ready to launch new vehicles, it'll be plug-and-play.**

---

**Next Steps:**
1. Review this doc
2. Tell me which vehicles/models you're adding first
3. I'll write the collection descriptions
4. We create the structure in Shopify
5. You add products when ready

No surprises, no quota burns, no Google penalties.
