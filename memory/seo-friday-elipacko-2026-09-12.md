# Elipacko.com — SEO Friday Report (Sep 5–11, 2026)

_Received via inter-session message from Fern Allern session. Logged at 00:02 UTC Sept 12._

---

## 📈 RANKING MOVERS (WoW: Sep 1–7 vs Sep 4–10)

### Winners
- `/pp-corrugated-sheets/` — 35.3 → 32.1 ✅ (content expansion Sep 8 starting to register; 510w → 1,635w)
- `/pp-trays/` — 37.6 → 34.1 ✅
- `/pp-meat-lugs/` — 7.8 → 6.8 ✅ (approaching page 1)
- `/custom-pp-packaging-box/` — 9.2 → 7.4 ✅

### Losers
- `/pp-post-office-boxes/` — 43.3 → 52.4 ❌ (slid a full page)
- `/` homepage — 28.7 → 39.4 ❌ impressions 17 → 9 (concerning; still deeply buried)
- `/pp-corrugated-boxes/` — 18.7 → 22.2 ❌

### Steady
- `/pp-dividers/` — **#1 priority to watch.** Holding ~pos 7.2–7.5, 117–123 impressions/week. Closest to a real click driver.
- `/pp-turnover-boxes/` — 51→54 impressions, pos stable ~16

### 🆕 New page appearing
- `/storage-moving-boxes/` — 22 impressions @ pos 26.3 this week vs ZERO last week. Just got picked up by Google.

---

## 🔗 BACKLINK GOOGLE INDEXING — CYCLE 1 STATUS

Started Sep 8 (120 URLs/day, 09:10 UTC):
- Sep 8: 66 submitted (quota ran short)
- Sep 9: 120 ✅
- Sep 10: 120 ✅
- Sep 11: 120 ✅
- **Total: 426/447 URLs — 95% through cycle 1**
- Sep 12 run completes cycle 1 (21 remaining), then cycle 2 starts immediately

### IndexNow (Bing/Yandex)
- Mon Sep 8: 655 backlink pages blasted (weekly cron)
- Tue Sep 9: 103 pages across 7 Fern Allern managed sites

---

## ⚙️ INFRASTRUCTURE CHANGES THIS WEEK

- **Fixed:** `elipacko-index-now.js` was burning 29 Google Indexing API quota slots/day on static unchanged pages → removed GA from that cron; now Bing BWT + Yandex only. Those 29 freed slots go to backlink rotation.
- **Fixed:** Script deletion bug (edit gone wrong Sep 8) — recreated and confirmed working.

---

## 🚧 STILL BLOCKED

| Blocker | Notes |
|---------|-------|
| Dedicated GCP SA for elipacko | Mitch hasn't dropped `.elipacko-dedicated-sa.json` yet. Sharing axl-348 quota with Bartact. |
| SHOPIFY_TOKEN_BARTACT | 401 since Sep 11 ~15:00 UTC — SEO auto-audit partially broken. Mitch must regenerate. |
| Gmail SMTP auth | 535 BadCredentials — ongoing, not resolved. |
| TELEGRAM_TOKEN | Still missing — cron alerts silently failing. |

---

## OUTLOOK

- `/pp-dividers/` at pos 7.5 with 117 impressions/week is the one to watch — page-1 territory if content gets to 2,000+ words (current word count unknown). **Priority: content audit + expand.**
- Backlink cycle 1 completes this weekend. First real authority signals expected in GSC in **2–4 weeks**.
- Homepage ranking collapse (pos 28→39) bears watching — may need a dedicated investigation if it continues.
