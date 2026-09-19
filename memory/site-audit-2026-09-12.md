# Site Audit — 2026-09-12 06:00 UTC

## Results
- **Live:** 359 / 382
- **Down:** 14
- **Previous run (2026-09-08):** 359 live / 14 down → **Net change: 0** (no new failures, no recoveries)
- **Alert triggered:** No (0 newly downed sites; threshold is >10)

## Dashboard
- Rebuilt via `/tmp/rebuild-axl-dashboard.js`
- Pushed to GitHub: https://github.com/Brazenproducts/axl-dashboard (commit: 00b08eb)
- Dashboard stats: 302 A, 68 B, 10 C, 635 D, 0 F, 12 X — 1027 total pages

## Dead Sites (14 — all chronic)

| Domain | Status | Notes |
|--------|--------|-------|
| bestdutchoven.com | SSL error | GitHub Pages cert mismatch |
| bestantiagingsupplement.com | SSL error | GitHub Pages cert mismatch |
| bestdogtrainingcourse.com | SSL error | GitHub Pages cert mismatch |
| besthvacfilter.com | 404 | Not found |
| bestoffroadbrands.com | 404 | Not found |
| bestpastamaker.com | SSL error | GitHub Pages cert mismatch |
| bestreciprocatingsaw.com | SSL error | GitHub Pages cert mismatch |
| bestsousvide.com | SSL error | GitHub Pages cert mismatch |
| beststandmixer.com | SSL error | GitHub Pages cert mismatch |
| besttireinflator.com | SSL error | GitHub Pages cert mismatch |
| topespressomaker.com | SSL error | GitHub Pages cert mismatch |
| utvaccessory.com | SSL error | GitHub Pages cert mismatch |
| whatsizehvacfilter.com | 404 | Not found |
| wholehouseairfilter.com | 404 | Not found |

## Notes
- All 14 failures are chronic — same set since at least 2026-09-08 (beststandmixer.com failed on 09-08 and remains down).
- SSL failures = GitHub Pages cert mismatch on custom domain CNAME configs.
- 404s need redeployment.
- No critical alert sent — no newly downed sites this cycle.
- **TODO (carried over):** Fix cron job — references `workspace/scripts/site-audit.js` but actual scripts live at `/tmp/site-audit.js` and `/tmp/rebuild-axl-dashboard.js`. Update cron payload to use correct paths.
