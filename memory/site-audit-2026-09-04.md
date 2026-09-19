# Site Audit — 2026-09-04 06:00 UTC

## Results
- **Live:** 360 / 382
- **Down:** 13 (same as previous run — no new failures)
- **Previous run (2026-09-03):** 360 live / 13 down → **Net change: 0** (no sites recovered, no new failures)
- **Alert triggered:** No (0 newly downed sites; threshold is >10)

## Dashboard
- Rebuilt via `/tmp/rebuild-axl-dashboard.js`
- Pushed to GitHub: https://github.com/Brazenproducts/axl-dashboard (commit: e751f4f)
- Dashboard stats: 302 A, 68 B, 10 C, 635 D, 0 F, 12 X — 1027 total pages

## Dead Sites (13 — all chronic, same as last three runs)

| Domain | Status | Issue |
|--------|--------|-------|
| bestdutchoven.com | SSL error | GitHub Pages cert mismatch |
| bestantiagingsupplement.com | SSL error | GitHub Pages cert mismatch |
| bestdogtrainingcourse.com | SSL error | GitHub Pages cert mismatch |
| besthvacfilter.com | 404 | Not found |
| bestoffroadbrands.com | 404 | Not found |
| bestpastamaker.com | SSL error | GitHub Pages cert mismatch |
| bestreciprocatingsaw.com | SSL error | GitHub Pages cert mismatch |
| bestsousvide.com | SSL error | GitHub Pages cert mismatch |
| besttireinflator.com | SSL error | GitHub Pages cert mismatch |
| topespressomaker.com | SSL error | GitHub Pages cert mismatch |
| utvaccessory.com | SSL error | GitHub Pages cert mismatch |
| whatsizehvacfilter.com | 404 | Not found |
| wholehouseairfilter.com | 404 | Not found |

## Notes
- All 13 failures are carry-overs — chronic since at least 2026-08-30.
- SSL failures = GitHub Pages cert mismatch on custom domain CNAME configs.
- 404s need redeployment.
- No critical alert sent — no newly downed sites this cycle.
- **TODO:** Fix cron job — references `workspace/scripts/site-audit.js` but actual scripts live in `/tmp/`. Should update cron to point at `/tmp/site-audit.js` and `/tmp/rebuild-axl-dashboard.js`.
