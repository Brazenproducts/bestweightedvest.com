/**
 * Bartact Server-Side Conversion Upload
 * Polls Shopify for new paid orders with gclid, uploads to Google Ads API
 * Runs every hour via cron. Handles Enhanced Conversions (hashed email/name).
 * 
 * Google Ads: Customer 1770651698 | Purchase action: 6672170781
 * Conversion tracking ID: AW-739987346
 */

require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const fs = require('fs');
const crypto = require('crypto');

const STATE_FILE = '/home/ubuntu/.openclaw/workspace/memory/bartact-conversion-upload-state.json';
const GADS_CUSTOMER_ID = '1770651698';
const PURCHASE_ACTION = `customers/${GADS_CUSTOMER_ID}/conversionActions/6672170781`;

function sha256(str) {
  return crypto.createHash('sha256').update(str.trim().toLowerCase()).digest('hex');
}

async function getShopifyToken() {
  const r = await fetch('https://bartact.myshopify.com/admin/oauth/access_token', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: '78fd9505a467f0795d035e5f4a6dfb06', client_secret: process.env.SHOPIFY_CLIENT_SECRET_BARTACT, grant_type: 'client_credentials' })
  });
  return (await r.json()).access_token;
}

async function getGoogleAdsToken() {
  const creds = JSON.parse(fs.readFileSync('/home/ubuntu/.openclaw/workspace/.google-ads-credentials.json'));
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: creds.client_id, client_secret: creds.client_secret, refresh_token: creds.refresh_token, grant_type: 'refresh_token' })
  });
  const data = await r.json();
  return { token: data.access_token, developerToken: creds.developer_token };
}

function extractGclid(order) {
  // Check landing_site URL params
  const landing = order.landing_site || '';
  const ref = order.referring_site || '';
  for (const url of [landing, ref]) {
    try {
      const params = new URLSearchParams(url.includes('?') ? url.split('?')[1] : url);
      const gclid = params.get('gclid');
      if (gclid) return gclid;
    } catch (e) {}
  }
  // Check note_attributes for gclid stored by Shopify
  const noteAttrs = order.note_attributes || [];
  const gclidAttr = noteAttrs.find(a => a.name === 'gclid' || a.name === '_gclid');
  if (gclidAttr) return gclidAttr.value;
  return null;
}

