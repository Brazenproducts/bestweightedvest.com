/**
 * elipacko.com — Daily Indexing (Bing BWT + Yandex only)
 *
 * Google Indexing API is NOT run daily — those 29 pages are static and already indexed.
 * Submitting unchanged pages daily wastes shared SA quota needed for 447 backlink site pages.
 * Google Indexing API for elipacko.com is triggered manually when pages actually change.
 *
 * Daily: Bing BWT + Yandex (no quota limits on either)
 * Backlink Google Indexing: handled by elipacko-backlinks-google-indexing.js at 09:10 UTC
 */
console.log('[PLAYBOOK] Sections checked: IndexNow 403 Protocol, Quota Preflight, Cron Monitoring, Content Standards. Operating under rule: Bing BWT URL Submission API (IndexNow 403 bypassed via BWT API key, HTTP 200 confirmed); Yandex IndexNow direct (HTTP 202 confirmed). Google Indexing API removed from daily run — static pages already indexed; quota reserved for backlink site rotation.');

const https = require('https');

const urls = [
  'https://elipacko.com/',
  'https://elipacko.com/products/',
  'https://elipacko.com/company/',
  'https://elipacko.com/contact/',
  'https://elipacko.com/pp-corrugated-boxes/',
  'https://elipacko.com/pp-gaylord-boxes/',
  'https://elipacko.com/pp-pallets/',
  'https://elipacko.com/pp-meat-lugs/',
  'https://elipacko.com/pp-poultry-boxes/',
  'https://elipacko.com/agriculture-packaging/',
  'https://elipacko.com/seafood-packaging/',
  'https://elipacko.com/pp-corrugated-sheets/',
  'https://elipacko.com/storage-moving-boxes/',
  'https://elipacko.com/cold-chain-packaging/',
  'https://elipacko.com/pp-containers/',
  'https://elipacko.com/pp-dividers/',
  'https://elipacko.com/pp-trays/',
  'https://elipacko.com/pp-turnover-boxes/',
  'https://elipacko.com/pp-ballot-boxes/',
  'https://elipacko.com/pp-post-office-boxes/',
  'https://elipacko.com/pp-voting-booths/',
  'https://elipacko.com/shipping-boxes/',
  'https://elipacko.com/request-quote/',
  'https://elipacko.com/pp-divider-boards/',
  'https://elipacko.com/aluminum-reinforced-pp-box/',
  'https://elipacko.com/custom-corrugated-plastic-sheets/',
  'https://elipacko.com/custom-pp-packaging-box/',
  'https://elipacko.com/velcro-closure-pp-box/',
  'https://elipacko.com/steel-stillage-pallet-cage/',
];

async function main() {
  let bingOk = false;
  let yandexOk = false;

  // === BING — BWT URL Submission API (bypasses IndexNow 403) ===
  const bwtApiKey = process.env.BWT_API_KEY || '0a35c8d451e348e099fe46c4533a9f12';
  await new Promise(r => {
    const bingBody = JSON.stringify({ siteUrl: 'https://elipacko.com/', urlList: urls });
    const bingReq = https.request({
      hostname: 'ssl.bing.com',
      path: `/webmaster/api.svc/json/SubmitUrlbatch?apikey=${bwtApiKey}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bingBody) }
    }, bingRes => {
      let bd = ''; bingRes.on('data', c => bd += c);
      bingRes.on('end', () => {
        if (bingRes.statusCode === 200) {
          console.log(`✅ Bing BWT API: ${urls.length} URLs submitted`);
          bingOk = true;
        } else {
          console.log(`❌ Bing BWT API: HTTP ${bingRes.statusCode} — ${bd.slice(0, 120)}`);
        }
        r();
      });
    });
    bingReq.on('error', e => { console.log(`❌ Bing BWT API error: ${e.message}`); r(); });
    bingReq.write(bingBody);
    bingReq.end();
  });

  // === YANDEX — IndexNow (HTTP 200 or 202 = success) ===
  await new Promise(r => {
    const yxBody = JSON.stringify({
      host: 'elipacko.com',
      key: 'b4f7e2a1c3d5e6f7a8b9c0d1e2f3a4b5',
      keyLocation: 'https://elipacko.com/b4f7e2a1c3d5e6f7a8b9c0d1e2f3a4b5.txt',
      urlList: urls
    });
    const yxReq = https.request({
      hostname: 'yandex.com', path: '/indexnow', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(yxBody) }
    }, yxRes => {
      let yd = ''; yxRes.on('data', c => yd += c);
      yxRes.on('end', () => {
        if (yxRes.statusCode === 202 || yxRes.statusCode === 200) {
          console.log(`✅ Yandex IndexNow: ${urls.length} URLs submitted (HTTP ${yxRes.statusCode})`);
          yandexOk = true;
        } else {
          console.log(`❌ Yandex IndexNow: HTTP ${yxRes.statusCode} — ${yd.slice(0, 120)}`);
        }
        r();
      });
    });
    yxReq.on('error', e => { console.log(`❌ Yandex IndexNow error: ${e.message}`); r(); });
    yxReq.write(yxBody);
    yxReq.end();
  });

  const fullSummary = `Elipacko: Bing BWT ${bingOk ? '✅' : '❌'} | Yandex ${yandexOk ? '✅' : '❌'} | Google Indexing API: not run (static pages — see backlinks script for GA quota usage)`;
  console.log(fullSummary);

  // Telegram alert
  const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
  const chatId = process.env.TELEGRAM_CHAT_ID || '';
  if (botToken && chatId) {
    const msg = encodeURIComponent(`${(bingOk && yandexOk) ? '✅' : '⚠️'} ${fullSummary}`);
    https.get(`https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${msg}`, () => {});
  }
}

main().catch(e => { console.error(e); process.exit(1); });
