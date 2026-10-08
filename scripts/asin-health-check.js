#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ASIN_BATCH_FILE = '/tmp/asin-batch.txt';
const STATE_FILE = path.join(__dirname, '../scripts/sitestripe-healthcheck-state.json');
const MEMORY_FILE = path.join(__dirname, '../memory/asin-healthcheck-latest.md');

async function checkASIN(browser, asin, timeout = 15000) {
  const page = await browser.newPage();
  
  try {
    const url = `https://www.amazon.com/dp/${asin}`;
    
    // Set timeout and navigate
    page.setDefaultNavigationTimeout(timeout);
    page.setDefaultTimeout(timeout);
    
    let response;
    try {
      response = await page.goto(url, { waitUntil: 'networkidle2', timeout });
    } catch (e) {
      // Timeout or navigation error
      return {
        asin,
        status: 'DEAD',
        reason: 'timeout',
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
      const unavailableText = await page.evaluate(() => {
        const element = document.body.innerText;
        return element.includes('Currently unavailable') || element.includes('currently unavailable');
      });
      
      if (unavailableText) {
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
      title: title.substring(0, 100), // Truncate for storage
      image: image,
      url
    };

  } catch (error) {
    return {
      asin,
      status: 'DEAD',
      reason: 'error',
      title: null,
      image: null,
      url: `https://www.amazon.com/dp/${asin}`,
      error: error.message
    };
  } finally {
    await page.close();
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
  
  // Parse the batch - ASINs are listed, followed by metadata lines
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
  console.log(`Batch size: ${batchSize}, Starting at: ${startIndex}`);
  console.log(`Progress: ${progress}`);

  // Load existing state
  let stateData = { deadASINs: [], checkedToday: 0, lastCheckDate: null };
  if (fs.existsSync(STATE_FILE)) {
    try {
      stateData = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    } catch (e) {
      console.warn('Could not parse state file, starting fresh');
    }
  }

  // Reset daily counters if date changed
  const today = new Date().toISOString().split('T')[0];
  if (stateData.lastCheckDate !== today) {
    stateData.checkedToday = 0;
    stateData.lastCheckDate = today;
  }

  // Launch browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const results = [];
  let deadCount = 0;
  const deadASINsThisBatch = [];

  console.log(`\nStarting ASIN health checks...`);
  
  // Check ASINs with rate limiting
  for (let i = 0; i < asins.length; i++) {
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
      
      // Rate limiting - delay between requests
      if ((i + 1) % 10 === 0) {
        console.log(`Processed ${i + 1}/${asins.length}...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
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

  await browser.close();

  // Update state
  stateData.deadASINs.push(...deadASINsThisBatch);
  stateData.checkedToday += asins.length;
  
  // Remove duplicates
  const uniqueDeadASINs = new Map();
  for (const dead of stateData.deadASINs) {
    uniqueDeadASINs.set(dead.asin, dead);
  }
  stateData.deadASINs = Array.from(uniqueDeadASINs.values());
  stateData.totalDeadLifetime = uniqueDeadASINs.size;

  // Save state
  fs.writeFileSync(STATE_FILE, JSON.stringify(stateData, null, 2));
  console.log(`\nState saved: ${STATE_FILE}`);

  // Generate report
  const progressPercent = Math.round((startIndex + asins.length) / 24 / 100 * 100);
  const memoryContent = `# ASIN Health Check Report
Generated: ${new Date().toISOString()}

## Today's Check
- **ASINs checked today:** ${stateData.checkedToday}
- **Dead found today:** ${deadCount}
- **Dead found this batch:** ${deadASINsThisBatch.length}

## Lifetime Stats
- **Total dead ASINs:** ${stateData.totalDeadLifetime}
- **Progress:** ${startIndex + asins.length}/2400 = ${progressPercent}%

## Dead ASINs Found (This Batch)
${deadASINsThisBatch.map(d => `- ${d.asin} (${d.reason})`).join('\n')}

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
  return Object.entries(reasons).map(([reason, count]) => `- ${reason}: ${count}`).join('\n');
})()}
`;

  fs.writeFileSync(MEMORY_FILE, memoryContent);
  console.log(`\nMemory report saved: ${MEMORY_FILE}`);

  console.log(`\n=== SUMMARY ===`);
  console.log(`ASINs checked: ${asins.length}`);
  console.log(`Dead found: ${deadCount}`);
  console.log(`Alive: ${asins.length - deadCount}`);
  console.log(`Total dead lifetime: ${stateData.totalDeadLifetime}`);
  console.log(`Progress: ${progressPercent}%`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
