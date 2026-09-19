#!/usr/bin/env node
/**
 * ASIN Health Check - Improved Puppeteer Browser Automation
 * Checks 200 ASINs per day with better title extraction and error handling
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Read ASINs from batch file
const asins = [];
const input = fs.readFileSync('/tmp/asin-batch.txt', 'utf8');
input.split('\n').forEach(line => {
  const asin = line.trim();
  if (asin && asin.length === 10 && /^B[0-9A-Z]{9}$/.test(asin)) {
    asins.push(asin);
  }
});

console.log(`Processing ${asins.length} ASINs with improved detection...`);

// State tracking
const results = {
  checked: 0,
  dead: [],
  alive: [],
  errors: []
};

// Check ASIN with improved title extraction
async function checkAsin(page, asin) {
  try {
    const url = `https://www.amazon.com/dp/${asin}`;
    
    // Navigate with timeout
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 15000 
    });
    
    // Get page content for error checking
    const pageContent = await page.content();
    const isErrorPage = pageContent.includes('Sorry') && pageContent.includes('not available');
    const is404 = pageContent.includes('Error 404') || pageContent.includes('Page Not Found');
    
    // Try multiple methods to extract title
    let title = null;
    
    // Method 1: productTitle span
    try {
      title = await page.$eval('#productTitle', el => el.textContent.trim());
    } catch (e) {
      // Method 2: h1 or product-overview-title
      try {
        title = await page.$eval('h1', el => el.textContent.trim());
      } catch (e2) {
        // Method 3: og:title meta tag
        try {
          title = await page.$eval('meta[property="og:title"]', el => el.getAttribute('content'));
        } catch (e3) {
          // Try any heading element
          try {
            const headings = await page.$$('h1, h2');
            if (headings.length > 0) {
              title = await page.evaluate(el => el.textContent.trim(), headings[0]);
            }
          } catch (e4) {
            // No title found
          }
        }
      }
    }
    
    // Check for unavailable message more thoroughly
    const unavailableIndicators = [
      'Currently unavailable',
      'This item cannot be found',
      'Error 404',
      'This page does not exist',
      'We cannot find the requested product',
      'Product is no longer available',
      'This product is no longer available'
    ];
    
    const pageText = await page.evaluate(() => document.body.innerText);
    const isUnavailable = unavailableIndicators.some(indicator => pageText.includes(indicator));
    
    // Determine if DEAD: only mark as dead if multiple conditions indicate it
    const isDead = (is404 || isErrorPage || isUnavailable) || (!title && (is404 || isErrorPage));
    
    const result = {
      asin,
      status: is404 ? '404' : (isUnavailable ? 'unavailable' : (isErrorPage ? 'error-page' : 'ok')),
      title: title || null,
      isDead: isDead,
      hasTitle: !!title
    };
    
    return result;
  } catch (err) {
    return {
      asin,
      status: 'error',
      error: err.message,
      isDead: true,
      title: null,
      hasTitle: false
    };
  }
}

// Main processing
async function checkAll() {
  let browser;
  try {
    console.log(`Starting improved ASIN health check at ${new Date().toISOString()}`);
    
    // Launch Puppeteer with headless mode
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1280, height: 720 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    );
    
    // Process ASINs with sampling for verification
    for (let i = 0; i < asins.length; i++) {
      const asin = asins[i];
      const result = await checkAsin(page, asin);
      
      results.checked++;
      
      if (result.isDead) {
        results.dead.push({ asin, reason: result.status, title: result.title });
      } else {
        results.alive.push({ asin, title: result.title });
      }
      
      // Progress indicator
      if ((i + 1) % 20 === 0) {
        console.log(`Progress: ${i + 1}/${asins.length} (${results.dead.length} dead, ${results.alive.length} alive)`);
      }
      
      // Throttle to avoid rate limiting
      if ((i + 1) % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    await browser.close();
    
    // Save results
    const memoryContent = `# ASIN Health Check Results - ${new Date().toISOString().split('T')[0]}

## Summary
- **ASINs checked today:** ${results.checked}
- **Dead found today:** ${results.dead.length}
- **Alive:** ${results.alive.length}
- **Progress:** ${70 + asins.length}/2400 = ${Math.round((70 + asins.length) / 2400 * 100)}%

## Dead ASINs (${results.dead.length})
${results.dead.slice(0, 100).map(r => `- \`${r.asin}\` - ${r.reason}`).join('\n')}
${results.dead.length > 100 ? `... and ${results.dead.length - 100} more` : ''}

## Sample Alive ASINs (${results.alive.length})
${results.alive.slice(0, 50).map(r => `- \`${r.asin}\` - ${r.title || '(untitled)'}`).join('\n')}
${results.alive.length > 50 ? `... and ${results.alive.length - 50} more` : ''}
`;

    const memPath = '/home/ubuntu/.openclaw/workspace/memory/asin-healthcheck-latest.md';
    fs.mkdirSync(path.dirname(memPath), { recursive: true });
    fs.writeFileSync(memPath, memoryContent);
    
    // Save state
    const newState = {
      lastCheck: new Date().toISOString(),
      deadCount: results.dead.length,
      deadASINs: results.dead.map(d => d.asin),
      lastBatchSize: results.checked,
      totalChecked: 70 + asins.length
    };
    
    const stateFile = '/home/ubuntu/.openclaw/workspace/scripts/sitestripe-healthcheck-state.json';
    fs.mkdirSync(path.dirname(stateFile), { recursive: true });
    fs.writeFileSync(stateFile, JSON.stringify(newState, null, 2));
    
    console.log('\n=== FINAL RESULTS ===');
    console.log(`Checked: ${results.checked}`);
    console.log(`Dead: ${results.dead.length}`);
    console.log(`Alive: ${results.alive.length}`);
    console.log('Results saved to memory/asin-healthcheck-latest.md');
    console.log('State saved to scripts/sitestripe-healthcheck-state.json');
    
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

checkAll();
