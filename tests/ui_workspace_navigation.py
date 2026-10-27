"""Persistent React navigation, dashboard, draft continuity and responsive layout."""
import argparse
import json
from copy import deepcopy
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import expect, sync_playwright
from ui_account_recovery_smoke import SDK
from ui_session_lifecycle_smoke import SESSION

ROOT = Path(__file__).resolve().parents[1]
AUTHENTICATED_SDK = SDK + "window.__session={user:{id:'workspace-teacher',email:'workspace@example.test'}};localStorage.setItem('sb-koptglmifwpzrfzvipnm-auth-token',JSON.stringify(window.__session));"


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def run():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--comet', action='store_true')
    parser.add_argument('--headed', action='store_true')
    args = parser.parse_args()
    output = ROOT / 'artifacts/workspace-navigation'
    output.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
    Thread(target=server.serve_forever, daemon=True).start()
    report = {'browser': 'Comet' if args.comet else 'Chromium', 'account': 'isolated Auth fixture', 'checks': []}
    try:
        with sync_playwright() as pw:
            options = {'headless': not args.headed}
            if args.comet:
                options['executable_path'] = r'C:\Program Files\Perplexity\Comet\Application\comet.exe'
            browser = pw.chromium.launch(**options)
            for width in (390, 1024, 1440):
                context = browser.new_context(viewport={'width': width, 'height': 1000}, reduced_motion='no-preference')
                page = context.new_page()
                errors = []
                page.on('pageerror', lambda error, errors=errors: errors.append(str(error)))
                page.route('**/supabase-js@*', lambda route: route.fulfill(content_type='application/javascript', body=AUTHENTICATED_SDK))
                page.bring_to_front()
                page.goto(f'http://127.0.0.1:{server.server_port}/#/sessions/new', wait_until='domcontentloaded')
                page.wait_for_load_state('load')
                if args.comet:
                    # Finish Comet's first-tab initialization before editing a draft.
                    page.reload(wait_until='load')
                page.wait_for_function('window.SpaceLabFrontend?.ready && !!window.SpaceLabReactBridge?.isReady()')
                page.evaluate("__emitAuth('SIGNED_IN',{user:{id:'workspace-teacher',email:'workspace@example.test'}})")
                page.locator('#react-titulo').fill('Borrador que permanece al navegar')
                page.evaluate('window.persistentNavigation=document.querySelector(".workspace-navigation")')

                def navigate(label, page=page, width=width):
                    try:
                        if width <= 800:
                            page.get_by_role('button', name='Abrir navegación', exact=True).click()
                            nav = page.locator('.sl-mobile-drawer')
                        else:
                            nav = page.locator('.workspace-sidebar')
                        nav.get_by_role('button', name=label, exact=True).click()
                        expect(page.locator('.sl-mobile-drawer')).to_have_count(0)
                    except Exception:
                        page.screenshot(path=str(output / f'failure-{width}.png'), animations='disabled')
                        (output / f'failure-{width}.json').write_text(json.dumps(page.evaluate('''()=>({url:location.href,
                            state:SpaceLabReactBridge.getSnapshot(),drawers:document.querySelectorAll('.sl-mobile-drawer').length})''')), encoding='utf-8')
                        raise

                def check_layout(page=page):
                    assert page.evaluate('''()=>{
                        const view=document.querySelector('.sl-app')||document.querySelector('#home-view:not(.hidden)')||document.querySelector('#app-view:not(.hidden)');
                        const box=view.getBoundingClientRect();
                        const sidebar=document.querySelector('.workspace-sidebar').getBoundingClientRect();
                        return box.right<=innerWidth+1 && box.left>=-1 && (innerWidth<=800 || box.left>=sidebar.right-1);
                    }''')
                    assert page.evaluate('persistentNavigation===document.querySelector(".workspace-navigation")')

                navigate('Mi espacio')
                expect(page.locator('#home-view')).to_be_visible()
                check_layout()
                assert page.locator('#home-main').evaluate('e=>e.scrollWidth<=e.clientWidth')
                assert page.evaluate('document.querySelector(".home-welcome-copy").getAnimations().length>0')
                page.screenshot(path=str(output / f'{report["browser"]}-home-{width}.png'), animations='disabled')
                if width > 800:
                    page.get_by_role('button', name='Contraer barra lateral').click()
                    page.wait_for_function('document.querySelector(".workspace-sidebar").getBoundingClientRect().width<80')
                    check_layout()
                    expect(page.locator('.workspace-sidebar').get_by_role('button', name='Mi espacio', exact=True)).to_have_attribute('aria-current', 'page')
                navigate('Crear sesión')
                expect(page.locator('.sl-main')).to_be_visible()
                expect(page.locator('#react-titulo')).to_have_value('Borrador que permanece al navegar')
                check_layout()
                navigate('Mi biblioteca')
                expect(page.locator('#home-sessions-section')).to_be_in_viewport()
                assert page.evaluate('location.hash') == '#/sessions'
                check_layout()
                if width > 800:
                    page.get_by_role('button', name='Expandir barra lateral').click()
                navigate('Unidades y experiencias')
                expect(page.locator('.sl-planning-surface #planning-dialog[open]')).to_be_visible()
                check_layout()
                navigate('Mi espacio')
                expect(page.locator('#home-view')).to_be_visible()
                fixture = deepcopy(SESSION)
                fixture['id'] = 'workspace-navigation-document'
                fixture['metadata']['titulo'] = 'Documento conservado'
                page.evaluate('session=>{StorageManager.saveSession(session);appOpenSession(session.id);SpaceLabReactBridge.showLegacy("document");}', fixture)
                expect(page.locator('#app-view')).to_be_visible()
                check_layout()
                assert page.evaluate('''()=>Math.abs(document.querySelector('#workflow-rail').getBoundingClientRect().left
                    - document.querySelector('#app-view').getBoundingClientRect().left)<1'''), 'The editor tools must stay beside the shared navigation'
                page.screenshot(path=str(output / f'{report["browser"]}-editor-{width}.png'), animations='disabled')
                page.locator('#session-sheet').evaluate('e=>e.dataset.retained="yes"')
                navigate('Mi espacio')
                expect(page.locator('#home-view')).to_be_visible()
                assert page.evaluate('getCurrentSession().id') == fixture['id']
                assert page.locator('#session-sheet').get_attribute('data-retained') == 'yes'
                page.evaluate("SpaceLabTheme.setPreference('dark')")
                page.screenshot(path=str(output / f'{report["browser"]}-home-dark-{width}.png'), animations='disabled')
                page.reload(wait_until='load')
                page.wait_for_function('window.SpaceLabFrontend?.ready && !!window.SpaceLabReactBridge?.isReady()')
                expect(page.locator('#home-view')).to_be_visible()
                expect(page.locator('.workspace-navigation')).not_to_have_attribute('hidden', '')
                expect(page.locator('.workspace-mobile-trigger' if width <= 800 else '.workspace-sidebar')).to_be_visible()
                expect(page.locator('#home-session-list')).to_contain_text('Documento conservado')
                page.emulate_media(reduced_motion='reduce')
                page.evaluate('LandingRouter.showHome(false)')
                assert page.locator('.home-welcome-copy').evaluate('e=>e.getAnimations().length') == 0
                page.evaluate('LandingRouter.showLanding(true)')
                expect(page.locator('.workspace-navigation')).to_have_attribute('hidden', '')
                expect(page.locator('#landing-view')).to_be_visible()
                assert page.evaluate('SpaceLabFrontend.failures.length') == 0
                assert not errors, errors
                report['checks'].append({'width': width, 'persistent_navigation': True, 'collapse_or_drawer': True,
                                         'home_library_planning_editor': True, 'draft_preserved': True,
                                         'motion_and_reduced_motion': True, 'light_dark': True, 'layout': True})
                context.close()
            browser.close()
        report['ok'] = True
    finally:
        server.shutdown()
        server.server_close()
        (output / ('comet.json' if args.comet else 'chromium.json')).write_text(json.dumps(report, indent=2), encoding='utf-8')
    print('ui_workspace_navigation.py: persistent navigation, responsive dashboard, drafts, themes and motion OK')


if __name__ == '__main__':
    run()
