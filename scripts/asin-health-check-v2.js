#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ASIN_BATCH_FILE = '/tmp/asin-batch.txt';
const STATE_FILE = path.join(__dirname, '../scripts/sitestripe-healthcheck-state.json');
const MEMORY_FILE = path.join(__dirname, '../memory/asin-healthcheck-latest.md');
const CHECKPOINT_FILE = path.join(__dirname, '../scripts/asin-healthcheck-checkpoint.json');

async function checkASIN(browser, asin, timeout = 20000) {
  let page;
  try {
    page = await browser.newPage();
    const url = `https://www.amazon.com/dp/${asin}`;
    
    page.setDefaultNavigationTimeout(timeout);
    page.setDefaultTimeout(timeout);
    
    let response;
    try {
      response = await page.goto(url, { waitUntil: 'networkidle1', timeout });
    } catch (e) {
      return {
        asin,
        status: 'DEAD',
        reason: 'timeout_or_error',
        title: null,
        image: null,
        url
      };
    }

    // Check for 404
    if (response && response.status() === 404) {
      return {
        asin,
        status: 'DEAD',
        reason: '404',
        title: null,
        image: null,
        url
      };
    }

    // Check for "Currently unavailable"
    try {
      const pageContent = await page.evaluate(() => document.body.innerText);
      if (pageContent.includes('Currently unavailable') || pageContent.includes('currently unavailable')) {
        return {
          asin,
          status: 'DEAD',
          reason: 'unavailable',
          title: null,
          image: null,
          url
        };
      }
    } catch (e) {
      // Continue to title check
    }

    // Extract title
    let title = null;
    try {
      title = await page.evaluate(() => {
        const titleEl = document.querySelector('#productTitle');
        return titleEl ? titleEl.textContent.trim() : null;
      });
    } catch (e) {
      // Continue
    }

    // Extract image
    let image = null;
    try {
      image = await page.evaluate(() => {
        const imgEl = document.querySelector('#landingImage');
        return imgEl ? imgEl.src : null;
      });
    } catch (e) {
      // Continue
    }

    // Mark as DEAD if no title
    if (!title) {
      return {
        asin,
        status: 'DEAD',
        reason: 'no_title',
        title: null,
        image: null,
        url
      };
    }

    return {
      asin,
      status: 'ALIVE',
      reason: null,
      title: title.substring(0, 100),
      image: image,
      url
    };

  } catch (error) {
    return {
      asin,
      status: 'DEAD',
      reason: 'check_error',
      title: null,
      image: null,
      url: `https://www.amazon.com/dp/${asin}`,
      error: error.message
    };
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (e) {
        // Ignore close errors
      }
    }
  }
}

