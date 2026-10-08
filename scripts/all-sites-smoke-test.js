#!/usr/bin/env node
/**
 * All-Sites Smoke Test — uses curl with -L to follow redirects + bypass Cloudflare
 */
const { execSync } = require('child_process');
const fs = require('fs');
require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });

const SITES = {
  'bartact': 'https://www.bartact.com',
  'bullstrap': 'https://bullstrap.com',
  'skipatip': 'https://skipatip.com',
  'faithfulpassages': 'https://faithfulpassages.com',
  'recentratings': 'https://recentratings.com',
};

const TELEGRAM = process.env.TELEGRAM_BOT_TOKEN_SLASHDADDY || process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = '7550065844';

function checkSite(name, url) {
  try {
    const code = execSync(
      `curl -o /dev/null -s -w "%{http_code}" -L --max-time 15 --user-agent "Mozilla/5.0" "${url}"`,
      { timeout: 20000 }
    ).toString().trim();
    return parseInt(code);
  } catch (e) {
    return 0;
  }
}

async function notify(msg) {
  if (!TELEGRAM) { console.log(msg); return; }
  const https = require('https');
  const body = JSON.stringify({ chat_id: CHAT_ID, text: msg });
  const req = https.request({ host: 'api.telegram.org', path: `/bot${TELEGRAM}/sendMessage`, method: 'POST', headers: { 'Content-Type': 'application/json' } }, () => {});
  req.on('error', () => {});
  req.write(body); req.end();
}

const failures = [];
const results = {};

for (const [name, url] of Object.entries(SITES)) {
  const code = checkSite(name, url);
  results[name] = code;
  if (code === 0 || code >= 400) {
    failures.push(`${name}: HTTP ${code || 'TIMEOUT'}`);
  } else {
    console.log(`✅ ${name}: ${code}`);
  }
}

if (failures.length > 0) {
  const msg = `🚨 Site smoke test FAILED:\n${failures.map(f => `• ${f}`).join('\n')}`;
  console.log(msg);
  notify(msg);
} else {
  console.log('✅ All sites OK');
}
