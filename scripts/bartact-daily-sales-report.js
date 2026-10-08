#!/usr/bin/env node
/**
 * Bartact Daily Sales Report
 * Uses Shopify OAuth client_credentials — NO SHOPIFY_TOKEN_BARTACT env var
 * Sends daily sales summary to Mitch via Telegram
 */
'use strict';

require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });

const TELEGRAM_CHAT_ID = '7550065844';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN_BARTACT;

async function getShopifyToken() {
  // Bartact uses OAuth client_credentials — there is NO static SHOPIFY_TOKEN_BARTACT
  const r = await fetch('https://bartact.myshopify.com/admin/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: '78fd9505a467f0795d035e5f4a6dfb06',
      client_secret: process.env.SHOPIFY_CLIENT_SECRET_BARTACT,
      grant_type: 'client_credentials'
    })
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('Failed to get Shopify token: ' + JSON.stringify(j));
  return j.access_token;
}

async function getOrders(token, sinceDate) {
  const H = { 'X-Shopify-Access-Token': token };
  const url = `https://bartact.myshopify.com/admin/api/2024-01/orders.json?status=any&financial_status=paid&created_at_min=${sinceDate}&limit=250&fields=id,total_price,created_at,source_name,referring_site,landing_site,note_attributes,cancelled_at`;
  const r = await fetch(url, { headers: H });
  const orders = (await r.json()).orders || [];
  return orders.filter(o => !o.cancelled_at);
}

function categorizeSource(order) {
  const src = (order.referring_site || '').toLowerCase();
  const name = (order.source_name || '').toLowerCase();
  const landing = (order.landing_site || '').toLowerCase();
  // Check for gclid to distinguish Google Ads from Google Organic
  const hasGclid = (order.note_attributes || []).some(n => n.name === 'gclid' || (n.name || '').includes('gclid'))
    || landing.includes('gclid=');
  if (src.includes('google.com') && hasGclid) return 'Google Ads';
  if (src.includes('google.com') && !hasGclid) return 'Google Organic';
  if (src.includes('facebook') || src.includes('instagram')) return 'Facebook/IG';
  if (src.includes('bing') || src.includes('microsoft')) return 'Bing Ads';
  if (name === 'shopify_draft_order') return 'Direct/Draft';
  if (src === '' && name === 'web') return 'Direct/Type-in';
  if (src.includes('shop.app') || name.includes('shop')) return 'Shop Pay';
  if (name === '3890849') return 'Shopify Managed (Shop/Facebook)';
  if (name.match(/^\d{7}$/)) return `Shopify Channel (${name})`;
  return 'Other';
}

async function sendTelegram(text) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log('No TELEGRAM_BOT_TOKEN_BARTACT — printing report instead:\n' + text);
    return;
  }
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'HTML' })
  });
}

function pst(date) {
  return new Date(date).toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  });
}

async function main() {
  const token = await getShopifyToken();

  // Today (Pacific midnight to now)
  const nowPT = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const todayStr = nowPT.toISOString().split('T')[0];
  const todayMidnight = new Date(`${todayStr}T00:00:00-07:00`);

  // Yesterday
  const yday = new Date(todayMidnight);
  yday.setDate(yday.getDate() - 1);

  const [todayOrders, ydayOrders] = await Promise.all([
    getOrders(token, todayMidnight.toISOString()),
    getOrders(token, yday.toISOString()).then(orders =>
      orders.filter(o => new Date(o.created_at) < todayMidnight)
    )
  ]);

  const sum = orders => orders.reduce((s, o) => s + parseFloat(o.total_price), 0);
  const bySource = orders => {
    const map = {};
    orders.forEach(o => {
      const cat = categorizeSource(o);
      map[cat] = (map[cat] || 0) + parseFloat(o.total_price);
    });
    return map;
  };

  const todayRev = sum(todayOrders);
  const ydayRev = sum(ydayOrders);
  const ydaySources = bySource(ydayOrders);
  const todaySources = bySource(todayOrders);

  const dateLabel = nowPT.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' });
  const timeLabel = nowPT.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' });

  let msg = `📦 <b>Bartact Daily Sales — ${dateLabel}</b>\n\n`;
  msg += `<b>Yesterday (full day):</b> ${ydayOrders.length} orders | $${ydayRev.toFixed(2)}\n`;
  Object.entries(ydaySources).sort((a,b) => b[1]-a[1]).forEach(([src, rev]) => {
    msg += `  • ${src}: $${rev.toFixed(2)}\n`;
  });

  msg += `\n<b>Today so far (${timeLabel} Pacific):</b> ${todayOrders.length} orders | $${todayRev.toFixed(2)}\n`;
  Object.entries(todaySources).sort((a,b) => b[1]-a[1]).forEach(([src, rev]) => {
    msg += `  • ${src}: $${rev.toFixed(2)}\n`;
  });

  // Last 3 orders
  if (todayOrders.length > 0) {
    msg += '\n<b>Recent orders today:</b>\n';
    todayOrders.slice(-3).reverse().forEach(o => {
      msg += `  • ${pst(o.created_at)} | $${parseFloat(o.total_price).toFixed(2)} | ${categorizeSource(o)}\n`;
    });
  }

  console.log(msg);
  await sendTelegram(msg);
  console.log('Sales report sent.');
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
