#!/usr/bin/env node

const fs = require('fs');
const http = require('http');
const https = require('https');

// Read ASINs
const batchFile = '/tmp/asin-batch.txt';
const content = fs.readFileSync(batchFile, 'utf-8');
const asinLines = content.split('\n').filter(line => line.trim() && line.match(/^B[A-Z0-9]{9}$/));

console.log(`Processing ${asinLines.length} ASINs via GET...`);

const deadAsins = [];
const liveAsins = [];
const results = [];

// Function to check ASIN via GET and parse response
async function checkAsin(asin) {
  return new Promise((resolve) => {
    const url = `https://www.amazon.com/dp/${asin}`;
    const options = {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive'
      }
    };

    const req = https.get(url, options, (res) => {
      let data = '';
      let isDead = false;
      let hasTitle = false;

      // Check status and headers
      if (res.statusCode === 404) {
        return resolve({ asin, status: 'DEAD', reason: '404', statusCode: 404 });
      }

      res.on('data', (chunk) => {
        data += chunk.toString();
        
        // Check for dead indicators in streaming data
        if (data.includes('Currently unavailable') || data.includes('no longer available')) {
          isDead = true;
        }
        if (data.includes('productTitle') || data.includes('"title":')) {
          hasTitle = true;
        }
      });

      res.on('end', () => {
        if (!hasTitle || data.includes('404')) {
          return resolve({ asin, status: 'DEAD', reason: 'No title or 404', statusCode: res.statusCode });
        }
        if (isDead) {
          return resolve({ asin, status: 'DEAD', reason: 'Unavailable', statusCode: res.statusCode });
        }
        
        resolve({ asin, status: 'LIVE', statusCode: res.statusCode });
      });
    }).on('error', (err) => {
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        resolve({ asin, status: 'DEAD', reason: 'Connection error' });
      } else {
        resolve({ asin, status: 'ERROR', reason: err.message });
      }
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ asin, status: 'TIMEOUT', reason: 'Request timeout' });
    });
  });
}

// Process sequentially to avoid rate limiting
async function processBatch(asins) {
  const results = [];
  
  for (let i = 0; i < asins.length; i++) {
    const result = await checkAsin(asins[i]);
    results.push(result);
    
    if ((i + 1) % 20 === 0) {
      console.log(`Checked ${i + 1}/${asins.length}...`);
    }
    
    // Add small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

processBatch(asinLines).then(results => {
  // Categorize
  results.forEach(result => {
    if (result.status === 'DEAD') {
      deadAsins.push(result.asin);
    } else if (result.status === 'LIVE') {
      liveAsins.push(result.asin);
    }
  });

  console.log('\n=== BATCH COMPLETE ===');
  console.log(`Total: ${results.length}`);
  console.log(`Live: ${liveAsins.length}`);
  console.log(`Dead: ${deadAsins.length}`);
  
  // Save detailed results
  const output = {
    timestamp: new Date().toISOString(),
    asinsChecked: asinLines.length,
    deadAsins: deadAsins,
    liveAsins: liveAsins,
    deadCount: deadAsins.length,
    liveCount: liveAsins.length,
    results: results
  };
  
  fs.writeFileSync('/tmp/asin-check-results.json', JSON.stringify(output, null, 2));
  console.log('Results saved to /tmp/asin-check-results.json');
});
