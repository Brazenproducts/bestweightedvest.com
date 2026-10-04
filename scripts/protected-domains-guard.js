#!/usr/bin/env node
/**
 * protected-domains-guard.js — CANONICAL shared protected-domain blocklist.
 *
 * [PLAYBOOK] Protected Domains — Zero Tolerance.
 * Every affiliate / content-generating / mass-edit script MUST import this and
 * call assertNotProtected(domain) before writing ANY file, or filter site lists
 * through filterProtected(). No exceptions.
 *
 * Breaking this guard = zero-tolerance PLAYBOOK violation.
 */

// NEVER-AFFILIATE content-protected domains (no Amazon links, no disclosures, no Bartact mentions, ever)
const PROTECTED_DOMAINS = new Set([
  'faithfulpassages.com',
  'thornwoodaccord.com',
  'hspseats.com',
  'huntersafetyproducts.com',
  'hspoffroad.com',
  // Live businesses — never affiliate
  'bartact.com',
  'bullstrap.com',
  'walkindustrial.com',
  'walkwaygear.com',
  'factorfilters.com',
  'bowtiefilters.com',
  'bloxfilters.com',
  'swalmy.com',
  // Active projects
  'skipatip.com',
  'recentratings.com',
  'thedailycheer.com',
  'directbizdata.com',
]);

function normalize(domain) {
  if (!domain) return '';
  return String(domain).toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').trim();
}

function isProtected(domain) {
  return PROTECTED_DOMAINS.has(normalize(domain));
}

// Throws if the domain is protected — call before any write/generate operation.
function assertNotProtected(domain, context = '') {
  const d = normalize(domain);
  if (PROTECTED_DOMAINS.has(d)) {
    throw new Error(`[PLAYBOOK] PROTECTED DOMAIN BLOCKED: refusing to write affiliate/content to "${d}"${context ? ' ('+context+')' : ''}. Zero-tolerance policy.`);
  }
  return true;
}

// Filter a list of site domains, dropping protected ones (logs each drop).
function filterProtected(sites, { silent = false } = {}) {
  const out = [];
  for (const s of sites) {
    if (isProtected(s)) {
      if (!silent) console.warn(`[PLAYBOOK] Skipping protected domain: ${normalize(s)}`);
    } else {
      out.push(s);
    }
  }
  return out;
}

module.exports = { PROTECTED_DOMAINS, isProtected, assertNotProtected, filterProtected, normalize };
