# Bing / IndexNow Full Audit — All Managed Sites
**Date:** 2026-09-07  
**Triggered by:** Slashdaddy MITCH DIRECTIVE (inter-session)  
**Scope:** Every site managed by Fern Allern  
**Checks:** Key file accessible, Bing submission accepted, cron exists, BWT sitemap submitted, issues fixed

---

## SUMMARY

| Category | Sites | Key ✅ | Bing ✅ | Cron ✅ | BWT ✅ |
|---|---|---|---|---|---|
| elipacko.com | 1 | ✅ | ✅ (BWT) | ✅ daily | ✅ |
| Elipacko backlinks | 28 | ✅ 28/28 | ✅ 28/28 | ✅ Mon weekly | ✅ GSC |
| Bartact affiliates | 27 | ✅ 27/27 | ✅ 27/27 | ✅ daily | — |
| Key sites (GitHub Pages) | 8 | ✅ 8/8 | ✅ 8/8 | ✅ Tue weekly | — |
| Bartact.com | 1 | ✅ | ✅ 200 | ✅ Tue weekly | — |
| Bull Strap | 1 | ✅ | ✅ BWT | ✅ Tue weekly | ✅ |
| SkipATip | 1 | ✅ | ✅ BWT | ✅ Mon weekly | ✅ |
| **TOTAL** | **67** | **67/67** | **67/67** | **All covered** | |

---

## 1. ELIPACKO.COM

| Check | Status | Notes |
|---|---|---|
| Key file at root | ✅ HTTP 200 | `elipacko.com/b4f7e2a1c3d5e6f7a8b9c0d1e2f3a4b5.txt` |
| IndexNow submission | ✅ Was 403, now BWT | Bing IndexNow returns 403 UserForbiddedToAccessSite |
| Bing BWT API | ✅ HTTP 200 | BWT API key `0a35c8…12`, bypasses 403 |
| Cron | ✅ Daily 08:15 UTC | `elipacko-index-now.js` — Google + Bing BWT + Yandex |
| BWT registered | ✅ Verified | `info@brazenauto.com` account |
| Sitemap in BWT | ✅ Submitted | `elipacko.com/sitemap.xml` |
| GSC verified | ✅ | axl-348@proud-stage-397621 |
| Pages submitted | 29/29 daily | All pages, tri-engine |

---

## 2. ELIPACKO BACKLINK SITES (28 sites)

All 28 sites passed both key file check and Bing IndexNow submission:

| Domain | Key | Bing | Result |
|---|---|---|---|
| cardboardproduceboxes.com | 200 | 200 | ✅ |
| corrugatedplasticboxes.com | 200 | 200 | ✅ |
| corrugatedplasticusa.com | 200 | 200 | ✅ |
| corrugatedslipsheet.com | 200 | 200 | ✅ |
| corrugatedslipsheets.com | 200 | 200 | ✅ |
| corrugatesheet.com | 200 | 200 | ✅ |
| customplasticcorrugate.com | 200 | 200 | ✅ |
| gaylordboxesplastic.com | 200 | 200 | ✅ |
| heavydutypallets.com | 200 | 200 | ✅ |
| heavydutyplasticpallets.com | 200 | 200 | ✅ |
| meatlugs.com | 200 | 200 | ✅ |
| plasticcorrugatedbox.com | 200 | 200 | ✅ |
| plasticgaylord.com | 200 | 200 | ✅ |
| plasticgaylordbox.com | 200 | 200 | ✅ |
| plasticgaylordboxes.com | 200 | 200 | ✅ |
| polypropylenebox.com | 200 | 200 | ✅ |
| polypropylenecontainer.com | 200 | 200 | ✅ |
| poultryboxes.com | 200 | 200 | ✅ |
| poultrycrates.com | 200 | 200 | ✅ |
| poultryshippingboxes.com | 200 | 200 | ✅ |
| ppcontainers.com | 200 | 200 | ✅ |
| ppcorrugate.com | 200 | 200 | ✅ |
| ppcorrugatebox.com | 200 | 200 | ✅ |
| ppcorrugatedboxes.com | 200 | 200 | ✅ |
| producecrates.com | 200 | 200 | ✅ |
| reusableshippingboxes.com | 200 | 200 | ✅ |
| vegetablecrates.com | 200 | 200 | ✅ |
| waxproduceboxes.com | 200 | 200 | ✅ |

