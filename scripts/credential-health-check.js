#!/usr/bin/env node
/**
 * credential-health-check.js
 * Checks all Shopify tokens, GH token, and key API credentials.
 * Runs daily at 8 AM UTC. Alerts Mitch if anything is broken.
 * If THIS FILE goes missing, the cron that calls it will alert.
 */
require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const https = require('https');

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN_SLASHDADDY || process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = '7550065844';

function notify(msg) {
  if (!TELEGRAM_TOKEN) { console.log('ALERT:', msg); return; }
  const body = JSON.stringify({ chat_id: CHAT_ID, text: msg, parse_mode: 'HTML' });
  const req = https.request({ host: 'api.telegram.org', path: `/bot${TELEGRAM_TOKEN}/sendMessage`, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, () => {});
  req.on('error', () => {});
  req.write(body); req.end();
}

async function checkShopify(name, store, token) {
  return new Promise(res => {
    const req = https.request({ host: `${store}.myshopify.com`, path: '/admin/api/2024-01/shop.json', method: 'GET', headers: { 'X-Shopify-Access-Token': token } }, resp => {
      res({ name, ok: resp.statusCode === 200, status: resp.statusCode });
    });
    req.on('error', e => res({ name, ok: false, status: e.message }));
    req.end();
  });
}

async function main() {
  const issues = [];
  const checks = [];

  // Shopify tokens
  if (process.env.SHOPIFY_TOKEN_BARTACT)
    checks.push(checkShopify('Bartact', 'bartact', process.env.SHOPIFY_TOKEN_BARTACT));
  if (process.env.SHOPIFY_TOKEN_BULLSTRAP)
    checks.push(checkShopify('Bull Strap', 'bull-strap-78', process.env.SHOPIFY_TOKEN_BULLSTRAP));
  if (process.env.SHOPIFY_TOKEN_BALLKINIS)
    checks.push(checkShopify('Ballkinis', 'ballkinis', process.env.SHOPIFY_TOKEN_BALLKINIS));
  if (process.env.SHOPIFY_TOKEN_FACTOR)
    checks.push(checkShopify('Factor Filters', 'factorfilters', process.env.SHOPIFY_TOKEN_FACTOR));

  const results = await Promise.all(checks);
  results.forEach(r => { if (!r.ok) issues.push(`❌ ${r.name} Shopify token: ${r.status}`); });

  // GH Token check
  if (process.env.GH_TOKEN) {
    await new Promise(res => {
      const req = https.request({ host: 'api.github.com', path: '/user', method: 'GET', headers: { Authorization: `Bearer ${process.env.GH_TOKEN}`, 'User-Agent': 'OpenClaw' } }, resp => {
        if (resp.statusCode !== 200) issues.push(`❌ GitHub token: HTTP ${resp.statusCode}`);
        res();
      });
      req.on('error', e => { issues.push(`❌ GitHub token: ${e.message}`); res(); });
      req.end();
    });
  }

  const date = new Date().toISOString().slice(0, 10);
  if (issues.length > 0) {
    notify(`⚠️ Credential Health Check — ${date}\n\n${issues.join('\n')}\n\nFix these tokens before dependent scripts fail.`);
    console.log('Issues found:', issues);
  } else {
    console.log(`✅ All credentials healthy — ${date}`);
  }
}

main().catch(e => { console.error(e); notify(`❌ Credential health check crashed: ${e.message}`); });
