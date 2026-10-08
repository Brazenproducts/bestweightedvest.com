# Cron Health Report
**Generated:** Thursday, October 8th, 2026 - 3:00 PM (UTC)

## Summary
- **Total Jobs:** 97
- **Healthy (ok):** 77 (79.4%)
- **Running:** 9 (9.3%)
- **Idle:** 3 (3.1%)
- **Skipped:** 7 (7.2%)
- **Error:** 1 (1.0%)

---

## Broken Jobs (8 Total)

### Error Status (1)
| Job ID | Name | Schedule | Last Run | Issue |
|--------|------|----------|----------|-------|
| efa5d28b-a5ee-4681-834e-8d905e1d4e91 | SkipATip — Daily Plac... | cron 0 2 * * * @ America/Los_... | 6h ago | **ERROR** - Job failed to execute properly; requires investigation |

### Skipped Status (7)
| Job ID | Name | Schedule | Last Run | Reason |
|--------|------|----------|----------|--------|
| 558f70fa-4993-46ef-801f-345fd3b30e5d | Daily Amazon Associat... | cron 0 9 * * * @ America/Los_... | 23h ago | **SKIPPED** - Trigger condition not met or execution blocked |
| 8ac9d03f-9d8b-4dda-ae43-d43eabc3941a | Reminder: High-Commis... | cron 0 9 * * * @ America/Los_... | 23h ago | **SKIPPED** - Trigger condition not met or execution blocked |
| ca801698-4131-454f-bf22-42fa00f55c67 | Domain ownership remi... | cron 0 17 * * * @ America/Los_... | 15h ago | **SKIPPED** - Trigger condition not met or execution blocked |
| 7bcae443-61ab-47d7-84e9-42fcdd550bfa | SiteStripe daily heal... | cron 0 9 * * * @ UTC (exact) | 6h ago | **SKIPPED** - Trigger condition not met or execution blocked |
| fb4b8ceb-d10c-4c31-8ccb-3039a232d4cc | Weekly Amazon Seller ... | cron 0 8 * * 1 @ America/Los_... | 3d ago | **SKIPPED** - Trigger condition not met or execution blocked |
| 8126e07f-d8a4-4bd9-b77b-69d424c65092 | Monthly Bartact Negat... | cron 0 10 1 * * @ America/Los... | 7d ago | **SKIPPED** - Trigger condition not met or execution blocked |
| 3ad951e6-43fe-4f32-9ed5-05611c697c3c | bartact-listing-group... | cron 0 14 17 9 * @ America/Lo... | 21d ago | **SKIPPED** - Trigger condition not met or execution blocked (very stale) |

---

## Notes
- **Error (1):** The SkipATip job (efa5d28b...) is actively failing. This should be investigated first to determine the root cause.
- **Skipped (7):** Most skipped jobs likely have trigger conditions that prevent execution. These need review to confirm they're intentionally blocked or if configuration adjustments are needed.
- **Idle (3):** 3 jobs have never run (`-` in "Last" column) and may be pending initial execution or awaiting trigger conditions.
- **Overall Health:** 79.4% of jobs are healthy with successful `ok` status.

---

## Recommendations (Not Implemented)
1. **Investigate SkipATip Error:** Review job logs for the failing job to identify the error condition.
2. **Review Skipped Jobs:** Determine if trigger conditions should be adjusted or if these are intentionally paused.
3. **Monitor Running Jobs:** The 9 "running" jobs may be in-flight executions; verify they complete successfully.
