# PLAYBOOK.md - Brazen Auto Operations

## HARD RULES

### NO MARKDOWN TABLES — EVER
Do NOT use markdown table formatting in any reply on any channel (Telegram, Discord, WhatsApp, anywhere). Tables render as unreadable garbage on every messaging platform. Use numbered lists or bullet points instead. This applies to ALL bots — Slashdaddy, Filli, Bartact bot, every bot. No exceptions.

### Amazon Associates Framework
Evaluate sites for Associates registration using this priority order:
1. Backlink value to Bartact (primary)
2. Total revenue value = volume × per-order commission (not just per-order alone)

Store 01 (brazenprodu01-20) and Store 02 (brazenprodu02-20) have no requirement to be automotive vs non-automotive — that's arbitrary. Register the highest-value sites by the framework above across both stores.

### Bull Strap — NO ADS EVER
Margins too thin. Organic SEO only. No Merchant Center monitoring. No ROAS tracking. Permanent.

### JKU/JL Must Lead Before JK/JL in Titles
Hard rule for all product and collection titles. JKU before JK, JL before... wait — always lead with the 4-door variant.

### Protected Sites — Never Treat as Affiliate Sites
- faithfulpassages.com
- thornwoodaccord.com
- hspseats.com
- huntersafetyproducts.com
- hspoffroad.com

### Filli Mass Operations
Filli is frozen on all affiliate site changes. No mass operations without explicit per-operation Mitch approval. Mitch must give go directly — Slashdaddy cannot relay approval on Mitch's behalf for mass operations.

### No Simultaneous Repo Work
Slashdaddy and Filli must not work on the same repos at the same time. Causes conflicts.

### Google Ads — Read Only
Do not suggest budget changes unless Mitch brings it up first. Google Ads is read-only.

### Bartact Collection — Definition of Done
A Bartact collection is NOT done until ALL of the following are true:
- SEO title set (30-65 chars)
- SEO meta description set (120-165 chars)
- Body description 500+ words
- Collection banner image set (not blank)

Missing any one of these = collection is incomplete. The SEO audit must flag and report all four. No exceptions — a collection with 800-word copy and no banner image is still broken.

### Canonical Freeze
Do not touch canonicals until Oct 18, 2026.

### Google Indexing API — New/Updated Pages Only
Do not submit static unchanged pages daily. Submit once on publish, then only on content changes.

### Publishing New Content — Quality Gate Required (ALL BOTS)
Any new page published on bartact.com, bullstrap.com, or any affiliate site MUST run through:
`node scripts/publish-and-index.js [--account bartact|bullstrap|brazenauto] <url>`

This script:
1. Fetches the live page and checks: meta title (30-65 chars), meta description (120-165 chars), word count (400+), internal links (≥1), no forbidden claims
2. ONLY if all checks pass: submits to Google Indexing API (correct account auto-detected by domain) + IndexNow to Bing + Yandex
3. BLOCKS indexing if quality gate fails — fix the issues first

Account auto-detection:
- bartact.com / ballkinis.com → Bartact SA (.bartact-indexing-service-account.json)
- bullstrap.com → Bull Strap OAuth (.bullstrap-indexing-credentials.json)
- All other sites → Brazen Auto OAuth (.brazenauto-indexing-credentials.json)

This cron/script applies to ALL bots. Wire it into every blog/page publishing workflow.

### Google Indexing API — Affiliate Sites: HOMEPAGES ONLY
**HARD RULE — ALL BOTS:** Never submit inner pages of affiliate sites (fordbroncoaccessories.com, besttruckaccessories.com, jlcovers.com, etc.) to the Google Indexing API.
Inner pages contain Amazon affiliate product links. Products get removed from Amazon or pulled by us = those pages become ghost URLs in Google's index = ranking penalty.
Only submit:
- Affiliate site homepages (one URL per domain, trailing slash)
- Bartact.com pages: existing pages already indexed — do NOT re-submit. NEW pages (blogs, collections, products) MUST be submitted immediately on publish via publish-and-index.js
- Bull Strap pages
- Wrangliator.com all pages (editorial content only, no product pages that can disappear)
Violating this creates ghost URLs and harms SEO.

### New Content — Bots Must Index on Publish (ALL ENGINES)
Every time a bot creates or updates ANY of the following, it MUST run publish-and-index.js immediately after:
- New Bartact blog post
- New Bartact collection
- New Bartact product page
- Any updated collection with new body copy
- Any new affiliate site page

The script submits to Google Indexing API + IndexNow (Bing + Yandex) in one call. No exceptions. The rule is: content exists but isn't indexed = it doesn't exist to search engines.

### New Bartact Collections — SEO Fields Required at Creation
When any bot creates a new Bartact collection, it must set ALL of the following before the collection goes live:
- SEO title (30-65 chars, keyword-forward)
- SEO meta description (120-165 chars)
- Body description (500+ words)
- Collection banner image

Do NOT create a collection and come back later to add SEO. Set it on creation or don't publish it.

### Collection/Product Audit — 500-Word Standard
The thin content threshold for Bartact collections is 500 words, not 400. Any automated audit that reports a collection as "passing" at 400 words is using the wrong threshold. Fix the check to 500.
