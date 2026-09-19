#!/usr/bin/env node
// seo-internal-links.js
// Returns related internal cross-links for affiliate sites in the Jeep/Bronco/Truck seat cover network.
// Usage: node scripts/seo-internal-links.js <domain>
// Exports: getRelatedLinks(domain) → Array<{href, text}>

const SITE_NETWORK = {
  // ── Jeep Wrangler / Commander / Gladiator ──────────────────────────────────
  'commanderseats.com': [
    { href: 'https://jeepbenchcovers.com',    text: 'Jeep rear bench seat covers' },
    { href: 'https://wranglerseatcover.com',  text: 'Jeep Wrangler seat covers' },
    { href: 'https://jkseatcovers.com',       text: 'Jeep JK seat covers (2007–2018)' },
    { href: 'https://jlseatcovers.com',       text: 'Jeep JL seat covers (2018–2026)' },
    { href: 'https://gladiatorseat.com',      text: 'Jeep Gladiator seat covers' },
    { href: 'https://jtseatcovers.com',       text: 'JT Gladiator seat covers' },
    { href: 'https://tjseatcovers.com',       text: 'TJ Wrangler seat covers' },
    { href: 'https://molleseats.com',         text: 'MOLLE tactical seat covers' },
    { href: 'https://jeepseatcover.com',      text: 'Jeep seat cover guide' },
    { href: 'https://jlseats.com',            text: 'JL seats guide' },
    { href: 'https://jlseatcover.com',        text: 'JL seat cover picks' },
    { href: 'https://tacticalseats.com',      text: 'Tactical seat covers' },
  ],
  'jeepbenchcovers.com': [
    { href: 'https://commanderseats.com',     text: 'Jeep Commander seat covers' },
    { href: 'https://jkseatcovers.com',       text: 'JK seat covers' },
    { href: 'https://jlseatcovers.com',       text: 'JL seat covers' },
    { href: 'https://tjseatcovers.com',       text: 'TJ seat covers' },
    { href: 'https://gladiatorseat.com',      text: 'Gladiator seat covers' },
    { href: 'https://wranglerseatcover.com',  text: 'Wrangler seat covers' },
    { href: 'https://molleseats.com',         text: 'MOLLE seat covers' },
    { href: 'https://jeepseatcover.com',      text: 'Jeep seat cover guide' },
  ],
  'jlseatcover.com': [
    { href: 'https://jlseatcovers.com',       text: 'JL seat covers guide' },
    { href: 'https://jlseats.com',            text: 'JL seats guide' },
    { href: 'https://jluseatcovers.com',      text: 'JLU seat covers' },
    { href: 'https://jlscrambler.com',        text: 'JL Scrambler seat covers' },
    { href: 'https://wranglerseatcover.com',  text: 'Wrangler seat covers' },
    { href: 'https://jkseatcovers.com',       text: 'JK seat covers' },
    { href: 'https://molleseats.com',         text: 'MOLLE seat covers' },
  ],
  'jlseats.com': [
    { href: 'https://jlseatcovers.com',       text: 'JL seat covers' },
    { href: 'https://jlseatcover.com',        text: 'JL seat cover picks' },
    { href: 'https://jluseatcovers.com',      text: 'JLU seat covers' },
    { href: 'https://wranglerseatcover.com',  text: 'Wrangler seat covers' },
    { href: 'https://molleseats.com',         text: 'MOLLE seat covers' },
  ],
  'wranglerseatcover.com': [
    { href: 'https://jkseatcovers.com',       text: 'JK seat covers' },
    { href: 'https://jlseatcovers.com',       text: 'JL seat covers' },
    { href: 'https://tjseatcovers.com',       text: 'TJ seat covers' },
    { href: 'https://jeepbenchcovers.com',    text: 'Jeep bench seat covers' },
    { href: 'https://gladiatorseat.com',      text: 'Gladiator seat covers' },
    { href: 'https://molleseats.com',         text: 'MOLLE seat covers' },
    { href: 'https://commanderseats.com',     text: 'Commander seat covers' },
  ],
  'scramblerseatcovers.com': [
    { href: 'https://jlseatcovers.com',       text: 'JL seat covers' },
    { href: 'https://jlscrambler.com',        text: 'JL Scrambler seat covers' },
    { href: 'https://jtseatcovers.com',       text: 'JT Gladiator seat covers' },
    { href: 'https://gladiatorseat.com',      text: 'Gladiator seat covers' },
    { href: 'https://molleseats.com',         text: 'MOLLE seat covers' },
  ],
  'gladiatorjeepclub.com': [
    { href: 'https://gladiatorseat.com',      text: 'Gladiator seat covers' },
    { href: 'https://jtseatcovers.com',       text: 'JT seat covers' },
    { href: 'https://molleseats.com',         text: 'MOLLE seat covers' },
    { href: 'https://jlseatcovers.com',       text: 'JL seat covers' },
    { href: 'https://wranglerseatcover.com',  text: 'Wrangler seat covers' },
  ],
  'jtseatcovers.com': [
    { href: 'https://gladiatorseat.com',      text: 'Gladiator seat covers' },
    { href: 'https://jlseatcovers.com',       text: 'JL seat covers' },
    { href: 'https://molleseats.com',         text: 'MOLLE seat covers' },
    { href: 'https://wranglerseatcover.com',  text: 'Wrangler seat covers' },
    { href: 'https://jeepseatcover.com',      text: 'Jeep seat cover guide' },
  ],
  'jtseats.com': [
    { href: 'https://jtseatcovers.com',       text: 'JT seat covers' },
    { href: 'https://gladiatorseat.com',      text: 'Gladiator seat covers' },
    { href: 'https://molleseats.com',         text: 'MOLLE seat covers' },
  ],
  // ── Bronco ────────────────────────────────────────────────────────────────
  'broncobumper.com': [
    { href: 'https://broncoseat.com',         text: 'Bronco seat covers' },
    { href: 'https://broncoseatcover.com',    text: 'Ford Bronco seat cover' },
    { href: 'https://broncorollbar.com',      text: 'Bronco roll bar' },
    { href: 'https://broncointerior.com',     text: 'Bronco interior accessories' },
    { href: 'https://bestbroncoaccessories.com', text: 'Best Bronco accessories' },
  ],
  'broncorollbar.com': [
    { href: 'https://broncoseat.com',         text: 'Bronco seat covers' },
    { href: 'https://broncobumper.com',       text: 'Bronco bumpers' },
    { href: 'https://broncointerior.com',     text: 'Bronco interior' },
    { href: 'https://broncoexterior.com',     text: 'Bronco exterior parts' },
    { href: 'https://bestbroncoaccessories.com', text: 'Best Bronco accessories' },
  ],
  'broncointerior.com': [
    { href: 'https://broncoseat.com',         text: 'Bronco seat covers' },
    { href: 'https://broncoseatcover.com',    text: 'Ford Bronco seat cover' },
    { href: 'https://broncorollbar.com',      text: 'Bronco roll bar' },
    { href: 'https://bestbroncoaccessories.com', text: 'Best Bronco accessories' },
  ],
  'broncoexterior.com': [
    { href: 'https://broncobumper.com',       text: 'Bronco bumpers' },
    { href: 'https://broncorollbar.com',      text: 'Bronco roll bar' },
    { href: 'https://bestbroncoaccessories.com', text: 'Best Bronco accessories' },
    { href: 'https://broncointerior.com',     text: 'Bronco interior accessories' },
  ],
  'broncorollbars.com': [
    { href: 'https://broncorollbar.com',      text: 'Bronco roll bar guide' },
    { href: 'https://broncocage.com',         text: 'Bronco roll cage' },
    { href: 'https://broncobumper.com',       text: 'Bronco bumpers' },
    { href: 'https://broncointerior.com',     text: 'Bronco interior' },
    { href: 'https://bestbroncoaccessories.com', text: 'Best Bronco accessories' },
  ],
  'broncocage.com': [
    { href: 'https://broncorollbar.com',      text: 'Bronco roll bar' },
    { href: 'https://broncorollbars.com',     text: 'Bronco roll bars guide' },
    { href: 'https://broncobumper.com',       text: 'Bronco bumpers' },
    { href: 'https://bestbroncoaccessories.com', text: 'Best Bronco accessories' },
  ],
  // ── Truck / Commercial ───────────────────────────────────────────────────
  'tacticaltailgate.com': [
    { href: 'https://tacticalseats.com',      text: 'Tactical seat covers' },
    { href: 'https://molleseats.com',         text: 'MOLLE seat covers' },
    { href: 'https://tacomaseats.com',        text: 'Tacoma seat covers' },
  ],
  'hspseats.com': [
    { href: 'https://bigrigseatcovers.com',   text: 'Big rig seat covers' },
    { href: 'https://semiseatcovers.com',     text: 'Semi truck seat covers' },
    { href: 'https://bigrigseats.com',        text: 'Big rig seats guide' },
  ],
  'bigrigseatcovers.com': [
    { href: 'https://hspseats.com',           text: 'HSP semi seat covers' },
    { href: 'https://semiseatcovers.com',     text: 'Semi seat covers guide' },
    { href: 'https://bigrigseats.com',        text: 'Big rig seats' },
  ],
  'semiseatcovers.com': [
    { href: 'https://bigrigseatcovers.com',   text: 'Big rig seat covers' },
    { href: 'https://hspseats.com',           text: 'HSP semi seats' },
    { href: 'https://bigrigseats.com',        text: 'Big rig seats guide' },
  ],
  'bigrigseats.com': [
    { href: 'https://bigrigseatcovers.com',   text: 'Big rig seat covers' },
    { href: 'https://semiseatcovers.com',     text: 'Semi seat covers' },
    { href: 'https://hspseats.com',           text: 'HSP semi seat covers' },
  ],
};

/**
 * Returns an array of related link objects for a given domain.
 * @param {string} domain - e.g. 'commanderseats.com'
 * @returns {Array<{href: string, text: string}>}
 */
function getRelatedLinks(domain) {
  return SITE_NETWORK[domain] || [];
}

module.exports = { getRelatedLinks };

// CLI: node seo-internal-links.js commanderseats.com
if (require.main === module) {
  const domain = process.argv[2];
  if (!domain) {
    console.error('Usage: node seo-internal-links.js <domain>');
    process.exit(1);
  }
  const links = getRelatedLinks(domain);
  if (!links.length) {
    console.error(`No links found for domain: ${domain}`);
    process.exit(1);
  }
  console.log(JSON.stringify(links, null, 2));
}
