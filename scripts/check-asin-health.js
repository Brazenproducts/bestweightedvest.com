#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

// Read ASINs from stdin or file
const asinBatch = fs.readFileSync('/tmp/asin-batch.txt', 'utf8')
  .split('\n')
  .filter(line => line.trim() && !line.startsWith('Total') && !line.startsWith('Batch') && !line.startsWith('Starting') && !line.startsWith('Next') && !line.startsWith('Progress'))
  .slice(0, 200);

const results = {
  checked: [],
  dead: [],
  alive: [],
  checkTime: new Date().toISOString()
};

let completed = 0;

// Check each ASIN
async function checkASIN(asin, index) {
  return new Promise((resolve) => {
    const url = `https://www.amazon.com/dp/${asin}`;
    
    const options = {
      hostname: 'www.amazon.com',
      path: `/dp/${asin}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const result = {
          asin: asin,
          status: res.statusCode,
          dead: false,
          reason: null,
          title: null,
          image: null
        };

        // Check for 404
        if (res.statusCode === 404) {
          result.dead = true;
          result.reason = '404';
        }
        // Check for unavailable
        else if (data.includes('Currently unavailable') || data.includes('currently unavailable')) {
          result.dead = true;
          reason = 'unavailable';
        }
        // Try to extract title
        const titleMatch = data.match(/<span id="productTitle"[^>]*>([^<]+)<\/span>/);
        if (titleMatch) {
          result.title = titleMatch[1].trim();
        } else if (data.includes('pageNotFound') || data.includes('404')) {
          result.dead = true;
          result.reason = '404-content';
        }

        // Try to extract image
        const imageMatch = data.match(/#landingImage[^>]*|id="landingImage"[^>]*src="([^"]+)"/);
        if (imageMatch) {
          result.image = imageMatch[1];
        }

        // If no title, likely dead
        if (!result.title) {
          result.dead = true;
          result.reason = result.reason || 'no-title';
        }

        results.checked.push(asin);
        if (result.dead) {
          results.dead.push(result);
        } else {
          results.alive.push(asin);
        }

        completed++;
        process.stdout.write(`\rChecking: ${completed}/${asinBatch.length} - Dead: ${results.dead.length}`);
        
        resolve(result);
      });
    });

    req.on('error', (err) => {
      const result = {
        asin: asin,
        status: 'error',
        dead: true,
        reason: err.message,
        title: null,
        image: null
      };

      results.dead.push(result);
      completed++;
      process.stdout.write(`\rChecking: ${completed}/${asinBatch.length} - Dead: ${results.dead.length}`);
      resolve(result);
    });

    req.on('timeout', () => {
      req.abort();
    });
  });
}

// Sequential checking with delay
async function checkAll() {
  for (let i = 0; i < asinBatch.length; i++) {
    await checkASIN(asinBatch[i], i);
    // Add small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n\nHealth Check Summary:');
  console.log(`Total checked: ${results.checked.length}`);
  console.log(`Dead found: ${results.dead.length}`);
  console.log(`Alive: ${results.alive.length}`);
  
  // Save results
  fs.writeFileSync('/tmp/asin-healthcheck-results.json', JSON.stringify(results, null, 2));
  
  // Load existing state
  const stateFile = path.join(__dirname, '../scripts/sitestripe-healthcheck-state.json');
  let state = { deadASINs: [], lastCheck: null, totalChecked: 0, progress: 0 };
  
  if (fs.existsSync(stateFile)) {
    state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  }

  // Update state
  state.lastCheck = new Date().toISOString();
  state.totalChecked = (state.totalChecked || 0) + results.checked.length;
  state.progress = Math.round((state.totalChecked / 2400) * 100);
  
  // Add new dead ASINs
  const newDeadASINs = results.dead.map(d => d.asin);
  state.deadASINs = [...new Set([...(state.deadASINs || []), ...newDeadASINs])];

  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));

  console.log(`\nState updated:`);
  console.log(`  Total lifetime dead: ${state.deadASINs.length}`);
  console.log(`  Progress: ${state.totalChecked}/2400 (${state.progress}%)`);
}

checkAll().catch(console.error);
