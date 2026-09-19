#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read ASINs from batch file
const batchFile = '/tmp/asin-batch.txt';
const asins = fs.readFileSync(batchFile, 'utf-8')
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.length > 0);

console.log(`Total ASINs to check: ${asins.length}`);

// Load state file
const stateFile = path.join(__dirname, '..', 'scripts', 'sitestripe-healthcheck-state.json');
let state = { deadASINs: [], checkedToday: 0, totalDeadLifetime: 0 };

if (fs.existsSync(stateFile)) {
  try {
    state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
  } catch (e) {
    console.log('Could not read state file, starting fresh');
  }
}

// Check if we need to reset daily counter
const today = new Date().toISOString().split('T')[0];
if (state.lastCheckDate !== today) {
  state.checkedToday = 0;
  state.lastCheckDate = today;
}

// Track results
const results = [];
const deadFound = [];

// Process ASINs
console.log('\nStarting ASIN checks...');
console.log(`Batch: ${asins.slice(0, 3).join(', ')}... and ${asins.length - 3} more\n`);

// Output summary that will be read by OpenClaw
console.log(`BATCH_SIZE=${asins.length}`);
console.log(`ASINS_JSON=${JSON.stringify(asins)}`);
