#!/usr/bin/env node
/**
 * ASIN Health Check - Puppeteer Browser Automation
 * Checks 200 ASINs per day for availability on Amazon
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

console.log(`Processing ${asins.length} ASINs with Puppeteer...`);

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

// Check ASIN with Puppeteer
async function checkAsin(page, asin) {
  try {
    const url = `https://www.amazon.com/dp/${asin}`;
    
    // Navigate with timeout
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 15000 
    });
    
    // Check for 404 or error indicators
    const pageTitle = await page.title();
    const is404 = pageTitle.includes('404') || pageTitle.includes('not found');
    
    // Extract title from productTitle span
    let title = null;
    try {
      title = await page.$eval('#productTitle', el => {
        const text = el.textContent.trim();
        return text.length > 0 ? text : null;
      });
    } catch (e) {
      // Title not found
    }
    
    // Check for unavailable message
    const isUnavailable = await page.evaluate(() => {
      const text = document.body.textContent;
      return text.includes('Currently unavailable') || 
             text.includes('This item cannot be found') ||
             text.includes('Error 404') ||
             text.includes('does not exist');
    });
    
    // Determine if DEAD
    const isDead = is404 || isUnavailable || !title;
    
    const result = {
      asin,
      status: is404 ? '404' : (isUnavailable ? 'unavailable' : 'ok'),
      title: title || null,
      isDead: isDead
    };
    
    return result;
  } catch (err) {
    return {
      asin,
      status: 'error',
      error: err.message,
      isDead: true
    };
  }
}

// Main processing
async function checkAll() {
  let browser;
  try {
    console.log(`Starting ASIN health check at ${new Date().toISOString()}`);
    
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
    
    // Set a reasonable viewport
    await page.setViewport({ width: 1280, height: 720 });
    
    // Set user agent to avoid blocking
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    );
    
    // Process ASINs
    for (let i = 0; i < asins.length; i++) {
      const asin = asins[i];
      const result = await checkAsin(page, asin);
      
      results.checked++;
      
      if (result.isDead) {
        results.dead.push({ asin, reason: result.status, title: result.title });
      } else {
        results.alive.push({ asin, title: result.title });
      }
      
      // Progress indicator - every 20 ASINs
      if ((i + 1) % 20 === 0) {
        console.log(`Progress: ${i + 1}/${asins.length} (${results.dead.length} dead so far)`);
      }
      
      // Small delay to avoid rate limiting
      if ((i + 1) % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    await browser.close();
    
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
${results.dead.length > 0 ? results.dead.map(r => `- \`${r.asin}\` - ${r.reason}`).join('\n') : 'None'}

## Sample Alive ASINs (${results.alive.length})
${results.alive.slice(0, 50).map(r => `- \`${r.asin}\` - ${r.title || '(no title)'}`).join('\n')}
${results.alive.length > 50 ? `\n... and ${results.alive.length - 50} more alive ASINs` : ''}

## Run Time
Started: ${new Date().toISOString()}
Checked: ${results.checked} ASINs in ~${Math.round(results.checked * 5)}s
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
    
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

checkAll();
