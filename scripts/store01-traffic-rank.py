#!/usr/bin/env python3
"""Pull GSC clicks for all 50 Store 01 sites and rank lowest → highest traffic."""

import json, requests, sys
from datetime import datetime, timedelta

CREDS_FILE = '/home/ubuntu/.openclaw/workspace/sites/indexing-credentials/.brazenauto-indexing-credentials.json'

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

def refresh_token(creds):
    r = requests.post('https://oauth2.googleapis.com/token', data={
        'client_id': creds['client_id'],
        'client_secret': creds['client_secret'],
        'refresh_token': creds['refresh_token'],
        'grant_type': 'refresh_token'
    })
    r.raise_for_status()
    return r.json()['access_token']

def get_clicks(token, site_url, start, end):
    url = f"https://searchconsole.googleapis.com/webmasters/v3/sites/{requests.utils.quote(site_url, safe='')}/searchAnalytics/query"
    r = requests.post(url, headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
        json={"startDate": start, "endDate": end, "dimensions": [], "rowLimit": 1})
    if r.status_code == 403:
        return None, "no_access"
    if r.status_code == 404:
        return None, "not_verified"
    if r.status_code != 200:
        return None, f"err_{r.status_code}"
    data = r.json()
    rows = data.get('rows', [])
    if not rows:
        return 0, "ok"
    return int(rows[0].get('clicks', 0)), "ok"

def main():
    creds = json.load(open(CREDS_FILE))
    token = refresh_token(creds)

    end = datetime.now().strftime('%Y-%m-%d')
    start = (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d')

    print(f"\n{'='*65}")
    print(f"Store 01 (brazenprodu01-20) — GSC Clicks ({start} → {end})")
    print(f"{'='*65}")

    results = []
    for domain in STORE01_SITES:
        site_url = f"https://{domain}/"
        clicks, status = get_clicks(token, site_url, start, end)
        if clicks is None:
            # try sc-domain: format
            site_url2 = f"sc-domain:{domain}"
            clicks, status = get_clicks(token, site_url2, start, end)
        results.append((domain, clicks if clicks is not None else -1, status))
        marker = "✅" if status == "ok" else "⚠️"
        val = f"{clicks:,}" if clicks is not None else status
        print(f"  {marker} {domain:<35} {val}")

    print(f"\n{'='*65}")
    print("RANKED LOWEST → HIGHEST TRAFFIC (candidates to remove):")
    print(f"{'='*65}")
    sortable = [(d, c, s) for d, c, s in results]
    sortable.sort(key=lambda x: (x[1] if x[1] >= 0 else 999999))
    for i, (domain, clicks, status) in enumerate(sortable, 1):
        val = f"{clicks:,} clicks" if clicks >= 0 else f"({status})"
        print(f"  {i:2}. {domain:<35} {val}")

    print(f"\n--- BOTTOM 6 (lowest traffic — remove these to make room) ---")
    for domain, clicks, status in sortable[:6]:
        val = f"{clicks:,} clicks" if clicks >= 0 else f"({status})"
        print(f"  ❌ {domain:<35} {val}")

if __name__ == '__main__':
    main()
