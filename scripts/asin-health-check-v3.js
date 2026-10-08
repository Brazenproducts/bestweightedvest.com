#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

const ASIN_BATCH_FILE = '/tmp/asin-batch.txt';
const MEMORY_FILE = path.join(__dirname, '../memory/asin-healthcheck-latest.md');
const STATE_FILE = path.join(__dirname, '../scripts/sitestripe-healthcheck-state.json');

// Simple HTTPS request without Puppeteer for faster checks
async function checkASINQuick(asin, timeout = 10000) {
  return new Promise((resolve) => {
    const url = `https://www.amazon.com/dp/${asin}`;
    const timeoutHandle = setTimeout(() => {
      resolve({
        asin,
        status: 'UNKNOWN',
        reason: 'timeout',
        url
      });
    }, timeout);

    const req = https.get(url, { 
      timeout: timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res) => {
      clearTimeout(timeoutHandle);
      
      if (res.statusCode === 404) {
        resolve({
          asin,
          status: 'DEAD',
          reason: '404',
          code: 404,
          url
        });
      } else if (res.statusCode >= 200 && res.statusCode < 300) {
        // Check for content
        let data = '';
        res.on('data', chunk => {
          data += chunk;
          if (data.length > 50000) res.destroy(); // Stop reading after 50KB
        });
        res.on('end', () => {
          if (data.includes('Currently unavailable')) {
            resolve({
              asin,
              status: 'DEAD',
              reason: 'unavailable',
              code: 200,
              url
            });
          } else if (!data.includes('productTitle') && !data.includes('product title')) {
            resolve({
              asin,
              status: 'UNKNOWN',
              reason: 'no_title_found',
              code: 200,
              url
            });
          } else {
            resolve({
              asin,
              status: 'ALIVE',
              reason: null,
              code: 200,
              url
            });
          }
        });
      } else {
        resolve({
          asin,
          status: 'UNKNOWN',
          reason: `http_${res.statusCode}`,
          code: res.statusCode,
          url
        });
      }
    });

    req.on('error', (error) => {
      clearTimeout(timeoutHandle);
      resolve({
        asin,
        status: 'UNKNOWN',
        reason: 'request_error',
        error: error.message,
        url
      });
    });
  });
}

async function main() {
  // Read batch
  if (!fs.existsSync(ASIN_BATCH_FILE)) {
    console.error(`Batch file not found: ${ASIN_BATCH_FILE}`);
    process.exit(1);
  }

  const batchText = fs.readFileSync(ASIN_BATCH_FILE, 'utf8');
  const lines = batchText.trim().split('\n');
  
  const asins = [];
  let startIndex = 0;
  
  for (const line of lines) {
    if (line.match(/^B[A-Z0-9]{9}$/)) {
      asins.push(line);
    } else if (line.startsWith('Starting index:')) {
      startIndex = parseInt(line.split(':')[1]);
    }
  }

  console.log(`Checking ${asins.length} ASINs (batch starting at ${startIndex})`);
  
  const results = [];
  let deadCount = 0;
  let aliveCount = 0;
  let unknownCount = 0;
  const deadASINs = [];

  // Check all ASINs sequentially with small delays
  for (let i = 0; i < asins.length; i++) {
    const asin = asins[i];
    const result = await checkASINQuick(asin);
    results.push(result);
    
    if (result.status === 'DEAD') {
      deadCount++;
      deadASINs.push({ asin, reason: result.reason });
      console.log(`[${i+1}/${asins.length}] ❌ ${asin} - ${result.reason}`);
    } else if (result.status === 'ALIVE') {
      aliveCount++;
      console.log(`[${i+1}/${asins.length}] ✅ ${asin}`);
    } else {
      unknownCount++;
      console.log(`[${i+1}/${asins.length}] ⚠️  ${asin} - ${result.reason}`);
    }
    
    // Delay between requests to avoid overwhelming Amazon
    if ((i + 1) % 20 === 0) {
      console.log(`Processed ${i+1}/${asins.length}. Waiting 2 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Generate report
  const progressPercent = Math.round((startIndex + asins.length) / 2400 * 100);
  
  const memoryContent = `# ASIN Health Check Report
Generated: ${new Date().toISOString()}
Batch: ${startIndex}-${startIndex + asins.length - 1}

## Summary
- **ASINs Checked This Batch**: ${asins.length}
- **Status Confirmed Alive**: ${aliveCount}
- **Status Confirmed Dead**: ${deadCount}
- **Status Unknown/Timeout**: ${unknownCount}
- **Overall Success Rate**: ${((aliveCount + deadCount) / asins.length * 100).toFixed(1)}%

## Daily Progress
- **Total ASINs This Batch**: ${asins.length}
- **Batch Index**: ${startIndex}/2400 = ${Math.round(startIndex / 2400 * 100)}%
- **After This Batch**: ${startIndex + asins.length}/2400 = ${progressPercent}%

## Dead ASINs Found
${deadASINs.length > 0 ? deadASINs.map(d => `- ${d.asin} (${d.reason})`).join('\n') : 'None found in this batch'}

## Reason Summary
${(() => {
  const reasons = {};
  results.forEach(r => {
    if (r.reason) {
      reasons[r.reason] = (reasons[r.reason] || 0) + 1;
    }
  });
  return Object.entries(reasons)
    .sort((a, b) => b[1] - a[1])
    .map(([reason, count]) => `- ${reason}: ${count}`)
    .join('\n') || 'N/A';
})()}

## Notes
- HTTP-based health checks (lighter than full browser automation)
- Checks for: 404 status, "Currently unavailable" text, missing product title
- Timeouts treated as unknown (may indicate server issues or rate limiting)

---
*ASIN Health Check - Affiliate Product Monitoring (SiteStripe)*
`;

  fs.writeFileSync(MEMORY_FILE, memoryContent);
  console.log(`\nReport saved to: ${MEMORY_FILE}`);

  console.log(`\n=== FINAL SUMMARY ===`);
  console.log(`Checked: ${asins.length}`);
  console.log(`Confirmed Alive: ${aliveCount}`);
  console.log(`Confirmed Dead: ${deadCount}`);
  console.log(`Unknown/Timeout: ${unknownCount}`);
  console.log(`Progress: ${progressPercent}% (${startIndex + asins.length}/2400)`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
