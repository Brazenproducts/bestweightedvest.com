require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const https = require('https');
const { GoogleAuth } = require('google-auth-library');

const SA_KEY = '/home/ubuntu/.openclaw/workspace/.bartact-indexing-service-account.json';

// Money collections + top legit pages — the ones we WANT Google to re-crawl & re-score
const urls = [
  'https://www.bartact.com/',
  'https://www.bartact.com/collections/seat-covers',
  'https://www.bartact.com/collections/jeep-wrangler-seat-covers',
  'https://www.bartact.com/collections/jeep-wrangler-seat-covers-accessories',
  'https://www.bartact.com/collections/molle-accessories',
  'https://www.bartact.com/collections/ford-bronco-seat-covers',
  'https://www.bartact.com/collections/jeep-gladiator-seat-covers',
  'https://www.bartact.com/collections/toyota-tacoma-seat-covers',
  'https://www.bartact.com/collections/jeep-gladiator-seat-covers-accessories-2019',
  'https://www.bartact.com/collections/grab-handles-for-jeep-wrangler-gladiator-ford-bronco-utvs-buggies-rails',
  'https://www.bartact.com/collections/paracord-grab-handles',
  'https://www.bartact.com/collections/jeep-wrangler-jl-jlu-accessories-2018',
  'https://www.bartact.com/collections/ford-bronco-accessories-2021-2022-2023',
  'https://www.bartact.com/collections/fire-extinguisher-roll-bar-mount',
  'https://www.bartact.com/collections/tactical-seat-covers'
];

async function token() {
  const auth = new GoogleAuth({ keyFile: SA_KEY, scopes: ['https://www.googleapis.com/auth/indexing'] });
  const c = await auth.getClient();
  return (await c.getAccessToken()).token;
}

function notify(tok, url) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ url, type: 'URL_UPDATED' });
    const req = https.request({
      hostname: 'indexing.googleapis.com',
      path: '/v3/urlNotifications:publish',
      method: 'POST',
      headers: { 'Authorization': '***' + tok, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, r => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>resolve({status:r.statusCode})); });
    req.on('error', () => resolve({status:0})); req.write(body); req.end();
  });
}

function indexNow(urls) {
  return new Promise((resolve) => {
    const KEY = 'b4f7e2a1c3d5e6f7a8b9c0d1e2f3a4b5';
    const body = JSON.stringify({ host:'www.bartact.com', key:KEY, keyLocation:'https://www.bartact.com/'+KEY+'.txt', urlList:urls });
    const req = https.request({ hostname:'api.indexnow.org', path:'/indexnow', method:'POST', headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)} }, r=>{r.resume();resolve(r.statusCode);});
    req.on('error',()=>resolve(0)); req.write(body); req.end();
  });
}

(async () => {
  console.log('=== Priority re-crawl: ' + urls.length + ' money pages → Google Indexing API (URL_UPDATED) ===\n');
  const tok = await token();
  let ok = 0;
  for (const url of urls) {
    const r = await notify(tok, url);
    if (r.status === 200) ok++;
    console.log((r.status===200?'✅':'⚠️ '+r.status) + ' | ' + url.replace('https://www.bartact.com',''));
    await new Promise(res => setTimeout(res, 350));
  }
  const inStatus = await indexNow(urls);
  console.log('\nGoogle: ' + ok + '/' + urls.length + ' submitted. IndexNow (Bing/Yandex): HTTP ' + inStatus);
})().catch(e => console.error('ERR', e.message));
