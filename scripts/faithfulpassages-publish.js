#!/usr/bin/env node
/**
 * faithfulpassages-publish.js
 * Publishes daily Faithful Passages content (prayer/song/scripture)
 * Generates HTML, audio (EN+ES via gtts), updates sitemap, git push
 * Usage: node faithfulpassages-publish.js --file /tmp/fp-content-today.json
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const SITE_DIR = '/home/ubuntu/.openclaw/workspace/sites/faithfulpassages.com';
const AUDIO_DIR = path.join(SITE_DIR, 'audio');
const SITEMAP = path.join(SITE_DIR, 'sitemap.xml');
const BASE_URL = 'https://faithfulpassages.com';

// ─── CLI ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const fileIdx = args.indexOf('--file');
if (fileIdx === -1 || !args[fileIdx + 1]) {
  console.error('Usage: node faithfulpassages-publish.js --file <path>');
  process.exit(1);
}
const contentFile = args[fileIdx + 1];
const content = JSON.parse(fs.readFileSync(contentFile, 'utf8'));
const { type, title, slug, tag, theme, date, reflection } = content;

// ─── Audio generation via gtts ────────────────────────────────────────────────
function generateAudio(text, lang, outPath) {
  const script = `
from gtts import gTTS
import sys
tts = gTTS(text=sys.argv[1], lang=sys.argv[2], slow=False)
tts.save(sys.argv[3])
print(f"Audio saved: {sys.argv[3]}")
`;
  const tmpPy = '/tmp/fp_tts_gen.py';
  fs.writeFileSync(tmpPy, script);
  const res = spawnSync('python3', [tmpPy, text, lang, outPath], {
    timeout: 60000,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  if (res.status !== 0) {
    const errMsg = res.stderr ? res.stderr.toString() : 'unknown error';
    console.warn(`  ⚠ Audio generation failed for ${lang}: ${errMsg.slice(0, 200)}`);
    return false;
  }
  console.log(`  ✓ Audio [${lang}]: ${outPath}`);
  return true;
}

// ─── HTML builders ────────────────────────────────────────────────────────────
function nav() {
  return `<nav><a class="nav-brand" href="/">Faithful <span>Passages</span></a><ul class="nav-links"><li><a href="/prayers.html">Prayers</a></li><li><a href="/songs.html">Songs</a></li><li><a href="/scripture.html">Scripture</a></li><li><a href="/about.html">About</a></li><li><a href="https://donate.stripe.com/faithfulpassages" class="nav-donate" target="_blank" rel="noopener">❤️ Support</a></li></ul></nav>`;
}

function footer() {
  return `<div class="donate-section" style="background:linear-gradient(135deg,#7A9E7E 0%,#5a7a5e 100%);color:white;text-align:center;padding:48px 24px;">
<h2 style="font-size:1.7rem;margin-bottom:12px;">Keep This Free for Everyone</h2>
<p style="font-size:1.05rem;opacity:0.9;max-width:520px;margin:0 auto 28px;">Faithful Passages is free — no ads, no paywalls, no algorithms. If these words have helped you, consider supporting the work.</p>
<a href="https://donate.stripe.com/faithfulpassages" target="_blank" rel="noopener" style="display:inline-block;background:white;color:#5a7a5e;font-weight:700;font-size:1.05rem;padding:14px 36px;border-radius:50px;text-decoration:none;box-shadow:0 4px 20px rgba(0,0,0,0.2);">❤️ Give a Gift</a>
<p style="font-size:0.8rem;opacity:0.7;margin-top:16px;">Secure · Any amount · Cancel anytime</p>
</div>
<div class="email-section"><h2>Get Daily Prayers Delivered Free</h2><p>A new prayer every morning. Real words for real life.</p><form class="email-form" onsubmit="handleSignup(event)"><input type="email" placeholder="Your email address" required><button type="submit">Subscribe Free</button></form></div>
<footer><div class="footer-links"><a href="/prayers.html">Prayers</a><a href="/songs.html">Songs</a><a href="/scripture.html">Scripture</a><a href="/about.html">About</a><a href="/privacy.html">Privacy</a></div><p>© 2026 Faithful Passages</p></footer>
<script src="/app.js"></script>`;
}

function audioBlock(slug, lang, labelEn, labelEs) {
  const label = lang === 'en' ? labelEn : labelEs;
  return `<p style="font-size:0.85rem;color:#888;margin-bottom:8px;">▶ ${label}</p><audio controls preload="none" style="width:100%;border-radius:8px;margin-bottom:20px;"><source src="/audio/${slug}-${lang}.mp3" type="audio/mpeg"></audio>`;
}

function textToHtmlParagraphs(text) {
  return text.split(/\n\n+/).map(p => `<p>${p.replace(/\n/g, '<br>\n')}</p>`).join('\n');
}

function lyricsToHtml(text) {
  return text.split('\n').map(line => {
    if (!line.trim()) return '<br>';
    return `<p>${line}</p>`;
  }).join('\n');
}

function buildPrayerHtml() {
  const { text_en, text_es, prayer_en, prayer_es } = content;
  const en = prayer_en || text_en;
  const es = prayer_es || text_es;
  const typeLabel = 'Prayer';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — Faithful Passages</title>
<meta name="description" content="${theme}">
<link rel="canonical" href="${BASE_URL}/${slug}.html">
<link rel="stylesheet" href="/style.css">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":"${title}","datePublished":"${date}","publisher":{"@type":"Organization","name":"Faithful Passages","url":"${BASE_URL}"}}</script>
</head>
<body>
${nav()}
<div class="hero" style="padding:56px 24px 48px;"><p class="hero-eyebrow">${typeLabel} · ${date}</p><h1>${title}</h1><p>${theme}</p></div>
<section>
<div class="prayer-card">
<span class="prayer-tag">${tag}</span>
${audioBlock(slug, 'en', 'Listen in English', 'Escuchar en Español')}
${textToHtmlParagraphs(en)}
</div>
<div class="prayer-card" style="background:#f9f7f4;"><h3 style="font-size:1rem;color:#7A9E7E;">Reflection</h3><p style="font-style:italic;">${reflection}</p></div>
<hr class="divider">
<div class="prayer-card">
<p class="section-label">En Español</p>
<h2 style="font-size:1.3rem;margin-bottom:16px;">${title}</h2>
${audioBlock(slug, 'es', 'Listen in English', 'Escuchar en Español')}
${textToHtmlParagraphs(es)}
</div>
</section>
${footer()}
</body></html>`;
}

function buildSongHtml() {
  const { lyrics_en, lyrics_es, text_en, text_es, scripture, style } = content;
  const en = lyrics_en || text_en;
  const es = lyrics_es || text_es;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — Faithful Passages</title>
<meta name="description" content="${theme}">
<link rel="canonical" href="${BASE_URL}/${slug}.html">
<link rel="stylesheet" href="/style.css">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":"${title}","datePublished":"${date}","publisher":{"@type":"Organization","name":"Faithful Passages","url":"${BASE_URL}"}}</script>
</head>
<body>
${nav()}
<div class="hero" style="padding:56px 24px 48px;"><p class="hero-eyebrow">Song · ${date}</p><h1>${title}</h1><p>${theme}</p><p style="font-size:0.9rem;color:#888;margin-top:8px;">Based on ${scripture} · ${style}</p></div>
<section>
<div class="prayer-card">
${audioBlock(slug, 'en', 'Listen in English', 'Escuchar en Español')}
<div class="lyrics">
${lyricsToHtml(en)}
</div>
</div>
<hr class="divider">
<div class="prayer-card">
<p class="section-label">En Español</p>
<h2 style="font-size:1.3rem;margin-bottom:16px;">${title}</h2>
${audioBlock(slug, 'es', 'Listen in English', 'Escuchar en Español')}
<div class="lyrics">
${lyricsToHtml(es)}
</div>
</div>
</section>
${footer()}
</body></html>`;
}

function buildScriptureHtml() {
  const { reading_en, reading_es, text_en, text_es, verse, ref, misconception, real_meaning, application } = content;
  const en = reading_en || text_en;
  const es = reading_es || text_es;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — Faithful Passages</title>
<meta name="description" content="${theme}">
<link rel="canonical" href="${BASE_URL}/${slug}.html">
<link rel="stylesheet" href="/style.css">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":"${title}","datePublished":"${date}","publisher":{"@type":"Organization","name":"Faithful Passages","url":"${BASE_URL}"}}</script>
</head>
<body>
${nav()}
<div class="hero" style="padding:56px 24px 48px;"><p class="hero-eyebrow">Scripture · ${date}</p><h1>${title}</h1><p>${theme}</p><blockquote style="font-style:italic;border-left:3px solid #7A9E7E;padding-left:16px;margin:16px 0;">"${verse}" <span style="font-size:0.85rem;color:#888;">— ${ref}</span></blockquote></div>
<section>
<div class="prayer-card">
${audioBlock(slug, 'en', 'Listen in English', 'Escuchar en Español')}
${textToHtmlParagraphs(en)}
</div>
${misconception ? `<div class="prayer-card" style="background:#f9f7f4;"><h3 style="font-size:1rem;color:#c0392b;">What People Think It Means</h3><p>${misconception}</p></div>` : ''}
${real_meaning ? `<div class="prayer-card" style="background:#f0f7f0;"><h3 style="font-size:1rem;color:#7A9E7E;">What It Actually Means</h3><p>${real_meaning}</p></div>` : ''}
${application ? `<div class="prayer-card"><h3 style="font-size:1rem;color:#7A9E7E;">How to Apply It</h3><p>${application}</p></div>` : ''}
<hr class="divider">
<div class="prayer-card">
<p class="section-label">En Español</p>
<h2 style="font-size:1.3rem;margin-bottom:16px;">${title}</h2>
${audioBlock(slug, 'es', 'Listen in English', 'Escuchar en Español')}
${textToHtmlParagraphs(es)}
</div>
</section>
${footer()}
</body></html>`;
}

// ─── Sitemap update ───────────────────────────────────────────────────────────
function updateSitemap(slug, date) {
  let xml = fs.readFileSync(SITEMAP, 'utf8');
  const entry = `  <url><loc>${BASE_URL}/${slug}.html</loc><lastmod>${date}</lastmod></url>`;
  if (xml.includes(`${slug}.html`)) {
    console.log('  ℹ Sitemap entry already exists');
    return;
  }
  xml = xml.replace('</urlset>', `${entry}\n</urlset>`);
  fs.writeFileSync(SITEMAP, xml);
  console.log('  ✓ Sitemap updated');
}

// ─── Git push ─────────────────────────────────────────────────────────────────
function gitPush(slug, title, type) {
  try {
    execSync(`cd ${SITE_DIR} && git add -A && git commit -m "Daily content: ${title} (${date})" && git push origin main`, {
      stdio: 'pipe',
      timeout: 60000
    });
    console.log('  ✓ Git pushed');
    return true;
  } catch (e) {
    const out = e.stdout ? e.stdout.toString() : '';
    const err = e.stderr ? e.stderr.toString() : '';
    if (out.includes('nothing to commit') || err.includes('nothing to commit')) {
      console.log('  ℹ Nothing to commit');
      return true;
    }
    console.warn('  ⚠ Git push failed:', err.slice(0, 300));
    return false;
  }
}

// ─── IndexNow ping ────────────────────────────────────────────────────────────
function pingIndexNow(slug) {
  try {
    const keyFile = path.join(SITE_DIR, 'b4f7e2a1c3d5e6f7a8b9c0d1e2f3a4b5.txt');
    if (!fs.existsSync(keyFile)) return;
    const https = require('https');
    const body = JSON.stringify({
      host: 'faithfulpassages.com',
      key: 'b4f7e2a1c3d5e6f7a8b9c0d1e2f3a4b5',
      keyLocation: `${BASE_URL}/b4f7e2a1c3d5e6f7a8b9c0d1e2f3a4b5.txt`,
      urlList: [`${BASE_URL}/${slug}.html`]
    });
    const req = https.request({
      hostname: 'api.indexnow.org',
      path: '/indexnow',
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) }
    }, res => console.log(`  ✓ IndexNow: HTTP ${res.statusCode}`));
    req.on('error', e => console.warn('  ⚠ IndexNow error:', e.message));
    req.write(body);
    req.end();
  } catch (e) {
    console.warn('  ⚠ IndexNow skipped:', e.message);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🕊 Faithful Passages — Publishing ${type}: "${title}"`);
  console.log(`   Slug: ${slug} | Date: ${date}\n`);

  // 1. Generate audio
  console.log('1. Generating audio...');
  const audioEnPath = path.join(AUDIO_DIR, `${slug}-en.mp3`);
  const audioEsPath = path.join(AUDIO_DIR, `${slug}-es.mp3`);
  const audioText = content.prayer_en || content.lyrics_en || content.reading_en || content.text_en || '';
  const audioTextEs = content.prayer_es || content.lyrics_es || content.reading_es || content.text_es || '';
  const audioEnOk = generateAudio(audioText, 'en', audioEnPath);
  const audioEsOk = generateAudio(audioTextEs, 'es', audioEsPath);

  // 2. Build HTML
  console.log('2. Building HTML...');
  let html;
  if (type === 'prayer') html = buildPrayerHtml();
  else if (type === 'song') html = buildSongHtml();
  else if (type === 'scripture') html = buildScriptureHtml();
  else { console.error(`Unknown type: ${type}`); process.exit(1); }

  const htmlPath = path.join(SITE_DIR, `${slug}.html`);
  fs.writeFileSync(htmlPath, html);
  console.log(`  ✓ HTML: ${htmlPath}`);

  // 3. Update sitemap
  console.log('3. Updating sitemap...');
  updateSitemap(slug, date);

  // 4. Git commit + push
  console.log('4. Committing and pushing...');
  const pushed = gitPush(slug, title, type);

  // 5. IndexNow
  console.log('5. Pinging IndexNow...');
  pingIndexNow(slug);

  // Report
  const url = `${BASE_URL}/${slug}.html`;
  const audioStatus = (audioEnOk && audioEsOk) ? 'Audio EN+ES generated' : audioEnOk ? 'Audio EN only' : 'Audio skipped (gtts)';
  console.log(`\n✅ Published ${type}: ${title}`);
  console.log(`   URL: ${url}`);
  console.log(`   ${audioStatus}`);
  console.log(`   Git: ${pushed ? 'pushed' : 'failed'}\n`);

  // Write result for caller to parse
  fs.writeFileSync('/tmp/fp-publish-result.json', JSON.stringify({
    type, title, slug, url, date, audioEnOk, audioEsOk, pushed
  }));
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
