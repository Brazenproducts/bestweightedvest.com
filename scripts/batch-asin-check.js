#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

// Read ASINs from batch file
const batchFile = '/tmp/asin-batch.txt';
const content = fs.readFileSync(batchFile, 'utf-8');
const asinLines = content.split('\n').filter(line => line.trim() && line.match(/^B[A-Z0-9]{9}$/));

console.log(`Processing ${asinLines.length} ASINs...`);

const deadAsins = [];
const liveAsins = [];
const errorAsins = [];

// Function to check an ASIN via Amazon's lightweight endpoint
async function checkAsin(asin) {
  return new Promise((resolve) => {
    const url = `https://www.amazon.com/dp/${asin}`;
    const options = {
      method: 'HEAD',
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
      }
    };

    https.request(url, options, (res) => {
      if (res.statusCode === 404) {
        resolve({ asin, status: 'DEAD', reason: '404' });
      } else if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve({ asin, status: 'LIVE', statusCode: res.statusCode });
      } else {
        resolve({ asin, status: 'UNKNOWN', statusCode: res.statusCode });
      }
    }).on('error', (err) => {
      resolve({ asin, status: 'ERROR', reason: err.message });
    }).end();
  });
}

// Process in parallel batches of 10
async function processBatch(asins) {
  const results = [];
  
  for (let i = 0; i < asins.length; i += 10) {
    const batch = asins.slice(i, i + 10);
    const batchResults = await Promise.all(batch.map(checkAsin));
    results.push(...batchResults);
    
    // Log progress
    console.log(`Processed ${Math.min(i + 10, asins.length)}/${asins.length}`);
  }
  
  return results;
}

processBatch(asinLines).then(results => {
  // Categorize results
  results.forEach(result => {
    if (result.status === 'DEAD') {
      deadAsins.push(result.asin);
    } else if (result.status === 'LIVE') {
      liveAsins.push(result.asin);
    } else {
      errorAsins.push(result.asin);
    }
  });

  // Output summary
  console.log('\n=== BATCH RESULTS ===');
  console.log(`Total checked: ${results.length}`);
  console.log(`Live: ${liveAsins.length}`);
  console.log(`Dead: ${deadAsins.length}`);
  console.log(`Errors: ${errorAsins.length}`);
  
  // Save results to file
  const output = {
    timestamp: new Date().toISOString(),
    asinsChecked: asinLines.length,
    deadAsins: deadAsins,
    deadCount: deadAsins.length,
    liveCount: liveAsins.length,
    errorCount: errorAsins.length,
    results: results
  };
  
  fs.writeFileSync('/tmp/asin-check-results.json', JSON.stringify(output, null, 2));
  console.log('\nResults saved to /tmp/asin-check-results.json');
});
