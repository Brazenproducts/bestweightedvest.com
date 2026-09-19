#!/bin/bash

# ASIN Health Check - Batch Processor
# Processes batch of ASINs using browser automation via HTTP calls to OpenClaw gateway

BATCH_FILE="/tmp/asin-batch.txt"
STATE_FILE="/home/ubuntu/.openclaw/workspace/scripts/sitestripe-healthcheck-state.json"
MEMORY_FILE="/home/ubuntu/.openclaw/workspace/memory/asin-healthcheck-latest.md"
RESULTS_FILE="/tmp/asin-check-results.json"

# Initialize results
cat > "$RESULTS_FILE" << 'EOF'
{
  "date": "2026-09-09",
  "checked": 0,
  "dead": 0,
  "live": 0,
  "results": [],
  "deadAsins": []
}
EOF

# Read ASINs and process
ASINS=$(cat "$BATCH_FILE" | grep -v '^$')
ASIN_COUNT=$(echo "$ASINS" | wc -l)

echo "Processing $ASIN_COUNT ASINs..."

# Counter
CHECKED=0
DEAD=0
LIVE=0

# Process each ASIN
while IFS= read -r ASIN; do
  [ -z "$ASIN" ] && continue
  
  CHECKED=$((CHECKED + 1))
  URL="https://www.amazon.com/dp/$ASIN"
  
  # Use curl to do a quick HEAD/GET check first
  # This is faster than browser for volume checks
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -L -I "$URL" 2>/dev/null)
  
  if [ "$HTTP_CODE" = "404" ]; then
    DEAD=$((DEAD + 1))
    echo "DEAD [$DEAD/$ASIN]: 404"
    echo "  $ASIN" >> /tmp/dead-asins.txt
  else
    LIVE=$((LIVE + 1))
    echo "OK [$LIVE/$ASIN]: HTTP $HTTP_CODE"
  fi
  
  # Report progress every 25
  if [ $((CHECKED % 25)) -eq 0 ]; then
    echo "Progress: $CHECKED/$ASIN_COUNT checked, $DEAD dead, $LIVE live"
  fi
  
  # Rate limit - be nice to Amazon
  sleep 0.5
  
done <<< "$ASINS"

echo ""
echo "=== FINAL RESULTS ==="
echo "Total checked: $CHECKED"
echo "Dead (404): $DEAD"
echo "Live: $LIVE"
echo "Success rate: $((LIVE * 100 / CHECKED))%"

# Save results to JSON
python3 << PYEOF
import json
from datetime import datetime

results = {
    "date": "2026-09-09",
    "time": datetime.utcnow().isoformat(),
    "checked": $CHECKED,
    "dead": $DEAD,
    "live": $LIVE,
    "success_rate": round(($LIVE * 100 / $CHECKED) if $CHECKED > 0 else 0, 2)
}

with open('$RESULTS_FILE', 'w') as f:
    json.dump(results, f, indent=2)

print("Results saved to $RESULTS_FILE")
PYEOF

echo "Done!"
