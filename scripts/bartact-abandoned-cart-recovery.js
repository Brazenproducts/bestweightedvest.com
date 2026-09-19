/**
 * Bartact Abandoned Cart Recovery
 * Runs hourly. Finds abandoned checkouts 1-6 hours old, sends recovery email with 5% discount.
 * Uses Gmail API (brazenauto) to send. Tracks sent emails to avoid duplicates.
 */
'use strict';

require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const fs   = require('fs');
const path = require('path');

const STATE_FILE  = '/home/ubuntu/.openclaw/workspace/memory/bartact-cart-recovery-state.json';
const CREDS_FILE  = '/home/ubuntu/.openclaw/workspace/.gmail-brazenauto-credentials.json';
const DISCOUNT    = 'BARTACT-SAVE-5PCT';
const FROM_NAME   = 'Bartact';
const FROM_EMAIL  = 'info@brazenauto.com';

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch { return { sent: {} }; }
}
function saveState(s) { fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2)); }

async function getGmailToken() {
  const creds = JSON.parse(fs.readFileSync(CREDS_FILE, 'utf8'));
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: creds.client_id, client_secret: creds.client_secret, refresh_token: creds.refresh_token, grant_type: 'refresh_token' })
  });
  const d = await r.json();
  if (!d.access_token) { console.log('Gmail auth error:', JSON.stringify(d)); }
  return d.access_token;
}

async function getShopifyToken() {
  const r = await fetch('https://bartact.myshopify.com/admin/oauth/access_token', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: '78fd9505a467f0795d035e5f4a6dfb06', client_secret: process.env.SHOPIFY_CLIENT_SECRET_BARTACT, grant_type: 'client_credentials' })
  });
  return (await r.json()).access_token;
}

function buildEmail(checkout) {
  const firstName = checkout.shipping_address?.first_name || checkout.billing_address?.first_name || '';
  const greeting  = firstName ? `Hey ${firstName},` : 'Hey there,';
  const items     = (checkout.line_items || []).slice(0, 3).map(i => `• ${i.title}`).join('\n');
  const total     = parseFloat(checkout.total_price || 0).toFixed(2);
  const url       = checkout.abandoned_checkout_url || `https://www.bartact.com`;

  const subject = firstName
    ? `${firstName}, you left something behind — here's 5% off`
    : 'You left something behind — here\'s 5% off';

  const text = `${greeting}

You left some great gear in your Bartact cart. We saved it for you.

${items}
Cart total: $${total}

Use code ${DISCOUNT} to save 5% when you complete your order — but this offer expires in 24 hours.

Complete your order here:
${url}

Questions? Reply to this email or visit bartact.com

— The Bartact Team
Handmade in Temecula, CA`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:20px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden;max-width:600px">
  <tr><td style="background:#1a1a1a;padding:24px;text-align:center">
    <span style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:2px">BARTACT</span>
    <p style="color:#999;font-size:12px;margin:4px 0 0">Handmade in Temecula, CA</p>
  </td></tr>
  <tr><td style="padding:32px 40px">
    <p style="font-size:16px;color:#333;margin:0 0 8px">${greeting}</p>
    <p style="font-size:15px;color:#555;margin:0 0 24px">You left some great gear in your cart. We saved it for you.</p>
    ${items ? `<div style="background:#f9f9f9;border-left:3px solid #1a1a1a;padding:16px;margin:0 0 24px;font-size:14px;color:#444">${(checkout.line_items||[]).slice(0,3).map(i=>`<div style="margin:4px 0">• ${i.title}</div>`).join('')}</div>` : ''}
    <p style="font-size:15px;color:#555;margin:0 0 24px">Cart total: <strong>$${total}</strong></p>

    <div style="background:#1a1a1a;border-radius:4px;padding:20px;text-align:center;margin:0 0 24px">
      <p style="color:#ccc;font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px">Special Offer — Expires in 24 Hours</p>
      <p style="color:#ffffff;font-size:28px;font-weight:bold;margin:0 0 8px">SAVE 5%</p>
      <p style="color:#ccc;font-size:13px;margin:0 0 16px">Use code at checkout:</p>
      <div style="background:#333;border-radius:4px;padding:12px;display:inline-block">
        <span style="color:#ffffff;font-size:18px;font-weight:bold;letter-spacing:2px">${DISCOUNT}</span>
      </div>
    </div>

    <div style="text-align:center;margin:0 0 24px">
      <a href="${url}" style="background:#e63000;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:4px;font-size:16px;font-weight:bold;display:inline-block">COMPLETE MY ORDER →</a>
    </div>

    <p style="font-size:13px;color:#999;text-align:center;margin:0">Questions? Reply to this email or visit <a href="https://www.bartact.com" style="color:#333">bartact.com</a></p>
  </td></tr>
  <tr><td style="background:#f5f5f5;padding:20px;text-align:center">
    <p style="font-size:12px;color:#999;margin:0">Bartact · Temecula, CA · <a href="https://www.bartact.com" style="color:#999">bartact.com</a></p>
    <p style="font-size:11px;color:#bbb;margin:8px 0 0">You're receiving this because you started a checkout at bartact.com. <a href="https://www.bartact.com" style="color:#bbb">Unsubscribe</a></p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  return { subject, text, html };
}

