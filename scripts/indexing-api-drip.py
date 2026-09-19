#!/usr/bin/env python3
"""
Google Indexing API drip — 199 URLs/day
Bullstrap full catalog indexing drip.
Shares state with scripts/bullstrap-full-indexing.js via memory/bullstrap-full-indexing-state.json
"""

import json
import time
import sys
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path

WORKSPACE       = Path(__file__).resolve().parent.parent
CREDS_FILE      = WORKSPACE / '.bullstrap-indexing-credentials.json'
URLS_FILE       = WORKSPACE / 'sites/besttirepatch.com/memory/bullstrap-all-urls-for-indexing.json'
STATE_FILE      = WORKSPACE / 'memory/bullstrap-full-indexing-state.json'
DAILY_LIMIT     = 199
BATCH_DELAY_MS  = 250   # ms between requests
INDEXING_URL    = 'https://indexing.googleapis.com/v3/urlNotifications:publish'
TOKEN_URL       = 'https://oauth2.googleapis.com/token'


def log(msg):
    ts = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    print(f'[DRIP] {ts} {msg}', flush=True)


def get_access_token(creds: dict) -> str:
    """Exchange refresh_token for a fresh access_token."""
    payload = urllib.parse.urlencode({
        'client_id':     creds['client_id'],
        'client_secret': creds['client_secret'],
        'refresh_token': creds['refresh_token'],
        'grant_type':    'refresh_token',
    }).encode()
    req = urllib.request.Request(TOKEN_URL, data=payload,
                                  headers={'Content-Type': 'application/x-www-form-urlencoded'})
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read())
    if 'access_token' not in data:
        raise RuntimeError(f'Token exchange failed: {data}')
    return data['access_token']


def push_url(token: str, url: str) -> int:
    """Submit one URL to the Indexing API. Returns HTTP status code."""
    body = json.dumps({'url': url, 'type': 'URL_UPDATED'}).encode()
    req = urllib.request.Request(INDEXING_URL, data=body, headers={
        'Authorization': f'Bearer {token}',
        'Content-Type':  'application/json',
    })
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        return e.code


def load_state() -> dict:
    default = {'pushed': [], 'totalPushed': 0, 'dailyCount': 0,
               'dailyDate': None, 'lastRun': None, 'lastOffset': 0}
    if STATE_FILE.exists():
        try:
            return {**default, **json.loads(STATE_FILE.read_text())}
        except Exception:
            pass
    return default


def save_state(state: dict):
    STATE_FILE.write_text(json.dumps(state))


def main():
    # ── Load credentials ──────────────────────────────────────────────────────
    if not CREDS_FILE.exists():
        log(f'ERROR: No credentials at {CREDS_FILE}')
        sys.exit(1)
    creds = json.loads(CREDS_FILE.read_text())

    # ── Load URL pool ─────────────────────────────────────────────────────────
    if not URLS_FILE.exists():
        log(f'ERROR: No URL list at {URLS_FILE}')
        sys.exit(1)
    url_data  = json.loads(URLS_FILE.read_text())
    all_urls  = url_data.get('urls', url_data) if isinstance(url_data, dict) else url_data
    total_pool = len(all_urls)
    log(f'URL pool: {total_pool:,}')

    # ── Load / reset state ────────────────────────────────────────────────────
    state = load_state()
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')

    if state.get('dailyDate') != today:
        state['dailyCount'] = 0
        state['dailyDate']  = today

    already_today = state['dailyCount']
    budget        = DAILY_LIMIT - already_today

    pushed_set    = set(state.get('pushed', []))
    total_pushed  = state.get('totalPushed', len(pushed_set))
    remaining_pool = total_pool - len(pushed_set)

    # ── Daily-limit guard ─────────────────────────────────────────────────────
    if budget <= 0:
        log(f'Daily limit already reached ({already_today}/{DAILY_LIMIT}) — skipping submission.')
        log(f'Progress : {total_pushed:,} / {total_pool:,} submitted '
            f'({total_pushed/total_pool*100:.1f}%)')
        log(f'Remaining: {remaining_pool:,} URLs')
        import math
        days_left = math.ceil(remaining_pool / DAILY_LIMIT)
        log(f'ETA      : ~{days_left} days at {DAILY_LIMIT}/day')
        print()
        print('=== SUMMARY ===')
        print(f'Submitted today : 0 (quota already used by earlier run)')
        print(f'Total submitted : {total_pushed:,}')
        print(f'Remaining       : {remaining_pool:,}')
        print(f'Est. completion : ~{days_left} days')
        return

    # ── Build work list ───────────────────────────────────────────────────────
    to_push = [u for u in all_urls if u not in pushed_set]
    batch   = to_push[:budget]

    log(f'Remaining URLs  : {len(to_push):,} | Today budget: {budget}')
    log(f'Submitting batch: {len(batch)} URLs')

    # ── Get token ─────────────────────────────────────────────────────────────
    try:
        token = get_access_token(creds)
        log('Access token obtained')
    except Exception as e:
        log(f'FATAL: Token error — {e}')
        sys.exit(1)

    # ── Push URLs ─────────────────────────────────────────────────────────────
    ok         = 0
    errors     = []
    quota_hit  = False

    for i, url in enumerate(batch, 1):
        status = push_url(token, url)

        if status in (200, 202):
            ok += 1
            state['pushed'].append(url)
            state['totalPushed'] = state.get('totalPushed', 0) + 1
            state['dailyCount']  = state.get('dailyCount', 0) + 1
            pushed_set.add(url)
            if i % 50 == 0:
                log(f'  … {i}/{len(batch)} OK so far')
        elif status == 429:
            log(f'QUOTA HIT after {ok} submissions')
            quota_hit = True
            break
        else:
            errors.append(f'{status}: {url[:80]}')
            log(f'  ERR {status} {url[:80]}')

        time.sleep(BATCH_DELAY_MS / 1000)

    # ── Save state ────────────────────────────────────────────────────────────
    state['lastRun'] = datetime.now(timezone.utc).isoformat()
    save_state(state)

    # ── Final report ──────────────────────────────────────────────────────────
    total_pushed_now = state.get('totalPushed', 0)
    remaining_now    = total_pool - len(set(state.get('pushed', [])))
    import math
    days_left = math.ceil(remaining_now / DAILY_LIMIT) if remaining_now > 0 else 0

    log(f'Done: {ok} submitted, {len(errors)} errors{", QUOTA HIT" if quota_hit else ""}')
    pct = f'{total_pushed_now/total_pool*100:.1f}%' if total_pool else 'N/A'
    log(f'Progress : {total_pushed_now:,} / {total_pool:,} ({pct})')
    log(f'Remaining: {remaining_now:,} | ETA: ~{days_left} days')

    print()
    print('=== SUMMARY ===')
    print(f'Submitted today : {ok}')
    print(f'Total submitted : {total_pushed_now:,}')
    print(f'Remaining       : {remaining_now:,}')
    print(f'Est. completion : ~{days_left} days')
    if quota_hit:
        print('⚠️  QUOTA HIT — Google daily limit reached mid-batch')
    if errors:
        print(f'\nFailures ({len(errors)}):')
        for e in errors[:10]:
            print(f'  {e}')
        if len(errors) > 10:
            print(f'  … and {len(errors)-10} more')


if __name__ == '__main__':
    main()
