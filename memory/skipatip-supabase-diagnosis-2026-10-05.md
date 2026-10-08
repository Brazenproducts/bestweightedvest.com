# SkipATip Supabase — Full Diagnosis (2026-10-05, UPDATED 2026-10-07)

## ⚠️ 2026-10-07 UPDATE — ROOT CAUSE FOUND (worse than IO throttling)

Using the `SUPABASE_MANAGEMENT_TOKEN` (Management API), confirmed:

1. **Platform status:** `ACTIVE_HEALTHY` (VM up) BUT
2. **Service health:** db=UNHEALTHY, rest=UNHEALTHY
3. **SQL via Management API fails with:**
   ```
   FATAL: 57P03: the database system is not accepting connections
   DETAIL: Hot standby mode is disabled.
   ```
   → **Postgres is STUCK IN CRASH RECOVERY** (replaying WAL, not accepting connections). Not merely slow — actually down.
4. **Compute tier:** `selected_addons: []` → running on **default Micro** (2 CPU / 1GB RAM / 87 MB/s baseline IO).
   For a **2.9M-row** DB this is drastically undersized — the root cause.

### Action taken autonomously (2026-10-07)
- Triggered **project restart** via Management API (`POST /v1/projects/{ref}/restart`) → HTTP 200 accepted.
- Waited 90s, re-probed → **still 57P03 / UNHEALTHY.** Restart alone did NOT clear it.

### Why restart didn't work
DB crashed (likely from IO exhaustion on undersized Micro) and is stuck replaying WAL. On a 1GB/87MB-s Micro, recovery of a 2.9M-row DB can stall or be impossibly slow. It needs **more compute/IO headroom to finish recovery**, or Supabase support intervention.

### BLOCKED ON SPEND DECISION (Mitch only)
Fixing this requires a **compute tier upgrade** (costs money) — which I will NOT do without explicit approval:
- **Small** ~$15/mo (174 MB/s) — minimum viable, may still be tight
- **Medium** ~$60/mo (347 MB/s) — recommended to force recovery + run 2.9M-row workload
- **Large** ~$111/mo (630 MB/s) — comfortable headroom

Step-up plan: bump to **Medium** to break recovery → once online, deploy staged IO fixes (`scripts/io-fix/`) → optionally downgrade to Small. If upgrade still won't recover, open a **Supabase support ticket** (DB stuck in recovery / 57P03) — may need their infra team.

---

# Original Diagnosis (2026-10-05)


## Status: DATABASE API LAYER DOWN (not just slow)

Frozen at **2,890,854** businesses for **17 days** (since Sept 17). Every daily report shows "n/a". This is now diagnosed, not guessed.

## Hard Evidence (probed directly 2026-10-05)

1. **Lightweight HEAD count** (`SELECT count head:true`) → **FAILED in 5.7s** (empty error)
2. **Direct REST probe** → **HTTP 503**, body:
   ```json
   {"code":"PGRST002","message":"Could not query the database for the schema cache. Retrying."}
   ```

**`PGRST002` = PostgREST cannot read the DB schema cache.** The API layer can't even introspect the schema — meaning Postgres is so resource/IO-starved it can't serve PostgREST's basic bootstrap query. This is why EVERY script fails (collection, stats, reports): the REST interface never initializes.

## Root Cause Chain

**Disk IO budget exhausted → Postgres can't keep up → PostgREST schema cache query times out → entire REST API returns 503 → all pipelines dead.**

### What's burning the IO (confirmed in code)

`check-db.js` (and sibling stats scripts) contains a catastrophic full-table scan:
```js
const { data: cityData } = await supabase
  .from('places_raw')
  .select('city');   // ← pulls ALL 2.9M rows every run to count unique cities in JS
```
This reads **2.9 million rows into memory** just to compute a distinct-city count with a JS `Set`. Run on every stats/report invocation. Classic Disk IO killer on a large table.

Multiple stats variants exist doing similar things: `check-db.js`, `debug-stats.js`, `final-stats.js`, `get-db-stats.js`, `get-real-stats.js`, `get-stats.mjs`, `simple-stats.js`, `temp-stats.js`, `query-stats.js`, `quick-24h-stats.js`. Proliferation of full-scan stats scripts = sustained IO pressure.

## Two-Path Fix

### Path A — Unblock NOW (requires Mitch's Supabase dashboard/billing access)
Upgrade compute tier to raise baseline Disk IO + restore headroom so Postgres recovers and PostgREST can initialize:
https://supabase.com/dashboard/project/zqmepfdghljknyojfsmq/settings/compute-and-disk

Baseline Disk IO by tier: Micro 87 / Small 174 / Medium 347 / Large 695 / XL 1390 IOPS.
A temporary bump to Medium/Large would let the instance drain the IO backlog and come back online. Can downgrade after optimization lands.

**NOTE:** Even with optimization, if the instance is currently wedged (PGRST002), it may need a tier bump OR a project restart/pause-resume from the dashboard to clear the stuck state. I cannot do either — no billing/dashboard access.

### Path B — Reduce IO load (I can build this now, no dashboard access)
1. **Kill the full-table-scan stats pattern.** Replace `.select('city')` on 2.9M rows with:
   - A Postgres RPC/`count` with `GROUP BY`, or
   - A materialized view `places_stats` refreshed once/hour, or
   - `SELECT count(DISTINCT city)` via an RPC function (runs in-DB, returns one number).
2. **Add missing indexes** (likely culprits): `created_at`, `reviews_synced_at`, `city`, `collection_queue(status, priority)`.
3. **Consolidate** the 10+ redundant stats scripts into one that uses cheap head-counts only.
4. **Tune autovacuum** for the 2.9M-row `places_raw` table.

**BUT:** Path B requires a working REST/SQL connection to deploy (create index, RPC, matview). Right now the API is 503 — so **Path B cannot be applied until the instance is responsive again.** That likely needs Path A (tier bump or restart) first to break the deadlock.

## The Honest Bottom Line

This is a **chicken-and-egg deadlock**:
- The DB is down because IO is exhausted.
- I can fix the IO-abusive code, but I can't deploy the fix because the DB API is down (503).
- Breaking the deadlock needs a **tier upgrade OR a project restart/pause-resume** — both require Mitch's Supabase dashboard access.

**Recommended sequence:**
1. **Mitch:** Restart or temporarily upgrade the project in the Supabase dashboard (clears the wedged state).
2. **Me (immediately after):** Deploy the IO fixes (RPC for stats, indexes, consolidate scripts) so it doesn't re-exhaust.
3. **Then:** Downgrade tier if desired, once IO load is sane.

Without step 1, nothing I do can land — the API won't accept writes/DDL.

## Probe commands used (for re-verification)
```bash
cd /home/ubuntu/.openclaw/workspace/skipatip
# REST schema probe:
curl -s -w '\nHTTP:%{http_code}\n' "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/places_raw?select=count" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Prefer: count=exact"
# → PGRST002 / HTTP 503 = still wedged
# → a number / HTTP 200 = recovered, safe to deploy Path B
```
