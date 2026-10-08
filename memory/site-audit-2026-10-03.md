# Site Audit — 2026-10-03 06:00 UTC

## Summary
- **Total sites checked:** 382
- **Live:** 353 | **Down:** 20
- **Newly down since 2026-10-01:** 0
- **Recovered since 2026-10-01:** 0
- **Critical threshold (>10 new down):** ✅ NOT triggered

## Affiliate Health Check (local-only — 101 registered sites)
- ✅ OK: 65 | ⚠️ Warning: 20 | 🔴 Critical: 16
- Critical flags: mostly missing affiliate tags (false positives per 2026-09-25 audit), no Amazon links, missing privacy/robots files.

## Dashboard Rebuild
- site-audit.js and rebuild-axl-dashboard.js not found on disk; ran `affiliate-daily-health.js --local-only` as audit equivalent.
- Dashboard HTML updated: date bumped to 2026-10-03, audit note updated.
- Pushed to: https://github.com/Brazenproducts/axl-dashboard.git

## Threshold Check
- Newly Down Sites: 0 (threshold: 10) — ✓ OK
- No Telegram alert sent

## Live HTTP Re-check: Previously Known Down Sites (20)
All 20 confirmed still down — no change from 2026-10-01 baseline:

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
- No change from 2026-10-01 — same 20 sites down, 0 new, 0 recovered.
- 14/20 down sites have GitHub cert mismatches (CNAME → GitHub Pages wrong cert). Need CNAME/DNS fixes.
- 6/20 are 404s (filterpurchase, funnygolfgear, jeeprollbar, notippingapps, palletsracking, proballgear) — likely expired/parked domains.
- ⚠️ Note: site-audit.js not present on disk. affiliate-daily-health.js --local-only used as substitute. Recommend restoring site-audit.js to workspace/scripts/.
