# Site Audit — 2026-09-28 06:00 UTC

## Summary
- **Total sites checked:** 382
- **Live:** 353 | **Down:** 20
- **Newly down since 2026-09-27:** 6
- **Recovered since 2026-09-27:** 0
- **Critical threshold (>10 new down):** ✅ NOT triggered

## Dashboard Rebuild
- Script: `/tmp/rebuild-axl-dashboard.js`
- Built: 302 A, 68 B, 10 C, 635 D, 0 F, 12 X — 1027 total
- Pushed to: https://github.com/Brazenproducts/axl-dashboard.git (commit b4dc8a9)

## Threshold Check
- Newly Down Sites: 6 (threshold: 10) — ✓ OK
- No Telegram alert sent

## Newly Down Sites (6 — all HTTP 404)
- filterpurchase.com
- funnygolfgear.com
- jeeprollbar.com
- notippingapps.com
- palletsracking.com
- proballgear.com

## All Currently Down Sites (20)
| Site | Status |
|------|--------|
| bestdutchoven.com | 0 (cert mismatch) |
| bestantiagingsupplement.com | 0 (cert mismatch) |
| bestdogtrainingcourse.com | 0 |
| besthvacfilter.com | 404 |
| bestoffroadbrands.com | 404 |
| bestpastamaker.com | 0 |
| bestreciprocatingsaw.com | 0 |
| bestsousvide.com | 0 |
| beststandmixer.com | 0 |
| besttireinflator.com | 0 |
| filterpurchase.com | 404 *(NEW)* |
| funnygolfgear.com | 404 *(NEW)* |
| jeeprollbar.com | 404 *(NEW)* |
| notippingapps.com | 404 *(NEW)* |
| palletsracking.com | 404 *(NEW)* |
| proballgear.com | 404 *(NEW)* |
| topespressomaker.com | 0 |
| utvaccessory.com | 0 |
| whatsizehvacfilter.com | 0 |
| wholehouseairfilter.com | 0 |

## Notes
- Cron job still referencing stale path `workspace/scripts/site-audit.js` — actual script is `/tmp/site-audit.js`. Cron path should be corrected.
- 6 new 404s are likely expired/parked domains — recommend review.
- The 10 sites with status=0 include 2 with GitHub cert mismatches (pointing to GitHub Pages incorrectly).
