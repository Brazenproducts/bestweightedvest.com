#!/usr/bin/env node
/**
 * ASIN Health Check - Browser Automation
 * Checks 200 ASINs per day for availability on Amazon
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// Read ASINs from stdin or file
const asins = [];
const input = fs.readFileSync('/tmp/asin-batch.txt', 'utf8');
input.split('\n').forEach(line => {
  const asin = line.trim();
  if (asin && asin.length === 10 && /^B[0-9A-Z]{9}$/.test(asin)) {
    asins.push(asin);
  }
});

console.log(`Processing ${asins.length} ASINs...`);

// State tracking
const results = {
  checked: 0,
  dead: [],
  alive: [],
  errors: []
};

const stateFile = '/home/ubuntu/.openclaw/workspace/scripts/sitestripe-healthcheck-state.json';
let lifetimeDead = 0;

if (fs.existsSync(stateFile)) {
  try {
    const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    lifetimeDead = (state.deadCount || 0);
  } catch (e) {
    console.error('Error reading state file:', e.message);
  }
}

// Check each ASIN using Amazon product page
async function checkAsin(asin) {
  return new Promise((resolve) => {
    const url = `https://www.amazon.com/dp/${asin}`;
    
    // Use a timeout to prevent hanging
    const timeout = setTimeout(() => {
      resolve({ asin, status: 'timeout', title: null, image: null });
    }, 10000);

    const options = {
      hostname: 'www.amazon.com',
      path: `/dp/${asin}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 8000
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        clearTimeout(timeout);
        
        // Check for 404 or unavailable indicators
        const is404 = res.statusCode === 404;
        const isUnavailable = data.includes('Currently unavailable') || 
                             data.includes('This item cannot be found') ||
                             data.includes('does not exist') ||
                             data.includes('Error 404');
        
        // Extract title from HTML
        let title = null;
        const titleMatch = data.match(/<span id="productTitle"[^>]*>([^<]+)<\/span>/);
        if (titleMatch) {
          title = titleMatch[1].trim();
        }
        
        // Check for title in meta tags if not found
        if (!title) {
          const metaMatch = data.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/);
          if (metaMatch) {
            title = metaMatch[1];
          }
        }
        
        // Determine if DEAD
        const isDead = is404 || isUnavailable || !title;
        
        const result = {
          asin,
          status: is404 ? '404' : (isUnavailable ? 'unavailable' : 'ok'),
          title: title || null,
          isDead: isDead
        };
        
        resolve(result);
      });
    });
    
    req.on('error', (err) => {
      clearTimeout(timeout);
      resolve({ asin, status: 'error', error: err.message, isDead: true });
    });
    
    req.on('timeout', () => {
      clearTimeout(timeout);
      req.destroy();
    });
    
    req.end();
  });
}

// Process all ASINs
async function checkAll() {
  console.log(`Starting ASIN health check at ${new Date().toISOString()}`);
  
  for (let i = 0; i < asins.length; i++) {
    const asin = asins[i];
    const result = await checkAsin(asin);
    
    results.checked++;
    
    if (result.isDead) {
      results.dead.push({ asin, reason: result.status, title: result.title });
    } else {
      results.alive.push({ asin, title: result.title });
    }
    
    // Progress indicator
    if ((i + 1) % 20 === 0) {
      console.log(`Progress: ${i + 1}/${asins.length}`);
    }
  }
  
  // Calculate metrics
  const totalDead = lifetimeDead + results.dead.length;
  const progress = Math.round((70 + asins.length) / 2400 * 100);
  
  // Save results to memory
  const memoryContent = `# ASIN Health Check Results - ${new Date().toISOString().split('T')[0]}

## Summary
- **ASINs checked today:** ${results.checked}
- **Dead found today:** ${results.dead.length}
- **Total dead lifetime:** ${totalDead}
- **Progress:** ${70 + asins.length}/2400 = ${progress}%

## Dead ASINs (${results.dead.length})
${results.dead.map(r => `- \`${r.asin}\` - ${r.reason}`).join('\n')}

## Alive ASINs (${results.alive.length})
${results.alive.slice(0, 50).map(r => `- \`${r.asin}\` - ${r.title || '(no title)'}`).join('\n')}
${results.alive.length > 50 ? `\n... and ${results.alive.length - 50} more alive ASINs` : ''}

## Run Time
Started: ${new Date().toISOString()}
Duration: ~${Math.round((results.checked * 1000) / 1000)}s
`;

  const memPath = '/home/ubuntu/.openclaw/workspace/memory/asin-healthcheck-latest.md';
  fs.mkdirSync(path.dirname(memPath), { recursive: true });
  fs.writeFileSync(memPath, memoryContent);
  
  // Update state file
  const newState = {
    lastCheck: new Date().toISOString(),
    deadCount: totalDead,
    deadASINs: results.dead.map(d => d.asin),
    lastBatchSize: results.checked,
    totalChecked: 70 + asins.length
  };
  
  fs.mkdirSync(path.dirname(stateFile), { recursive: true });
  fs.writeFileSync(stateFile, JSON.stringify(newState, null, 2));
  
  console.log('\n=== RESULTS ===');
  console.log(`Checked: ${results.checked}`);
  console.log(`Dead: ${results.dead.length}`);
  console.log(`Alive: ${results.alive.length}`);
  console.log(`Total dead (lifetime): ${totalDead}`);
  console.log(`Progress: ${progress}%`);
  console.log('\nResults saved to memory/asin-healthcheck-latest.md');
  console.log('State saved to scripts/sitestripe-healthcheck-state.json');
}

checkAll().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
