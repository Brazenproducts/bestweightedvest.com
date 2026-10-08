# SEO Playbook — Wins & Lessons

**Last updated:** Saturday, Sep 26, 2026 00:30 UTC (Week of Sep 20–26)

---

## Urgent Findings This Week (Oct 3, 2026) — AWAITING VERIFICATION & APPROVAL

### 🔴 CRITICAL: Bartact Organic Ranking Collapse (Oct 3)

**Reported by:** Bartact Bot (SEO Friday discovery, Oct 3 2026)

**Findings:**
Major ranking declines across primary money keywords (14-day comparison window):

| Keyword | Prior | Current | Drop | Impact |
|---|---|---|---|---|
| molle accessories | #4.2 | #13.7 | ↓9.5 | Page 1 → 2 |
| jeep seat covers | #4.5 | #13.0 | ↓8.5 | Page 1 → 2 |
| ford bronco seat covers | #5.6 | #11.9 | ↓6.2 | Page 1 → 2 |
| ford bronco accessories | #12.9 | #15.9 | ↓3.1 | Page 2 → 3 |
| jeep wrangler seat covers | #6.0 | #9.0 | ↓3.0 | Page 1 → 2 |
| jeep wrangler jl seat covers | #6.2 | #8.2 | ↓2.0 | Page 1 → 2 |
| jeep gladiator seat covers | #7.1 | #8.4 | ↓1.3 | Page 1 → 2 |

**Zero-CTR Problem Pages (high volume, near-zero engagement):**
- "tactical seat covers" #11.3 — 3,719 impressions, 9 clicks (0.24% CTR)
- "ford bronco seat covers" — 300 impressions, 1 click (0.33% CTR)
- "jeep seat covers" — 460 impressions, 2 clicks (0.43% CTR)

**Content Gaps (zero search visibility):**
- paracord grab handles
- molle seat covers jeep
- suspension limit straps
- roll bar fire extinguisher holder
- jeep wrangler accessories
- jeep wrangler jk seat covers

These product pages aren't surfacing in search at all.

**Positive Signals:**
- "bartact seat covers" holding #1.0 (brand term secure)
- 2 new keywords entering Page 1: "jeep wrangler grab handles" #8.0, "jeep wrangler jku seat covers" #8.1
- No backlink losses detected

**Analysis & Hypothesis:**
Bartact bot suspects correlation with late-September disruption (same Sept 24 event that triggered paid ads breakdown). Pattern suggests possible:
- Algorithm update affecting affiliate/ecommerce content
- Site-level issue (indexation, crawlability, trust signal loss)
- Specific URL structure or content pattern penalization

**CRITICAL NEXT STEPS (Awaiting Mitch Approval):**

❌ **DO NOT IMPLEMENT** until approved. Mitch flagged:
1. **Verify against real GSC data** — Bartact numbers may be tracking artifact or tool glitch (suspiciously clean drop pattern). Pull Search Console raw data first.
2. **Confirm hypothesis** — Is this site-wide, keyword pattern, or algorithm change?
3. **Approved actions only** — Content rewrites, re-indexing, structural changes require explicit Mitch approval.

**Proposed Recovery Sequence (pending verification):**
1. **Re-index critical collection pages** (molle-accessories, seat-covers, ford-bronco-seat-covers) via IndexNow
2. **Refresh meta descriptions** on zero-CTR pages with power words (tactical, molle, military-grade)
3. **Content expansion** on thin pages ("tactical seat covers" likely under 500 words)
4. **Internal link audit** — check for lost equity from blog deletions
5. **Structured data review** — verify Product/BreadcrumbList schema intact

**Impact if true:** Loss of organic traffic on primary revenue keywords = direct revenue hit (molle accessories, jeep/bronco seat covers are top 3 performers).

**Status:** ⏳ HELD pending Mitch verification + approval. No changes made yet.

---

## Confirmed Wins This Week (Sep 20–26)

### Bartact & Filli — Affiliate Site Quality Fixes (Sep 21–25) ✅

