# Cron Health Monitor Report
**Generated:** Saturday, September 19, 2026 - 3:00 PM UTC

## Summary
- **Total Jobs:** 103
- **Healthy Jobs:** 101
- **Broken Jobs:** 2

## Broken Jobs

### 1. Shopping ROAS Emergency Alert
- **Job ID:** `dfe825b1-080d-476f-91c2-17279143d5cf`
- **Name:** Shopping ROAS Emergen...
- **Status:** error
- **Schedule:** cron 0 3 * * * @ America/Los_Angeles
- **Last Run:** 5 hours ago
- **Agent:** main
- **Error Details:** Not available (restricted access in isolated cron mode)
- **Delivery:** none -> telegram:openclaw-control-ui (explicit)

### 2. Weekly PLAYBOOK Audit
- **Job ID:** `0fd1d064-18c9-44f9-917b-d0334f081686`
- **Name:** Weekly PLAYBOOK Audit...
- **Status:** error (5x consecutive errors)
- **Schedule:** cron 0 16 * * 0 @ UTC (exact)
- **Last Run:** 6 days ago
- **Agent:** slashdaddy
- **Error Details:** Not available (restricted access in isolated cron mode)
- **Delivery:** announce -> telegram:7550065844 (explicit)

## Additional Notes
- **Restricted Access:** When running in isolated cron mode, the cron tool is restricted to the current job only. Full error details for other jobs cannot be retrieved without elevated access.
- **Skipped Jobs:** 4 jobs with "skipped" status (not counted as errors):
  - Daily Amazon Associat... (main)
  - Reminder: High-Commis... (main)
  - SiteStripe daily heal... (main)
  - Weekly Amazon Seller ... (main)
  - Monthly Bartact Negat... (main)

## Recommendations
- Investigate the "Shopping ROAS Emergen..." job immediately (error from ~5 hours ago)
- Review the "Weekly PLAYBOOK Audit" job (5 consecutive errors over 6+ days)
- Check why the 4-5 skipped jobs are not running (may be trigger conditions not met)
- No automatic fixes attempted per configuration

---
*Report generated from `openclaw cron list` output. Use `openclaw cron get <jobId>` for detailed job information.*