function makeRaw(to, from, subject, text, html) {
  const boundary = 'bartact_boundary_' + Date.now();
  const msg = [
    `From: ${FROM_NAME} <${FROM_EMAIL}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    text,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    html,
    '',
    `--${boundary}--`
  ].join('\r\n');
  return Buffer.from(msg).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sendEmail(gmailToken, to, subject, text, html) {
  const raw = makeRaw(to, FROM_EMAIL, subject, text, html);
  const r = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { 'Authorization': '***' + gmailToken, 'Content-Type': 'application/json' }, // Bearer prefix applied at runtime
    body: JSON.stringify({ raw })
  });
  return r.status === 200 || r.status === 201;
}

async function main() {
  const state = loadState();
  const shopToken  = await getShopifyToken();
  const gmailToken = await getGmailToken();
  if (!shopToken || !gmailToken) { console.log('Auth failed'); return; }

  // Get abandoned checkouts from last 6 hours (Shopify has 3-day lag before checkout expires)
  const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const until = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // min 1 hour old
  const r = await fetch(
    `https://bartact.myshopify.com/admin/api/2024-01/checkouts.json?limit=50&created_at_min=${since}&created_at_max=${until}`,
    { headers: { 'X-Shopify-Access-Token': shopToken } }
  );
  const checkouts = (await r.json()).checkouts || [];
  const abandoned = checkouts.filter(c => !c.completed_at && c.email && c.email.includes('@'));

  console.log(`Found ${abandoned.length} abandoned checkouts (1-6 hrs old)`);

  let sent = 0, skipped = 0;
  for (const checkout of abandoned) {
    const key = checkout.token || checkout.id;
    if (state.sent[key]) { skipped++; continue; }

    const { subject, text, html } = buildEmail(checkout);
    const ok = await sendEmail(gmailToken, checkout.email, subject, text, html);
    if (ok) {
      state.sent[key] = { email: checkout.email, sentAt: new Date().toISOString(), value: checkout.total_price };
      sent++;
      console.log(`✅ Sent to ${checkout.email} | $${checkout.total_price}`);
    } else {
      console.log(`❌ Failed: ${checkout.email}`);
    }
    await new Promise(res => setTimeout(res, 500));
  }

  // Prune old entries (keep 60 days)
  const cutoff = Date.now() - 60 * 24 * 60 * 60 * 1000;
  Object.keys(state.sent).forEach(k => {
    if (new Date(state.sent[k].sentAt).getTime() < cutoff) delete state.sent[k];
  });

  saveState(state);
  console.log(`Done: ${sent} sent, ${skipped} already emailed`);
}

main().catch(e => console.error('FATAL:', e.message));
