// Blog content guard — runs before ANY publish to Bartact or Bull Strap
// Checks: is this post on-topic? Does it have enough words? Is it going to the right blog?
const BARTACT_ALLOWED = /jeep|wrangler|gladiator|bronco|tacoma|4runner|molle|paracord|grab.handle|limit.strap|fire.extinguisher|wrangliator|seat.cover|roll.bar/i;
const BARTACT_BANNED  = /tarp|cargo.cover|outdoor.storage|foam.backed.tarp|scrim.back.*tarp|waterproof.tarp|uv.prot.*tarp|bike.rack|2.stroke|body.armor|air.filter|brake.kit|battery.charger/i;

function validateBartactPost(title, body) {
  if (!BARTACT_ALLOWED.test(title)) return { ok: false, reason: `Title not on-brand: "${title}"` };
  if (BARTACT_BANNED.test(title))   return { ok: false, reason: `Title contains banned topic: "${title}"` };
  const words = body.replace(/<[^>]*>/g,' ').split(/\s+/).filter(w=>w.length>1).length;
  if (words < 400) return { ok: false, reason: `Too short: ${words} words (min 400)` };
  return { ok: true };
}

module.exports = { validateBartactPost };
