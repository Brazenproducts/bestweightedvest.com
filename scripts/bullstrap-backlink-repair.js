#!/usr/bin/env node
// Bull Strap Backlink Health & Repair
// Checks every collection link in blog posts against live Shopify data.
// Auto-repairs dead/empty collections by swapping with topically-similar replacements.

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const WORKSPACE = path.join(__dirname, '..');
const BLOG_STATE_FILE = path.join(WORKSPACE, 'memory/bullstrap-blog-state.json');
const COLLECTIONS_FILE = path.join(WORKSPACE, 'memory/bullstrap-collections.json');
const AUDIT_LOG = path.join(WORKSPACE, 'memory/bullstrap-backlink-repair-log.md');

const SHOP = process.env.SHOPIFY_STORE_BULLSTRAP || 'bull-strap-78.myshopify.com';
const TOKEN = process.env.SHOPIFY_TOKEN_BULLSTRAP;
const API_VERSION = '2024-01';

if (!TOKEN) {
  console.error('❌ SHOPIFY_TOKEN_BULLSTRAP not set');
  process.exit(1);
}

let stats = {
  checked: 0,
  healthy: 0,
  repaired: 0,
  failed: 0,
  repairs: []
};

let collectionsMap = {}; // Map local IDs to collection data
let shopifyCollections = {}; // Cache of Shopify collections by handle

function log(msg) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
}

