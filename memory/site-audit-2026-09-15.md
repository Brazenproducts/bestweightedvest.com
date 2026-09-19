# Site Audit — 2026-09-15 06:00 UTC

## Summary
- **Total sites checked:** 382
- **Live:** 359
- **Down:** 23
- **Newly down since 2026-09-14:** 0
- **Recovered since 2026-09-14:** 0
- **Critical threshold (>10 new down):** ❌ NOT triggered

## Dashboard Rebuild
- Script: `/tmp/rebuild-axl-dashboard.js`
- Built: 302 A, 68 B, 10 C, 635 D, 0 F, 12 X — 1027 total
- Pushed to: https://github.com/Brazenproducts/axl-dashboard.git (commit 504c39e)

## Currently Down Sites (23 total — same as yesterday)
Sites failing with SSL cert mismatch (GitHub Pages CNAME not set):
- bestdutchoven.com
- bestantiagingsupplement.com
- bestdogtrainingcourse.com
- bestpastamaker.com
- bestreciprocatingsaw.com
- bestsousvide.com
- besttireinflator.com
- topespressomaker.com
- utvaccessory.com

Sites returning 404:
- besthvacfilter.com
- bestoffroadbrands.com
- whatsizehvacfilter.com
- wholehouseairfilter.com

Other:
- beststandmixer.com (timeout)

## Notes
- No new outages since yesterday's run
- Previous CRITICAL alert (2026-09-14) re: broken affiliate tags still open — 30 sites using invalid `brazenprodu02-20` tag
- Cron job paths in job config are stale (`workspace/scripts/site-audit.js`) — actual scripts live in `/tmp/`; flagged for update
