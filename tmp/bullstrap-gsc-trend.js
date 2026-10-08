require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const https = require('https');
const fs = require('fs');
const { GoogleAuth } = require('google-auth-library');

// Try common Bull Strap GSC property + service account
const SA_CANDIDATES = [
  '/home/ubuntu/.openclaw/workspace/.bullstrap-indexing-credentials.json',
  '/home/ubuntu/.openclaw/workspace/.bartact-indexing-service-account.json',
  '/home/ubuntu/.openclaw/workspace/.gcp-service-account.json'
];
const SITE_CANDIDATES = ['https://www.bullstrap.com/', 'https://bullstrap.com/', 'sc-domain:bullstrap.com'];

async function tokenFrom(key) {
  const auth = new GoogleAuth({ keyFile: key, scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });
  const c = await auth.getClient();
  return (await c.getAccessToken()).token;
}

function query(token, site, body) {
  return new Promise((res) => {
    const buf = Buffer.from(JSON.stringify(body));
    https.request({
      hostname: 'searchconsole.googleapis.com',
      path: '/webmasters/v3/sites/' + encodeURIComponent(site) + '/searchAnalytics/query',
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Content-Length': buf.length }
    }, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { res(null); } }); })
      .on('error', () => res(null)).end(buf);
  });
}

function wk(n) { return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10); }

(async () => {
  for (const key of SA_CANDIDATES) {
    if (!fs.existsSync(key)) continue;
    let token;
    try { token = await tokenFrom(key); } catch (e) { continue; }
    for (const site of SITE_CANDIDATES) {
      const test = await query(token, site, { startDate: wk(14), endDate: wk(7), dimensions: [] });
      if (test && !test.error && test.rows) {
        console.log('✅ Access via ' + key.split('/').pop() + ' on ' + site + '\n');
        const weeks = [[wk(42), wk(36)], [wk(35), wk(29)], [wk(28), wk(22)], [wk(21), wk(15)], [wk(14), wk(8)]];
        console.log('=== BULL STRAP weekly GSC (clicks | impressions | pos) ===');
        for (const [s, e] of weeks) {
          const r = await query(token, site, { startDate: s, endDate: e, dimensions: [] });
          const row = r && r.rows && r.rows[0];
          if (row) console.log(s + '→' + e + ': ' + row.clicks + ' clk | ' + row.impressions + ' impr | pos ' + row.position.toFixed(1));
          else console.log(s + '→' + e + ': no data');
        }
        return;
      }
    }
  }
  console.log('❌ Could not access Bull Strap GSC property with available service accounts. Needs Mitch/GSC UI or correct SA.');
})().catch(e => console.error('ERR', e.message));