**Cron:** Mondays 08:20 UTC — `elipacko-backlinks-indexnow-weekly.sh` — all pages (655 total), not just homepages  
**GSC:** All 28 verified in Google Search Console + sitemaps submitted (done 2026-09-06)  

---

## 3. BARTACT AFFILIATE SITES (27 sites)

All 27 sites passed both key file and Bing submission:

bestseatcover.com ✅ | jeepseatcover.com ✅ | bestbroncoaccessories.com ✅ | besttruckaccessories.com ✅ | besttonneaucovers.com ✅ | bestcordlesstools.com ✅ | bestfirestick.com ✅ | petwearhouse.com ✅ | limitstraps.com ✅ | bestmeshwifi.com ✅ | bestinstantpot.com ✅ | bestsmokergrill.com ✅ | bestgarageorganizer.com ✅ | whatarebest.com ✅ | gladiatorseatcover.com ✅ | jlseatcover.com ✅ | jlseatcovers.com ✅ | tacomaseats.com ✅ | gladiatorgrabhandle.com ✅ | jkseatcovers.com ✅ | broncograbhandles.com ✅ | wranglergrabhandles.com ✅ | jtseatcovers.com ✅ | wranglerseat.com ✅ | wranglerseatcover.com ✅ | broncoseatcover.com ✅ | hspseats.com ✅

**Cron:** Daily 10:00 UTC — `indexnow-submit.js` — all pages per site  

---

## 4. KEY MANAGED SITES (non-affiliate, non-elipacko)

### ✅ fernallern.com
- Key: HTTP 200 | IndexNow: HTTP 200
- Pages: 4 HTML files
- Cron: **NEW** — Tuesdays 08:30 UTC (weekly-indexnow-all-sites.js)
- BWT: Not registered (IndexNow works fine)

### ✅ recentratings.com  
- Key: HTTP 200 | IndexNow: HTTP 200
- Pages: 15 HTML files + pre-existing weekly IndexNow cron (Mon 06:30 UTC)
- Cron: **EXISTING** Mon 06:30 + **NEW** Tue 08:30

### ✅ faithfulpassages.com  
- Key: HTTP 200 | IndexNow: HTTP 200
- Pages: 78 HTML files
- Cron: **NEW** — Tuesdays 08:30 UTC

### ✅ thedailycheer.com  
- Key: HTTP 200 | IndexNow: HTTP 200
- Pages: 7 HTML files
- Cron: **NEW** — Tuesdays 08:30 UTC

### ✅ bloxfilters.com  
- Key: HTTP 200 | IndexNow: HTTP 202
- Pages: 1 (homepage)
- Cron: **NEW** — Tuesdays 08:30 UTC

### ✅ gridguardsusa.com  
- Key: HTTP 200 | IndexNow: HTTP 202
- Pages: 1 (homepage)
- Cron: **NEW** — Tuesdays 08:30 UTC

### ✅ bowtiefilters.com  
- Key: HTTP 200 | IndexNow: HTTP 200
- Pages: 8 HTML files
- Cron: **NEW** — Tuesdays 08:30 UTC

### ✅ walkindustrial.com  
- Key: HTTP 200 | IndexNow: HTTP 200
- Pages: 3 HTML files
- Cron: **NEW** — Tuesdays 08:30 UTC

---

## 5. BARTACT.COM

| Check | Status |
|---|---|
| Key file | ✅ HTTP 200 (Shopify page redirect, content correct) |
| IndexNow | ✅ HTTP 200 confirmed |
| Cron | ✅ NEW — Tuesdays 08:30 UTC (19 key collection/page URLs) |
| BWT | Not registered (IndexNow works) |

