const {google} = require('googleapis');

(async () => {
  const auth = new google.auth.GoogleAuth({keyFile: '/home/ubuntu/.openclaw/workspace/.gcp-service-account.json', scopes: ['https://www.googleapis.com/auth/webmasters']});
  const wm = google.searchconsole({version: 'v1', auth: await auth.getClient()});
  for (const sm of ['sitemap.xml','sitemap_collections_1.xml','sitemap_products_1.xml','sitemap_pages_1.xml']) {
    await wm.sitemaps.submit({siteUrl: 'https://www.bartact.com/', feedpath: 'https://www.bartact.com/'+sm});
    console.log('Submitted: '+sm);
  }
})().catch(err => { console.error('ERROR:', err.message); process.exit(1); });
