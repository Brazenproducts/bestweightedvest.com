import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const envContent = readFileSync('/home/ubuntu/.openclaw/workspace/.env', 'utf8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      envVars[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
    }
  }
}

const https = require('https');
const token = envVars.SHOPIFY_TOKEN_BARTACT;

function shopifyGet(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'bartact.myshopify.com',
      path: `/admin/api/2024-01${path}`,
      method: 'GET',
      headers: { 'X-Shopify-Access-Token': token }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(new Error(d.slice(0,300))); } });
    });
    req.on('error', reject);
    req.end();
  });
}

// Search for MOLLE products
const molle = await shopifyGet('/products.json?limit=250&query=MOLLE');
const molleProducts = (molle.products || []).filter(p => !p.title.toLowerCase().startsWith('click for options'));
console.log('MOLLE products:');
for (const p of molleProducts.slice(0, 30)) {
  console.log(JSON.stringify({id:p.id,title:p.title,handle:p.handle}));
}

// Also search Jeep MOLLE specifically
const jeepMolle = await shopifyGet('/products.json?limit=250&query=Jeep+MOLLE');
console.log('\nJeep MOLLE:');
for (const p of (jeepMolle.products || []).filter(p => !p.title.toLowerCase().startsWith('click for options')).slice(0, 20)) {
  console.log(JSON.stringify({id:p.id,title:p.title,handle:p.handle}));
}

// Also search for grab handles (next topic after MOLLE)
const grabHandles = await shopifyGet('/products.json?limit=250&query=Jeep+grab+handle');
console.log('\nJeep grab handles:');
for (const p of (grabHandles.products || []).filter(p => !p.title.toLowerCase().startsWith('click for options')).slice(0, 20)) {
  console.log(JSON.stringify({id:p.id,title:p.title,handle:p.handle}));
}
