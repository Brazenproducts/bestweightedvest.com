#!/usr/bin/env python3
"""Rank Store 01 sites by GitHub repo activity (commits, files, last push) as traffic proxy."""

import subprocess, json, os, sys
from datetime import datetime

GH_TOKEN = subprocess.check_output(
    ["bash", "-c", "grep GH_TOKEN /home/ubuntu/.openclaw/workspace/.env | cut -d= -f2"],
    text=True).strip()

STORE01_SITES = [
    "gladiatorseatcover.com", "broncointerior.com", "bestcarwashkit.com",
    "overlanderupgrades.com", "lightninginterior.com", "ridgeutv.com",
    "wranglerseatcover.com", "broncorollbars.com", "wranglerseats.com",
    "wranglerjeepaccessories.com", "tacomaseats.com", "4runnerseats.com",
    "cybertruckbumper.com", "jlcovers.com", "lightningaftermarket.com",
    "cybertruckstorage.com", "bestseatcover.com", "broncoexterior.com",
    "tacticaltailgate.com", "jkseatcovers.com", "18wheelergear.com",
    "besttruckfloorliner.com", "tacticalseatcovers.com", "broncotents.com",
    "broncograbhandles.com", "besttrucktopper.com", "broncoupgrade.com",
    "bestrecoverykit.com", "bestheadlightrestoration.com", "bestgolfcartaccessories.com",
    "bestledlightbars.com", "scoutupgrades.com", "bestdetailingkit.com",
    "sidebysidegoods.com", "broncofloormats.com", "broncoseat.com",
    "bigrigseatcovers.com", "stoutparts.com", "broncobumper.com",
    "broncoshade.com", "cybertruckseatcover.com", "tjseatcovers.com",
    "jtseatcovers.com", "slatetruckaccessories.com", "molleattachments.com",
    "wranglergrabhandles.com", "besttireinflator.com", "broncotops.com",
    "broncocargo.com", "jlseatcover.com"
]

import urllib.request

def gh_get(path):
    url = f"https://api.github.com{path}"
    req = urllib.request.Request(url, headers={
        'Authorization': f'token {GH_TOKEN}',
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'brazen-traffic-rank'
    })
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read())
    except Exception as e:
        return None

def domain_to_repo(domain):
    """Try common repo name patterns."""
    # strip .com
    base = domain.replace('.com', '').replace('.', '-')
    return base

def get_repo_info(domain):
    repo = domain_to_repo(domain)
    # Try Brazenproducts org first, then brazenproducts user
    for org in ['Brazenproducts', 'brazenproducts']:
        data = gh_get(f"/repos/{org}/{repo}")
        if data and 'pushed_at' in data:
            pushed = data.get('pushed_at', '')[:10]
            size_kb = data.get('size', 0)
            # Get commit count via contributors stats
            commits_data = gh_get(f"/repos/{org}/{repo}/commits?per_page=1")
            # Check Link header not available, approximate via size
            return {
                'repo': f"{org}/{repo}",
                'pushed': pushed,
                'size_kb': size_kb,
                'stars': data.get('stargazers_count', 0),
                'open_issues': data.get('open_issues_count', 0),
                'found': True
            }
    return {'repo': f'Brazenproducts/{repo}', 'pushed': '?', 'size_kb': 0, 'stars': 0, 'found': False}

results = []
print(f"\nFetching GitHub repo data for {len(STORE01_SITES)} Store 01 sites...\n")
for domain in STORE01_SITES:
    info = get_repo_info(domain)
    results.append((domain, info))
    status = "✅" if info['found'] else "❌"
    print(f"  {status} {domain:<38} pushed={info['pushed']:<12} size={info['size_kb']:>5}KB")

# Score: higher size + more recent = better
def score(item):
    _, info = item
    if not info['found']:
        return 0
    size = info['size_kb']
    # Date score: days since last push (fewer = better)
    try:
        days = (datetime.now() - datetime.strptime(info['pushed'], '%Y-%m-%d')).days
        freshness = max(0, 365 - days)
    except:
        freshness = 0
    return size + freshness

results.sort(key=score)

print(f"\n{'='*65}")
print("RANKED WEAKEST → STRONGEST (by repo size + recency)")
print(f"{'='*65}")
for i, (domain, info) in enumerate(results, 1):
    status = "✅" if info['found'] else "❌ NOT FOUND"
    print(f"  {i:2}. {domain:<38} size={info['size_kb']:>5}KB  pushed={info['pushed']}  {status}")

print(f"\n--- BOTTOM 6 (weakest — swap these OUT) ---")
for domain, info in results[:6]:
    print(f"  🔴 {domain:<38} size={info['size_kb']:>5}KB  pushed={info['pushed']}")

print(f"\n--- SITES TO ADD (these should replace the bottom 6) ---")
to_add = ["jlseatcovers.com", "jluseatcovers.com", "besttruckaccessories.com",
          "jeepseatcover.com", "broncoseatcover.com", "bestbroncoaccessories.com"]
for s in to_add:
    print(f"  🟢 {s}")
