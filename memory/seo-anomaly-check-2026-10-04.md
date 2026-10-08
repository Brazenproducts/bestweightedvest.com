# SEO Anomaly Check — 2026-10-04 15:00 UTC (Sunday)

**Result: 1 issue (Bartact meta descriptions). Strike 2/3 — SILENT EXIT, no message to Mitch.**

| Check | Result |
|---|---|
| SSL (9 domains) | ✅ All valid. Earliest expiry bullstrap.com Nov 9 (~36 days). None <30 days. |
| Walk Industrial content (blox/gridguards/bowtie/factor) | ✅ All correct brand content, zero affiliate markers |
| Bartact top 10 collections meta descriptions | ❌ All 10 missing `<meta name="description">` (pages still 200) |
| Bull Strap Shopify token | ✅ HTTP 200 on bull-strap-78.myshopify.com (correct shop) |
| HTTP 404/500 (all 9 domains) | ✅ None — all apex return 200 |

## SSL expiry dates
- bartact.com: Dec 24 | bullstrap.com: Nov 9 (earliest) | skipatip.com: Dec 13
- recentratings.com: Dec 26 | bloxfilters.com: Nov 21 | gridguardsusa.com: Dec 14
- bowtiefilters.com: Dec 1 | factorfilters.com: Nov 23 | faithfulpassages.com: Dec 17

## Walk Industrial content (verified brand titles)
- bloxfilters.com: "BLOX™ Filter Systems ... | Walk Industrial" ✅
- gridguardsusa.com: "Grid Guards® USA | Patented Reusable Paint Booth Grid Protection" ✅
- bowtiefilters.com: "BowTie Filters | ... by Walk Industrial" ✅
- factorfilters.com: "Buy HVAC Air Filters Online ... Factor Filter™" ✅
- 0 affiliate markers on all four.

## Bartact top 10 collections checked (all 200, all name=description MISSING)
best-sellers, accessories, jeep-wrangler-seat-covers, fire-extinguisher-holders,
bull-strap, ford-bronco-seat-covers, bull-strap-tie-downs-and-recovery,
cargo-tie-downs, heated-seat-covers, molle-pouches-molle-accessories-gear-bags-by-bartact

## Strike reasoning (Bartact meta descriptions)
3-strike-rule item (NOT SSL, NOT wrong-content — no immediate alert).
- Oct 2: CLEAN (reset counter)
- Oct 3: Strike 1 (new cycle)
- Oct 4 (today): persists → **Strike 2 of 3**. No alert.
- If still broken Oct 5 → Strike 3 → ALERT fires.
Pattern: og:description consistently present; the standard name=description tag flaps
(likely theme/metafield output intermittency).

## Note (informational, NOT alert-worthy)
skipatip.com apex redirects (307) → www.skipatip.com; apex resolves 200.
www.skipatip.com responses are slow/flapping (17–21s; 1 of 3 probes timed out at 25s).
This is a performance anomaly, not a 404/500, not SSL, not wrong-content — outside
defined break criteria. Watch next run; if www starts returning non-200 consistently,
it would qualify as an HTTP error item under the 3-strike rule.
