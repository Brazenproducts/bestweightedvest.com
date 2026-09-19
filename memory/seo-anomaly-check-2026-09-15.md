# SEO Anomaly Check — 2026-09-15 15:00 UTC

## Result: ALERT SENT ⚠️ — gridguardsusa.com SSL at 29 days

---

## 1. SSL Checks (9 critical domains)

- bartact.com | HTTP:200 | SSL expires Oct 25, 2026 | 40 days ✅
- bullstrap.com | HTTP:200 | SSL expires Nov 9, 2026 | 55 days ✅
- skipatip.com | HTTP:307 | SSL expires Dec 13, 2026 | 88 days ✅ RENEWED (was 26 days yesterday!)
- recentratings.com | HTTP:200 | SSL expires Oct 25, 2026 | 40 days ✅
- bloxfilters.com | HTTP:200 | SSL expires Nov 21, 2026 | 66 days ✅
- gridguardsusa.com | HTTP:200 | SSL expires Oct 15, 2026 | **29 days** ❌ ALERT SENT (threshold: <30 days, immediate)
- bowtiefilters.com | HTTP:200 | SSL expires Dec 1, 2026 | 77 days ✅
- factorfilters.com | HTTP:200 | SSL expires Nov 23, 2026 | 69 days ✅
- faithfulpassages.com | HTTP:200 | SSL expires Oct 17, 2026 | 32 days ✅

**Notable:** skipatip.com SSL renewed — was 26 days yesterday (Oct 11 expiry), now 88 days (Dec 13 expiry). No further alerts needed.
**gridguardsusa.com** hit 29 days — crossed <30 threshold. SSL = immediate alert. Alerted Mitch.

---

## 2. Walk Industrial Sites — Content Check

- bloxfilters.com | "BLOX™ Filter Systems for Dürr EcoDry X Trolley" ✅ Correct
- gridguardsusa.com | "Grid Guards® USA | Patented Reusable Paint Booth Grid Protection" ✅ Correct
- bowtiefilters.com | "Patented Paint Booth Exhaust Filters by Walk Industrial" ✅ Correct
- factorfilters.com | "Buy HVAC Air Filters Online | All Sizes" ✅ Correct

No affiliate junk, no hijacked content on any Walk Industrial property.

---

## 3. Bartact Top 10 Collections — Meta Descriptions

❌ CANNOT CHECK — Bartact Shopify token still 401 Unauthorized.
Strike 2/3 today. Alert triggers at Strike 3 = 2026-09-16 if still broken.

---

## 4. Shopify Tokens — Status

### Bull Strap
- Store: bull-strap-78.myshopify.com
- Token: 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
- HTTP: **401 Unauthorized** — Strike 2/3
- Previous alert sent: 2026-09-13
- Next alert trigger: Strike 3 = 2026-09-16

### Bartact
- Store: bartact.myshopify.com
- Token: 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
- HTTP: **401 Unauthorized** — Strike 2/3
- Previous alert sent: 2026-09-13
- Next alert trigger: Strike 3 = 2026-09-16

---

## 5. HTTP Status — Any 404/500

- bartact.com: 200 ✅
- bullstrap.com: 200 ✅
- skipatip.com: 307 (redirect) ✅
- recentratings.com: 200 ✅
- bloxfilters.com: 200 ✅
- gridguardsusa.com: 200 ✅
- bowtiefilters.com: 200 ✅
- factorfilters.com: 200 ✅
- faithfulpassages.com: 200 ✅

No 404s. No 500s. All domains responding.

---

## Summary

- SSL (9 domains): gridguardsusa.com at 29 days — ALERTED ❌ | skipatip.com renewed ✅ | all others healthy ✅
- Walk Industrial content: All 4 sites clean ✅
- Bartact meta descriptions: BLOCKED — token 401 (strike 2/3)
- Bull Strap Shopify token: 401 — strike 2/3
- Bartact Shopify token: 401 — strike 2/3
- HTTP 404/500: None ✅

## Action: ONE message sent to Mitch (7550065844) — gridguardsusa.com SSL + heads-up on tokens at strike 2.

**Watch list for tomorrow (2026-09-16):**
- gridguardsusa.com SSL: renew immediately (29 days, alerted)
- Both Shopify tokens: Strike 3/3 if still 401 → ALERT
- faithfulpassages.com: 32 days — approaching threshold, monitor
