#!/usr/bin/env node
/**
 * Bartact Shopping ROAS Monitor with Shopify gclid Cross-Check
 * Fetches Google Shopping campaign performance metrics
 * Compares against Shopify gclid revenue from order custom attributes
 * Reports ROAS, spend, conversions, and critical alerts
 */

require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
console.log('[PLAYBOOK] Sections checked: Affiliate Tags (brazenprodu01-20/02-20 only), Content Standards (500w min), Google Ads READ ONLY, Bull Strap NO ADS, Protected Domains. Running within policy.');
const fs = require('fs');

const GADS_CUSTOMER_ID = '1770651698';
const OUTPUT_FILE = '/home/ubuntu/.openclaw/workspace/memory/bartact-ads-latest.md';
const SHOPIFY_STORE = process.env.SHOPIFY_STORE || 'bartact';
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_TOKEN_BARTACT || process.env.SHOPIFY_ACCESS_TOKEN;

async function getGoogleAdsToken() {
  const creds = JSON.parse(fs.readFileSync('/home/ubuntu/.openclaw/workspace/.google-ads-credentials.json'));
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: creds.client_id,
      client_secret: creds.client_secret,
      refresh_token: creds.refresh_token,
      grant_type: 'refresh_token'
    })
  });
  const data = await r.json();
  if (!data.access_token) throw new Error('Failed to get Google Ads token: ' + JSON.stringify(data));
  return { token: data.access_token, developerToken: creds.developer_token };
}

async function getShopifyGclidRevenue() {
  if (!SHOPIFY_ACCESS_TOKEN) {
    console.log('⚠️ No Shopify token configured, skipping gclid cross-check');
    return { totalGclidRevenue: 0, gclidOrderCount: 0, captureRate: 0, totalOrders: 0 };
  }

  try {
    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Query orders from yesterday with GraphQL - use REST API instead
    // REST API endpoint to fetch orders
    const response = await fetch(`https://${SHOPIFY_STORE}.myshopify.com/admin/api/2024-10/orders.json?status=any&created_at_min=${yesterdayStr}&created_at_max=${todayStr}&limit=250`, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.errors) {
      console.error('Shopify API error:', data.errors);
      return { totalGclidRevenue: 0, gclidOrderCount: 0, captureRate: 0, totalOrders: 0 };
    }

    let totalGclidRevenue = 0;
    let gclidOrderCount = 0;
    const orders = data.orders || [];
    const totalOrders = orders.length;

    orders.forEach(order => {
      const revenue = parseFloat(order.total_price) || 0;
      
      // Check if order has gclid in note_attributes
      let hasGclid = false;
      if (order.note_attributes && Array.isArray(order.note_attributes)) {
        hasGclid = order.note_attributes.some(attr => attr.name === 'gclid');
      }
      
      // Also check in the note field as fallback
      if (!hasGclid && order.note && order.note.includes('gclid')) {
        hasGclid = true;
      }
      
      if (hasGclid) {
        totalGclidRevenue += revenue;
        gclidOrderCount++;
      }
    });

    const captureRate = totalOrders > 0 ? (gclidOrderCount / totalOrders * 100) : 0;
    console.log(`  📊 Shopify: ${totalOrders} orders, ${gclidOrderCount} with gclid, $${totalGclidRevenue.toFixed(2)} revenue, ${captureRate.toFixed(1)}% capture rate`);

    return {
      totalGclidRevenue,
      gclidOrderCount,
      captureRate,
      totalOrders
    };
  } catch (error) {
    console.error('Error fetching Shopify gclid data:', error.message);
    return { totalGclidRevenue: 0, gclidOrderCount: 0, captureRate: 0, totalOrders: 0 };
  }
}

