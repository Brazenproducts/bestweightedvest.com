# Bing / IndexNow Audit — skipatip.com
**Date:** 2026-09-07  
**Directive:** Mitch via Slashdaddy — mandatory PLAYBOOK rule

---

## Audit Results

### 1. IndexNow Key File
- **Local path:** `/public/b4f7e2a1c3d5e6f7a8b9c0d1e2f3a4b5.txt`
- **Live URL:** `https://www.skipatip.com/b4f7e2a1c3d5e6f7a8b9c0d1e2f3a4b5.txt`
- **Status:** ✅ HTTP 200, content correct

### 2. IndexNow API Submission
- **Result:** ❌ HTTP 403 — `UserForbiddedToAccessSite`
- **Root cause:** Bing IndexNow returns 403 for new domains even with valid key file present; same issue as elipacko.com (known Bing quirk)
- **Fix:** Use Bing Webmaster Tools URL submission API as bypass (same as elipacko.com strategy)

### 3. Bing Webmaster Tools — Site Registration & Verification
- **Pre-audit:** skipatip.com was NOT in the BWT account (info@brazenauto.com); only elipacko.com was
- **Fix applied:**
  - Called `AddSite` API → HTTP 200 ✅
  - Created `/public/BingSiteAuth.xml` with auth code `CC9998D6F5DA5FA1A6B5CA80C30C4E53`
  - Deployed via commit `66ff525`
  - Bing auto-verified on crawl: `IsVerified: true` ✅
- **BWT API Key:** `0a35c8d451e348e099fe46c4533a9f12` (info@brazenauto.com account)

### 4. BWT URL Submission Test
- **Result:** ✅ HTTP 200 — `{"d":null}` — 37 priority URLs submitted successfully

### 5. Sitemap Submission to Bing
- **`SubmitSitemap` API (old format):** HTTP 404 — endpoint deprecated/unavailable
- **`AddOrUpdateSitemap` API:** HTTP 404 — same
- **⚠️ Action needed:** Submit sitemap manually at https://www.bing.com/webmasters → skipatip.com → Sitemaps → `https://www.skipatip.com/sitemap.xml`

### 6. Bing Indexing Status
- **`site:skipatip.com` Bing search:** ✅ Pages indexed and appearing

---

## Fixes Applied

| Fix | Commit / Action |
|-----|----------------|
| Added `BingSiteAuth.xml` to `/public/` | `66ff525` |
| Registered skipatip.com in BWT account | BWT AddSite API call |
| Site verified in BWT | Auto-verified after `66ff525` deploy |
| 37 priority URLs submitted to Bing | BWT SubmitUrlbatch API |
| Weekly cron created | `crontab -l` — Mondays 09:00 UTC |
| Weekly blast script | `scripts/skipatip-indexnow-weekly.js` |

---

## Weekly Cron (Active)
```
0 9 * * 1 cd /home/ubuntu/.openclaw/workspace/skipatip && node scripts/skipatip-indexnow-weekly.js >> /home/ubuntu/.openclaw/workspace/logs/skipatip-indexnow.log 2>&1
```
- Runs every Monday 09:00 UTC
- Submits 37 priority URLs via BWT API (belt-and-suspenders: also tries IndexNow first)
- Log: `/home/ubuntu/.openclaw/workspace/logs/skipatip-indexnow.log`

---

## Remaining Manual Step
- **Sitemap submission:** Log into https://www.bing.com/webmasters with info@brazenauto.com → select skipatip.com → Sitemaps → add `https://www.skipatip.com/sitemap.xml`
- The sitemap API endpoint is not working (404) so this requires a manual dashboard action

---

## Key Facts for Future Reference
- BWT account: `info@brazenauto.com`
- BWT API key: `0a35c8d451e348e099fe46c4533a9f12`
- skipatip.com IndexNow key: `b4f7e2a1c3d5e6f7a8b9c0d1e2f3a4b5`
- IndexNow always 403 for this account — use BWT SubmitUrlbatch instead
- BWT SubmitUrlbatch works: POST to `https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlbatch?apikey=KEY` with `{"siteUrl":"https://www.skipatip.com/","urlList":[...]}`
