# SkipATip Supabase Disk IO Alert — 2026-09-22 11:33 UTC

## Alert Details

**Project:** skipatip  
**Project Ref:** zqmepfdghljknyojfsmq  
**Issue:** Depleting Disk IO Budget  
**Severity:** ⚠️ WARNING — Performance degradation imminent

## Symptoms When Budget Exhausted

- Response times increase noticeably
- CPU usage rises due to IO wait
- Instance may become unresponsive

## Current State

**Database stats:**
- Total businesses: 2,890,854 (last updated 2026-09-21)
- No recent growth (static since at least 2026-09-17)
- Daily reports running but showing "n/a" for most metrics

**Possible causes:**
1. **Inefficient queries** — high table scans on 2.9M row tables
2. **Missing indexes** — common lookups not indexed (place_id, business name, location)
3. **Excessive writes** — daily jobs writing/updating large datasets
4. **Large table scans** — analytics or aggregation queries without proper optimization
5. **Vacuum/autovacuum contention** — Postgres maintenance overhead on large tables

## Recommended Actions

### Immediate (Investigate)

1. **Check hourly Disk IO consumption:**  
   https://supabase.com/dashboard/project/zqmepfdghljknyojfsmq/reports/database

2. **Review slow queries:**
   - Identify top queries by IO cost
   - Check for missing indexes
   - Look for full table scans

3. **Inspect table sizes:**
   ```sql
   SELECT schemaname, tablename, 
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
   FROM pg_tables 
   WHERE schemaname = 'public'
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
   ```

### Short-term (Optimize)

1. **Add indexes** for common queries:
   - `place_id` (if not already indexed)
   - `name`, `location`, `category` for search patterns
   - Composite indexes for frequent filter combinations

2. **Optimize daily cron jobs:**
   - Batch updates instead of row-by-row
   - Use `COPY` or bulk inserts
   - Limit SELECT scans with proper WHERE clauses

3. **Review autovacuum settings:**
   - May need tuning for 2.9M row tables
   - Check for bloat in frequently updated tables

### Long-term (Scale)

1. **Upgrade compute tier:**  
   https://supabase.com/dashboard/project/zqmepfdghljknyojfsmq/settings/compute-and-disk
   
   Current tier unknown — check baseline Disk IO capacity:
   - Micro: 87 IOPS baseline
   - Small: 174 IOPS baseline
   - Medium: 347 IOPS baseline
   - Large: 695 IOPS baseline
   - XL: 1,390 IOPS baseline

2. **Partition large tables** (if queries support it):
   - Partition `places` by region/state
   - Archive old data

3. **Implement read replicas** for analytics queries (if supported on plan)

## Documentation

- [High Disk IO Consumption Guide](https://supabase.com/docs/guides/troubleshooting/exhaust-disk-io)
- [Compute Add-ons and Disk IO](https://supabase.com/docs/guides/platform/compute-add-ons#disk-io)

## Next Steps

1. **Investigate:** Check hourly Disk IO dashboard to identify peak usage times
2. **Profile queries:** Run slow query analysis to find IO-heavy operations
3. **Quick wins:** Add missing indexes if found
4. **Escalate if needed:** Upgrade compute tier if optimization alone isn't enough

---

**Alert received:** 2026-09-22 11:33 UTC  
**Action by:** [pending investigation]
