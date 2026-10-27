"""Full React surface hydration, dynamic regions, pairing and optional live Comet login.

Default uses isolated Auth fixtures. --live-account creates/deletes a disposable
Supabase account; it sends no emails and makes no paid AI calls.
"""
import argparse
import json
import sys
from copy import deepcopy
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import expect, sync_playwright
from ui_account_recovery_smoke import SDK
from ui_session_lifecycle_smoke import SESSION

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def run():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--comet', action='store_true')
    parser.add_argument('--headed', action='store_true')
    parser.add_argument('--live-account', action='store_true')
    args = parser.parse_args()
    output = ROOT / 'artifacts/react-migration'
    output.mkdir(parents=True, exist_ok=True)
    suite = user = None
    if args.live_account:
        sys.path.insert(0, str(ROOT / 'scripts'))
        from beta_acceptance_remote import Acceptance
        suite = Acceptance(output / 'comet-live-account.json')
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
    Thread(target=server.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{server.server_port}'
    report = {'browser': 'Comet' if args.comet else 'Chromium', 'checks': [], 'paid_ai_calls': 0}
    try:
        if suite:
            user = suite.create_user('free')
            status, _ = suite.call('PATCH', '/rest/v1/profiles?id=eq.' + user['id'], {'docente': 'Docente React'}, admin=True)
            suite.check('Comet: disposable display name configured', status == 200)
        with sync_playwright() as pw:
            options = {'headless': not args.headed}
            if args.comet:
                executable = Path(r'C:\Program Files\Perplexity\Comet\Application\comet.exe')
                if not executable.is_file():
                    raise RuntimeError('Comet executable is unavailable')
                options['executable_path'] = str(executable)
            browser = pw.chromium.launch(**options)
            for width in (390, 1440):
                context = browser.new_context(viewport={'width': width, 'height': 1000}, reduced_motion='reduce')
                page = context.new_page()
                errors = []
                page.on('pageerror', lambda error, errors=errors: errors.append(str(error)))
                if not suite:
                    page.route('**/supabase-js@*', lambda route: route.fulfill(content_type='application/javascript', body=SDK))
                page.goto(base + '/index.html#/landing', wait_until='domcontentloaded')
                page.wait_for_function('window.SpaceLabFrontend?.ready && typeof window.appOpenSession === "function"')
                assert page.evaluate('SpaceLabFrontend.hydrated && SpaceLabFrontend.failures.length === 0')
                assert page.locator('#frontend-root').count() == 1
                assert page.locator('#session-form').count() == 1
                assert page.locator('#landing-view').is_visible()
                page.screenshot(path=str(output / f'{report["browser"]}-landing-{width}.png'))
                page.locator('[data-action="open-login"]').first.click()
                expect(page.locator('#auth-modal')).to_be_visible()
                if user:
                    page.locator('#auth-email').fill(user['email'])
                    page.locator('#auth-password').fill(user['password'])
                    page.locator('#btn-submit-auth').click()
                    page.wait_for_function('expected => SupabaseClient.getSessionUserSync()?.id === expected', arg=user['id'])
                    page.wait_for_function('document.getElementById("auth-modal").classList.contains("hidden")')
                else:
                    page.locator('#btn-close-auth').click()
                    page.evaluate("__emitAuth('SIGNED_IN',{user:{id:'react-surface-account',email:'surface@example.test'}})")
                fixture = deepcopy(SESSION)
                fixture['id'] = 'react-surface-live' if suite else 'react-surface-fixture'
                fixture['metadata']['titulo'] = '<img src=x onerror="window.surfaceXss=true">Sesión React'
                page.evaluate('''session => {
                    StorageManager.saveSession(session);
                    window.LandingRouter.showHome(true);
                }''', fixture)
                if user:
                    page.wait_for_function('async id => (await SupabaseClient.getSessionsCloud()).some(row => row.id === id)', arg=fixture['id'])
                    expect(page.locator('#home-credit-count')).to_have_text(str(suite.balance(user)))
                expect(page.locator('#home-session-list')).to_contain_text(fixture['metadata']['titulo'])
                assert page.locator('#home-session-list img').count() == 0
                page.evaluate('''()=>Toast.error('<img src=x onerror="window.surfaceXss=true">Aviso seguro')''')
                expect(page.locator('.toast-msg').last).to_contain_text('<img src=x')
                assert page.locator('#toast-container img').count() == 0
                assert page.evaluate('window.surfaceXss !== true')
                assert page.locator('#home-view').evaluate('element=>element.getAnimations().length') == 0
                page.screenshot(path=str(output / f'{report["browser"]}-home-{width}.png'))
                page.locator(f'#home-session-list [data-session-id="{fixture["id"]}"]').click()
                page.wait_for_function('expected => getCurrentSession()?.id === expected', arg=fixture['id'])
                assert page.locator('#session-sheet').inner_text()
                page.screenshot(path=str(output / f'{report["browser"]}-editor-{width}.png'))
                page.evaluate('''()=>{
                    LandingRouter.showLanding(true);
                    LandingRouter.showHome(true);
                }''')
                expect(page.locator('#home-session-list')).to_contain_text('Sesión React')
                assert page.locator('#session-form').count() == 1
                assert page.evaluate('SpaceLabFrontend.failures.length === 0')
                assert not errors, errors
                report['checks'].append({'width': width, 'hydration': True, 'account': 'real' if user else 'fixture',
                                         'home': True, 'document': True, 'safe_dynamic_text': True, 'reduced_motion': True})
                context.close()

            if not suite:
                context = browser.new_context(reduced_motion='no-preference')
                early = context.new_page()
                held = []
                early.route('**/supabase-js@*', lambda route: held.append(route))
                early.goto(base + '/index.html#/landing', wait_until='domcontentloaded')
                early.wait_for_function('window.SpaceLabFrontend?.hydrated')
                early.locator('[data-action="open-login"]').first.click()
                assert held, 'The SDK must still be loading for the early-click regression'
                for route in held:
                    route.fulfill(content_type='application/javascript', body=SDK)
                early.wait_for_function('window.SpaceLabFrontend?.ready')
                expect(early.locator('#auth-modal')).to_be_visible()
                early.locator('#btn-close-auth').click()
                animated = early.evaluate('''() => {
                    LandingRouter.showHome(true);
                    return document.getElementById('home-main').getAnimations().length > 0;
                }''')
                assert animated, 'Normal motion must animate the route transition'
                report['startup'] = {'early_click_preserved': True, 'route_animation': True}
                context.close()

            context = browser.new_context()
            page = context.new_page()
            page.goto(base + '/descargas_landing.html')
            expect(page.locator('#standalone-root[data-page="Downloads"]')).to_be_visible()
            assert 'v1.4.5' in page.locator('.version').inner_text()
            assert '/releases/download/v1.4.5/' in page.locator('.btn-download').get_attribute('href')
            page.goto(base + '/conexion.html')
            expect(page.locator('#status-message')).to_contain_text('Falta el token')
            expect(page.locator('#btn-connect')).to_be_disabled()
            page.route('http://127.0.0.1:8000/verificar-token?*', lambda route: route.fulfill(
                status=401 if 'expired-test-token' in route.request.url else 200,
                content_type='application/json', body='{"status":"Connected"}'))
            page.goto(base + '/conexion.html?token=expired-test-token')
            page.locator('#btn-connect').click()
            expect(page.locator('#status-message')).to_contain_text('vencido')
            assert page.evaluate('localStorage.getItem("backend_connected")') is None
            page.goto(base + '/conexion.html?token=synthetic-react-pairing-token')
            page.locator('#btn-connect').click()
            expect(page.locator('#title')).to_have_text('Motor Enlazado')
            assert page.evaluate('localStorage.getItem("connection_token")') == 'synthetic-react-pairing-token'
            context.close()
            report['standalone'] = {'downloads': True, 'missing_token': True, 'expired_token': True, 'pairing': 'isolated HTTP fixture'}
            browser.close()
        if suite:
            suite.check('Comet: actual UI sign-in, cloud storage and React surfaces', True)
        report['ok'] = True
    finally:
        server.shutdown()
        server.server_close()
        if suite:
            suite.cleanup()
        (output / ('comet-report.json' if args.comet else 'surfaces-report.json')).write_text(
            json.dumps(report, indent=2), encoding='utf-8')
    print('ui_full_react_smoke.py: complete surfaces, dynamic text, pairing and browser ' + report['browser'] + ' OK')


if __name__ == '__main__':
    run()
