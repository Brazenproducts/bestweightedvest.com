#!/usr/bin/env node
/**
 * bullstrap-token-refresh.js
 * Refreshes the Bull Strap Shopify access token using client_credentials OAuth flow.
 * Writes fresh token to .env as SHOPIFY_TOKEN_BULLSTRAP.
 * Run daily at 6am PST via cron f8952886.
 */

'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');

const ENV_PATH = path.resolve(__dirname, '../.env');

function getEnv(key) {
  const env = fs.readFileSync(ENV_PATH, 'utf8');
  const m = env.match(new RegExp(`^${key}=(.+)$`, 'm'));
  return m ? m[1].trim() : null;
}

function setEnv(key, value) {
  let env = fs.readFileSync(ENV_PATH, 'utf8');
  if (new RegExp(`^${key}=`, 'm').test(env)) {
    env = env.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${value}`);
  } else {
    env += `\n${key}=${value}`;
  }
  fs.writeFileSync(ENV_PATH, env);
}

function post(hostname, path, body) {
  return new Promise((resolve, reject) => {
    const data = Buffer.from(body);
    const req = https.request({
      hostname, path, method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length,
      }
    }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch (e) { reject(new Error(`Parse error: ${raw}`)); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  const CLIENT_ID = getEnv('SHOPIFY_CLIENT_ID_BULLSTRAP');
  const SECRET = getEnv('SHOPIFY_SECRET_BULLSTRAP') || getEnv('SHOPIFY_CLIENT_SECRET_BULLSTRAP');

  if (!CLIENT_ID || !SECRET) {
    console.error('❌ Missing SHOPIFY_CLIENT_ID_BULLSTRAP or SHOPIFY_SECRET_BULLSTRAP in .env');
    process.exit(1);
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: CLIENT_ID,
    client_secret: SECRET,
  }).toString();

  console.log(`[${new Date().toISOString()}] Refreshing Bull Strap Shopify token...`);

  const result = await post('bull-strap-78.myshopify.com', '/admin/oauth/access_token', body);

  if (!result.access_token) {
    console.error('❌ Token refresh failed:', JSON.stringify(result));
    process.exit(1);
  }

  setEnv('SHOPIFY_TOKEN_BULLSTRAP', result.access_token);
  console.log(`✅ Token refreshed: ${result.access_token.slice(0, 12)}...`);
  console.log(`   Written to .env as SHOPIFY_TOKEN_BULLSTRAP`);
}

main().catch(e => { console.error('❌ Fatal:', e.message); process.exit(1); });
