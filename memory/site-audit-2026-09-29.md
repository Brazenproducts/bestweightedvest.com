# Site Audit — 2026-09-29 06:00 UTC

## Summary
- **Total sites checked:** 382
- **Live:** 353 | **Down:** 20
- **Newly down since 2026-09-28:** 0
- **Recovered since 2026-09-28:** 0
- **Critical threshold (>10 new down):** ✅ NOT triggered

## Dashboard Rebuild
- Script: `/tmp/rebuild-axl-dashboard.js`
- Built: 302 A, 68 B, 10 C, 635 D, 0 F, 12 X — 1027 total
- Pushed to: https://github.com/Brazenproducts/axl-dashboard.git (commit e8e6416)

## Threshold Check
- Newly Down Sites: 0 (threshold: 10) — ✓ OK
- No Telegram alert sent

## Newly Down Sites (0)
None — stable from yesterday.

## All Currently Down Sites (20)
| Site | Status | Issue |
|------|--------|-------|
| bestantiagingsupplement.com | 0 | GitHub cert mismatch |
| bestdogtrainingcourse.com | 0 | GitHub cert mismatch |
| bestdutchoven.com | 0 | GitHub cert mismatch |
| besthvacfilter.com | 404 | Not found |
| bestoffroadbrands.com | 404 | Not found |
| bestpastamaker.com | 0 | GitHub cert mismatch |
| bestreciprocatingsaw.com | 0 | GitHub cert mismatch |
| bestsousvide.com | 0 | GitHub cert mismatch |
| beststandmixer.com | 0 | Timeout |
| besttireinflator.com | 0 | GitHub cert mismatch |
| filterpurchase.com | 404 | Not found (down since 2026-09-28) |
| funnygolfgear.com | 404 | Not found (down since 2026-09-28) |
| jeeprollbar.com | 404 | Not found (down since 2026-09-28) |
| notippingapps.com | 404 | Not found (down since 2026-09-28) |
| palletsracking.com | 404 | Not found (down since 2026-09-28) |
| proballgear.com | 404 | Not found (down since 2026-09-28) |
| topespressomaker.com | 0 | GitHub cert mismatch |
| utvaccessory.com | 0 | GitHub cert mismatch |
| whatsizehvacfilter.com | 0 | GitHub cert mismatch |
| wholehouseairfilter.com | 0 | GitHub cert mismatch |

## Notes
- No change from 2026-09-28 — same 20 sites down, 0 new, 0 recovered.
- 14 of 20 down sites have GitHub cert mismatches (CNAME pointing to GitHub Pages with wrong cert). These need CNAME/DNS fixes.
- 6 404s (filterpurchase, funnygolfgear, jeeprollbar, notippingapps, palletsracking, proballgear) likely expired/parked domains — recommend review.
- Cron path corrected: script is `/tmp/site-audit.js`, not `workspace/scripts/site-audit.js`.
