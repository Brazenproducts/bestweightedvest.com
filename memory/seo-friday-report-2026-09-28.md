# SEO Friday Report — Week of Sept 22–28, 2026

Received via inter-session routing (skipatip main Telegram session) during Sat Oct 3 cron run.
NOTE: This covers an EARLIER window (Sep 22–28) than the fernallern report (Sep 29→Oct 2); it's the prior week's report arriving out of order.

## 🔴 HEADLINE: Broad ranking decline — now a trend, not noise
14-day window Sept 15–28 vs prior Sept 1–14.

### Major position losses (Bartact)
| Keyword | Was | Now | Change | Clicks |
|---|---|---|---|---|
| jeep seat covers | #3.9 | #9.7 | ▼5.7 | −33 🔴 |
| molle accessories | #3.9 | #9.5 | ▼5.5 | −5 🔴 |
| ford bronco seat covers | #5.1 | #7.0 | ▼2.0 | −3, now ZERO-CTR |
| jeep wrangler jl seat covers | #5.6 | #7.6 | ▼2.0 | −1 |
| jeep wrangler seat covers | #6.2 | #7.8 | ▼1.6 | −7 |
| jeep gladiator seat covers | #7.0 | #8.0 | ▼1.0 | −3 |
| jeep tj seat covers | #5.4 | #6.3 | ▼0.8 | −4 |
| ford bronco accessories | #12.8 | #15.8 | ▼3.0 | (Page 2) |

### Still holding
- bartact seat covers — #1.2 (brand term) but −59 clicks 🔴
- tactical seat covers — #11.0 flat, 0.23% CTR (3,880 impr, 9 clicks)

### Recovered/new
- "jeep wrangler grab handles" (#6.6), "jeep wrangler jku seat covers" (#7.9) — weak positions

## 📉 Diagnosis
Two back-to-back weeks of decline across nearly every commercial keyword. Points to:
1. Content starvation — 127 collections thin (<500 words), unfixed 11+ days
2. No freshness signal — only 1 blog post this week (MOLLE Accessories for Jeep Wrangler)
3. Possible algorithmic reweighting — simultaneous drop suggests domain-level re-evaluation
4. Click erosion compounding

## 🔗 Backlink / indexing
- Bull Strap indexing: 3,600/78,820 URLs (4.6%). +200/day spike from Sep 25 did NOT hold, back to +2–3/day. ~200+ days to full catalog.
- Bartact blog: only 1 post this week. 16 pending in queue.
- IndexNow weekly cron still broken (indexnow-submit.js, submit-sitemaps.js missing).

## 🚨 Operational blockers (STILL unfixed)
| Issue | Days Broken | Impact |
|---|---|---|
| Bull Strap MC monitoring | 13 days | No product feed visibility; ALSO missing credentials file |
| SkipATip Supabase Disk IO | 11 days | DB frozen at 2,890,854; collection pipeline dead |
| recentratings.com SSL | — | 28 days left, alert sent Sep 26, NOT renewed |
| IndexNow/sitemap cron | 2+ weeks | Scripts missing |
| verify-and-pin-restaurants.js | — | Missing, nightly job failing |

## 🔍 Content gaps
- Weekly audit INCOMPLETE — web_search disabled, no GA creds, GSC service account missing. Can't verify affiliate rankings (bestseatcover.com, tacticalseats.com, bestbroncoaccessories.com).
- 127 thin collections — root cause, unaddressed
- tactical seat covers — pure title/meta problem (rank fine at #11, nobody clicks)

## 📋 Priorities (by impact)
1. 🔴 STOP THE BLEEDING — bulk-expand top 10 collection pages tied to losses (jeep seat covers, molle accessories, bronco seat covers) 300–500 words each
2. 🔴 Publish 3+ blog posts this week (queue has 16 ready)
3. 🟠 Renew recentratings.com SSL (28 days, alerted, not done)
4. 🟠 Fix "tactical seat covers" meta/title
5. 🟡 Restore MC monitoring (needs script AND credentials)
6. 🟡 SkipATip Supabase — frozen, needs tier upgrade or query optimization

## Bottom line
Trend confirmed and accelerated. Brand term safe, everything else sliding. Content expansion is the fix; lost positions harder to reclaim than defend.
