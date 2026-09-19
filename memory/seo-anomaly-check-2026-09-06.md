# SEO Anomaly Check — 2026-09-06 15:00 UTC

## Result: ALL CLEAN ✅ — No alert sent

---

## 1. SSL Checks (9 critical domains)
All domains: SSL valid (ssl_verify_result=0) + HTTP 200 final

| Domain | HTTP | SSL | Days Left |
|---|---|---|---|
| bartact.com | 200 | ✅ | 49 |
| bullstrap.com | 200 | ✅ | 64 |
| skipatip.com | 200 | ✅ | 34 |
| recentratings.com | 200 | ✅ | 49 |
| bloxfilters.com | 200 | ✅ | 75 |
| gridguardsusa.com | 200 | ✅ | 38 |
| bowtiefilters.com | 200 | ✅ | 86 |
| factorfilters.com | 200 | ✅ | 78 |
| faithfulpassages.com | 200 | ✅ | 41 |

Note: skipatip.com at 34 days — approaching renewal, watch next week.

---

## 2. Walk Industrial Sites — Content Check
- bloxfilters.com ✅ — 0 real affiliate signals, 37 brand signals. Title: "BLOX™ Filter Systems for Dürr EcoDry X Trolley | Walk Industrial"
- gridguardsusa.com ✅ — 0 affiliate signals, 31 brand signals. Title: "Grid Guards® USA | Patented Reusable Paint Booth Grid Protection"
- bowtiefilters.com ✅ — 0 affiliate signals, 38 brand signals. Title: "BowTie Filters | Patented Paint Booth Exhaust Filters by Walk Industrial"
- factorfilters.com ✅ — 1 signal triggered "buy now" = FALSE POSITIVE (inside Judge.me review widget settings JSON, `widget_ugc_primary_button_text`). Not affiliate content. 7 brand signals present. Correct title confirmed.

---

## 3. Bartact Top 10 Collections — Meta Descriptions
All 10 confirmed with global.description_tag metafields present (bartact.myshopify.com):

| Collection Handle | Status |
|---|---|
| jeep-wrangler-seat-covers | ✅ |
| jeep-wrangler-seat-covers-accessories | ✅ |
| molle-accessories | ✅ |
| ford-bronco-seat-covers | ✅ |
| jeep-gladiator-seat-covers | ✅ |
| toyota-tacoma-seat-covers | ✅ |
| toyota-4runner-seat-covers | ✅ |
| jeep-grab-handles | ✅ |
| paracord-grab-handles | ✅ |
| molle-pouches-molle-accessories-gear-bags-by-bartact | ✅ |

---

## 4. Bull Strap Shopify Token
- Store: bull-strap-78.myshopify.com
- Token: shpat_4211c9ff...
- API response: HTTP 200 ✅ (token valid)

---

## 5. HTTP Status — Any 404 or 500 (Main Domains)
- All 9 critical domains return HTTP 200 ✅
- No domain-level 404 or 500 detected

---

## 6. Strike Log & Carry-Forwards
- **molle-pouches-gear-bags redirect** — Previously resolved 2026-09-05. Verified today: 301 chain working correctly (apex → www → /collections/molle-pouches-molle-accessories-gear-bags-by-bartact → 200). ✅ Still resolved.
- No open strikes. Strike log clean.

---

## Notes
- skipatip.com SSL cert expires in ~34 days (around Oct 10). No action needed yet; watch closely next week.
- factorfilters.com false-positive "buy now" pattern is consistent with previous runs; comes from Judge.me widget JSON blob, not page content.
