"""Public availability checks. No login, email, user data or paid AI calls."""
import argparse
import base64
import json
from pathlib import Path
import re
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
SITE = 'https://sesiones.sypablitodp.site'
API = 'https://koptglmifwpzrfzvipnm.supabase.co'


def run():
    parser = argparse.ArgumentParser(__doc__)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    source = (ROOT / 'js/supabase-client.js').read_text(encoding='utf-8')
    match = re.search(r"const SUPABASE_KEY = '([^']+)'", source)
    if not match:
        raise RuntimeError('Public API key declaration not found')
    public_key = match.group(1)
    if not public_key.startswith('sb_publishable_'):
        parts = public_key.split('.')
        if len(parts) != 3:
            raise RuntimeError('The health check requires a public API key')
        claims = json.loads(base64.urlsafe_b64decode(parts[1] + '==='))
        if claims.get('role') != 'anon':
            raise RuntimeError('The health check must only use a public API key')

    report = {'checks': [], 'paid_ai_calls': 0, 'emails_sent': 0}
    checks = [
        ('website', SITE + '/', 'GET', False, 200),
        ('build_manifest', SITE + '/app-version.json', 'GET', False, 200),
        ('auth_settings', API + '/auth/v1/settings', 'GET', True, 200),
        ('ai_requires_authentication', API + '/functions/v1/ai-gateway', 'POST', True, 401),
    ]
    for name, url, method, use_key, expected in checks:
        headers = {'User-Agent': 'SpaceLab-Beta-Health', 'Origin': SITE}
        if use_key:
            headers['apikey'] = public_key
        if method == 'POST':
            headers['Content-Type'] = 'application/json'
        request = Request(url, headers=headers, method=method, data=b'{}' if method == 'POST' else None)
        try:
            try:
                response = urlopen(request, timeout=20)
            except HTTPError as error:
                response = error
            with response:
                content = response.read()
                passed = response.status == expected
                if passed and name == 'build_manifest':
                    passed = bool(json.loads(content).get('build'))
                if passed and name == 'auth_settings':
                    passed = isinstance(json.loads(content).get('external'), dict)
                report['checks'].append({'name': name, 'status': response.status, 'passed': passed})
        except (OSError, URLError, ValueError) as error:
            report['checks'].append({'name': name, 'passed': False, 'error_type': type(error).__name__})
    report['ok'] = all(check['passed'] for check in report['checks'])
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(report, indent=2))
    return 0 if report['ok'] else 1


if __name__ == '__main__':
    raise SystemExit(run())