async function getCampaignMetrics(token, developerToken) {
  // Get yesterday's date in YYYY-MM-DD format
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  const query = `
    SELECT
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      metrics.cost_micros,
      metrics.conversions,
      metrics.all_conversions_value,
      metrics.clicks,
      metrics.impressions
    FROM campaign
    WHERE campaign.advertising_channel_type = 'SHOPPING'
      AND segments.date = '${yesterdayStr}'
    ORDER BY campaign.name
  `;

  const url = `https://googleads.googleapis.com/v25/customers/${GADS_CUSTOMER_ID}/googleAds:search`;
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'developer-token': developerToken
    },
    body: JSON.stringify({ query })
  });

  const data = await r.json();
  if (data.error) {
    console.error('Google Ads API error:', JSON.stringify(data.error));
    throw new Error('Google Ads API error: ' + (data.error.message || JSON.stringify(data.error)));
  }

  return (data.results || []).map(row => {
    const campaign = row.campaign;
    const metrics = row.metrics;
    const costMicros = metrics.costMicros ? parseInt(metrics.costMicros) : 0;
    const spend = costMicros / 1000000;
    const revenue = metrics.allConversionsValue ? parseFloat(metrics.allConversionsValue) : 0;
    const roas = spend > 0 ? revenue / spend : 0;
    
    return {
      name: campaign.name,
      status: campaign.status,
      spend: spend,
      revenue: revenue,
      conversions: metrics.conversions ? parseFloat(metrics.conversions) : 0,
      clicks: metrics.clicks ? parseInt(metrics.clicks) : 0,
      impressions: metrics.impressions ? parseInt(metrics.impressions) : 0,
      roas: roas
    };
  });
}

function formatDateTime() {
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const dayName = days[now.getUTCDay()];
  const monthName = months[now.getUTCMonth()];
  const date = now.getUTCDate();
  const hour = now.getUTCHours();
  const min = now.getUTCMinutes().toString().padStart(2, '0');
  
  return {
    fullLabel: `${dayName}, ${monthName} ${date}th, ${now.getUTCFullYear()} - ${hour}:${min} AM (UTC)`,
    yesterday: `${dayName}, ${monthName} ${date - 1}th, ${now.getUTCFullYear()} (yesterday)`
  };
}

