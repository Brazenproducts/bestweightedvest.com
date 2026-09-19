# SEO Anomaly Check — 2026-09-13 15:00 UTC

## Result: ALERT SENT ⚠️⚠️ — Strike 3 triggered (both tokens) + SSL warning

## 1. SSL Checks (9 critical domains)

| Domain | HTTP | SSL Expiry | Days Left | Status |
|---|---|---|---|---|
| bartact.com | 200 | Oct 25, 2026 | 42 days | ✅ |
| bullstrap.com | 200 | Nov 9, 2026 | 57 days | ✅ |
| skipatip.com | 307 (redirect) | Oct 11, 2026 | **28 days** | ⚠️ UNDER 30 — ALERTED |
| recentratings.com | 200 | Oct 25, 2026 | 42 days | ✅ |
| bloxfilters.com | 200 | Nov 21, 2026 | 69 days | ✅ |
| gridguardsusa.com | 200 | Oct 15, 2026 | 32 days | ⚠️ Watch |
| bowtiefilters.com | 200 | Dec 1, 2026 | 79 days | ✅ |
| factorfilters.com | 200 | Nov 23, 2026 | 71 days | ✅ |
| faithfulpassages.com | 200 | Oct 17, 2026 | 34 days | ⚠️ Watch |

**skipatip.com SSL hits 28 days — immediate alert (no 3-strike rule for SSL).**

## 2. Walk Industrial Sites — Content Check
All 4 sites: correct product content, no affiliate junk ✅

- bloxfilters.com — BLOX™ Filter Systems / Walk Industrial content ✅
- gridguardsusa.com — Grid Guards® USA content ✅
- bowtiefilters.com — BowTie Filters / Walk Industrial content ✅
- factorfilters.com — Factor Filter™ HVAC store (Shopify) ✅  
  *(Note: "buy now" matched in deep scan but is legitimate e-commerce CTA, not affiliate. No affiliate network links found.)*

## 3. Bartact Top 10 Collections — Meta Descriptions
❌ **CANNOT CHECK** — Bartact Shopify token returned 401 (Strike 3). Check blocked.

## 4. Shopify Tokens — STRIKE 3 ❌❌
### Bull Strap
- Store: bull-strap-78.myshopify.com
- Token: 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
- HTTP: **401 Unauthorized** — 3rd consecutive day
- First seen: 2026-09-11 | Strike 1→2→3
- **Action: ALERT SENT**

### Bartact
- Store: bartact.myshopify.com
- Token: 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
- HTTP: **401 Unauthorized** — 3rd consecutive day
- First seen: 2026-09-11 | Strike 1→2→3
- **Action: ALERT SENT**

## 5. HTTP Status — Any 404/500
No 404 or 500 on any critical domain ✅

## Summary
| Check | Result |
|---|---|
| SSL (9 domains) | 1 warning (skipatip.com, 28 days) — ALERTED |
| Walk Industrial content | All clean ✅ |
| Bartact meta descriptions | BLOCKED (token 401) |
| Bull Strap token | 401 — Strike 3 — ALERTED |
| Bartact token | 401 — Strike 3 — ALERTED |
| HTTP 404/500 | None ✅ |

## Action: ONE message sent to Mitch (7550065844) listing all 3 issues.
