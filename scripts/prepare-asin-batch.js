#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load all ASINs from cache
const cacheFile = path.join(__dirname, '..', 'memory', 'asin-cache.json');
const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
const allAsins = Object.values(cache);

// Deduplicate
const uniqueAsins = [...new Set(allAsins)];
console.error(`Total unique ASINs in cache: ${uniqueAsins.length}`);

// Load state to determine which batch to run
const stateFile = path.join(__dirname, 'sitestripe-healthcheck-state.json');
let state = {
  deadAsins: [],
  lastCheckDate: new Date().toISOString().split('T')[0],
  totalAsinsTracked: 2400,
  asinsCheckedToday: 0,
  deadFoundToday: 0,
  progressDaysRemaining: 12,
  lastUpdated: new Date().toISOString(),
  lifetimeDead: 0,
  checkHistory: [],
  successRate: 1.0,
  estimatedRotationDays: 12,
  lastBatchStartIndex: 0
};

if (fs.existsSync(stateFile)) {
  try {
    state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
  } catch (e) {
    console.error('Could not read state, starting fresh');
  }
}

// Reset daily counter if new day
const today = new Date().toISOString().split('T')[0];
if (state.lastCheckDate !== today) {
  state.asinsCheckedToday = 0;
  state.deadFoundToday = 0;
  state.lastCheckDate = today;
  // Advance batch index by 200 (200 ASINs per day)
  state.lastBatchStartIndex = ((state.lastBatchStartIndex || 0) + 200) % uniqueAsins.length;
} else {
  // Reset state just to advance the batch index properly
  state.lastBatchStartIndex = ((state.lastBatchStartIndex || 0) + 200) % uniqueAsins.length;
}

// Get next batch of 200
const batchSize = 200;
const startIndex = state.lastBatchStartIndex || 0;
const endIndex = Math.min(startIndex + batchSize, uniqueAsins.length);
const batch = uniqueAsins.slice(startIndex, endIndex);

// Pad with cycling if needed
while (batch.length < batchSize && uniqueAsins.length > 0) {
  const cycleIndex = (startIndex + batch.length) % uniqueAsins.length;
  batch.push(uniqueAsins[cycleIndex]);
}

// Output batch to stdout for OpenClaw
batch.forEach(asin => console.log(asin));

// Log to stderr for diagnostics
console.error(`Batch size: ${batch.length}`);
console.error(`Starting index: ${startIndex}`);
console.error(`Next batch will start at: ${endIndex}`);
console.error(`Progress: ${startIndex}/2400 = ${Math.round((startIndex/2400)*100)}%`);
