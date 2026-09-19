#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

// Read ASINs from batch file
const batchFile = '/tmp/asin-batch.txt';
const asins = fs.readFileSync(batchFile, 'utf-8')
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.length > 0);

console.log(`Checking ${asins.length} ASINs for availability...\n`);

// Load or create state
const stateFile = path.join(__dirname, 'sitestripe-healthcheck-state.json');
let state = { 
  deadASINs: [], 
  checkedToday: 0, 
  totalDeadLifetime: 0,
  lastCheckDate: new Date().toISOString().split('T')[0],
  progressDay: 0 
};

if (fs.existsSync(stateFile)) {
  try {
    const existing = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
    state = existing;
    // Reset daily if new day
    if (state.lastCheckDate !== new Date().toISOString().split('T')[0]) {
      state.checkedToday = 0;
      state.lastCheckDate = new Date().toISOString().split('T')[0];
      state.progressDay += 1;
    }
  } catch (e) {
    console.log('Starting fresh state');
  }
}

// Results tracking
const results = {
  checked: asins,
  dead: [],
  alive: [],
  checkTime: new Date().toISOString()
};

// Generate output for browser automation
console.log('ASIN_BATCH_READY=true');
console.log(`BATCH_COUNT=${asins.length}`);
console.log(`PROGRESS_DAY=${state.progressDay + 1}`);
console.log(`TOTAL_PROGRESS=${Math.round(((state.checkedToday + asins.length) / 2400) * 100)}%`);

// Save the batch info for reporting
fs.writeFileSync(
  '/tmp/asin-batch-info.json',
  JSON.stringify({
    asins,
    stateAfter: {
      ...state,
      checkedToday: state.checkedToday + asins.length,
      totalDeadFound: 0  // Will be updated after checks
    },
    checkTime: new Date().toISOString()
  }, null, 2)
);

console.log('\nBatch prepared. Ready for browser checks.');
console.log(`ASINs ready: ${asins.slice(0, 5).join(', ')}...`);
