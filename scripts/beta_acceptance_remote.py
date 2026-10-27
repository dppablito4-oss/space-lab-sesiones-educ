"""Manual live acceptance with disposable accounts; never changes global settings.

Credentials and TOTP secrets stay in memory. Only accounts created by this run
are changed and deleted. Default tests use accounting RPCs without calling AI.
--with-ai additionally makes one short generation per plan (two calls maximum).
"""
import argparse
import base64
import hashlib
import hmac
import json
import re
import secrets
import struct
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from beta_remote_smoke import BASE, PROJECT, ROOT, service_key


def totp(secret):
    key = base64.b32decode(secret.upper() + '=' * (-len(secret) % 8))
    digest = hmac.new(key, struct.pack('>Q', int(time.time()) // 30), hashlib.sha1).digest()
    offset = digest[-1] & 15
    return f'{(struct.unpack(">I", digest[offset:offset + 4])[0] & 0x7fffffff) % 1000000:06d}'


class Acceptance:
    def __init__(self, output, *, base=BASE, project=PROJECT, public_key=None, admin_key=None):
        source = (ROOT / 'js/supabase-client.js').read_text(encoding='utf-8')
        self.public_key = public_key or re.search(r"const SUPABASE_KEY = '([^']+)'", source).group(1)
        self.admin_key = admin_key or service_key()
        self.base = base
        self.users = []
        self.output = output
        self.report = {'project': project, 'checks': [], 'cleanup': [], 'paid_ai_calls': 0}

    def call(self, method, path, payload=None, *, user=None, admin=False):
        key = self.admin_key if admin else self.public_key
        headers = {'apikey': key, 'Content-Type': 'application/json',
                   'Origin': 'https://sesiones.sypablitodp.site', 'Prefer': 'return=representation'}
        if admin or user:
            headers['Authorization'] = 'Bearer ' + (key if admin else user['token'])
        request = Request(self.base + path, method=method, headers=headers,
                          data=json.dumps(payload).encode() if payload is not None else None)
        try:
            response = urlopen(request, timeout=135)
        except HTTPError as error:
            response = error
        with response:
            raw = response.read()
            try:
                body = json.loads(raw) if raw else None
            except ValueError:
                body = None
            return response.status, body

    def check(self, name, condition):
        self.report['checks'].append({'name': name, 'passed': bool(condition)})
        print(('PASS ' if condition else 'FAIL ') + name, flush=True)
        if not condition:
            raise AssertionError(name)

    def create_user(self, plan):
        user = {'email': f'acceptance-{uuid.uuid4()}@example.invalid',
                'password': secrets.token_urlsafe(32), 'plan': plan}
        status, body = self.call('POST', '/auth/v1/admin/users', {
            'email': user['email'], 'password': user['password'], 'email_confirm': True}, admin=True)
        if isinstance(body, dict) and body.get('id'):
            user['id'] = body['id']
            self.users.append(user)  # Track before any assertion or later request.
        self.check(plan + ': temporary account created', status in (200, 201) and 'id' in user)
        self.login(user)
        status, rows = self.call('GET', '/rest/v1/subscriptions?select=id&user_id=eq.' + user['id'], admin=True)
        self.check(plan + ': subscription readable', status == 200 and isinstance(rows, list))
        payload = {'plan_code': plan, 'status': 'active', 'provider': 'manual',
                   'current_period_end': (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()}
        if rows:
            status, _ = self.call('PATCH', '/rest/v1/subscriptions?user_id=eq.' + user['id'], payload, admin=True)
        else:
            status, _ = self.call('POST', '/rest/v1/subscriptions', {**payload, 'user_id': user['id']}, admin=True)
        self.check(plan + ': disposable subscription assigned', status in (200, 201))
        status, entitlements = self.call('POST', '/rest/v1/rpc/get_user_entitlements', {}, user=user)
        self.check(plan + ': commercial plan returned by RPC', status == 200 and entitlements.get('plan') == plan)
        features = entitlements['features']
        self.check(plan + ': feature matrix', features.get('session.generate') is True
                   and features.get('ai.quality_max') is (plan == 'pro')
                   and features.get('ai.attach_file') is (plan == 'pro'))
        return user

    def login(self, user):
        status, session = self.call('POST', '/auth/v1/token?grant_type=password', {
            'email': user['email'], 'password': user['password']})
        self.check(user['plan'] + ': password login', status == 200 and bool(session.get('access_token')))
        user['token'] = session['access_token']
        user['refresh_token'] = session['refresh_token']

    def accounting(self, user, operation, payload):
        status, result = self.call('POST', '/rest/v1/rpc/run_ai_accounting', {
            'p_user_id': user['id'], 'p_operation': operation, 'p_payload': payload}, admin=True)
        if status != 200 or not isinstance(result, dict):
            raise AssertionError(f'Accounting HTTP {status} ({operation})')
        return result

    def reserve(self, user, request_id):
        return self.accounting(user, 'reserve_ai_credits', {
            'p_request_id': request_id, 'p_action': 'refine_text',
            'p_provider': 'openai', 'p_model': 'synthetic-acceptance-no-provider-call'})

    def refund(self, user, request_id):
        return self.accounting(user, 'refund_ai_usage', {'p_request_id': request_id})

    def balance(self, user):
        status, rows = self.call('GET', '/rest/v1/ai_credit_wallets?select=balance&user_id=eq.' + user['id'], user=user)
        if status != 200 or not isinstance(rows, list) or len(rows) != 1:
            raise AssertionError('Own wallet must be readable')
        return rows[0]['balance']

    def concurrency(self, free, pro):
        before = self.balance(free)
        request_id = str(uuid.uuid4())
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(lambda _: self.reserve(free, request_id), range(2)))
        self.check('free: simultaneous duplicate reserved once',
                   sum(r.get('ok') is True for r in results) == 1
                   and sum(r.get('code') == 'DUPLICATE_REQUEST' for r in results) == 1)
        self.check('free: one active reservation blocks another',
                   self.reserve(free, str(uuid.uuid4())).get('code') == 'CONCURRENT_LIMIT_REACHED')
        self.check('cross-user refund refused', self.refund(pro, request_id).get('ok') is False)
        with ThreadPoolExecutor(max_workers=2) as pool:
            refunds = list(pool.map(lambda _: self.refund(free, request_id), range(2)))
        self.check('free: simultaneous refunds idempotent', all(r.get('ok') for r in refunds)
                   and self.balance(free) == before)

        before = self.balance(pro)
        ids = [str(uuid.uuid4()) for _ in range(5)]
        with ThreadPoolExecutor(max_workers=5) as pool:
            results = list(pool.map(lambda request: self.reserve(pro, request), ids))
        accepted = [request for request, result in zip(ids, results) if result.get('ok')]
        self.check('pro: four reservations accepted; fifth blocked', len(accepted) == 4
                   and sum(r.get('code') == 'CONCURRENT_LIMIT_REACHED' for r in results) == 1)
        for request_id in accepted:
            self.check('pro: refund after interrupted generation', self.refund(pro, request_id).get('ok'))
        self.check('pro: exact initial balance restored', self.balance(pro) == before)

        stale = str(uuid.uuid4())
        self.check('pro: reserve abandoned request', self.reserve(pro, stale).get('ok'))
        status, _ = self.call('PATCH', '/rest/v1/ai_usage?user_id=eq.' + pro['id'] + '&request_id=eq.' + stale,
                              {'created_at': (datetime.now(timezone.utc) - timedelta(minutes=16)).isoformat()}, admin=True)
        self.check('pro: age only disposable abandoned request', status == 200)
        next_id = str(uuid.uuid4())
        self.check('pro: new request recovers stale reservation', self.reserve(pro, next_id).get('ok'))
        self.check('pro: recovery refund', self.refund(pro, next_id).get('ok') and self.balance(pro) == before)

        codes = []
        for _ in range(6):
            request_id = str(uuid.uuid4())
            result = self.reserve(free, request_id)
            codes.append(result.get('code'))
            if result.get('ok'):
                self.refund(free, request_id)
        self.check('free: requests-per-minute limit enforced', 'RATE_LIMITED' in codes)
        self.check('free: rejected requests do not debit wallet',
                   self.balance(free) == self.report['free_balance_before_limits'])

    def mfa(self, user):
        status, factor = self.call('POST', '/auth/v1/factors', {
            'factor_type': 'totp', 'friendly_name': 'Disposable acceptance TOTP'}, user=user)
        self.check('real MFA: enroll TOTP', status == 200 and bool(factor.get('id')))
        factor_id, secret = factor['id'], factor['totp']['secret']
        status, challenge = self.call('POST', f'/auth/v1/factors/{factor_id}/challenge', {}, user=user)
        self.check('real MFA: create challenge', status == 200 and bool(challenge.get('id')))
        # Avoid generating a code immediately before its validity window ends.
        if time.time() % 30 > 28:
            time.sleep(2)
        status, verified = self.call('POST', f'/auth/v1/factors/{factor_id}/verify', {
            'challenge_id': challenge['id'], 'code': totp(secret)}, user=user)
        self.check('real MFA: verify generated TOTP', status == 200 and bool(verified.get('access_token')))
        user['token'] = verified['access_token']
        claims = json.loads(base64.urlsafe_b64decode(user['token'].split('.')[1] + '==='))
        self.check('real MFA: signed token has aal2', claims.get('aal') == 'aal2')
        before = self.balance(user)
        status, result = self.call('POST', '/rest/v1/rpc/admin_cc_context', {}, user=user)
        if status == 404:  # The public project may still have the legacy administrator RPC.
            status, result = self.call('POST', '/rest/v1/rpc/admin_set_ai_credits', {
                'p_user_id': user['id'], 'p_balance': 999, 'p_reason': 'Must be refused'}, user=user)
        self.check('MFA alone never grants administrator privileges',
                   (status == 403 or (status == 200 and result.get('ok') is False
                                     and result.get('code') == 'ADMIN_REQUIRED'))
                   and self.balance(user) == before)

    def ai(self, user):
        before = self.balance(user)
        payload = {'requestId': str(uuid.uuid4()), 'action': 'refine_text', 'quality': 'automatic',
                   'input': {'text': 'Los estudiantes comparan cantidades.',
                             'instruction': 'Mejora la claridad en una sola oración de máximo doce palabras.'}}
        self.report['paid_ai_calls'] += 1
        status, result = self.call('POST', '/functions/v1/ai-gateway', payload, user=user)
        self.check(user['plan'] + ': real AI generation', status == 200 and isinstance(result, str) and bool(result.strip()))
        after = self.balance(user)
        self.check(user['plan'] + ': real generation debited credits', before > after)
        status, gateways = self.call('GET', '/rest/v1/ai_gateway_requests?select=attempts&request_id=eq.'
                                    + payload['requestId'], user=user)
        self.check(user['plan'] + ': gateway exposes its provider-attempt identifiers', status == 200
                   and len(gateways) == 1 and bool(gateways[0].get('attempts')))
        attempts = ','.join(str(uuid.UUID(item['requestId'])) for item in gateways[0]['attempts'])
        status, rows = self.call('GET', '/rest/v1/ai_usage?select=credits,status,provider,provider_model,'
                                'provider_cost_usd,input_tokens,output_tokens,latency_ms&request_id=in.('
                                + attempts + ')', user=user)
        completed = [row for row in rows if row['status'] == 'success'] if status == 200 else []
        self.check(user['plan'] + ': successful usage reconciles exact credit debit', status == 200
                   and len(completed) == 1 and completed[0]['credits'] == before - after)
        usage = completed[0]
        self.report.setdefault('ai_usage', []).append({'plan': user['plan'], **usage})
        self.check(user['plan'] + ': provider token and estimated-cost telemetry recorded',
                   isinstance(usage.get('input_tokens'), int) and usage['input_tokens'] > 0
                   and isinstance(usage.get('output_tokens'), int) and usage['output_tokens'] > 0
                   and float(usage.get('provider_cost_usd') or 0) > 0)
        status, _ = self.call('POST', '/functions/v1/ai-gateway', payload, user=user)
        self.check(user['plan'] + ': duplicate gateway request has no extra charge', status == 409
                   and self.balance(user) == after)

    def browser_sync(self, user):
        from functools import partial
        from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
        from threading import Thread

        from playwright.sync_api import sync_playwright

        class QuietHandler(SimpleHTTPRequestHandler):
            def log_message(self, *_args):
                pass

        server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
        Thread(target=server.serve_forever, daemon=True).start()
        scripts = ['js/core/profile-fields.js', 'js/core/account-storage.js', 'js/core/session-sync.js',
                   'js/supabase-client.js', 'js/storage.js']
        try:
            with sync_playwright() as pw:
                browser = pw.chromium.launch(headless=True)
                context = browser.new_context()
                device = browser.new_context()

                def page_for(owner):
                    page = owner.new_page()
                    page.goto(f'http://127.0.0.1:{server.server_port}/robots.txt')
                    page.set_content('<p>Synthetic remote acceptance</p>')
                    page.add_script_tag(url='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.8')
                    for script in scripts:
                        page.add_script_tag(path=str(ROOT / script))
                    return page

                first = page_for(context)
                first.evaluate('''async session => {
                    const {error} = await SupabaseClient.client.auth.setSession(session);
                    if (error) throw new Error('Could not set disposable session');
                }''', {'access_token': user['token'], 'refresh_token': user['refresh_token']})
                second = page_for(context)
                other = page_for(device)
                other.evaluate('''async credentials => {
                    await SupabaseClient.signIn(credentials.email, credentials.password);
                }''', {'email': user['email'], 'password': user['password']})
                for page in (first, second, other):
                    page.wait_for_function('expected => SupabaseClient.getSessionUserSync()?.id === expected', arg=user['id'])
                document_id = 'acceptance-browser-' + str(uuid.uuid4())
                session = {'id': document_id, 'metadata': {'titulo': 'Offline draft'},
                           'htmlContent': '<p>Recoverable synthetic content</p>'}
                context.set_offline(True)
                persisted = first.evaluate('''session => {
                    return StorageManager.saveSession(session) && StorageManager.setCurrentSession(session);
                }''', session)
                self.check('browser: offline document and draft persisted', persisted)
                self.check('browser: second tab reads offline document', second.evaluate(
                    'id => StorageManager.getSession(id)?.metadata.titulo', document_id) == 'Offline draft')
                first.wait_for_timeout(300)
                first.close()
                context.set_offline(False)
                self.check('browser: remaining tab syncs after interrupted connection', second.evaluate(
                    '() => StorageManager.syncSessions()'))
                self.check('browser: independent device syncs from real Supabase', other.evaluate(
                    '() => StorageManager.syncSessions()'))
                self.check('browser: recovered content matches on other device', other.evaluate(
                    'id => StorageManager.getSession(id)?.htmlContent', document_id) == session['htmlContent'])

                # Competing snapshots must preserve the first commit and recover the second.
                other.evaluate('id => window.staleCopy = StorageManager.getSession(id)', document_id)
                second.evaluate('''async id => {
                    const copy = StorageManager.getSession(id);
                    copy.metadata.titulo = 'Title from tab';
                    copy.lastSaved = new Date().toISOString();
                    await SupabaseClient.saveSessionCloud(copy);
                }''', document_id)
                other.evaluate('''async () => {
                    staleCopy.htmlContent = '<p>Content from device</p>';
                    staleCopy.lastSaved = new Date().toISOString();
                    StorageManager.saveSession(staleCopy);
                }''')
                rows = second.evaluate('''async id => {
                    const deadline = Date.now() + 30000;
                    while (Date.now() < deadline) {
                        const rows = await SupabaseClient.getSessionsCloud();
                        if (rows.some(row => row._recoveryOf === id)) return rows;
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                    throw new Error('Recovered document did not reach the other device');
                }''', document_id)
                saved = next(row for row in rows if row['id'] == document_id)
                recovered = next(row for row in rows if row.get('_recoveryOf') == document_id)
                self.report['same_document_conflict'] = {
                    'policy': 'conditional_write_and_recovered_copy',
                    'earlier_title_preserved': saved['metadata']['titulo'] == 'Title from tab',
                    'latest_body_preserved': recovered['htmlContent'] == '<p>Content from device</p>',
                    'requires_follow_up': saved['metadata']['titulo'] != 'Title from tab'
                    or recovered['htmlContent'] != '<p>Content from device</p>',
                }
                self.check('browser: original commit survives a stale device', self.report['same_document_conflict']['earlier_title_preserved'])
                self.check('browser: stale device content recovered in separate cloud document',
                           self.report['same_document_conflict']['latest_body_preserved'])
                browser.close()
        finally:
            server.shutdown()
            server.server_close()

    def cleanup(self):
        for user in self.users:
            deleted = False
            for _ in range(3):
                try:
                    status, _ = self.call('DELETE', '/auth/v1/admin/users/' + user['id'], admin=True)
                    deleted = status in (200, 204, 404)
                    if deleted:
                        break
                except (OSError, TimeoutError):
                    pass
            self.report['cleanup'].append({'id': user['id'], 'deleted': deleted})
            print('Temporary account cleanup: ' + ('OK' if deleted else 'FAILED'), flush=True)
        self.report['ok'] = 'error_type' not in self.report and bool(self.report['checks']) \
            and all(c['passed'] for c in self.report['checks']) \
            and all(c['deleted'] for c in self.report['cleanup'])
        self.report['acceptance_passed'] = self.report['ok'] and not self.report.get(
            'same_document_conflict', {}).get('requires_follow_up', False)
        self.output.parent.mkdir(parents=True, exist_ok=True)
        self.output.write_text(json.dumps(self.report, indent=2), encoding='utf-8')
        if not all(c['deleted'] for c in self.report['cleanup']):
            raise RuntimeError('Temporary-account cleanup requires follow-up; see report')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--with-ai', action='store_true')
    parser.add_argument('--browser', action='store_true', help='Real client/storage in two tabs and a separate browser context')
    parser.add_argument('--output', type=Path, default=ROOT / 'artifacts/apertura-controlada/acceptance-remote.json')
    args = parser.parse_args()
    suite = Acceptance(args.output)
    try:
        free, pro = suite.create_user('free'), suite.create_user('pro')
        if args.with_ai:
            suite.ai(free)
            suite.ai(pro)
        suite.report['free_balance_before_limits'] = suite.balance(free)
        suite.concurrency(free, pro)
        if args.browser:
            suite.browser_sync(free)
        suite.mfa(pro)
    except Exception as error:
        suite.report['error_type'] = type(error).__name__
        raise
    finally:
        suite.cleanup()


if __name__ == '__main__':
    main()
