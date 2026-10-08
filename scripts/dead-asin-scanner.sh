#!/bin/bash
# Dead ASIN Scanner — runs weekly, fixes automatically
# Checks all 99 affiliate sites for dead Amazon links and replaces/removes them
cd /home/ubuntu/.openclaw/workspace
LOG="logs/dead-asin-scan.log"
echo "[$(date -u)] Starting dead ASIN scan" >> $LOG
python3 scripts/dead-asin-scanner.py >> $LOG 2>&1
echo "[$(date -u)] Done" >> $LOG
