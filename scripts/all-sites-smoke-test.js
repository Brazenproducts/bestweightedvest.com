#!/usr/bin/env node

/**
 * All-Sites Daily Smoke Test
 * Checks connectivity and basic page load for all bots' live sites
 * Sites: skipatip, bartact, bullstrap, faithfulpassages, fernallern
 */

const https = require('https');

const SITES = {
  'skipatip': 'https://skipatip.com',
  'bartact': 'https://bartact.com',
  'bullstrap': 'https://bullstrap.com',
  'faithfulpassages': 'https://faithfulpassages.com',
  'fernallern': 'https://fernallern.com',
};

const TIMEOUT = 15000; // 15 seconds per site
const failures = [];
const results = {};

async function checkSite(name, url) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      failures.push(`${name}: TIMEOUT (>${TIMEOUT / 1000}s)`);
      results[name] = 'TIMEOUT';
      resolve();
    }, TIMEOUT);

    https.get(url, (res) => {
      clearTimeout(timeout);
      
      if (res.statusCode >= 200 && res.statusCode < 400) {
        results[name] = `OK (${res.statusCode})`;
        resolve();
      } else {
        failures.push(`${name}: HTTP ${res.statusCode}`);
        results[name] = `ERROR ${res.statusCode}`;
        resolve();
      }
    }).on('error', (err) => {
      clearTimeout(timeout);
      failures.push(`${name}: ${err.message}`);
      results[name] = `ERROR: ${err.message}`;
      resolve();
    });
  });
}

async function runTests() {
  console.log(`🔍 Starting smoke test at ${new Date().toISOString()}`);
  console.log('---');

  // Test all sites in parallel
  const tests = Object.entries(SITES).map(([name, url]) => 
    checkSite(name, url)
  );

  await Promise.all(tests);

  // Print results
  console.log('\n📊 Results:');
  Object.entries(results).forEach(([name, status]) => {
    console.log(`  ${name}: ${status}`);
  });

  // Summary
  const totalTests = Object.keys(SITES).length;
  const passCount = totalTests - failures.length;

  console.log('---');
  if (failures.length > 0) {
    console.log(`\n🚨 FAILURES (${failures.length}/${totalTests}):`);
    failures.forEach(f => console.log(`  • ${f}`));
    process.exit(1);
  } else {
    console.log(`\n✅ All ${totalTests} sites OK`);
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
