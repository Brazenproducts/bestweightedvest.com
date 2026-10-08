# SEO Friday Report — Sept 29 – Oct 2, 2026 (BULLSTRAP session, most complete)

Received via inter-session routing (bullstrap main Telegram session) during Sat Oct 3 cron run.
Third of three reports this cron run. Most comprehensive. Covers same window as fernallern report; supersedes several items from Sep 28 (skipatip) report.

## 🚨 HEADLINE: Bartact ranking collapse → revenue crisis (Oct 1)

### Worst drops (Sept 18 → Oct 2)
| Keyword | Was | Now | Change |
|---|---|---|---|
| jeep seat covers | #4.5 | #13.0 | ▼8.5 (page 2, zero-CTR) |
| molle accessories | #4.2 | #13.7 | ▼9.5 (page 2) |
| ford bronco seat covers | #5.6 | #11.9 | ▼6.2 (page 2, zero-CTR) |
| jeep wrangler seat covers | #6.0 | #9.0 | ▼3.0 |
| jeep gladiator seat covers | #7.1 | #8.4 | ▼1.3 |
| tactical seat covers | #10.7 | #11.3 | ▼0.6 (3,719 impr, 0.27% CTR) |

Bright spot: "bartact seat covers" → #1.0 (brand term dominant).

## 🔴 Revenue crisis (Oct 1)
- Revenue: $241 by 3:33 PM vs $3–4k/day target
- Google Ads spend collapsed: $159.59 vs $1,500–2,000/day (severe throttling)
- Conversion rate: 672 clicks, 1 conversion = 0.15% (normal 2–4%)
- Organic revenue: $172 vs $1,500–2,000 target
- Root cause (ads): likely budget cap or payment method declined/expired — NEEDS MANUAL GOOGLE ADS CHECK BY MITCH
- Mitigation: 6 hardest-hit collection pages resubmitted to Google Indexing API Sep 30 (24–48h recovery window)

## ⚠️ New incidents
**SkipATip Supabase outage (Oct 2) — ESCALATED TO HUMAN**
- DB instance DOWN (PGRST002, ECONNREFUSED :5432). Metadata says ACTIVE_HEALTHY but live = all services UNHEALTHY. Region us-west-1, tied to Supabase networking incident.
- Management API restart returned 200 but still down after 120s. Beyond safe autonomous action (ticket/compute upgrade/PITR all risk cost or data).
- NOTE: This is a DIFFERENT/escalated state than Sep 28 report ("Disk IO, frozen at 2,890,854"). Now full outage.

**Dead ASIN scan (Oct 1) — NEW**
- besttruckaccessories.com: 5 dead; jeepseatcover.com: 3; jlcovers.com: 5; 4runnerseats.com, broncoseat.com, broncointerior.com also affected. Monetization leaks, need swaps.
- Data at dead-asins-full-scan-2026-10-01.json

**Briefing data-path bugs** — reading stale ASIN path; references Bull Strap indexed-state files not in workspace.

## 📊 Content gaps (Sept 28 audit)
- 25+ collections <200 words
- 69 products thin (<100 words) — UP from 60
- 1 product no images: Damron Bottoms Only (2 weeks running)
- Zero-word collections: Ebay Storage, HVAC Filters, Motorcycle Gear, Miscellaneous, Uncategorized, Winch Strap, Seat Belts & Harnesses
- 2 over-length metas: grab-handles (180ch), molle-accessories (165ch)
- Thin-content pages = exactly the ranking losers (strong correlation)

## ✅ Confirmed WINS (supersede Sep 28 blockers)
- **IndexNow FIXED**: both missing scripts (indexnow-submit.js, submit-sitemaps.js) CREATED Sep 29. Cron succeeds next Tuesday.
- **SSL ALL RESOLVED**: bartact.com + recentratings.com RENEWED → Dec 24/26 2026 (83–85 days). All 9 critical domains >30 days, zero alerts. [This closes the Sep 28 recentratings SSL fire I flagged as most urgent.]
- Shopify tokens stable (both 200 OK; Bull Strap refreshed Oct 2)
- Bull Strap indexing steady: 3,617/78,820 (+1,407 this week), 200/day pace
- Bull Strap backlink health improved: 71 collections checked, only 1 failed

## 🟡 Monitor
- Affiliate sites regression: critical 13→16 (up 3); OK 67→65; warning 20 flat
- Site audit downtime grew: down 14→20; 14 GitHub cert mismatches; 6 new 404s (filterpurchase, funnygolfgear, jeeprollbar, notippingapps, palletsracking, proballgear)
- Blog pipelines STILL EMPTY: both Bartact + Bull Strap queues at 0 topics, no new content 2+ weeks

## 🛠️ Action queue
🔴 URGENT: Mitch check Google Ads (budget/payment); SkipATip Supabase human decision; monitor 6 resubmitted pages (48h)
🟠 THIS WEEK: content-expand molle-accessories + jeep-seat-covers; fix 2 over-length metas; swap dead ASINs; refill blog queues; add Damron images; fix briefing data-path bugs
🟡 NEXT: affiliate critical regression; 14 GitHub cert mismatches; 6 new 404 domains; noindex 7 zero-word collections

**Next check:** Fri Oct 9. Focus: did jeep seat covers + molle accessories recover from page 2 after Sep 30 reindex?
