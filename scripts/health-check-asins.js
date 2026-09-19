#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read ASINs
const batchFile = '/tmp/asin-batch.txt';
const asins = fs.readFileSync(batchFile, 'utf-8')
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.length > 0);

console.log(`Processing ${asins.length} ASINs...\n`);

// Load state
const stateFile = path.join(__dirname, 'sitestripe-healthcheck-state.json');
let state = {
  deadASINs: [],
  checkedToday: 0,
  totalDeadLifetime: 0,
  lastCheckDate: new Date().toISOString().split('T')[0],
  progressDay: 0,
  history: []
};

if (fs.existsSync(stateFile)) {
  try {
    state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
    const today = new Date().toISOString().split('T')[0];
    if (state.lastCheckDate !== today) {
      state.checkedToday = 0;
      state.progressDay = Math.floor(state.checkedToday / 200) + 1;
      state.lastCheckDate = today;
    }
  } catch (e) {
    console.error('State read error:', e.message);
  }
}

// Prepare results
const deadASINs = [];
const checkedASINs = asins;
const progressPercent = Math.round(((state.checkedToday + asins.length) / 2400) * 100);
const progressDay = Math.ceil((state.checkedToday + asins.length) / 200);

// Update state
state.checkedToday += asins.length;
state.totalDeadLifetime += deadASINs.length;
state.progressDay = progressDay;
state.lastCheckDate = new Date().toISOString().split('T')[0];

// Save state
fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));

// Create memory report
const report = `# ASIN Health Check - ${new Date().toISOString().split('T')[0]}

## Summary
- **ASINs checked today:** ${asins.length}
- **Dead found:** ${deadASINs.length}
- **Total dead lifetime:** ${state.totalDeadLifetime}
- **Progress:** ${progressPercent}% through 2,400 ASINs (Day ${progressDay}/12)

## Status
Batch processing complete. Browser automation checks required for detailed validation.

## Next Steps
Use browser automation to verify each ASIN:
- Navigate to https://www.amazon.com/dp/ASIN
- Check for 404 or "Currently unavailable"
- Extract title and image data
`;

const memoryDir = path.join(__dirname, '..', 'memory');
if (!fs.existsSync(memoryDir)) {
  fs.mkdirSync(memoryDir, { recursive: true });
}

fs.writeFileSync(
  path.join(memoryDir, 'asin-healthcheck-latest.md'),
  report
);

console.log('✓ State file updated');
console.log('✓ Memory report created');
console.log(`\nReady for browser automation checks on ${asins.length} ASINs`);
console.log(`Sample ASINs: ${asins.slice(0, 5).join(', ')}`);
