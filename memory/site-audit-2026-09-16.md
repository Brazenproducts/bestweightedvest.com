# Site Audit — 2026-09-16 06:00 UTC

## Summary
- **Total sites checked:** 382
- **Live:** 368
- **Down:** 14
- **Newly down since 2026-09-15:** 0
- **Recovered since 2026-09-15:** 9
- **Critical threshold (>10 new down):** ❌ NOT triggered

## Dashboard Rebuild
- Script: `/tmp/rebuild-axl-dashboard.js`
- Built: 302 A, 68 B, 10 C, 635 D, 0 F, 12 X — 1027 total
- Pushed to: https://github.com/Brazenproducts/axl-dashboard.git (commit ce785af)

## Currently Down Sites (14 total)

**SSL cert mismatch (GitHub Pages CNAME not set):**
- bestdutchoven.com
- bestantiagingsupplement.com
- bestdogtrainingcourse.com
- bestpastamaker.com
- bestreciprocatingsaw.com
- bestsousvide.com
- besttireinflator.com
- topespressomaker.com
- utvaccessory.com

**404:**
- besthvacfilter.com
- bestoffroadbrands.com
- whatsizehvacfilter.com
- wholehouseairfilter.com

**Timeout:**
- beststandmixer.com

## Recovered Since Yesterday (9 sites)
Previously down sites no longer returning errors — likely GitHub Pages propagation resolved for some SSL issues.

## Notes
- 9 sites recovered from yesterday's 23-down list — net improvement
- Persistent SSL mismatch sites (9) still need CNAME fix in GitHub Pages repo settings
- 4 sites with HTTP 404 may need repo/HTML file investigation
- beststandmixer.com timeout is intermittent — monitor
- Cron job config still has stale script paths (`workspace/scripts/site-audit.js`) — actual scripts at `/tmp/` — **needs cron job update**
- Previous open issue: 30 sites using invalid `brazenprodu02-20` affiliate tag (from 2026-09-14 CRITICAL)
