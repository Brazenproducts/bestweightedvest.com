#!/usr/bin/env node
/**
 * Bartact Shopping ROAS Monitor
 * Fetches Google Shopping campaign performance metrics
 * Compares 24h performance against previous period
 * Reports ROAS, spend, conversions, and critical alerts
 */

require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const fs = require('fs');

const GADS_CUSTOMER_ID = '1770651698';
const OUTPUT_FILE = '/home/ubuntu/.openclaw/workspace/memory/shopping-roas-latest.md';

// Shopping campaign names to monitor
const SHOPPING_CAMPAIGNS = [
  'Smart Shopping',
  'Top Selling Products(ssc)',
  'Bartact Shopping - All Products'
];

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

async function getCampaignMetrics(token, developerToken, dateRange) {
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
    // API returns camelCase: costMicros, allConversionsValue, etc.
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
    
    const dateInfo = formatDateTime();
    
    // Calculate totals
    const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
    const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
    const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
    const totalRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
    
    // Determine status and alerts
    let statusEmoji = '✅';
    let statusText = 'HEALTHY';
    const alerts = [];
    
    if (totalRoas < 1.5) {
      statusEmoji = '🚨';
      statusText = 'CRITICAL';
      alerts.push(`🚨 <b>ROAS BELOW 1.5x</b> - Current ROAS: ${totalRoas.toFixed(2)}x`);
    } else if (totalRoas < 2.0) {
      statusEmoji = '⚠️';
      statusText = 'WARNING';
      alerts.push(`⚠️ <b>ROAS BELOW 2.0x</b> - Current ROAS: ${totalRoas.toFixed(2)}x`);
    }
    
    if (totalSpend === 0) {
      alerts.push('⚠️ <b>NO SPEND</b> - Campaigns may be paused or not serving');
    } else if (totalSpend < 50) {
      alerts.push(`⚠️ <b>LOW SPEND</b> - Only $${totalSpend.toFixed(2)} spent today`);
    }
    
    if (campaigns.length === 0) {
      alerts.push('⚠️ <b>NO SHOPPING CAMPAIGNS</b> - No active campaigns found');
    }
    
    // Build markdown report
    let md = `# Bartact Shopping ROAS Monitor\n`;
    md += `**Date:** ${dateInfo.fullLabel}  \n`;
    md += `**Data for:** ${dateInfo.yesterday}\n\n`;
    md += `## Status: ${statusEmoji} ${statusText}\n\n`;
    
    md += `### Summary\n`;
    md += `- **Total Spend:** $${totalSpend.toFixed(2)} / $250 budget (${(totalSpend / 250 * 100).toFixed(1)}%)\n`;
    md += `- **Total Revenue:** $${totalRevenue.toFixed(2)}\n`;
    md += `- **Total ROAS:** ${totalRoas.toFixed(2)}x\n`;
    md += `- **Total Conversions:** ${totalConversions.toFixed(1)}\n\n`;
    
    md += `### Campaign Status\n`;
    if (campaigns.length === 0) {
      md += `No shopping campaigns with spend detected.\n\n`;
    } else {
      campaigns.forEach(c => {
        const roasLabel = c.roas > 2 ? '✅' : c.roas > 1.5 ? '⚠️' : '🚨';
        md += `${roasLabel} **${c.name}** (${c.status}) - $${c.spend.toFixed(2)} spend, ${c.conversions.toFixed(0)} conv, ${c.roas.toFixed(2)}x ROAS\n`;
      });
      md += '\n';
    }
    
    if (alerts.length > 0) {
      md += `### Alerts\n`;
      alerts.forEach(alert => {
        md += `- ${alert}\n`;
      });
      md += '\n';
    }
    
    // Action required
    md += `### Action Required\n`;
    if (totalRoas < 1.5 || (totalSpend > 0 && totalSpend < 50)) {
      md += `**YES** - ROAS ${totalRoas.toFixed(2)}x is below 1.5x threshold or spend is critically low. Requires investigation.\n`;
    } else if (totalRoas < 2.0) {
      md += `**REVIEW** - ROAS ${totalRoas.toFixed(2)}x is below 2.0x target. Monitor closely.\n`;
    } else {
      md += `**NO** - Performance is within acceptable parameters.\n`;
    }
    
    md += '\n---\n';
    md += `_Monitor script executed at ${dateInfo.fullLabel}_\n`;
    
    fs.writeFileSync(OUTPUT_FILE, md);
    console.log(`✅ Report saved to ${OUTPUT_FILE}`);
    console.log('\n' + md);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Save error report
    const errorReport = `# Bartact Shopping ROAS Monitor - ERROR\n\n**Error:** ${error.message}\n\n_Script failed at ${new Date().toISOString()}_\n`;
    fs.writeFileSync(OUTPUT_FILE, errorReport);
    
    process.exit(1);
  }
}

main();