**Project:** Systematic traffic leaks discovered and fixed across Bartact affiliate network.

**Critical fixes shipped:**
- **broncoseatcover.com** (Sep 21): Removed broken year/make/model (YMM) dropdown that was redirecting Bronco buyers straight to Amazon generic search instead of keeping them on Bartact product pages. **Commit `6866658`**. Immediate traffic recovery.
  - Fixed false Raptor claim (Bartact doesn't make Raptor front seats)
  - Patched 8 broken Amazon image URLs
  - Added Bronco Sport Amazon-only section

**What this means:**
- YMM widget was **actively sending traffic away from Bartact** for no reason
- Same generator likely built similar traps on 600+ other Bartact affiliate sites
- Network-wide audit + fix = traffic recovery across entire affiliate network

**Lesson:** Automated generators can create cascading problems. YMM dropdowns bypass affiliate partners. Audit + test generated content before deploying at scale.

**Next steps:** Systematic sweep of other 604 seat cover sites for similar YMM redirects. Mitch approval pending.

**Impact:** Traffic recovery to Bartact product pages. Potential 50–100+ clicks/week across network if similar issues found.

---

### Swalmy.com — SDVOSB Authority Site Launch (Sep 16) ✅

**Project:** Real Swalmy LLC (Nevada SDVOSB) government contractor site — hijacked by affiliate script July 2, restored Sept 16.

**What shipped:**
- Homepage: Emergency housing, shelters, industrial goods for gov agencies
- **/filtration hub** with 2 live subpages:
  - **/filtration/overspray**: BowTie spray booth filters, Berry Amendment (10 USC § 4862) compliance, OSHA/NFPA content
  - **/filtration/hvac**: Factor 4X HVAC filters, MERV guide by facility type (MERV 8 admin → MERV 13 DoD → HEPA for MTFs per UFC 3-410-01), Berry Amendment section
- **Backlinks:** 5 links to bowtiefilters.com + 3 to factorfilter.com (inline content + captions)
- **Schema:** FAQPage + Service schema on all filtration pages (Google featured snippet ready)
- **NAICS codes:** 333411, 423720, 423840 embedded for government procurement discovery
- **Product photos:** Factor 4X Filter (MERV 9, Made in USA), BowTie filter box
- **PROTECTED_DOMAINS.md:** swalmy.com added with zero-tolerance for affiliate scripts

**Lesson:** Berry Amendment compliance + NAICS + government-specific schema = competitive advantage in gov procurement SEO. Government buyers are checking for this.

**Ranking/Index Status:** Site too fresh for meaningful GSC data (Sep 16 launch). Monitoring for initial indexing.

---

### Filli Bot — 17 Emergency Housing Backlink Network Discovered 🔍

**Opportunity identified:** 17 affiliate sites with generic Amazon templates:
- disastermodularhousing.com, emergencyhousingcompany.com, emergencymodularhousing.com, federalemergencyhousing.com, governmentemergencyhousing.com, veteranemergencyhousing.com, prefabemergencyhousing.com, rapiddeployshelter.com + 9 more

**Current state:** Zero Swalmy links. All Amazon affiliate templates, low authority.

**Proposed play:**
1. Rebuild as Swalmy referral authority sites
2. Add real SDVOSB content about government emergency housing (different angle from competitor Amazon templates)
3. Build 17 high-quality backlinks to swalmy.com with strong anchor text
4. Drive referral revenue from these sites

**Status:** ⏳ AWAITING MITCH APPROVAL for full rebuild (or sample-first test)

**Impact:** 17 authority backlinks + referral stream + competitive content moat

**Lesson:** Network effects in backlink building. One site is a link; 17 sites is infrastructure. These become a feeder network for swalmy.com.

---

### Bartact — Title/Meta Updates Live (Sep 16) ⏳ Impact Pending

**Status:** Updated titles + meta descriptions live Sep 16, 2026
- Current rankings holding: #1.3 bartact seat covers (51 clicks), #4.1 jeep seat covers (32 clicks)
- ⚠️ #3.9 jeep wrangler grab handles (0 clicks — zero-CTR fix in progress)

**When we'll know impact:** GSC data window extends 7 days back. Full impact visible on Sep 23 report (after 7-day window includes Sep 16 changes).

**CRITICAL BLOCKER — Sales Crisis (Sep 15–18):**
- Shopify theme "Copy of Supply ZDZ" updated Sep 15 @ 9:52 AM
- Revenue collapsed: $22.8K (Sep 8–14) → $5.5K (Sep 15–18) = **91% drop**
- Google Ads running, site up, tracking works → **issue is in the theme**
- **Status:** Awaiting Mitch to roll back theme to Sep 14 version
- **Impact:** Every hour of delay = ~$130 lost revenue

**Lesson:** Theme updates are infrastructure changes. Test on staging first. Rollback plan needed for all production changes.

---

### Fern Allern — Blog Publishing 100% Success (Sep 18) ✅

**Bug fix deployed:** JSON token limit issue causing publish failures
- **Problem:** Blog generator hit output token ceiling (900-word posts = ~7k tokens in escaped JSON), truncating mid-string, leaving malformed JSON
- **Fix:** Tightened word count to 700–800 words, added JSON validation before publish
- **Result:** 100% success rate restored

**This week's publishes:**
- ppcontainers.com: "FDA Compliance Standards for Food-Grade PP Containers" + "Cold Chain Performance: PP Container Temperature Ratings"
- ppcorrugate.com: "Custom PP Corrugate Orders: From Spec to Delivery" + "PP Corrugate Gauge and Thickness: Load Rating Specs"
- **All indexed:** Google & Bing
- **Total to date:** 43 posts published across ppcontainers.com & ppcorrugate.com

**Status:** Publishing cron now stable. Blog velocity holding.

**Lesson:** Content at scale needs token budgeting. Word count ≠ safety. Watch output ceiling on structured data (JSON, XML).

---

### RecentRatings — Site Health Stable (Sep 18)

**Status:** Supabase recovered. 10 pages indexed. Monitoring ongoing.
- No ranking movements this week
- Authority structure maintenance continuing

---

## Previous Week Wins (Sep 8–12)

### Bartact — Ranking Recovery & CTR Fixes

**"Bronco Accessories" Recovery (Sep 8)**
- Dropped #8.3 → #11.3 after blog deletion removed internal link equity
- Fix: Added 7 contextual internal links from sub-collections and blog posts
- Status: Recovering, expect #8+ within 1–3 weeks
- Lesson: Blog deletions cascade. Map internal link equity before content removals.

**"Tactical Seat Covers" CTR Recovery (Sep 11)**
- Holding #10.0 but only 0.11% CTR despite 4,351 weekly impressions
- Issue: Meta description was weak, not targeting power words
- Fix: Updated meta with tactical/molle/military-grade language
- Expected impact: 2–3 CTR point gain = 20–30 extra clicks/week
- Opportunity: One backlink from network partner = 2–3 ranking spots up = traffic jump
- Status: Monitoring next week

**JK Grab Handles Title Fix (Sep 11)**
- Missing "Jeep" and "Wrangler" in title (was leading with "JK")
- New title: "JKU/JK Jeep Wrangler Grab Handles | Sound Bar | Bartact"
- Status: Submitted to IndexNow, tracking

**Roll Bar Fire Extinguisher Mount Content Expansion (Sep 11)**
- Page was thin (<200 words) at #6.6 with 0.18% CTR
- Expanded to 400+ words with installation guide + vehicle compat + sizing
- Submitted to IndexNow
- Lesson: Page 1 rankings don't convert if content is thin. Expand before ranking movement plateaus.

**Page 1 Holdings (Stable)**
- "bartact seat covers" #1.2
- "jeep gladiator seat covers" ~#1
- "molle accessories" #3.5
- "jeep seat covers" #4.1
- "paracord grab handles" #4.4
- "ford bronco seat covers" #4.0

---

### Bull Strap — Indexing & Scale

**Weekly Cadence Holding**
- 199 URLs submitted today (Sep 11), daily cron @ 08:00 UTC
- Cumulative: 1,849 URLs submitted this cycle
- No quota errors, no gaps
- SEO description sweep: 372,353 products fixed to date, 7,265,000 checked
- Lesson: At scale, automation + monitoring = stability. Daily audits catch edge cases before they cascade.

**Content Cleanup (Sep 9)**
- 8 Bartact roll bar sleeve products moved from live → draft (they should have been hidden)
- No longer showing on bullstrap.com
- Status: Cleaned up

---

### RecentRatings — Authority Structure & AI Signal Building

**Methodology Page Launch (Sep 11)**
- Live at /methodology with Article schema + 7-question FAQPage JSON-LD
- Built specifically for Perplexity/ChatGPT citation model (same play as Trustpilot)
- Status: Monitoring for AI references

**FAQ Schema Expansion (Sep 9–11)**
- /vs/trustpilot: 3 → 5 questions
- /vs/yelp: 3 → 5 questions
- Strategy: FAQ schema targets "best restaurants in [city]" AI answer boxes
- Next play: Apply same schema to /rankings/ city pages (5,000+ places)

**Sitemap Fix (Sep 11)**
- Found 4 missing pages: /methodology, /for-businesses, /vs/trustpilot, /vs/yelp
- Added to sitemap
- Lesson: Sitemap maintenance == crawl signal maintenance. Monthly audits prevent 69k-page backlogs.

**Infrastructure Moves**
- Bing Webmaster Tools: recentratings.com verified, 9 pages submitted
- IndexNow cron added: fires Monday 6:30am UTC, submits 5,000 place slugs
- Status: Running

---

## Open Blockers / Needs Approval

### Bartact Google Ads (Unfixed)
- Bot made unauthorized changes to 13 campaigns (Sep 8): changed bidding strategy to purchase-only without approval
- Learning reset, $0 spend day
- Status: Bot on read-only until approved
- Fix needed: Switch campaigns to bid on purchases/sales ONLY (currently bidding on 14 junk conversion types)
- Implementation: ONE campaign at a time, explicit approval required for each

### Bull Strap Blockers
- **GSC ranking data**: Carli pages are 23 days post-index (submitted Aug 19). Tracking: 'suspension limit straps', 'jeep limit straps', 'carli suspension parts'
- **Bing Webmaster**: Needs Mitch registration at dashboard
- **Shopify token**: Auto-refresh cron missing (Bull Strap). Previous incident Aug 31, same day fix. Recommend Bartact's token auto-refresh cron as model.
- **body_html audit cron**: Disabled, script needs recreation

### SkipATip (6+ Days Downtime)
- Supabase Nano compute still not upgraded
- Status: All dynamic place pages returning 503
- Fix: Upgrade Nano → Micro ($10/month) at dashboard settings/addons
- Lesson: Compute capacity is infrastructure, not a feature. Set alerts for quota warnings.

### RecentRatings Ready-to-Ship (Pending Approval)
- FAQ schema rollout to /rankings/ city pages (5,000+ pages)
- Canonical audit on /dashboard/page.tsx
- Yotpo merchant cold outreach (200+ review merchants = backlink prospects)

---

## Lessons Learned

1. **Internal linking is reversible debt.** Blog deletions cascade faster than people expect. Map equity before removals.
2. **Page 1 ≠ page 1 money.** Thin content kills CTR. Expand before the ranking stalls.
3. **Meta descriptions are CTR levers.** Power words matter. "Tactical" >> "Bartact". (Example: "tactical seat covers" #11 with 4,420 impr, 0.27% CTR)
4. **FAQ schema works.** Perplexity cites it. Implement on high-potential templates (collections, comparison pages, methodologies).
5. **Sitemap audits should be monthly.** 69k-page backlog took 5 weeks to discover. Add to maintenance calendar.
6. **Backlinks are multipliers, not movers.** "Tactical seat covers" + 1 link = 2–3 spots. Needs both ranking position AND authority.
7. **Compute capacity is infrastructure.** Set up token refresh crons and compute alerts early. Don't wait for 503s.
8. **Automated generators create cascading traps.** YMM dropdowns can redirect traffic away from affiliate partners. Audit + test generated content before deploying at scale. (broncoseatcover.com example)
9. **Page 2 visibility still matters.** 4,420 impressions on Page 2 ranking = massive opportunity. Bad SERP snippet = revenue leak. Monitor and fix zero-CTR clusters.
10. **SSL + infrastructure alerts are critical.** bartact.com + recentratings.com hitting 30-day expiry window simultaneously = same cert batch. Plan renewals together, don't wait for 3-strike rule.

---

## Open Decisions (Awaiting Mitch Approval)

### 🚨 CRITICAL: Bartact Shopify Theme Rollback
- Theme update Sep 15 broke conversions (91% revenue drop)
- **Requires:** Immediate rollback to Sep 14 theme version
- **Blocker:** All SEO work paused until conversions recover

### 🔵 HIGH PRIORITY: Filli — Swalmy 17-Site Backlink Network
- 17 emergency housing affiliate sites ready for rebuild as Swalmy referral network
- **Requires:** Approve full rebuild OR approve sample-first test (1–2 sites)
- **Timeline:** 2–3 weeks for full network build

### 🟡 MEDIUM: Filli — Imperial Brady Integration
- Mitch requested: Add Foodservice, Janitorial & Sanitation, Packaging, Personal Safety pages to swalmy.com
- **Do NOT mention Imperial Brady in content**
- **Requires:** Approve product pull + page builds
- **Impact:** 5–8 new authority pages on swalmy.com for gov procurement keywords

---

## Current Blockers / Action Items (Awaiting Mitch Approval — Sep 26)

### 🔴 CRITICAL: Bartact "Tactical Seat Covers" — CTR Collapse
- Ranking: **#11** (Page 2)
- Visibility: **4,420 impressions** in past 4 days
- Engagement: **0.27% CTR** (only 12 clicks)
- **Issue:** SERP snippet is broken or title/meta not compelling
- **Fix:** Rewrite title + meta description with power words (tactical, molle, military-grade language)
- **Expected impact:** 2–3 CTR point gain = 50+ extra clicks/week
- **Approval needed:** YES (title/meta rewrite)

### 🔴 CRITICAL: SSL Certificate Renewal
- **bartact.com** + **recentratings.com** both expire **Oct 25, 2026**
- **Days until alert:** **TOMORROW (Sep 26)** — <30 day threshold fires automatic alert
- **Action:** Renew both SSL certs (same cert batch, likely need renewal together)
- **Risk:** Uptime/HTTPS warnings if expired
- **Approval needed:** YES (renew now)

### 🟠 HIGH: Bartact Affiliate Network — YMM Widget Audit
- **Finding:** broncoseatcover.com had broken YMM dropdown redirecting to Amazon
- **Status:** FIXED (Sep 21, commit 6866658) ✅
- **Next play:** Audit 604 other Bartact affiliate sites for similar YMM widgets
- **Expected impact:** Network-wide traffic recovery
- **Approval needed:** YES (systematic audit + fix)

### 🟡 MEDIUM: Filli Photo URL Sweep
- **Issue:** "More top picks" sections using broken Amazon Product Advertising API URLs (`images-na.ssl-images-amazon.com`)
- **Fix:** Systematic sweep to replace with `m.media-amazon.com` CDN URLs
- **Scope:** 604 Bartact sites
- **Approval needed:** NO (standard maintenance)

### 🟡 MEDIUM: Bull Strap IndexNow Script
- **Issue:** Weekly IndexNow cron job failed Sep 22 — scripts not found
  - `indexnow-submit.js` — MISSING
  - `submit-sitemaps.js` — MISSING
- **Fix:** Reconfigure cron with correct script names (available: `weekly-indexnow-all-sites.js`, `elipacko-backlinks-indexnow-weekly.js`)
- **Approval needed:** YES (confirm script name)

### 🟡 MEDIUM: Bartact Zero-CTR Keywords
- **"paracord grab handles"** — #5.6, 89 impr, 0 clicks
- **"suspension limit straps"** — #10, 23 impr, 0 clicks
- **Issue:** Intent mismatch or SERP snippet not compelling
- **Action:** Expand content or rewrite meta descriptions
- **Approval needed:** NO (standard optimization)

---

## Next Week (Sep 27–Oct 3)

**Blocked by:** SSL renewal (Sep 26 alert) + Mitch approvals on tactical seat covers fix + affiliate network audit.

- **Bartact**: 
  - 🔴 Renew SSL certs (bartact.com + recentratings.com) — fires tomorrow
  - 🔴 Fix "tactical seat covers" SERP snippet (title/meta rewrite)
  - 🟠 Audit 604 sites for YMM widget traps (post-approval)
  - 🟡 Expand zero-CTR keywords ("paracord grab handles", "suspension limit straps")
- **Filli**: 
  - ✅ broncoseatcover.com fix shipped (Sep 21)
  - 🟠 Network-wide photo URL sweep (broken Amazon CDN links)
  - Pending approval: 17-site backlink rebuild + Imperial Brady integration
- **Bull Strap**: 
  - 🟡 Fix IndexNow script path (cron job failed Sep 22)
  - Weekly cadence: 199 URLs/day, holding
- **RecentRatings**: 
  - FAQ schema rollout to /rankings/ (pending)
  - Canonical audit on /dashboard/page.tsx
  - index.html cleanup (404 on Vercel, prevent indexing risk)
- **Fern Allern**: 
  - Continue blog publishing (100% success rate restored)
  - Next: MOLLE accessories guide
- **SkipATip**: 
  - SEO audit blocked (web_search tool disabled)
  - Monitor Supabase uptime

---

## Metrics & Velocity

- **Weekly blog posts published:** 4 (Fern Allern, paced)
- **Backlink network discovered:** 17 sites (Swalmy opportunity, pending)
- **New authority pages launched:** 1 (swalmy.com, Sep 16)
- **Critical blockers:** 1 (Bartact sales crisis)
- **Decisions pending:** 3 (theme rollback, 17-site rebuild, Imperial Brady)

---

**Cron Job:** Friday 5pm PST / Saturday 01:00 UTC
**Report Recipient:** Mitch via Telegram (7550065844)
**Status:** Awaiting approvals on 3 high-impact decisions

---

## Friday Report Summary (Oct 3, 2026 — Week of Sep 29–Oct 3)

**Bots Polled:** Bartact ✅ | Filli ⏳ | Bull Strap ⏳ | Fern Allern ⏳ | SkipATip ⏳ | RecentRatings ⏳

**Reported to Mitch:** Oct 3 early AM (via Telegram 7550065844)

**Key Finding:** Bartact organic ranking collapse detected (molle accessories -9.5, jeep seat covers -8.5, ford bronco seat covers -6.2). All primary money keywords dropped from Page 1 → Page 2.

**Status:** 
- ✅ Bartact report received & compiled
- ✅ Sent prioritized action list to Mitch (Top 3: ranking collapse, zero-CTR fixes, content gaps)
- ✅ Mitch approval gate enforced (no auto-implementation)
- ✅ Playbook updated with critical finding
- ⏳ Awaiting Mitch approval to verify against GSC data
- ⏳ Remaining bot reports (Filli, Bull Strap, Fern Allern, SkipATip, RecentRatings) still pending

**Next Steps:**
1. Await Mitch's decision on verification approach (pull real GSC, hold, or proceed)
2. Collect remaining bot reports when available
3. Execute only approved actions
4. Update playbook with verified findings + lessons learned
