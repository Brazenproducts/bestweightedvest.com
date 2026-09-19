#!/usr/bin/env node

/**
 * ASIN Health Check - Orchestrator for OpenClaw Browser Tool
 * 
 * This script generates OpenClaw browser tool calls to check all ASINs.
 * Since the browser tool is accessed via gateway, we prepare batches
 * for checking via the cron system.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const BATCH_FILE = '/tmp/asin-batch.txt';
const STATE_FILE = path.join(__dirname, 'sitestripe-healthcheck-state.json');
const MEMORY_FILE = path.join(__dirname, '..', 'memory', 'asin-healthcheck-latest.md');
const RESULTS_FILE = '/tmp/asin-check-results.json';

// Read ASINs
const asins = fs.readFileSync(BATCH_FILE, 'utf8')
  .split('\n')
  .map(s => s.trim())
  .filter(s => s.length > 0);

console.log(`Starting ASIN health check for ${asins.length} ASINs`);

// Load existing state
let state = {};
if (fs.existsSync(STATE_FILE)) {
  try {
    state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch (e) {
    console.warn('Could not parse state file, starting fresh');
  }
}

state.deadAsins = state.deadAsins || [];
state.lastCheckDate = state.lastCheckDate || null;
state.totalDeadLifetime = state.deadAsins.length;
state.progressPercent = Math.round((state.lastCheckDate ? 1 : 0) * 100 / 2400);

// Today's results
const today = new Date().toISOString().split('T')[0];
let todayResults = {
  date: today,
  checked: 0,
  dead: 0,
  live: 0,
  deadAsins: [],
  newDeadFound: []
};

// Since we're running in cron with browser available, output check instructions
const checks = asins.map(asin => ({
  asin,
  url: `https://www.amazon.com/dp/${asin}`,
  deadline: new Date(Date.now() + 300000).toISOString() // 5 min timeout per ASIN
}));

// Save batch config for processing
const batchConfig = {
  date: today,
  totalAsins: asins.length,
  checks,
  progressTarget: Math.round((state.progressPercent + (asins.length / 2400 * 100)))
};

fs.writeFileSync(RESULTS_FILE, JSON.stringify(batchConfig, null, 2));
console.log(`Prepared ${checks.length} checks, saved to ${RESULTS_FILE}`);

// Output progress target
console.log(`Progress: 0/${asins.length} checked`);
console.log(`Target progress: ${batchConfig.progressTarget}% through 2,400 ASINs`);
console.log(`Dead lifetime: ${state.totalDeadLifetime}`);

process.exit(0);
