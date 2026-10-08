#!/bin/bash
# faithfulpassages-daily.sh
# Daily content generation for faithfulpassages.com
# PROTECTED SITE - do not modify without Mitch approval

WORKSPACE="/home/ubuntu/.openclaw/workspace"
LOG_DATE=$(date -u +"%Y-%m-%d %H:%M:%S UTC")

echo "[$LOG_DATE] faithfulpassages-daily.sh starting"

# Check if content file exists for today
TODAY=$(date +"%Y-%m-%d")
CONTENT_FILE="/tmp/fp-content-${TODAY}.json"

if [ ! -f "$CONTENT_FILE" ]; then
  echo "[$LOG_DATE] No content file found at $CONTENT_FILE — skipping publish"
  echo "[$LOG_DATE] To publish: create $CONTENT_FILE and re-run"
  exit 0
fi

echo "[$LOG_DATE] Found content file, running publish..."
cd "$WORKSPACE" && node scripts/faithfulpassages-publish.js --file "$CONTENT_FILE"
echo "[$LOG_DATE] Done"
