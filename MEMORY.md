# Memory & Notes

## Restaurant Verification Job

**Job:** `SkipATip — nightly verify-and-pin-restaurants`  
**Cron:** Daily, 6:00 AM UTC  
**Purpose:** Verify restaurant locations against Google Places API, pin valid locations, delete phantom entries

### Daily Verification Counts

**2026-09-17 (Thursday) — ⚠️ ERROR**
- **Status:** SCRIPT NOT FOUND
- **Issue:** `/home/ubuntu/.openclaw/workspace/scripts/verify-and-pin-restaurants.js` is missing
- **Action needed:** Restore script or redeploy verification job

**2026-09-18 (Friday)**
- **Verified & pinned:** 1,989 restaurants (4 batches)
  - Batch 1: 497 verified, 3 deleted
  - Batch 2: 892 verified, 8 deleted
  - Batch 3: 46 verified, 4 deleted
  - Batch 4: 554 verified, 20 deleted
- **Total deleted:** 35 restaurants not found
- **Status:** ✅ Script ran successfully with --limit 900
- **Note:** After 4 full batches, encountered database connectivity issues (503 PGRST002) and module not found errors; subsequent runs returned 0 results

**2026-09-19 (Saturday)**
- **Verified & pinned:** 1,435 restaurants across 3 partial batches
  - Batch 1: 497 verified, 3 deleted
  - Batch 2: 892 verified, 8 deleted
  - Batch 3: 46 verified, 4 deleted (partial before error)
- **Total deleted:** 15 restaurants not found
- **Status:** ⚠️ PARTIAL SUCCESS → ERROR
  - First 500-limit batch completed successfully
  - Started 900-limit batch, completed ~897 items, then script not found error
  - Module `/home/ubuntu/.openclaw/workspace/scripts/verify-and-pin-restaurants.js` missing after partial execution
- **Action needed:** Investigate missing script; check if file was moved/deleted or if multiple runs caused conflicts

**2026-09-16 (Wednesday)**
- **Verified & pinned:** 497 restaurants
- **Deleted (not found):** 3 restaurants
  - Jersey Mike's, Manteca CA
  - Culver's, Edmond OK
  - Freddy's Frozen Custard, Tallahassee FL
- **Status:** First batch (500-item limit) completed successfully
- **Note:** Second batch (900-item limit) failed mid-run due to missing module; script error at [539/900]
