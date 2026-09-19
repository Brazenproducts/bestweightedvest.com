#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read ASINs from batch file
const batchFile = '/tmp/asin-batch.txt';
const asinLines = fs.readFileSync(batchFile, 'utf-8')
  .split('\n')
  .filter(line => line.trim() && line.match(/^B[A-Z0-9]{9}$/));

const deadAsins = [];
const checkedAsins = [];
const results = [];
let batchSize = 0;

console.log(`Starting health check on ${asinLines.length} ASINs...`);
console.log('---');

// Check a sample first to verify page structure
const sampleSize = Math.min(10, asinLines.length);
console.log(`Checking first ${sampleSize} ASINs for dead products...`);

for (let i = 0; i < sampleSize; i++) {
  const asin = asinLines[i];
  try {
    const url = `https://www.amazon.com/dp/${asin}`;
    
    // Use browser tool via CLI to check the page
    const cmd = `openclaw browser open --url "${url}" --label "asin-${i}" --timeout-ms 15000`;
    execSync(cmd, { stdio: 'pipe' });
    
    // Snapshot the page
    const snapshotCmd = `openclaw browser snapshot --target-id "asin-${i}"`;
    const output = JSON.parse(execSync(snapshotCmd, { encoding: 'utf-8' }));
    
    // Check for 404
    if (output.title && output.title.includes('404')) {
      deadAsins.push(asin);
      results.push({ asin, status: 'DEAD', reason: '404' });
      checkedAsins.push(asin);
      console.log(`✗ ${asin} - 404 Not Found`);
      continue;
    }
    
    // Check page text for unavailable
    const pageText = output.text || '';
    if (pageText.includes('Currently unavailable') || pageText.includes('no longer available')) {
      deadAsins.push(asin);
      results.push({ asin, status: 'DEAD', reason: 'Currently unavailable' });
      checkedAsins.push(asin);
      console.log(`✗ ${asin} - Currently unavailable`);
      continue;
    }
    
    // Check for product title
    if (!pageText.includes('productTitle') && !output.title) {
      deadAsins.push(asin);
      results.push({ asin, status: 'DEAD', reason: 'Missing product title' });
      checkedAsins.push(asin);
      console.log(`✗ ${asin} - Missing product title`);
      continue;
    }
    
    results.push({ asin, status: 'LIVE' });
    checkedAsins.push(asin);
    console.log(`✓ ${asin} - LIVE`);
    batchSize++;
    
  } catch (error) {
    console.log(`? ${asin} - Error checking: ${error.message.substring(0, 50)}`);
    results.push({ asin, status: 'ERROR', reason: error.message.substring(0, 100) });
    checkedAsins.push(asin);
  }
}

console.log('---');
console.log(`Sample check complete: ${checkedAsins.length} checked, ${deadAsins.length} dead found`);

// Output results
console.log(JSON.stringify({
  checkedCount: checkedAsins.length,
  deadCount: deadAsins.length,
  deadAsins: deadAsins,
  results: results,
  totalBatchSize: asinLines.length
}, null, 2));
