# SEO Anomaly Check — 2026-09-20 15:06 UTC

## Result: ALERT SENT ⚠️ — Both Shopify tokens Strike 4 of new cycle

---

## 1. SSL Checks (9 critical domains)

- bartact.com | HTTP:200 | SSL expires Oct 25, 2026 | **35 days** ✅
- bullstrap.com | HTTP:200 | SSL expires Nov 09, 2026 | **50 days** ✅
- skipatip.com | HTTP:307 | SSL expires Dec 13, 2026 | **83 days** ✅
- recentratings.com | HTTP:200 | SSL expires Oct 25, 2026 | **35 days** ✅
- bloxfilters.com | HTTP:200 | SSL expires Nov 21, 2026 | **61 days** ✅
- gridguardsusa.com | HTTP:200 | SSL expires Dec 14, 2026 | **84 days** ✅
- bowtiefilters.com | HTTP:200 | SSL expires Dec 01, 2026 | **72 days** ✅
- factorfilters.com | HTTP:200 | SSL expires Nov 23, 2026 | **64 days** ✅
- faithfulpassages.com | HTTP:200 | SSL expires Dec 17, 2026 | **87 days** ✅ **RENEWED** (was 30 days on 2026-09-17!)

All SSL clean. faithfulpassages.com cert renewed between Sep 17 and Sep 20 (30→87 days). No SSL alerts.

---

## 2. Walk Industrial Sites — Content Check

- bloxfilters.com | "BLOX™ Filter Systems for Dürr EcoDry X Trolley | Walk Industrial" ✅ Correct
- gridguardsusa.com | "Grid Guards® USA | Patented Reusable Paint Booth Grid Protection" ✅ Correct
- bowtiefilters.com | "BowTie Filters | Patented Paint Booth Exhaust Filters by Walk Industrial" ✅ Correct
- factorfilters.com | "Buy HVAC Air Filters Online | All Sizes | Factor Filter™" ✅ Correct

No affiliate junk, no hijacked content on any Walk Industrial property.

---

## 3. Bartact Top 10 Collections — Meta Descriptions

❌ CANNOT CHECK — Bartact Shopify token 401 Unauthorized (Strike 4 of new cycle; alert sent today)

---

## 4. Shopify Tokens — Status

### Bull Strap
- Store: bull-strap-78.myshopify.com
- Token: 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
- HTTP: **401 Unauthorized** ❌
- New cycle started: 2026-09-17 (Strike 1)
- Today: Strike **4** — Alert sent 2026-09-20T15:06:00Z
- Previous cycle alert: 2026-09-16

### Bartact
- Store: bartact.myshopify.com
- Token: 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
- HTTP: **401 Unauthorized** ❌
- New cycle started: 2026-09-17 (Strike 1)
- Today: Strike **4** — Alert sent 2026-09-20T15:06:00Z
- Previous cycle alert: 2026-09-16
- Context: Mitch regenerated this token on ~Sep 19 but never saved it to .env

---

## 5. HTTP Status — Any 404/500

- bartact.com: 200 ✅
- bullstrap.com: 200 ✅
- skipatip.com: 307 ✅ (expected redirect)
- recentratings.com: 200 ✅
- bloxfilters.com: 200 ✅
- gridguardsusa.com: 200 ✅
- bowtiefilters.com: 200 ✅
- factorfilters.com: 200 ✅
- faithfulpassages.com: 200 ✅

No 404s. No 500s. All domains responding.

---

## Summary

| Check | Status |
|---|---|
| SSL (9 domains) | ✅ All healthy — faithfulpassages renewed (30→87 days) |
| Walk Industrial content | ✅ All 4 clean |
| Bartact meta descriptions | ❌ BLOCKED (token 401, Strike 4 — alert sent) |
| Bull Strap Shopify token | ❌ 401 (Strike 4 — alert sent) |
| Bartact Shopify token | ❌ 401 (Strike 4 — alert sent) |
| HTTP 404/500 | ✅ None |

## Action: ONE message sent to Mitch (7550065844) — both Shopify tokens at strike 4, need regeneration + .env save.

**Watch list for tomorrow (2026-09-21):**
- Bull Strap Shopify token: Awaiting regeneration — continue tracking, alert already sent (no re-alert until new cycle)
- Bartact Shopify token: Awaiting fix — Mitch had token but never saved to .env
- bartact.com + recentratings.com SSL: 35 days — approaching watch territory; alert threshold is <30 days
- All others healthy, no action needed