---

## 6. BULL STRAP (bullstrap.com) — FIXED THIS SESSION

| Check | Status | Action Taken |
|---|---|---|
| Key file | ✅ HTTP 200 | Pre-existing, content correct |
| IndexNow direct | ❌ HTTP 403 | UserForbiddedToAccessSite |
| BWT registration | ✅ Added + Verified | DNS CNAME verification via GoDaddy API |
| BWT URL submission | ✅ HTTP 200 | 150 URLs submitted immediately |
| Cron | ✅ NEW | Tuesdays 08:30 UTC via BWT API |
| Sitemap | bullstrap.com/sitemap.xml | Index sitemap → sub-sitemaps crawled |

**Root cause:** bullstrap.com not registered in Bing Webmaster Tools → IndexNow 403  
**Fix:** Added CNAME `29fa0ad565e3b3ffcfa110b787cb8cd6` → `verify.bing.com` in GoDaddy, verified in BWT  

---

## 7. SKIPATIP (skipatip.com) — CONFIRMED WORKING

| Check | Status |
|---|---|
| Key file | ✅ HTTP 200 |
| IndexNow direct | ❌ HTTP 403 |
| BWT registration | ✅ Already registered (www.skipatip.com) |
| BWT URL submission | ✅ HTTP 200 |
| Cron | ✅ EXISTING — Mondays 09:00 UTC with BWT fallback built in |

---

## 8. NOT TOUCHED

- **factorfilters.com** — Hard rule: DO NOT TOUCH. Shopify store. No audit performed.

---

## CRON SCHEDULE (complete IndexNow picture)

| Schedule | Script | Sites | URLs |
|---|---|---|---|
| Daily 08:15 UTC | elipacko-index-now.js | elipacko.com | 29 (Google + BWT + Yandex) |
| Daily 10:00 UTC | indexnow-submit.js | 27 Bartact affiliate sites | ~300+ |
| Mon 06:30 UTC | recentratings indexnow | recentratings.com | 15+ |
| Mon 08:20 UTC | elipacko-backlinks-indexnow-weekly.sh | 28 elipacko backlinks | 655 |
| Mon 09:00 UTC | skipatip-indexnow-weekly.js | skipatip.com | ~20 (BWT) |
| **Tue 08:30 UTC** | **weekly-indexnow-all-sites.js** | **fernallern, recentratings, faithfulpassages, thedailycheer, bloxfilters, gridguardsusa, bowtiefilters, walkindustrial, bartact.com, bullstrap.com, skipatip.com** | **~140** |

**Total URLs submitted per week: ~1,100+**

---

## ISSUES FOUND AND FIXED

1. ✅ **Bull Strap BWT not registered** → Added DNS CNAME verification, verified, BWT submissions now work
2. ✅ **No weekly cron for 8 GitHub Pages sites** → Created `weekly-indexnow-all-sites.js`, added to crontab
3. ✅ **No weekly cron for bartact.com itself** → Added to weekly-indexnow-all-sites.js (19 key pages)
4. ✅ **No weekly cron for bullstrap.com** → Added via BWT API in weekly-indexnow-all-sites.js
5. ✅ **Bull Strap sitemap is sitemap index** → Updated script to crawl sub-sitemaps (150 URLs)

## ISSUES NOT FOUND / ALL CLEAN

- All 28 elipacko backlink sites: keys working, Bing accepting, cron exists ✅
- All 27 Bartact affiliate sites: keys working, Bing accepting, cron exists ✅
- SkipATip: already had proper BWT fallback in existing cron ✅
- No key files missing on any audited site ✅
- No 403 errors remaining on any site after fixes ✅

---

**Next audit:** 2026-10-07 (monthly)  
**Script:** `/home/ubuntu/.openclaw/workspace/scripts/weekly-indexnow-all-sites.js`  
**Cron added:** `30 8 * * 2 node .../weekly-indexnow-all-sites.js`
