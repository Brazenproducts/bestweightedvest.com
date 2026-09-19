#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

function checkAsinWithHeadRequest(asin) {
  return new Promise((resolve) => {
    const url = `https://www.amazon.com/dp/${asin}`;
    
    const req = https.request(url, {
      method: 'HEAD',
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res) => {
      if (res.statusCode === 404) {
        resolve({ asin, dead: true, reason: '404' });
      } else if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve({ asin, dead: false, reason: 'ok' });
      } else {
        resolve({ asin, dead: false, reason: `${res.statusCode}` });
      }
    });

    req.on('error', (error) => {
      resolve({ asin, dead: null, reason: error.message });
    });

    req.on('timeout', () => {
      req.abort();
      resolve({ asin, dead: null, reason: 'timeout' });
    });

    req.end();
  });
}

async function main() {
  // Read ASINs
  const batchFile = '/tmp/asin-batch.txt';
  const asins = fs.readFileSync(batchFile, 'utf-8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  console.log(`Checking ${asins.length} ASINs...`);

  // Load state
  const stateFile = path.join(__dirname, 'sitestripe-healthcheck-state.json');
  let state = {
    deadASINs: [],
    checkedToday: 0,
    totalDeadLifetime: 0,
    lastCheckDate: new Date().toISOString().split('T')[0],
    progressDay: 0
  };

  if (fs.existsSync(stateFile)) {
    try {
      const existing = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
      state = existing;
    } catch (e) {
      console.log('Starting fresh state');
    }
  }

  // Check all ASINs concurrently (in batches of 10)
  const batchSize = 10;
  const results = [];
  let deadCount = 0;

  for (let i = 0; i < asins.length; i += batchSize) {
    const batch = asins.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(checkAsinWithHeadRequest));
    results.push(...batchResults);
    
    // Count dead ones
    const batchDead = batchResults.filter(r => r.dead === true).length;
    deadCount += batchDead;
    
    console.log(`Checked ${Math.min(i + batchSize, asins.length)}/${asins.length} - Found ${deadCount} dead so far`);
  }

  // Extract dead ASINs
  const deadASINs = results.filter(r => r.dead === true).map(r => r.asin);
  
  // Update state
  state.checkedToday = asins.length;
  state.totalDeadLifetime += deadASINs.length;
  state.deadASINs = deadASINs;
  state.lastCheckDate = new Date().toISOString().split('T')[0];
  state.progressDay = Math.ceil((state.checkedToday) / 200);

  // Save state
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));

  // Create memory report
  const progressPercent = Math.round((state.checkedToday / 2400) * 100);
  
  const report = `# ASIN Health Check - ${new Date().toISOString().split('T')[0]}

## Summary
- **ASINs checked today:** ${asins.length}
- **Dead found:** ${deadASINs.length}
- **Total dead lifetime:** ${state.totalDeadLifetime}
- **Progress:** ${progressPercent}% through 2,400 ASINs (Day ${state.progressDay}/12)

## Dead ASINs Found
\`\`\`
${deadASINs.join('\n')}
\`\`\`

## Statistics
- Alive: ${results.filter(r => r.dead === false).length}
- Dead: ${deadASINs.length}
- Errors/Timeouts: ${results.filter(r => r.dead === null).length}

## Check Time
${new Date().toISOString()}
`;

  const memoryDir = path.join(__dirname, '..', 'memory');
  if (!fs.existsSync(memoryDir)) {
    fs.mkdirSync(memoryDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(memoryDir, 'asin-healthcheck-latest.md'),
    report
  );

  console.log(`\n✓ Complete: ${deadASINs.length} dead, ${results.filter(r => r.dead === false).length} alive`);
  console.log('✓ State file updated');
  console.log('✓ Memory report saved');
}

main().catch(console.error);
