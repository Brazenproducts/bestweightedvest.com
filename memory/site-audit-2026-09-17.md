# Site Audit — 2026-09-17 06:00 UTC

## Summary
- **Total sites checked:** 382
- **Live:** 359
- **Down:** 14
- **Newly down since 2026-09-16:** 0
- **Recovered since 2026-09-16:** 0
- **Critical threshold (>10 new down):** ❌ NOT triggered

## Dashboard Rebuild
- Script: `/tmp/rebuild-axl-dashboard.js`
- Built: 302 A, 68 B, 10 C, 635 D, 0 F, 12 X — 1027 total
- Pushed to: https://github.com/Brazenproducts/axl-dashboard.git (commit d24bf38)

## Currently Down Sites (14 total — same as yesterday)

**SSL cert mismatch (GitHub Pages CNAME not set):**
- bestantiagingsupplement.com
- bestdogtrainingcourse.com
- bestdutchoven.com
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

## Notes
- No change from 2026-09-16 — all 14 down sites are persistent, no new failures
- Cron job config still has stale script paths (`workspace/scripts/site-audit.js`) — actual scripts at `/tmp/` — **needs cron job update**
- Persistent SSL mismatch (9 sites) still needs CNAME fix in GitHub Pages repo settings
- Open issue from 2026-09-14: 30 sites using invalid `brazenprodu02-20` affiliate tag
