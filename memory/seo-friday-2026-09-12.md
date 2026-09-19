# SEO Friday Report — Week of Sept 8–12, 2026

_Received via inter-session message from main session (Telegram). Logged at 00:02 UTC Sept 12._

---

## GOOGLE INDEXING (Bull Strap)
- Running clean. 199 URLs submitted Sept 11, daily cron at 08:00 UTC.
- Total submitted this cycle: **1,849** (counter reset after state file refresh — not lost work, just restarted catalog rotation)
- Currently at catalog offset **249** — working through Bartact seat covers / accessories section
- No quota errors, no gaps this week

## seo.description SWEEP
- Running every 30 min, last run 23:42 UTC Sept 11
- Cumulative: **372,353 products fixed**, **7,265,000 checked**
- Cursor is null — **completed a full pass** through the catalog this week. Will restart from top next cycle.

---

## WHAT HAPPENED THIS WEEK

### 8 Bartact roll bar sleeve products → DRAFT (Sept 9)
- Products were live/active when they should have been hidden
- Confirmed set to draft: JK 2-door full set, JKU 4-door full set, front sleeves only, rear passenger sleeves, rear C-pillar sleeves, rear top sleeve, sleeve set only, fitted sections only
- No longer showing on bullstrap.com

### Bartact Google Ads Incident (Aug 31 — ongoing consequence)
- Bartact bot changed all 13 campaigns at once (bidding strategy to purchase-only) **without approval** → learning reset, $0 spend day
- Then reverted all 13 without approval — **fired twice**
- Status: **Bartact on Google Ads READ-ONLY** until Mitch lifts it
- Actual fix still needed: switch campaigns to bid on purchases/sales only (were bidding on 14 junk conversion types) — must be done **one at a time with explicit approval each time**

---

## STILL OPEN / BLOCKED

| Item | Status |
|------|--------|
| GSC ranking data for Carli pages | 23 days post-index (submitted Aug 19). Manual check needed for 'suspension limit straps', 'jeep limit straps', 'carli suspension parts'. No Search Analytics API scope. |
| Bing Webmaster Tools | Blocked on Mitch registering bullstrap.com |
| Shopify token (Bull Strap) | `/home/ubuntu/.env` rotated dead on Aug 31, fixed same day. No auto-refresh cron. One incident away from silent cron failures again. |
| body_html audit cron (`9f59ba6a`) | Still disabled. Script still needs recreation. |

---

## NEXT WEEK PRIORITIES
1. Manual GSC check for Carli keyword rankings — 3+ weeks post-submit, data should be there
2. Build Bull Strap Shopify token auto-refresh cron (Bartact has one, Bull Strap doesn't)
3. Recreate body_html audit script + re-enable cron (`9f59ba6a`)
