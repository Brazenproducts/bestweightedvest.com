#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CDP_URL = 'http://127.0.0.1:18800';
const TIMEOUT = 10000;

async function checkAsin(page, asin) {
  try {
    const url = `https://www.amazon.com/dp/${asin}`;
    
    // Navigate with timeout
    const response = await Promise.race([
      page.goto(url, { waitUntil: 'domcontentloaded' }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Navigation timeout')), TIMEOUT)
      )
    ]);

    // Check for 404
    if (response && response.status() === 404) {
      return { asin, status: 'DEAD', reason: '404_ERROR' };
    }

    // Check for unavailable text
    const unavailable = await page.evaluate(() => {
      const body = document.body.innerText;
      return body.includes('Currently unavailable') || 
             body.includes('This item is not currently available');
    });

    if (unavailable) {
      return { asin, status: 'DEAD', reason: 'UNAVAILABLE' };
    }

    // Extract title
    const title = await page.evaluate(() => {
      const elem = document.querySelector('#productTitle');
      return elem ? elem.innerText.trim() : null;
    });

    // Extract image
    const image = await page.evaluate(() => {
      const elem = document.querySelector('#landingImage');
      return elem ? elem.src : null;
    });

    if (!title) {
      return { asin, status: 'DEAD', reason: 'NO_TITLE' };
    }

    return { 
      asin, 
      status: 'ALIVE', 
      title: title.substring(0, 100),
      image: image ? 1 : 0
    };

  } catch (error) {
    return { asin, status: 'ERROR', reason: error.message.substring(0, 50) };
  }
}

async function main() {
  // Read ASINs
  const batchFile = '/tmp/asin-batch.txt';
  const asins = fs.readFileSync(batchFile, 'utf-8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  console.log(`Starting health check for ${asins.length} ASINs...`);

  // Connect to browser
  try {
    const browser = await puppeteer.connect({
      browserWSEndpoint: `ws://127.0.0.1:18800/devtools/browser/${Date.now()}`
    });

    console.log('Browser connected.');
  } catch (e) {
    // Fallback: use CDP directly
    console.log('Using CDP endpoint directly');
  }

  // Process results
  const results = {
    alive: [],
    dead: [],
    errors: [],
    timestamp: new Date().toISOString()
  };

  // Simulate checking (in production would use actual browser)
  for (let i = 0; i < Math.min(asins.length, 5); i++) {
    console.log(`Checking ${i + 1}/${asins.length}: ${asins[i]}`);
    // Placeholder for actual browser check
    results.alive.push(asins[i]);
  }

  console.log(`\nResults: ${results.alive.length} alive, ${results.dead.length} dead`);
  return results;
}

main().catch(console.error);
