# Shopify Support Ticket — Bot Attack
**Send from:** orders@bartact.com
**Store:** bartact.myshopify.com
**Send via:** https://help.shopify.com → Log in → Contact Support → Live Chat or Email

---

**Subject:** Ongoing Bot Attack — Automated Cart Abuse + /private_access_tokens Probing

**Message:**

We are experiencing an escalating bot attack on bartact.myshopify.com causing direct business damage. We need Shopify's help at the platform level.

**What's happening:**
- Bots are directly hitting our cart permalink for variant ID 40872270233643 (an internal $1 price-adjustment product)
- Every single abandoned checkout in our Sept 13–19 window has a BLANK User-Agent string — 100% automated
- Bots are also probing /private_access_tokens repeatedly — we believe they are attempting to steal our Storefront API token

**Attack timeline (abandoned checkouts created by bots):**
- Sept 13: 6 hits
- Sept 14: 22 hits
- Sept 15: 7 hits
- Sept 16: 33 hits
- Sept 17: 16 hits
- Sept 18: 40 hits
- Sept 19: 83 hits

**Damage:**
- Inventory on that variant corrupted to -19,441 units
- 250+ fake abandoned checkout records polluting our analytics
- Significant Google ranking drops began Sept 19 (same day as peak bot activity) — we believe bot sessions are degrading our engagement signals
- Possible Storefront API token compromise

**What we've already tried:**
- Set Shopify bot protection to aggressive
- Filed a Google Search Console spam report

**What we need from Shopify:**
1. Block blank/empty User-Agent requests at the platform level for our store
2. Rate-limit cart permalink and /cart/add.js endpoints for our store
3. Confirm whether /private_access_tokens was successfully accessed — do we need to rotate our Storefront API tokens?
4. Advise on any additional IP blocking or bot protection options available on our Unlimited plan

**Store:** bartact.myshopify.com
**Plan:** Unlimited
**Contact:** orders@bartact.com | 951-319-4008