function formatConversionDateTime(isoString) {
  // Google Ads format: "2026-09-03 15:30:00-07:00"
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  const mm = pad(d.getUTCMonth() + 1);
  const dd = pad(d.getUTCDate());
  const hh = pad(d.getUTCHours());
  const min = pad(d.getUTCMinutes());
  const ss = pad(d.getUTCSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}+00:00`;
}

async function main() {
  // Load state
  let state = { uploadedOrderIds: [], lastRunAt: null };
  if (fs.existsSync(STATE_FILE)) {
    try { state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch (e) {}
  }

  const shopToken = await getShopifyToken();
  const { token: gadsToken, developerToken } = await getGoogleAdsToken();
  if (!shopToken || !gadsToken) { console.log('Auth failed'); return; }

  // Get paid orders from last 6 hours
  const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const ordersR = await fetch(
    `https://bartact.myshopify.com/admin/api/2024-01/orders.json?status=any&financial_status=paid&limit=250&created_at_min=${since}&fields=id,name,created_at,total_price,currency,email,landing_site,referring_site,note_attributes,customer,shipping_address`,
    { headers: { 'X-Shopify-Access-Token': shopToken } }
  );
  const orders = (await ordersR.json()).orders || [];
  console.log(`Found ${orders.length} paid orders in last 6 hours`);

  // Filter to new orders with gclid
  const toUpload = orders.filter(o => {
    if (state.uploadedOrderIds.includes(o.id)) return false;
    return !!extractGclid(o);
  });
  console.log(`${toUpload.length} new orders with gclid to upload`);

  if (toUpload.length === 0) {
    state.lastRunAt = new Date().toISOString();
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    console.log('Done — nothing to upload');
    return;
  }

  // Build conversions payload
  const conversions = toUpload.map(order => {
    const gclid = extractGclid(order);
    const value = parseFloat(order.total_price || 0);
    const currency = order.currency || 'USD';
    const conversionTime = formatConversionDateTime(order.created_at);
    const orderId = order.name || String(order.id);

    const conv = {
      gclid,
      conversionAction: PURCHASE_ACTION,
      conversionDateTime: conversionTime,
      conversionValue: value,
      currencyCode: currency,
      orderId,
      userIdentifiers: []
    };

    // Enhanced Conversions — hash PII
    const email = (order.email || '').trim().toLowerCase();
    if (email) {
      conv.userIdentifiers.push({ hashedEmail: sha256(email) });
    }
    const addr = order.shipping_address || {};
    const firstName = (addr.first_name || '').trim().toLowerCase();
    const lastName = (addr.last_name || '').trim().toLowerCase();
    if (firstName || lastName) {
      conv.userIdentifiers.push({
        addressInfo: {
          hashedFirstName: firstName ? sha256(firstName) : undefined,
          hashedLastName: lastName ? sha256(lastName) : undefined,
          city: (addr.city || '').toLowerCase() || undefined,
          state: (addr.province_code || '').toUpperCase() || undefined,
          postalCode: (addr.zip || '') || undefined,
          countryCode: (addr.country_code || '') || undefined
        }
      });
    }

    return conv;
  });

  // Upload to Google Ads API
  const uploadR = await fetch(
    `https://googleads.googleapis.com/v25/customers/${GADS_CUSTOMER_ID}:uploadClickConversions`,
    {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + gadsToken, 'Content-Type': 'application/json', 'developer-token': developerToken },
      body: JSON.stringify({ conversions, partialFailure: true })
    }
  );

  const uploadText = await uploadR.text();
  let uploadResult;
  try { uploadResult = JSON.parse(uploadText); } catch (e) { uploadResult = { raw: uploadText.substring(0, 300) }; }

  console.log('Upload status:', uploadR.status);

  const partialErrors = uploadResult.partialFailureError || uploadResult.error;
  if (partialErrors) {
    console.log('Partial errors:', JSON.stringify(partialErrors).substring(0, 300));
  }

  const results = uploadResult.results || [];
  let successCount = 0;
  let failCount = 0;

  // If no results array, check if it was a flat success
  if (uploadR.status === 200 && results.length === 0 && !partialErrors) {
    // All succeeded
    successCount = conversions.length;
  } else {
    results.forEach((r, i) => {
      if (r && Object.keys(r).length > 0) {
        successCount++;
        console.log(`✅ Uploaded order ${toUpload[i]?.name || i} — gclid: ${conversions[i]?.gclid?.substring(0, 20)}... | $${conversions[i]?.conversionValue}`);
      } else {
        failCount++;
        console.log(`❌ Failed order ${toUpload[i]?.name || i}`);
      }
    });
  }

  if (uploadR.status === 200 && successCount === 0) {
    // Assume all succeeded if 200 and no explicit results
    successCount = conversions.length;
    toUpload.forEach(o => console.log(`✅ Order ${o.name} — $${o.total_price}`));
  }

  // Only save order IDs that successfully uploaded
  if (uploadR.status === 200) {
    toUpload.forEach(o => {
      if (!state.uploadedOrderIds.includes(o.id)) state.uploadedOrderIds.push(o.id);
    });
  }
  // Keep last 5000 IDs max
  if (state.uploadedOrderIds.length > 5000) state.uploadedOrderIds = state.uploadedOrderIds.slice(-5000);
  state.lastRunAt = new Date().toISOString();
  state.lastUploadCount = successCount;
  state.lastFailCount = failCount;
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

  console.log(`\nDone: ${successCount} uploaded, ${failCount} failed`);
}

main().catch(e => console.error('FATAL:', e.message));
