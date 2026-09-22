#!/usr/bin/env node
/**
 * fix-affiliate-tags.js
 * Sweep all affiliate site HTML files and fix wrong/dead Amazon tracking tags.
 * Dead store IDs: 04, 06, 07, 10, 12, 13, 16 — none of these earn commission.
 * Also fixes malformed double-tag URLs.
 *
 * Store 01 (brazenprodu01-20): automotive sites
 * Store 02 (brazenprodu02-20): non-automotive sites
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SITES_DIR = '/home/ubuntu/.openclaw/workspace/sites';

const STORE01_TAG = 'brazenprodu01-20';
const STORE02_TAG = 'brazenprodu02-20';

// Dead/wrong store IDs to replace
const DEAD_TAGS = [
  'brazenprodu04-20',
  'brazenprodu06-20',
  'brazenprodu07-20',
  'brazenprodu10-20',
  'brazenprodu12-20',
  'brazenprodu13-20',
  'brazenprodu16-20',
];

// Store 01 — automotive (brazenprodu01-20)
const STORE01_SITES = new Set([
  '4runnerseats.com',
  'allautodirect.com',
  'bestbroncoaccessories.com',
  'bestgolfcartaccessories.com',
  'bestrecoverykit.com',
  'bestseatcover.com',
  'besttruckaccessories.com',
  'broncoexterior.com',
  'broncofloormats.com',
  'broncograbhandles.com',
  'broncohandles.com',
  'broncointerior.com',
  'broncorollbar.com',
  'broncorollbars.com',
  'broncoseat.com',
  'broncoshade.com',
  'broncoupgrade.com',
  'fordbroncoaccessories.com',
  'gladiatorgrabhandle.com',
  'gladiatorseat.com',
  'gladiatorseatcover.com',
  'jeepseatcover.com',
  'jkrollbar.com',
  'jkseatcovers.com',
  'jlcovers.com',
  'jlseatcover.com',
  'jlseatcovers.com',
  'jlseats.com',
  'jluseatcovers.com',
  'jtseatcovers.com',
  'molleattachments.com',
  'mollebag.com',
  'molleinterior.com',
  'mollesystems.com',
  'rollbarhandles.com',
  'slatetruckaccessories.com',
  'tacomaseats.com',
  'tacticalcovers.com',
  'tacticalseat.com',
  'tacticalseatcovers.com',
  'tacticalseats.com',
  'tacticaltailgate.com',
  'tjseatcovers.com',
  'wranglergrabhandles.com',
  'wranglerjeepaccessories.com',
  'wranglerseat.com',
  'wranglerseatcover.com',
  'wranglerseats.com',
  // Pending addition to Store 01
  'sidebysidegoods.com',
  'lightningaftermarket.com',
]);

// Store 02 — non-automotive (brazenprodu02-20)
const STORE02_SITES = new Set([
  '120sfshed.com',
  'bestbaseballmitts.com',
  'bestbattinggloves.com',
  'bestcompactlaser.com',
  'bestdutchoven.com',
  'bestgaming-chair.com',
  'bestgarageheater.com',
  'bestheating-pad.com',
  'besthvacfilter.com',
  'bestice-maker.com',
  'bestlabel-maker.com',
  'bestmassage-gun.com',
  'bestmini-fridge.com',
  'bestofficefilters.com',
  'bestorbitalsandpaper.com',
  'bestpastamaker.com',
  'bestportable-ac.com',
  'bestportable-charger.com',
  'bestpower-bank.com',
  'bestreciprocatingsaw.com',
  'bestresistance-bands.com',
  'bestshower-head.com',
  'bestsousvide.com',
  'bestvibrationplate.com',
  'bestwaterfilterpitcher.com',
  'bestwindshieldwiper.com',
  'bestzeroturnmower.com',
  'commercialhvacfilter.com',
  'furnaceprefilter.com',
  'hvacprefilter.com',
  'kawasakiridgeutv.com',
  'outdoorseatingcushion.com',
  'shedswithoutpermit.com',
  'shedwithoutpermit.com',
  'topchainsaw.com',
  'topespressomaker.com',
  'topgaragedooropener.com',
  'toppelletgrill.com',
  'topportablepowerstation.com',
  'toppowerstation.com',
  'topqueenmattress.com',
  'topsnowblower.com',
  'topwalkingpad.com',
  'whatarebest.com',
  'whicharebest.com',
]);

function getTargetTag(siteName) {
  if (STORE01_SITES.has(siteName)) return STORE01_TAG;
  if (STORE02_SITES.has(siteName)) return STORE02_TAG;
  // Unregistered — guess by name
  return STORE01_TAG; // default to 01 for automotive-sounding sites
}

function fixContent(content, targetTag) {
  let fixed = content;
  let changes = 0;

  // 1. Fix dead store IDs
  for (const deadTag of DEAD_TAGS) {
    const re = new RegExp(deadTag.replace(/-/g, '\\-'), 'g');
    const before = fixed;
    fixed = fixed.replace(re, targetTag);
    if (fixed !== before) {
      const count = (before.match(re) || []).length;
      changes += count;
    }
  }

  // 2. Fix malformed double-tag URLs like:
  //    tag=brazenprodu01-20M/?tag=brazenprodu01-20
  //    tag=brazenprodu01-20R/?tag=...
  //    tag=brazenprodu01-202/?tag=...
  // These happen when a suffix got appended to the tag before the next ?tag=
  const doubleTagRe = /tag=brazenprodu\d{2}-20[A-Z0-9]+\/?\?tag=brazenprodu\d{2}-20/g;
  const beforeDouble = fixed;
  fixed = fixed.replace(doubleTagRe, `tag=${targetTag}`);
  if (fixed !== beforeDouble) {
    changes += (beforeDouble.match(doubleTagRe) || []).length;
  }

  // 3. Fix wrong-store tags on registered sites
  // e.g. Store 01 site has brazenprodu02-20 (wrong)
  //      Store 02 site has brazenprodu01-20 (wrong)
  if (targetTag === STORE01_TAG) {
    // Replace 02-20 with 01-20 on Store 01 sites (mollestraps.com issue)
    const re02 = /brazenprodu02-20/g;
    const before02 = fixed;
    fixed = fixed.replace(re02, STORE01_TAG);
    if (fixed !== before02) {
      changes += (before02.match(re02) || []).length;
    }
  }

  return { fixed, changes };
}

function getAllHtmlFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllHtmlFiles(full));
    } else if (entry.name.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

const siteDirs = fs.readdirSync(SITES_DIR, { withFileTypes: true })
  .filter(e => e.isDirectory())
  .map(e => e.name);

let totalSites = 0;
let totalFiles = 0;
let totalChanges = 0;
const changedSites = [];

console.log(`Scanning ${siteDirs.length} site directories...\n`);

for (const siteName of siteDirs) {
  const siteDir = path.join(SITES_DIR, siteName);
  const targetTag = getTargetTag(siteName);
  const htmlFiles = getAllHtmlFiles(siteDir);
  
  let siteChanges = 0;
  let siteFiles = 0;

  for (const filePath of htmlFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const { fixed, changes } = fixContent(content, targetTag);
    
    if (changes > 0) {
      fs.writeFileSync(filePath, fixed, 'utf8');
      siteChanges += changes;
      siteFiles++;
    }
    totalFiles++;
  }

  if (siteChanges > 0) {
    totalSites++;
    totalChanges += siteChanges;
    changedSites.push({ site: siteName, changes: siteChanges, files: siteFiles, tag: targetTag });
    console.log(`✅ ${siteName}: ${siteChanges} tags fixed in ${siteFiles} files → ${targetTag}`);
  }
}

console.log(`\n${'='.repeat(60)}`);
console.log(`SUMMARY:`);
console.log(`  Sites fixed: ${totalSites}`);
console.log(`  Files modified: ${totalFiles} scanned, changes in ${changedSites.reduce((a,s)=>a+s.files,0)}`);
console.log(`  Total tag replacements: ${totalChanges}`);
console.log(`\nChanged sites:`);
changedSites.forEach(s => console.log(`  ${s.site}: ${s.changes} replacements → ${s.tag}`));

// Now commit and push all changed sites
console.log(`\n${'='.repeat(60)}`);
console.log('Committing and pushing changes...\n');

for (const { site } of changedSites) {
  const siteDir = path.join(SITES_DIR, site);
  try {
    execSync('git add -A', { cwd: siteDir, stdio: 'pipe' });
    const diff = execSync('git diff --cached --stat', { cwd: siteDir }).toString().trim();
    if (!diff) { console.log(`  ${site}: nothing to commit (already clean)`); continue; }
    execSync(`git commit -m "fix: correct Amazon affiliate tracking tags to brazenprodu01-20/02-20"`, { cwd: siteDir, stdio: 'pipe' });
    execSync('git push origin main', { cwd: siteDir, stdio: 'pipe' });
    console.log(`  ✅ ${site}: committed and pushed`);
  } catch (e) {
    console.error(`  ❌ ${site}: git error — ${e.message.substring(0, 100)}`);
  }
}

console.log('\nDone.');
