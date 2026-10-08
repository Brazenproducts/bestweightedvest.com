#!/usr/bin/env node
/**
 * Bartact gclid Capture Rate Analysis - 7 Day
 * Analyzes the capture rate of gclid in note_attributes for orders from Google Ads
 * gclid-capture snippet was deployed 4/6
 */
'use strict';

require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });

async function getShopifyToken() {
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

function hasGclid(order) {
  // Check note_attributes for gclid
  if (order.note_attributes && Array.isArray(order.note_attributes)) {
    const gclid = order.note_attributes.find(n => n.name === 'gclid');
    if (gclid && gclid.value) return true;
  }
  // Fallback: check landing_site URL
  const landing = (order.landing_site || '').toLowerCase();
  if (landing.includes('gclid=')) return true;
  return false;
}

function isGoogleAds(order) {
  const src = (order.referring_site || '').toLowerCase();
  const name = (order.source_name || '').toLowerCase();
  const landing = (order.landing_site || '').toLowerCase();
  
  // Must be from Google
  if (!src.includes('google.com') && !landing.includes('google.com')) return false;
  
  // Exclude Google Organic (no ads)
  if (landing.includes('utm_source=google') && landing.includes('utm_medium=organic')) return false;
  if (src.includes('google.com/search') && !landing.includes('gclid=')) return false;
  
  return true;
}

async function main() {
  const token = await getShopifyToken();

  // Get 7 days of data
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAgoISO = sevenDaysAgo.toISOString();

  console.log(`Fetching orders from ${sevenDaysAgoISO}...`);
  const allOrders = await getOrders(token, sevenDaysAgoISO);
  
  // Filter for Google Ads traffic
  const googleAdsOrders = allOrders.filter(isGoogleAds);
  
  // Count gclid captures
  const withGclid = googleAdsOrders.filter(hasGclid);
  
  const captureRate = googleAdsOrders.length > 0 
    ? (withGclid.length / googleAdsOrders.length * 100).toFixed(2)
    : '0.00';

  // Break down by day
  const byDay = {};
  googleAdsOrders.forEach(order => {
    const date = new Date(order.created_at).toISOString().split('T')[0];
    if (!byDay[date]) byDay[date] = { total: 0, captured: 0 };
    byDay[date].total++;
    if (hasGclid(order)) byDay[date].captured++;
  });

  const dailyRates = Object.entries(byDay)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, {total, captured}]) => {
      const rate = total > 0 ? (captured / total * 100).toFixed(2) : '0.00';
      return { date, total, captured, rate };
    });

  // Build report
  let report = `# Bartact gclid Capture Rate - 7 Day Analysis\n\n`;
  report += `**Analysis Date**: ${now.toISOString()}\n`;
  report += `**Period**: Last 7 days (${sevenDaysAgoISO.split('T')[0]} to ${new Date().toISOString().split('T')[0]})\n\n`;

  report += `## Summary\n`;
  report += `- **Google Ads Orders**: ${googleAdsOrders.length}\n`;
  report += `- **Orders with gclid**: ${withGclid.length}\n`;
  report += `- **Overall Capture Rate**: **${captureRate}%**\n\n`;

  if (parseFloat(captureRate) > 30) {
    report += `✅ **MILESTONE**: Capture rate above 30% — we now have reliable enough data to make Google Ads budget decisions.\n\n`;
  }

  report += `## Daily Breakdown\n`;
  report += `| Date | Total Orders | gclid Captured | Capture Rate |\n`;
  report += `|------|--------------|----------------|---------------|\n`;
  dailyRates.forEach(({date, total, captured, rate}) => {
    report += `| ${date} | ${total} | ${captured} | ${rate}% |\n`;
  });

  report += `\n## Notes\n`;
  report += `- gclid-capture snippet deployed: 2026-04-06\n`;
  report += `- Tracking gclid in note_attributes on newer orders\n`;
  report += `- This metric helps validate Google Ads attribution accuracy\n`;

  console.log(report);
  return report;
}

main()
  .then(report => {
    // Save report to memory
    const fs = require('fs');
    const path = '/home/ubuntu/.openclaw/workspace/memory/gclid-capture-latest.md';
    fs.writeFileSync(path, report, 'utf8');
    console.log(`\nReport saved to ${path}`);
  })
  .catch(e => {
    console.error('ERROR:', e.message);
    process.exit(1);
  });
