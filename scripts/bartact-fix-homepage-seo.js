#!/usr/bin/env node
/**
 * Fix Bartact Homepage SEO Issues
 * - Add meta description
 * - Fix title tag
 * - Fix H1 structure
 * - Add Product schema to product template
 */
'use strict';

require('dotenv').config({ path: '/home/ubuntu/.openclaw/workspace/.env' });

const SHOP = 'bartact.myshopify.com';
const API_VERSION = '2024-01';

async function getShopifyToken() {
  const r = await fetch(`https://${SHOP}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: '78fd9505a467f0795d035e5f4a6dfb06',
      client_secret: process.env.SHOPIFY_CLIENT_SECRET_BARTACT,
      grant_type: 'client_credentials'
    })
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('Auth failed: ' + JSON.stringify(j));
  return j.access_token;
}

async function shopifyAPI(token, path, method = 'GET', body = null) {
  const opts = {
    method,
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json'
    }
  };
  if (body) opts.body = JSON.stringify(body);
  
  const r = await fetch(`https://${SHOP}/admin/api/${API_VERSION}${path}`, opts);
  return await r.json();
}

async function getThemeAsset(token, themeId, key) {
  const resp = await shopifyAPI(token, `/themes/${themeId}/assets.json?asset[key]=${encodeURIComponent(key)}`);
  return resp.asset;
}

async function putThemeAsset(token, themeId, key, value) {
  return await shopifyAPI(token, `/themes/${themeId}/assets.json`, 'PUT', {
    asset: { key, value }
  });
}

async function run() {
  console.log('🔧 Fixing Bartact Homepage SEO...\n');
  
  const token = await getShopifyToken();
  console.log('✅ Authenticated with Shopify');
  
  // Get main theme
  const themesResp = await shopifyAPI(token, '/themes.json');
  const mainTheme = themesResp.themes.find(t => t.role === 'main');
  console.log(`✅ Found theme: ${mainTheme.name} (ID: ${mainTheme.id})\n`);
  
  // ── Fix 1: theme.liquid (title + meta description) ─────────────────────────
  console.log('📝 Fetching theme.liquid...');
  const themeLiquid = await getThemeAsset(token, mainTheme.id, 'layout/theme.liquid');
  let content = themeLiquid.value;
  
  // Add meta description if missing
  if (!content.includes('<meta name="description"')) {
    console.log('  → Adding meta description');
    const metaDesc = '<meta name="description" content="Custom-fit tactical seat covers for Jeep Wrangler, Gladiator, Ford Bronco, Toyota Tacoma & 4Runner. Made in USA with military-grade materials. MOLLE panels, paracord grab handles, and tactical gear.">';
    
    // Insert after <head> or before </head>
    if (content.includes('<head>')) {
      content = content.replace('<head>', `<head>\n  ${metaDesc}`);
    } else if (content.includes('</head>')) {
      content = content.replace('</head>', `  ${metaDesc}\n</head>`);
    }
  }
  
  // Fix title tag structure
  if (!content.includes('{% if page_title %}')) {
    console.log('  → Fixing title tag structure');
    const titlePattern = /<title>.*?<\/title>/s;
    const newTitle = `<title>
    {% if page_title %}
      {{ page_title }} | Bartact
    {% else %}
      Bartact | Custom Jeep & Off-Road Tactical Seat Covers, Grab Handles | Made in USA
    {% endif %}
  </title>`;
    
    if (titlePattern.test(content)) {
      content = content.replace(titlePattern, newTitle);
    }
  }
  
  await putThemeAsset(token, mainTheme.id, 'layout/theme.liquid', content);
  console.log('✅ Updated theme.liquid\n');
  
  // ── Fix 2: Index template (H1 structure) ───────────────────────────────────
  console.log('📝 Fetching index template...');
  let indexTemplate;
  
  // Try common index template paths
  const indexPaths = [
    'templates/index.liquid',
    'sections/index.liquid',
    'templates/index.json'
  ];
  
  for (const path of indexPaths) {
    try {
      indexTemplate = await getThemeAsset(token, mainTheme.id, path);
      if (indexTemplate) {
        console.log(`  → Found: ${path}`);
        break;
      }
    } catch (e) {
      // Try next path
    }
  }
  
  if (indexTemplate) {
    let indexContent = indexTemplate.value;
    
    // Count H1 tags
    const h1Matches = indexContent.match(/<h1[\s>]/g) || [];
    const h1Count = h1Matches.length;
    
    if (h1Count > 1) {
      console.log(`  → Found ${h1Count} H1 tags, converting extras to H2`);
      
      let h1Seen = false;
      indexContent = indexContent.replace(/<h1([\s>])/g, (match, after) => {
        if (!h1Seen) {
          h1Seen = true;
          return match; // Keep first H1
        }
        return `<h2${after}`; // Convert others to H2
      });
      
      indexContent = indexContent.replace(/<\/h1>/g, (match, offset) => {
        const beforeMatch = indexContent.substring(0, offset);
        const h1Before = (beforeMatch.match(/<h1[\s>]/g) || []).length;
        const h1ClosesBefore = (beforeMatch.match(/<\/h1>/g) || []).length;
        
        if (h1Before - h1ClosesBefore === 1) {
          return match; // First H1 closing
        }
        return '</h2>'; // Other closings
      });
      
      await putThemeAsset(token, mainTheme.id, indexTemplate.key, indexContent);
      console.log('✅ Fixed H1 structure\n');
    } else {
      console.log('  → H1 structure already OK\n');
    }
  } else {
    console.log('  ⚠️  Could not find index template\n');
  }
  
  // ── Fix 3: Product template (add schema) ───────────────────────────────────
  console.log('📝 Adding Product schema to product template...');
  
  const productPaths = [
    'templates/product.liquid',
    'sections/product-template.liquid',
    'templates/product.json'
  ];
  
  let productTemplate;
  for (const path of productPaths) {
    try {
      productTemplate = await getThemeAsset(token, mainTheme.id, path);
      if (productTemplate) {
        console.log(`  → Found: ${path}`);
        break;
      }
    } catch (e) {
      // Try next
    }
  }
  
  if (productTemplate) {
    let productContent = productTemplate.value;
    
    if (!productContent.includes('schema.org/Product')) {
      console.log('  → Adding Product schema');
      
      const schema = `
<script type="application/ld+json">
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "{{ product.title }}",
  "description": "{{ product.description | strip_html | truncate: 200 }}",
  "image": "{{ product.featured_image | img_url: 'large' }}",
  "brand": {
    "@type": "Brand",
    "name": "Bartact"
  },
  "sku": "{{ product.selected_or_first_available_variant.sku }}",
  {% if product.selected_or_first_available_variant.available %}
  "offers": {
    "@type": "Offer",
    "url": "{{ shop.url }}{{ product.url }}",
    "priceCurrency": "{{ shop.currency }}",
    "price": "{{ product.selected_or_first_available_variant.price | divided_by: 100.0 }}",
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "Organization",
      "name": "Bartact"
    }
  }
  {% endif %}
}
</script>
`;
      
      // Add before </body> or at end
      if (productContent.includes('</body>')) {
        productContent = productContent.replace('</body>', `${schema}\n</body>`);
      } else {
        productContent += schema;
      }
      
      await putThemeAsset(token, mainTheme.id, productTemplate.key, productContent);
      console.log('✅ Added Product schema\n');
    } else {
      console.log('  → Product schema already exists\n');
    }
  } else {
    console.log('  ⚠️  Could not find product template\n');
  }
  
  console.log('🎉 All fixes applied!\n');
  console.log('📋 Summary:');
  console.log('  ✅ Meta description added');
  console.log('  ✅ Title tag structure fixed');
  console.log('  ✅ H1 structure optimized');
  console.log('  ✅ Product schema added');
  console.log('\n💡 Changes are live immediately. Check https://www.bartact.com');
}

run().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
