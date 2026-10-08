# SkipATip Places Collection — Daily Report
**Date:** Thursday, October 8th, 2026 — 9:00 AM UTC  
**Run Status:** ❌ **FAILED — External Services Unavailable**

---

## 🔴 Critical Issues

### 1. Collection Pipeline Failed (503)
**Script:** `scripts/data-pipeline/03-collect-places.js --limit=100`
```
Fatal: Error: Queue fetch error: 503
at getNextCities (.../03-collect-places.js:183:22)
```
- **Status:** Queue service unavailable
- **Impact:** Zero new places collected
- **Cities processed this run:** 0
- **Places collected this run:** 0

### 2. Database Offline (Crash Recovery)
**Diagnosis:** Supabase Postgres stuck in crash recovery (`57P03`)
- Compute tier: **Micro** (undersized for 2.9M rows)
- PostgREST API: HTTP 503 (cannot initialize schema cache)
- All database queries hang indefinitely
- **Last successful collection:** September 17, 2026 (17 days ago)
- **Root cause:** IO exhaustion from undersized compute tier + repeated full-table-scan stats queries

**Evidence:**
- `scripts/quick-24h-stats.js` hung for 30+ seconds before timeout
- Previous diagnostics (Oct 5, 2026) confirmed DB unavailable via Management API
- Restart attempt on Oct 7 failed (DB still wedged)

---

## 📊 Database State (Last Known: Oct 7, 2026)

| Metric | Value | 24h Delta | Status |
|--------|-------|-----------|--------|
| **Total Places in DB** | 2,890,854 | 0 | ⚠️ **Frozen** |
| **Total Reviews** | Unknown | Unknown | ❌ **Unavailable** |
| **Unique Cities** | Unknown | — | ❌ **Unavailable** |
| **Cities Processed (today)** | 0 | — | ❌ **Failed** |
| **Days Since Last Collection** | 17 | — | ⚠️ **Critical lag** |

---

## ⚙️ Recommended Actions (Priority Order)

### IMMEDIATE (requires user dashboard access)
1. **Restart Supabase project** (project pause + resume)
   - Dashboard: https://supabase.com/dashboard/project/zqmepfdghljknyojfsmq/settings/compute-and-disk
   - Goal: Clear wedged recovery state (57P03)

2. **Optionally: Upgrade compute tier** (if restart alone insufficient)
   - Current: **Micro** (87 MB/s baseline IO)
   - Recommended: **Small** ($15/mo, 174 MB/s) or **Medium** ($60/mo, 347 MB/s)
   - Justification: 2.9M rows + daily collection workload needs more IO headroom

### IMMEDIATE (investigate externals)
3. **Check queue service status**
   - Google Places API quota/rate limits?
   - Internal job queue (if applicable) health?
   - Retry collection script manually after Supabase recovers

### ONCE DB IS ONLINE
4. **Deploy IO optimization fixes** (I can build immediately after connectivity restored)
   - Replace full-table-scan stats queries with RPC/materialized view
   - Add missing indexes (`created_at`, `reviews_synced_at`, `city`, `collection_queue(status)`)
   - Consolidate 10+ redundant stats scripts into one efficient script

---

## 📋 Skipped Steps

- ✗ **update-site-stats.js** — skipped (stats unavailable)
- ✗ **Vercel homepage stat update** — awaiting database recovery

---

## 🔍 Manual Verification Commands

Once DB recovers, re-run to confirm:
```bash
cd /home/ubuntu/.openclaw/workspace/skipatip

# Verify connectivity (should return HTTP 200 with a number)
curl -s -w '\nHTTP:%{http_code}\n' \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/places_raw?select=count" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Prefer: count=exact"
# Expected: HTTP 200 + count number
# If still seeing PGRST002 / 503 → database still wedged

# Re-run collection
node scripts/data-pipeline/03-collect-places.js --limit=100

# Re-run stats
node scripts/quick-24h-stats.js

# Update site
node scripts/update-site-stats.js
```

---

**Next scheduled run:** Manual after services recover or next cron heartbeat  
**Last status update:** 2026-10-08 09:00 UTC
