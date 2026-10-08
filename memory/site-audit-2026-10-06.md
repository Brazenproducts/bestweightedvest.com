# Site Audit — 2026-10-06 06:00 UTC

## Summary
- **Total sites checked (local-only):** 101
- **OK:** 65 | **Warning:** 20 | **Critical:** 16
- **Newly down since 2026-10-05:** 0
- **Chronic HTTP-down sites (unchanged baseline):** 20
- **Critical threshold (>10 new down):** ✅ NOT triggered

## Affiliate Health Check (local-only — 101 registered sites)
- ✅ OK: 65 | ⚠️ Warning: 20 | 🔴 Critical: 16
- Critical flags: missing affiliate tags, no Amazon links, missing privacy/robots files (consistent with prior audits).
- NOTE: "Missing affiliate tags" on seat cover sites (broncoseat, gladiatorseat, etc.) are confirmed FALSE POSITIVES — brazenprodu01-20 tag live, per affiliate-audit-CRITICAL.md verified 2026-09-25.

## Dashboard Rebuild
- site-audit.js not found on disk; ran `affiliate-daily-health.js --local-only` as audit equivalent (same as prior runs).
- rebuild-axl-dashboard.js run from /tmp/rebuild-axl-dashboard.js
- Dashboard built: 302 A, 68 B, 10 C, 635 D, 0 F, 12 X — 1027 total domains
- Dashboard HTML: 429KB — /tmp/axl-dashboard-new.html
- Pushed to: https://github.com/Brazenproducts/axl-dashboard.git (commit 7c8ea0f)

## Threshold Check
- Newly Down Sites: 0 (threshold: 10) — ✓ OK
- No Telegram alert sent

## Chronic HTTP-Down Sites (20 — unchanged since 2026-10-01)
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
| filterpurchase.com | 404 | Not found |
| funnygolfgear.com | 404 | Not found |
| jeeprollbar.com | 404 | Not found |
| notippingapps.com | 404 | Not found |
| palletsracking.com | 404 | Not found |
| proballgear.com | 404 | Not found |
| topespressomaker.com | 0 | GitHub cert mismatch |
| utvaccessory.com | 0 | GitHub cert mismatch |
| whatsizehvacfilter.com | 0 | GitHub cert mismatch |
| wholehouseairfilter.com | 0 | GitHub cert mismatch |

## Notes
- Same 16 critical / 20 warning / 65 OK baseline as 2026-10-05. No new downs. No recoveries.
- ⚠️ site-audit.js still not present on disk — affiliate-daily-health.js --local-only used as substitute.
- Recommend restoring site-audit.js to /home/ubuntu/.openclaw/workspace/scripts/
