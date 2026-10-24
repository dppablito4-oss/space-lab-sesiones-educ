"""Entry, usable viewport, step scroll, attachments and real reload regression."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def run():
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
    Thread(target=server.serve_forever, daemon=True).start()
    fixture = json.loads((ROOT / 'tests/fixtures/inicial.v1.json').read_text(encoding='utf-8'))
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            for width in (360, 390, 768, 1440):
                context = browser.new_context(viewport={'width': width, 'height': 844}, reduced_motion='reduce')
                page = context.new_page()
                errors = []
                page.on('pageerror', lambda error: errors.append(str(error)))
                url = f'http://127.0.0.1:{server.server_port}/index.html#/app'
                page.goto(url, wait_until='domcontentloaded')
                page.wait_for_function('typeof window.appStartNewSession === "function"')
                page.evaluate('window.appStartNewSession()')
                page.locator('#quick-title-1').wait_for(state='visible')
                assert page.locator('#quick-title-1').evaluate('el => el === document.activeElement')
                assert page.locator('#session-mode-quick').get_attribute('aria-pressed') == 'true'
                if width < 600:
                    assert page.locator('#sidebar').bounding_box()['width'] >= width - 18
                layout = page.evaluate('''() => ({form:document.getElementById('session-form').getBoundingClientRect().right,
                    sidebar:document.getElementById('sidebar').getBoundingClientRect().right})''')
                assert layout['form'] >= layout['sidebar'] - 2, 'Unused summary column in quick mode'

                page.locator('#input-nivel').select_option('INICIAL')
                page.locator('#input-grado').select_option('5 años')
                page.locator('#input-area').select_option('Matemática')
                page.locator('#input-titulo').fill('Contamos semillas')
                page.locator('#input-duracion').fill('45 min')
                page.locator('#quick-next').click()
                page.locator('#input-session-criteria').fill('Explica cómo contó')
                page.locator('#input-session-evidence').fill('Agrupación de semillas')
                page.locator('#session-form').evaluate('el => el.scrollTop = el.scrollHeight')
                page.locator('#quick-next').click()
                assert page.locator('#session-form').evaluate('el => el.scrollTop') == 0
                assert 0 <= page.locator('#quick-title-3').bounding_box()['y'] < 844
                button = page.locator('#btn-generate').bounding_box()
                assert button['y'] >= 0 and button['y'] + button['height'] <= 844
                assert 'Sin alumnos registrados' in page.locator('#quick-warnings').inner_text()
                page.locator('#quick-back').focus()
                page.keyboard.press('Enter')
                assert page.locator('#quick-title-2').evaluate('el => el === document.activeElement')
                assert page.locator('#input-session-criteria').input_value() == 'Explica cómo contó'

                page.locator('#session-mode-advanced').click()
                assert page.locator('label[for="input-grado"]').inner_text() == 'Grado'
                page.locator('.sidebar-tab[data-tab="tab-ai"]').click()
                page.locator('#input-source-file').set_input_files({'name':'referencia.txt','mimeType':'text/plain','buffer':b'Semillas del aula'})
                page.wait_for_function("document.querySelector('#source-file-info').textContent.includes('referencia.txt')")
                page.locator('#session-mode-quick').click()
                page.locator('#session-mode-advanced').click()
                assert page.locator('#input-source-file').evaluate('el => el.files[0].name') == 'referencia.txt'

                # Persist a canonical document with editor preferences, then reload the browser.
                page.evaluate('''fixture => {
                    const session = {...fixture, id:'quick-reload', template:'estandar',
                        authoringPreferences:{criteria:'Explica cómo contó', evidence:'Agrupación de semillas', activities:'Cuenta semillas'}};
                    session.htmlContent = Templates.render('estandar', session, false);
                    StorageManager.saveSession(session);
                    appOpenSession(session.id);
                }''', fixture)
                page.reload(wait_until='domcontentloaded')
                page.wait_for_function('window.getCurrentSession?.()?.id === "quick-reload"')
                page.locator('.sidebar-tab[data-tab="tab-general"]').click()
                page.locator('#session-mode-quick').click()
                assert page.locator('#input-session-criteria').input_value() == 'Explica cómo contó'
                assert page.locator('#input-session-evidence').input_value() == 'Agrupación de semillas'
                assert page.locator('#input-session-activities').input_value() == 'Cuenta semillas'

                # Starting a different session clears the previous attachment and proposals.
                page.locator('#session-mode-advanced').click()
                page.locator('.sidebar-tab[data-tab="tab-ai"]').click()
                page.locator('#input-source-file').set_input_files({'name':'old.txt','mimeType':'text/plain','buffer':b'Old session'})
                page.wait_for_function("document.querySelector('#source-file-info').textContent.includes('old.txt')")
                page.evaluate('''() => {
                    history.replaceState(null, '', '#/sessions/new');
                    window.__newSessionResult = null;
                    window.appStartNewSession().then(r => window.__newSessionResult = r);
                }''')
                # Unsaved current documents must be protected by the existing confirmation.
                page.locator('#confirm-dialog').wait_for(state='visible')
                page.locator('#confirm-cancel').click()
                page.wait_for_function('window.__newSessionResult === false')
                assert page.evaluate('window.getCurrentSession().id') == 'quick-reload'
                assert page.evaluate('location.hash') == '#/sessions/quick-reload/edit'
                page.evaluate('() => { window.appStartNewSession(); }')
                page.locator('#confirm-accept').click()
                page.wait_for_function('window.getCurrentSession() === null')
                page.locator('#input-area').select_option('Matemática')
                page.locator('#input-grado').select_option('2°')
                page.locator('#input-titulo').fill('Otra sesión')
                page.locator('#input-duracion').fill('90 min')
                page.locator('[data-quick-step="3"]').click()
                page.locator('#quick-ai-options').evaluate('el => el.parentElement.open = true')
                assert page.locator('#source-file-info').is_hidden()
                assert page.locator('#input-source-file').evaluate('el => el.files.length') == 0
                assert page.locator('#input-session-criteria').input_value() == ''
                page.locator('#session-form').evaluate('el => el.scrollTop = 0')
                (ROOT / 'tests/screenshots').mkdir(exist_ok=True)
                page.screenshot(path=str(ROOT / f'tests/screenshots/quick-layout-{width}.png'))
                assert not errors, errors
                context.close()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    print('ui_quick_session_layout_smoke.py: OK (no AI calls)')


if __name__ == '__main__':
    run()
