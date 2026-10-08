const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ASIN_BATCH_FILE = '/tmp/asin-batch.txt';
const STATE_FILE = 'scripts/sitestripe-healthcheck-state.json';
const RESULTS_FILE = '../memory/asin-healthcheck-latest.md';

async function checkASIN(browser, asin) {
  let page = null;
  try {
    page = await browser.newPage();
    page.setDefaultTimeout(10000);
    page.setDefaultNavigationTimeout(10000);
    
    const url = `https://www.amazon.com/dp/${asin}`;
    
    const response = await page.goto(url, { waitUntil: 'domcontentloaded' }).catch(err => null);
    
    if (!response) {
      return { asin, status: 'DEAD', reason: 'Navigation failed', title: null, image: null };
    }
    
    const status = response.status();
    
    // Check for 404
    if (status === 404) {
      return { asin, status: 'DEAD', reason: '404', title: null, image: null };
    }
    
    // Check if page is still loading (might indicate error)
    if (status >= 400) {
      return { asin, status: 'DEAD', reason: `HTTP ${status}`, title: null, image: null };
    }
    
    // Try to get page content
    let pageText = '';
    try {
      const textResult = await page.evaluate(() => document.documentElement.innerText);
      pageText = textResult || '';
    } catch (e) {
      // Could not get text
      pageText = '';
    }
    
    if (typeof pageText === 'string' && pageText.toLowerCase().includes('currently unavailable')) {
      return { asin, status: 'DEAD', reason: 'Currently unavailable', title: null, image: null };
    }
    
    // Extract title
    let title = null;
    try {
      title = await page.$eval('#productTitle', el => el.textContent.trim());
      if (!title || title.length === 0) {
        return { asin, status: 'DEAD', reason: 'Empty title', title: null, image: null };
      }
    } catch (e) {
      // Title not found - mark as dead
      return { asin, status: 'DEAD', reason: 'Missing title', title: null, image: null };
    }
    
    // Extract image
    let image = null;
    try {
      image = await page.$eval('#landingImage', el => el.src || el.getAttribute('src'));
    } catch (e) {
      // Image not found but not marking as dead
    }
    
    return { asin, status: 'ALIVE', reason: 'OK', title, image };
      
  } catch (error) {
    return { asin, status: 'ERROR', reason: error.message, title: null, image: null };
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
  try {
    // Read ASINs from batch file
    const asinText = fs.readFileSync(ASIN_BATCH_FILE, 'utf8');
    const asins = asinText.split('\n')
      .filter(line => line.trim().length > 0 && /^B[A-Z0-9]+$/.test(line.trim()))
      .map(line => line.trim());
    
    console.log(`Found ${asins.length} ASINs to check`);
    
    // Load current state
    let state = { deadASINs: [], checkedCount: 0, totalDeadLifetime: 0 };
    if (fs.existsSync(STATE_FILE)) {
      try {
        const stateData = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        state = stateData;
      } catch (e) {
        console.log('Initializing new state file');
      }
    }
    
    // Launch browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });
    
    const results = {
      checkedToday: 0,
      deadFound: 0,
      aliveFound: 0,
      errors: 0,
      details: []
    };
    
    // Check each ASIN with rate limiting
    for (let i = 0; i < asins.length; i++) {
      const asin = asins[i];
      console.log(`[${i + 1}/${asins.length}] Checking ${asin}...`);
      
      const result = await checkASIN(browser, asin);
      results.details.push(result);
      
      if (result.status === 'DEAD') {
        results.deadFound++;
        if (!state.deadASINs.includes(asin)) {
          state.deadASINs.push(asin);
          state.totalDeadLifetime++;
        }
      } else if (result.status === 'ALIVE') {
        results.aliveFound++;
      } else {
        results.errors++;
      }
      
      results.checkedToday++;
      state.checkedCount++;
      
      // Rate limiting - small delay between requests
      if (i < asins.length - 1) {
        await new Promise(r => setTimeout(r, 800 + Math.random() * 700));
      }
    }
    
    await browser.close();
    
    // Calculate progress
    const totalASINs = 2400;
    const progressPercent = ((state.checkedCount / totalASINs) * 100).toFixed(1);
    
    // Generate markdown report
    const deadDetails = results.details.filter(d => d.status === 'DEAD');
    const errorDetails = results.details.filter(d => d.status === 'ERROR');
    
    const deadTodayList = deadDetails.length > 0 
      ? deadDetails.map(d => `- ${d.asin} (${d.reason})`).join('\n') 
      : 'None';
    const errorList = errorDetails.length > 0 
      ? errorDetails.map(d => `- ${d.asin}: ${d.reason}`).join('\n') 
      : 'None';
    
    const report = `# ASIN Health Check Report
Generated: ${new Date().toISOString()}

## Summary
- **ASINs Checked Today**: ${results.checkedToday}
- **Dead Found (Today)**: ${results.deadFound}
- **Alive Found (Today)**: ${results.aliveFound}
- **Errors (Today)**: ${results.errors}
- **Total Dead (Lifetime)**: ${state.totalDeadLifetime}
- **Progress**: ${state.checkedCount}/${totalASINs} (${progressPercent}%)

## Dead ASINs Found Today (${deadDetails.length})
${deadTodayList}

## Errors (${errorDetails.length})
${errorList}

## All Dead ASINs Lifetime (${state.deadASINs.length} total)
\`\`\`
${state.deadASINs.join('\n')}
\`\`\`
`;
    
    // Save results
    fs.mkdirSync(path.dirname(RESULTS_FILE), { recursive: true });
    fs.writeFileSync(RESULTS_FILE, report);
    console.log(`\nResults saved to ${RESULTS_FILE}`);
    
    // Save state
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    console.log(`State saved to ${STATE_FILE}`);
    
    // Print summary
    console.log('\n=== HEALTH CHECK SUMMARY ===');
    console.log(`Checked Today: ${results.checkedToday}`);
    console.log(`Dead Found: ${results.deadFound}`);
    console.log(`Total Dead Lifetime: ${state.totalDeadLifetime}`);
    console.log(`Progress: ${progressPercent}% (${state.checkedCount}/${totalASINs})`);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