async function shopifyFetch(endpoint, method = 'GET', body = null, retries = 2) {
  const url = `https://${SHOP}/admin/api/${API_VERSION}${endpoint}`;
  const opts = {
    method,
    headers: {
      'X-Shopify-Access-Token': TOKEN,
      'Content-Type': 'application/json'
    }
  };
  if (body) opts.body = JSON.stringify(body);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, opts);
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('Retry-After')) || (attempt * 2);
        log(`⏳ Rate limited (429). Waiting ${retryAfter}s...`);
        await new Promise(r => setTimeout(r, retryAfter * 1000));
        continue;
      }
      if (!res.ok) {
        if (res.status === 404 && attempt === retries) {
          return null; // Collection not found
        }
        throw new Error(`API ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      if (attempt < retries) {
        const delay = Math.min(1000 * attempt, 5000);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  return null;
}

async function getCollectionByHandle(handle) {
  if (shopifyCollections[handle]) {
    return shopifyCollections[handle];
  }

  // Try custom collections
  let data = await shopifyFetch(`/custom_collections.json?handle=${handle}`);
  if (data && data.custom_collections && data.custom_collections.length > 0) {
    const col = data.custom_collections[0];
    shopifyCollections[handle] = { type: 'custom', ...col };
    return shopifyCollections[handle];
  }

  // Try smart collections
  data = await shopifyFetch(`/smart_collections.json?handle=${handle}`);
  if (data && data.smart_collections && data.smart_collections.length > 0) {
    const col = data.smart_collections[0];
    shopifyCollections[handle] = { type: 'smart', ...col };
    return shopifyCollections[handle];
  }

  return null;
}

async function getCollectionProductCount(collectionId, type) {
  const endpoint = type === 'smart'
    ? `/smart_collections/${collectionId}/products.json?limit=1`
    : `/custom_collections/${collectionId}/products.json?limit=1`;

  const data = await shopifyFetch(endpoint);
  return data && data.products ? data.products.length : 0;
}

function loadCollectionsMap() {
  if (!fs.existsSync(COLLECTIONS_FILE)) {
    log('❌ Collections file not found');
    return false;
  }

  try {
    const data = JSON.parse(fs.readFileSync(COLLECTIONS_FILE, 'utf8'));
    const collections = data.collections || data;
    for (const col of collections) {
      collectionsMap[col.id] = col;
    }
    log(`Loaded ${Object.keys(collectionsMap).length} collections from mapping file`);
    return true;
  } catch (e) {
    log(`❌ Failed to load collections: ${e.message}`);
    return false;
  }
}

function getTopicKeywords(title) {
  const words = (title || '').toLowerCase().split(/[\s\-_/]+/).filter(w => w.length > 2);
  return new Set(words);
}

function findSimilarReplacement(deadTitle, localId) {
  const deadKeywords = getTopicKeywords(deadTitle);
  if (deadKeywords.size === 0) return null;

  let bestMatch = null;
  let bestScore = 0;

  for (const [localId, col] of Object.entries(collectionsMap)) {
    if (parseInt(localId) === parseInt(localId)) continue; // Skip self
    
    const colKeywords = getTopicKeywords(col.title);
    const matches = [...deadKeywords].filter(k => colKeywords.has(k)).length;
    const score = matches / Math.max(deadKeywords.size, colKeywords.size);

    if (score > bestScore && score >= 0.25) {
      bestScore = score;
      bestMatch = { id: col.id, title: col.title, score };
    }
  }

  return bestMatch;
}

async function checkAndRepairBacklinks() {
  log('Loading collections mapping...');
  if (!loadCollectionsMap()) return;

  log('Loading blog state...');
  if (!fs.existsSync(BLOG_STATE_FILE)) {
    log('❌ Blog state file not found');
    return;
  }

  let blogState;
  try {
    blogState = JSON.parse(fs.readFileSync(BLOG_STATE_FILE, 'utf8'));
  } catch (e) {
    log(`❌ Failed to parse blog state: ${e.message}`);
    return;
  }

  const usedCollections = blogState.usedCollections || [];
  log(`Found ${usedCollections.length} collection refs in blog posts`);

  // Check each collection
  for (const localId of usedCollections) {
    stats.checked++;

    const colMapping = collectionsMap[localId];
    if (!colMapping) {
      log(`⚠️  Collection ${localId}: not in mapping file`);
      stats.failed++;
      continue;
    }

    const { handle, title } = colMapping;
    
    // Add delay to respect rate limits
    await new Promise(r => setTimeout(r, 300));

    const collection = await getCollectionByHandle(handle);
    if (!collection) {
      log(`❌ Collection ${localId} ("${title}", handle: ${handle}): NOT FOUND in Shopify`);
      stats.failed++;
      continue;
    }

    // Check product count
    const productCount = await getCollectionProductCount(collection.id, collection.type);
    
    if (productCount === 0) {
      log(`⚠️  Collection ${localId} ("${title}"): EMPTY or DEAD`);

      // Find replacement
      const replacement = findSimilarReplacement(title, localId);
      if (replacement) {
        log(`✅ Found replacement: ID ${replacement.id} ("${replacement.title}", score: ${replacement.score.toFixed(2)})`);

        const idx = blogState.usedCollections.indexOf(localId);
        if (idx >= 0) {
          blogState.usedCollections[idx] = replacement.id;
          stats.repaired++;
          stats.repairs.push({
            deadId: localId,
            deadTitle: title,
            deadHandle: handle,
            replacementId: replacement.id,
            replacementTitle: replacement.title,
            score: replacement.score
          });
        }
      } else {
        log(`⚠️  No suitable replacement found for "${title}"`);
      }
    } else {
      log(`✅ Collection ${localId} ("${title}"): healthy (${productCount} products)`);
      stats.healthy++;
    }
  }

  // Save updated blog state if repairs were made
  if (stats.repaired > 0) {
    log(`Saving ${stats.repaired} repairs to blog state...`);
    fs.writeFileSync(BLOG_STATE_FILE, JSON.stringify(blogState, null, 2));
  }

  // Write audit log
  const auditEntry = `## ${new Date().toISOString()}

**Backlink Health Check Results:**
- Checked: ${stats.checked}
- Healthy: ${stats.healthy}
- Repaired: ${stats.repaired}
- Failed: ${stats.failed}

${stats.repairs.length > 0 ? `### Repairs Made\n${stats.repairs.map(r => `- ID ${r.deadId} ("${r.deadTitle}", ${r.deadHandle}) → ID ${r.replacementId} ("${r.replacementTitle}") [${(r.score * 100).toFixed(0)}%]`).join('\n')}` : ''}

---
`;

  fs.appendFileSync(AUDIT_LOG, auditEntry);

  // Final report
  log('\n' + '='.repeat(60));
  log('BACKLINK HEALTH REPORT');
  log('='.repeat(60));
  log(`Checked:  ${stats.checked}`);
  log(`Healthy:  ${stats.healthy}`);
  log(`Repaired: ${stats.repaired}`);
  log(`Failed:   ${stats.failed}`);

  if (stats.repairs.length > 0) {
    log('\n📝 Repairs made:');
    for (const repair of stats.repairs) {
      log(`  Dead: ID ${repair.deadId} ("${repair.deadTitle}")`);
      log(`  ✓ Fixed: ID ${repair.replacementId} ("${repair.replacementTitle}") [${(repair.score * 100).toFixed(0)}% match]`);
    }
  } else if (stats.repaired === 0 && stats.failed === 0) {
    log('\n✅ All backlinks are healthy!');
  }

  log('='.repeat(60));
}

(async () => {
  try {
    await checkAndRepairBacklinks();
  } catch (err) {
    log(`❌ Fatal error: ${err.message}`);
    log(err.stack);
    process.exit(1);
  }
})();
