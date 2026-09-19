#!/usr/bin/env node

/**
 * ASIN Health Check - Comprehensive Batch Processor
 * Processes all 200 ASINs and updates results files
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const BATCH_FILE = '/tmp/asin-batch.txt';
const STATE_FILE = path.join(__dirname, 'sitestripe-healthcheck-state.json');
const MEMORY_FILE = path.join(__dirname, '..', 'memory', 'asin-healthcheck-latest.md');
const RESULTS_FILE = '/tmp/asin-results-full.json';

// Read ASINs
const asinList = fs.readFileSync(BATCH_FILE, 'utf8')
  .split('\n')
  .map(s => s.trim())
  .filter(s => s && s.length > 0);

console.log(`[ASIN Processor] Starting batch: ${asinList.length} ASINs`);

// Helper: call curl to check HTTP status quickly
async function quickCheckAsin(asin) {
  return new Promise((resolve) => {
    const url = `https://www.amazon.com/dp/${asin}`;
    // Use curl with a short timeout to check if page loads
    exec(`curl -s -o /dev/null -w "%{http_code}" -m 5 "${url}" 2>/dev/null`, 
      (error, stdout) => {
        const code = stdout.trim();
        resolve({
          asin,
          status: code === '404' ? 'DEAD' : (code === '200' ? 'LIVE' : 'UNKNOWN'),
          httpCode: code
        });
      });
  });
}

async function processAllAsins() {
  const results = {
    date: new Date().toISOString().split('T')[0],
    startTime: new Date().toISOString(),
    totalAsins: asinList.length,
    checked: 0,
    dead: 0,
    live: 0,
    unknown: 0,
    deadAsins: [],
    results: []
  };

  // Load existing state
  let state = {};
  try {
    if (fs.existsSync(STATE_FILE)) {
      state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (e) {
    console.warn('State file parsing error');
  }

  state.deadAsins = state.deadAsins || [];
  state.lastCheckDate = state.lastCheckDate || null;

  console.log(`[ASIN Processor] Processing ${asinList.length} ASINs...`);
  console.log(`[ASIN Processor] Previous dead count: ${state.deadAsins.length}`);

  // Process in parallel batches of 10 for efficiency
  const batchSize = 10;
  for (let i = 0; i < asinList.length; i += batchSize) {
    const batch = asinList.slice(i, Math.min(i + batchSize, asinList.length));
    const batchResults = await Promise.all(batch.map(asin => quickCheckAsin(asin)));
    
    for (const result of batchResults) {
      results.checked++;
      results.results.push(result);
      
      if (result.status === 'DEAD') {
        results.dead++;
        results.deadAsins.push(result.asin);
        if (!state.deadAsins.includes(result.asin)) {
          state.deadAsins.push(result.asin);
        }
      } else if (result.status === 'LIVE') {
        results.live++;
      } else {
        results.unknown++;
      }

      if (results.checked % 50 === 0) {
        console.log(`[ASIN Processor] Progress: ${results.checked}/${results.totalAsins} - Dead: ${results.dead}, Live: ${results.live}`);
      }
    }
    
    // Rate limiting - be nice to Amazon servers
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  results.endTime = new Date().toISOString();
  results.lifetimeDeadCount = state.deadAsins.length;
  results.progressPercent = Math.round((state.deadAsins.length / 2400) * 100);

  // Save full results
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
  console.log(`[ASIN Processor] Detailed results saved to ${RESULTS_FILE}`);

  // Update state file
  state.lastCheckDate = results.date;
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  console.log(`[ASIN Processor] State updated: ${state.deadAsins.length} total dead ASINs`);

  // Write memory file
  const memoryContent = `# ASIN Health Check - ${results.date}

## Results
- **ASINs checked today:** ${results.checked}
- **Dead found today:** ${results.dead}
- **Total dead (lifetime):** ${results.lifetimeDeadCount}
- **Progress:** ${results.progressPercent}% through 2,400 ASINs
- **Success rate:** ${results.live > 0 ? Math.round((results.live / results.checked) * 100) : 0}%

## Breakdown
- ✅ Live: ${results.live}
- ❌ Dead (404): ${results.dead}
- ⚠️ Unknown: ${results.unknown}

## Timeline
- Started: ${results.startTime}
- Ended: ${results.endTime}
- Duration: ${calculateDuration(results.startTime, results.endTime)}

## Progress Tracking
At 200 ASINs/day, full cycle (2,400 total): 12 days
Current progress: Day ${Math.ceil((results.lifetimeDeadCount + 1) / 200)} of 12

## Notes
All checks used HTTP verification. Browser automation will be applied for:
- Detailed availability status
- Product title extraction
- Image capture for verification
`;

  fs.writeFileSync(MEMORY_FILE, memoryContent);
  console.log(`[ASIN Processor] Memory file updated: ${MEMORY_FILE}`);

  console.log(`\n=== FINAL RESULTS ===`);
  console.log(`Total checked: ${results.checked}`);
  console.log(`Dead (404): ${results.dead}`);
  console.log(`Live: ${results.live}`);
  console.log(`Lifetime dead: ${results.lifetimeDeadCount}`);
  console.log(`Progress: ${results.progressPercent}%`);
}

function calculateDuration(start, end) {
  const ms = new Date(end) - new Date(start);
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  return `${minutes}m`;
}

processAllAsins().catch(err => {
  console.error('[ASIN Processor] Fatal error:', err.message);
  process.exit(1);
});
