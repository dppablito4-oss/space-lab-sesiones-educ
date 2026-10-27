"""Validate installed migrations through real local Supabase Auth, REST and Storage.

Requires a running local stack with baseline + migrations applied. Refuses cloud
URLs. Temporary users are deleted in finally. No provider calls or emails.
"""
import argparse
import base64
import json
import subprocess
import uuid
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

from beta_acceptance_remote import Acceptance
from beta_remote_smoke import ROOT


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--workdir', type=Path, required=True)
    parser.add_argument('--output', type=Path, default=ROOT / 'artifacts/apertura-controlada/acceptance-local.json')
    args = parser.parse_args()
    command = 'npx.cmd' if __import__('os').name == 'nt' else 'npx'
    status = subprocess.run([command, '--yes', 'supabase', 'status', '--workdir', str(args.workdir),
                             '--output-format', 'json'], capture_output=True, text=True, encoding='utf-8',
                            check=True, timeout=45)
    keys = json.loads(status.stdout)
    base = keys['API_URL']
    if urlsplit(base).hostname not in ('127.0.0.1', 'localhost', '::1'):
        raise RuntimeError('This test only runs against an isolated local Supabase stack')
    suite = Acceptance(args.output, base=base, project='isolated-local-supabase',
                       public_key=keys['ANON_KEY'], admin_key=keys['SERVICE_ROLE_KEY'])

    def rpc(user, name, payload=None):
        return suite.call('POST', '/rest/v1/rpc/' + name, payload or {}, user=user)

    def write(user, action, target, payload, request_id=None):
        return rpc(user, 'admin_cc_write', {'p_request_id': request_id or str(uuid.uuid4()),
                                           'p_action': action, 'p_target': target, 'p_payload': payload})

    def upload(user, filename):
        request = Request(base + '/storage/v1/object/logos/' + user['id'] + '/' + filename, method='POST',
                          headers={'apikey': suite.public_key, 'Authorization': 'Bearer ' + user['token'],
                                   'Content-Type': 'image/png'},
                          data=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6ioAAAAASUVORK5CYII='))
        try:
            response = urlopen(request, timeout=20)
        except HTTPError as error:
            response = error
        with response:
            return response.status

    try:
        teacher, admin = suite.create_user('free'), suite.create_user('pro')
        aal1 = {**admin}
        suite.mfa(admin)
        status, _ = suite.call('PATCH', '/rest/v1/profiles?id=eq.' + admin['id'], {'role': 'admin'}, admin=True)
        suite.check('local: elevate only disposable administrator', status == 200)
        status, context = rpc(admin, 'admin_cc_context')
        suite.check('local: real aal2 administrator has write permissions', status == 200
                    and context.get('mfa') is True and 'credits.adjust' in context.get('permissions', []))
        before = suite.balance(teacher)
        payload = {'reason': 'Isolated native Supabase acceptance', 'delta': 5, 'expectedBalance': before}
        status, result = write(aal1, 'credits.adjust', teacher['id'], payload)
        suite.check('local: real aal1 token cannot write', status == 403 and result.get('message') == 'MFA_REQUIRED')
        request_id = str(uuid.uuid4())
        status, result = write(admin, 'credits.adjust', teacher['id'], payload, request_id)
        suite.check('local: real aal2 token can adjust credits', status == 200 and result.get('ok') is True)
        status, result = write(admin, 'credits.adjust', teacher['id'], payload, request_id)
        suite.check('local: admin replay has no duplicate credit', status == 200 and result.get('replayed') is True
                    and suite.balance(teacher) == before + 5)
        status, _ = suite.call('PATCH', '/rest/v1/profiles?id=eq.' + admin['id'], {'role': 'superadmin'}, user=admin)
        suite.check('local: administrator cannot promote self', status == 403)
        session_id = 'local-acceptance-' + str(uuid.uuid4())
        status, _ = suite.call('POST', '/rest/v1/sesiones', {
            'id': session_id, 'user_id': teacher['id'], 'titulo': 'Private synthetic document'}, user=teacher)
        suite.check('local: teacher saves own document', status == 201)
        status, rows = suite.call('GET', '/rest/v1/sesiones?select=id&id=eq.' + session_id, user=admin)
        suite.check('local: administrator cannot read teacher documents', status == 200 and rows == [])
        suite.check('local: active teacher can upload logo', upload(teacher, 'before.png') == 200)
        reserved = str(uuid.uuid4())
        suite.check('local: reserve before suspension', suite.reserve(teacher, reserved).get('ok'))
        status, result = write(admin, 'users.restrict', teacher['id'], {
            'reason': 'Isolated suspension acceptance', 'state': 'suspended', 'version': 0})
        suite.check('local: suspend through actual administrator RPC', status == 200 and result.get('ok'))
        status, active = rpc(teacher, 'account_is_active')
        suite.check('local: old JWT observes suspension immediately', status == 200 and active is False)
        status, rows = suite.call('GET', '/rest/v1/sesiones?select=id&id=eq.' + session_id, user=teacher)
        suite.check('local: suspension restricts document reads', status == 200 and rows == [])
        suite.check('local: suspension blocks authenticated Storage upload', upload(teacher, 'blocked.png') in (400, 401, 403))
        status, rows = suite.call('POST', '/storage/v1/object/list/logos', {'prefix': teacher['id']}, user=teacher)
        suite.check('local: suspension hides authenticated Storage listing', status == 200 and rows == [])
        suite.check('local: suspension blocks new reservations',
                    suite.reserve(teacher, str(uuid.uuid4())).get('code') == 'ACCOUNT_RESTRICTED')
        suite.check('local: refund remains possible while suspended', suite.refund(teacher, reserved).get('ok'))
        status, result = write(admin, 'users.restrict', teacher['id'], {
            'reason': 'Restore disposable teacher access', 'state': 'active', 'version': 1})
        suite.check('local: reactivate through actual administrator RPC', status == 200 and result.get('ok'))
        suite.check('local: reactivated account retains exact credits', suite.balance(teacher) == before + 5)
        suite.check('local: reactivation restores authenticated Storage upload', upload(teacher, 'after.png') == 200)
        status, audit = rpc(admin, 'admin_cc_read', {'p_resource': 'audit', 'p_query': {}})
        suite.check('local: administrative operations are audited', status == 200 and audit.get('total', 0) >= 3)
        quota_user = suite.create_user('free')
        daily_before = suite.balance(quota_user)
        for _ in range(3):
            request_id = str(uuid.uuid4())
            result = suite.accounting(quota_user, 'reserve_ai_credits', {
                'p_request_id': request_id, 'p_action': 'generate_session', 'p_provider': 'openai',
                'p_model': 'synthetic-local-acceptance'})
            suite.check('local: reserve five-credit synthetic request', result.get('ok'))
            result = suite.accounting(quota_user, 'complete_ai_usage', {
                'p_request_id': request_id, 'p_input_tokens': 0, 'p_output_tokens': 0,
                'p_provider_model': 'synthetic-local-acceptance', 'p_cost_usd': 0, 'p_latency_ms': 0})
            suite.check('local: complete synthetic usage without provider call', result.get('ok'))
        result = suite.accounting(quota_user, 'reserve_ai_credits', {
            'p_request_id': str(uuid.uuid4()), 'p_action': 'generate_session', 'p_provider': 'openai',
            'p_model': 'synthetic-local-acceptance'})
        suite.check('local: daily quota rejects fourth request without charge',
                    result.get('code') == 'DAILY_LIMIT_REACHED' and suite.balance(quota_user) == daily_before - 15)
        empty = suite.create_user('free')
        status, _ = suite.call('PATCH', '/rest/v1/credit_grants?user_id=eq.' + empty['id'],
                               {'remaining_credits': 0}, admin=True)
        suite.check('local: empty only disposable grants', status == 200)
        status, _ = suite.call('PATCH', '/rest/v1/ai_credit_wallets?user_id=eq.' + empty['id'],
                               {'balance': 0}, admin=True)
        suite.check('local: reconcile disposable zero wallet', status == 200)
        suite.check('local: insufficient credits rejected without negative wallet',
                    suite.reserve(empty, str(uuid.uuid4())).get('code') == 'INSUFFICIENT_CREDITS'
                    and suite.balance(empty) == 0)
    except Exception as error:
        suite.report['error_type'] = type(error).__name__
        raise
    finally:
        # Storage owns uploaded objects; remove only each fixture's known files
        # before deleting the associated Auth user.
        try:
            for user in suite.users:
                suite.call('DELETE', '/storage/v1/object/logos', {
                    'prefixes': [user['id'] + '/' + name for name in ('before.png', 'blocked.png', 'after.png')]}, admin=True)
        finally:
            suite.cleanup()


if __name__ == '__main__':
    main()
