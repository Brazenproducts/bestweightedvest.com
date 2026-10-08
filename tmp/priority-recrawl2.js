require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });
const https = require('https');
const { GoogleAuth } = require('google-auth-library');

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

function publish(tok, url) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ url, type: 'URL_UPDATED' });
    const req = https.request({
      hostname: 'indexing.googleapis.com',
      path: '/v3/urlNotifications:publish',
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + tok, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, r => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>resolve({status:r.statusCode})); });
    req.on('error', () => resolve({status:0})); req.write(body); req.end();
  });
}

(async () => {
  const auth = new GoogleAuth({ keyFile: '/home/ubuntu/.openclaw/workspace/.bartact-indexing-service-account.json', scopes: ['https://www.googleapis.com/auth/indexing'] });
  const client = await auth.getClient();
  console.log('=== Priority re-crawl (correct auth): ' + urls.length + ' money pages ===\n');
  let ok = 0;
  for (const url of urls) {
    const tok = (await client.getAccessToken()).token; // fresh token each call
    const r = await publish(tok, url);
    if (r.status === 200) ok++;
    console.log((r.status===200?'✅':'⚠️ '+r.status) + ' | ' + url.replace('https://www.bartact.com',''));
    await new Promise(res => setTimeout(res, 1200)); // throttle to avoid rate limits
  }
  console.log('\nGoogle Indexing API: ' + ok + '/' + urls.length + ' submitted for priority re-crawl.');
})().catch(e => console.error('ERR', e.message));
