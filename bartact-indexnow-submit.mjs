import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const https = require('https');

const KEY = 'e9c8f5a4b3d2c1a0f9e8d7c6b5a4e9c8';
const URL = 'https://www.bartact.com/blogs/news/ford-bronco-tactical-seat-covers-2021-bartact';

const payload = JSON.stringify({
  host: 'www.bartact.com',
  key: KEY,
  keyLocation: `https://www.bartact.com/${KEY}.txt`,
  urlList: [URL]
});

function post(host) {
  return new Promise((res) => {
    const r = https.request({
      hostname: host, path: '/indexnow', method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(payload) }
    }, x => { let d=''; x.on('data',c=>d+=c); x.on('end',()=>res({host,status:x.statusCode,body:d.slice(0,300)})); });
    r.on('error', e => res({host, err: e.message}));
    r.write(payload); r.end();
  });
}

const a = await post('api.indexnow.org');
const b = await post('www.bing.com');
console.log('api.indexnow.org:', JSON.stringify(a));
console.log('www.bing.com:', JSON.stringify(b));
