# SEO Anomaly Check — 2026-09-03 15:00 UTC

## Result: ALL CLEAN ✅ — No alert sent
## (One new issue logged at Strike 1 — see bottom)

---

## 1. SSL Checks (9 critical domains)
All domains: ssl_verify_result=0 (PASS) + HTTP 200 final
- bartact.com ✅ (301 apex → www, 200 final)
- bullstrap.com ✅ (200)
- skipatip.com ✅ (200)
- recentratings.com ✅ (200)
- bloxfilters.com ✅ (200)
- gridguardsusa.com ✅ (200)
- bowtiefilters.com ✅ (200)
- factorfilters.com ✅ (200)
- faithfulpassages.com ✅ (200)

---

## 2. Walk Industrial Sites — Content Check
- bloxfilters.com ✅ — 0 affiliate signals, 43 brand signals. Title: "blox™ filter systems for dürr ecodry x trolley | walk industrial"
- gridguardsusa.com ✅ — 0 affiliate signals, 25 brand signals. Title: "grid guards® usa | patented reusable paint booth grid protection"
- bowtiefilters.com ✅ — 2 "affiliate signals" = FALSE POSITIVE (same newsletter CTA "get our top picks delivered" as Sept 1). 54 brand signals. Correct brand content showing.
- factorfilters.com ✅ — 0 affiliate signals, 320 brand signals. Title: "buy hvac air filters online | all sizes | factor filter™"

---

## 3. Bartact Top 10 Collections — Meta Descriptions
All 10 confirmed with global.description_tag metafields:
- jeep-wrangler-seat-covers ✅ (143 chars)
- jeep-wrangler-seat-covers-accessories ✅ (157 chars)
- molle-accessories ✅ (137 chars)
- ford-bronco-seat-covers ✅ (144 chars)
- jeep-gladiator-seat-covers ✅ (148 chars)
- toyota-tacoma-seat-covers ✅ (154 chars)
- toyota-4runner-seat-covers ✅ (147 chars)
- jeep-grab-handles ✅ (146 chars)
- paracord-grab-handles ✅ (147 chars)
- molle-pouches-molle-accessories-gear-bags-by-bartact ✅ (145 chars)
  ↳ Handle was renamed from `molle-pouches-gear-bags` — old URL → 404 (see strike log)

---

## 4. Bull Strap Shopify Token
- Token: shpat_4be09561...baeba7b on bull-strap-78.myshopify.com
- API response: 200 ✅ (token valid)

---

## 5. HTTP Status — Any 404 or 500 (Main Domains)
- All 9 critical domains return HTTP 200 ✅
- No domain-level 404 or 500 detected

---

## 6. Additional Notes
- **bartact.com robots.txt**: Daily SEO script flagged it as "may be blocking all crawlers" — FALSE ALARM. www.bartact.com/robots.txt returns standard Shopify robots.txt (HTTP 200, no Disallow: /). Fine.
- **Bull Strap Aug-30 token** (shpat_738...): Returns 401. Stale. .env token is correct and current.

---

## ⚠️ Strike Log — Strike 1 Issues (no alert yet)

### ISSUE: molle-pouches-gear-bags → 404, no redirect
- **First seen:** 2026-09-03
- **Strike count:** 1/3
- **Details:** Collection handle was renamed to `molle-pouches-molle-accessories-gear-bags-by-bartact`. Old URL `/collections/molle-pouches-gear-bags` returns HTTP 404. Zero Shopify redirects configured for this path.
- **Risk:** Any Google-indexed or backlinked URLs at the old handle are now dead.
- **Fix needed:** Add Shopify redirect: `/collections/molle-pouches-gear-bags` → `/collections/molle-pouches-molle-accessories-gear-bags-by-bartact`
- **Action:** Logging strike 1. Alert if still unfixed in next 2 checks.