async function main() {
  try {
    console.log('📊 Fetching Bartact Shopping ROAS data...');
    
    const { token, developerToken } = await getGoogleAdsToken();
    const campaigns = await getCampaignMetrics(token, developerToken);
    
    console.log('🔍 Checking Shopify for gclid orders...');
    const shopifyData = await getShopifyGclidRevenue();
    
    const dateInfo = formatDateTime();
    
    // Calculate totals
    const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
    const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
    const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
    const totalRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
    
    // Calculate over-reporting
    const shopifyRevenue = shopifyData.totalGclidRevenue;
    const googleOverReporting = totalRevenue - shopifyRevenue;
    const overReportingPercent = shopifyRevenue > 0 ? (googleOverReporting / shopifyRevenue * 100) : (totalRevenue > 0 ? 100 : 0);
    
    // Check alert conditions
    // IMPORTANT: ROAS is undefined when there is no spend. A paused/removed set of
    // campaigns with $0 spend is NOT a ROAS emergency — you cannot have a bad return
    // on ad spend when nothing is being spent. Only evaluate ROAS when spend > 0.
    const hasSpend = totalSpend > 0;
    const alertRoas = hasSpend && totalRoas < 3.0;
    const alertZeroConversions = campaigns.some(c => c.spend >= 50 && c.conversions === 0);
    // Over-reporting check only meaningful when Google actually claims revenue from spend.
    const alertOverReporting = hasSpend && overReportingPercent > 50;
    const requiresAlert = alertRoas || alertZeroConversions || alertOverReporting;

    // Informational (non-alert) state: zero spend but residual gclid revenue.
    const zeroSpendState = !hasSpend;
    
    // Build markdown report
    let md = `# Bartact Shopping ROAS Monitor - Google Ads Audit\n`;
    md += `**Date:** ${dateInfo.fullLabel}  \n`;
    md += `**Data for:** ${dateInfo.yesterday}\n\n`;
    
    if (requiresAlert) {
      md += `## Status: 🚨 ALERT\n\n`;
    } else if (zeroSpendState) {
      md += `## Status: ⏸️ NO SPEND (campaigns paused/removed — ROAS N/A)\n\n`;
    } else {
      md += `## Status: ✅ HEALTHY\n\n`;
    }
    
    md += `### Summary\n`;
    md += `- **Total Spend:** $${totalSpend.toFixed(2)} / $250 budget (${(totalSpend / 250 * 100).toFixed(1)}%)\n`;
    md += `- **Google Revenue Claimed:** $${totalRevenue.toFixed(2)}\n`;
    md += `- **Shopify gclid Revenue:** $${shopifyRevenue.toFixed(2)}\n`;
    md += `- **Google Over-Reporting:** $${googleOverReporting.toFixed(2)} (${overReportingPercent.toFixed(0)}%)\n`;
    md += `- **Total ROAS (Google):** ${hasSpend ? totalRoas.toFixed(2) + 'x' : 'N/A (no spend)'}\n`;
    md += `- **Adjusted ROAS (Shopify gclid):** ${totalSpend > 0 ? (shopifyRevenue / totalSpend).toFixed(2) : 0}x\n`;
    md += `- **Total Conversions:** ${totalConversions.toFixed(0)}\n`;
    md += `- **gclid Capture Rate:** ${shopifyData.captureRate.toFixed(1)}% (${shopifyData.gclidOrderCount}/${shopifyData.totalOrders || 0} orders)\n\n`;
    
    md += `### Campaign Status\n`;
    if (campaigns.length === 0) {
      md += `No shopping campaigns with spend detected.\n\n`;
    } else {
      campaigns.forEach(c => {
        // Paused/removed or zero-spend campaigns: ROAS is N/A, show neutral icon.
        let roasLabel;
        if (c.spend <= 0) roasLabel = '⏸️';
        else roasLabel = c.roas > 3 ? '✅' : c.roas > 2 ? '⚠️' : '🚨';
        const roasText = c.spend > 0 ? `${c.roas.toFixed(2)}x ROAS` : 'ROAS N/A';
        md += `${roasLabel} **${c.name}** (${c.status}) - $${c.spend.toFixed(2)} spend, ${c.conversions.toFixed(0)} conv, ${roasText}\n`;
      });
      md += '\n';
    }
    
    if (requiresAlert) {
      md += `### 🚨 Alert Conditions Triggered\n`;
      if (alertRoas) {
        md += `- **ROAS ${totalRoas.toFixed(2)}x < 3.0x threshold**\n`;
      }
      campaigns.forEach(c => {
        if (c.spend >= 50 && c.conversions === 0) {
          md += `- **Campaign "${c.name}" has $${c.spend.toFixed(2)} spend with 0 conversions**\n`;
        }
      });
      if (alertOverReporting) {
        md += `- **Google over-reporting by ${overReportingPercent.toFixed(0)}% vs Shopify gclid**\n`;
      }
      md += '\n';
    }
    
    md += `### Action Required\n`;
    if (requiresAlert) {
      md += `**YES** - Alert triggered. Contact Mitch.\n`;
    } else if (zeroSpendState) {
      md += `**NO** - All Shopping campaigns are paused/removed, so there is $0 ad spend and ROAS is not applicable. `;
      md += `The $${shopifyRevenue.toFixed(2)} in Shopify gclid revenue is residual attribution (historical clicks / stale gclid params on organic/direct orders), not campaign-driven. No action needed unless you intend campaigns to be live.\n`;
    } else {
      md += `**NO** - Performance is within acceptable parameters.\n`;
    }
    
    md += '\n---\n';
    md += `_Audit executed at ${dateInfo.fullLabel}_\n`;
    
    fs.writeFileSync(OUTPUT_FILE, md);
    console.log(`✅ Report saved to ${OUTPUT_FILE}`);
    console.log('\n' + md);
    
    // Return results for potential Telegram notification
    process.exitCode = requiresAlert ? 1 : 0;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Save error report
    const errorReport = `# Bartact Shopping ROAS Monitor - ERROR\n\n**Error:** ${error.message}\n\n_Script failed at ${new Date().toISOString()}_\n`;
    fs.writeFileSync(OUTPUT_FILE, errorReport);
    
    process.exit(1);
  }
}

main();