async function main() {
  // Read batch from file
  if (!fs.existsSync(ASIN_BATCH_FILE)) {
    console.error(`Batch file not found: ${ASIN_BATCH_FILE}`);
    process.exit(1);
  }

  const batchText = fs.readFileSync(ASIN_BATCH_FILE, 'utf8');
  const lines = batchText.trim().split('\n');
  
  const asins = [];
  let batchSize = 0;
  let startIndex = 0;
  let nextBatchStart = 0;
  let progress = '';
  
  for (const line of lines) {
    if (line.match(/^B[A-Z0-9]{9}$/)) {
      asins.push(line);
    } else if (line.startsWith('Batch size:')) {
      batchSize = parseInt(line.split(':')[1]);
    } else if (line.startsWith('Starting index:')) {
      startIndex = parseInt(line.split(':')[1]);
    } else if (line.startsWith('Next batch will start at:')) {
      nextBatchStart = parseInt(line.split(':')[1]);
    } else if (line.startsWith('Progress:')) {
      progress = line.split(':')[1].trim();
    }
  }

  console.log(`Found ${asins.length} ASINs to check`);
  console.log(`Starting index: ${startIndex}`);

  // Check for checkpoint
  let checkpoint = { lastCheckedIndex: 0, results: [] };
  if (fs.existsSync(CHECKPOINT_FILE)) {
    try {
      checkpoint = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
      console.log(`Resuming from checkpoint: ${checkpoint.lastCheckedIndex}/${asins.length}`);
    } catch (e) {
      console.log('Starting fresh (checkpoint invalid)');
    }
  }

  const results = checkpoint.results || [];
  const startCheckIndex = checkpoint.lastCheckedIndex || 0;

  // Launch browser
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process=false'
    ],
    timeout: 30000
  });

  let deadCount = 0;
  const deadASINsThisBatch = [];

  console.log(`Starting ASIN checks from index ${startCheckIndex}...`);
  
  // Check ASINs with rate limiting
  for (let i = startCheckIndex; i < asins.length; i++) {
    const asin = asins[i];
    
    try {
      const result = await checkASIN(browser, asin);
      results.push(result);
      
      if (result.status === 'DEAD') {
        deadCount++;
        deadASINsThisBatch.push({
          asin,
          reason: result.reason,
          checkedAt: new Date().toISOString()
        });
        console.log(`[${i + 1}/${asins.length}] ❌ ${asin} - ${result.reason}`);
      } else {
        console.log(`[${i + 1}/${asins.length}] ✅ ${asin}`);
      }
      
      // Save checkpoint every 25 ASINs
      if ((i + 1) % 25 === 0) {
        console.log(`Progress: ${i + 1}/${asins.length} - Saving checkpoint...`);
        fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify({
          lastCheckedIndex: i + 1,
          results: results
        }, null, 2));
      }
      
      // Rate limiting - short delay between requests
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.error(`Error checking ${asin}: ${error.message}`);
      results.push({
        asin,
        status: 'DEAD',
        reason: 'check_error',
        error: error.message
      });
      deadCount++;
      deadASINsThisBatch.push({
        asin,
        reason: 'check_error',
        checkedAt: new Date().toISOString()
      });
    }
  }

  try {
    await browser.close();
  } catch (e) {
    console.warn('Browser close error (non-fatal):', e.message);
  }

  // Generate report
  const progressPercent = Math.round((startIndex + asins.length) / 2400 * 100);
  const memoryContent = `# ASIN Health Check Report
Generated: ${new Date().toISOString()}

## Today's Check
- **ASINs checked today:** ${startIndex + asins.length}
- **Dead found today:** ${deadASINsThisBatch.length}
- **Dead found this batch:** ${deadASINsThisBatch.length}

## Lifetime Stats
- **Total dead ASINs:** ${deadASINsThisBatch.length}
- **Progress:** ${startIndex + asins.length}/2400 = ${progressPercent}%

## Dead ASINs Found (This Batch)
${deadASINsThisBatch.map(d => `- ${d.asin} (${d.reason})`).join('\n') || 'None'}

## Check Summary
- Total checked in batch: ${asins.length}
- Alive: ${asins.length - deadCount}
- Dead: ${deadCount}
- Success rate: ${((asins.length - deadCount) / asins.length * 100).toFixed(1)}%

## Dead ASIN Reasons
${(() => {
  const reasons = {};
  deadASINsThisBatch.forEach(d => {
    reasons[d.reason] = (reasons[d.reason] || 0) + 1;
  });
  return Object.entries(reasons).map(([reason, count]) => `- ${reason}: ${count}`).join('\n') || 'None';
})()}
`;

  fs.writeFileSync(MEMORY_FILE, memoryContent);
  console.log(`\nMemory report saved: ${MEMORY_FILE}`);

  // Clean up checkpoint
  if (fs.existsSync(CHECKPOINT_FILE)) {
    fs.unlinkSync(CHECKPOINT_FILE);
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`ASINs checked: ${asins.length}`);
  console.log(`Dead found: ${deadCount}`);
  console.log(`Alive: ${asins.length - deadCount}`);
  console.log(`Progress: ${progressPercent}%`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
