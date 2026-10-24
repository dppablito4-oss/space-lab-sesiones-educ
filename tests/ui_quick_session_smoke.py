"""Real browser coverage; AI/account responses are mocked, no credits are spent."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
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
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            page = browser.new_page(viewport={'width':1440, 'height':1000}, reduced_motion='reduce')
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(f'http://127.0.0.1:{server.server_port}/index.html', wait_until='domcontentloaded')
            page.evaluate('''async () => {
                window.__user = {id:'quick-teacher'};
                SupabaseClient.getCurrentUser = async () => window.__user;
                SupabaseClient.getUserProfile = async () => null;
                SupabaseClient.saveSessionCloud = async () => true;
                SupabaseClient.invokeFunction = async (_name, body) => {
                    if (body.action === 'capabilities') return {qualities:['automatic','fast']};
                    throw new Error('Unexpected remote call');
                };
                window.__fixture = await (await fetch('tests/fixtures/inicial.v1.json')).json();
                window.__calls = [];
                window.__generated = 0;
                window.addEventListener('spacelab:session-generated', () => { window.__generated += 1; });
                AiCopilot.generateSession = async input => {
                    window.__calls.push(structuredClone(input));
                    if (window.__deny) throw new Error('Créditos insuficientes');
                    return structuredClone(window.__fixture);
                };
                SessionValidator.validateGeneratedContent = () => ({valid:true,errors:[],warnings:[]});
                window.__originalLevelNode = document.getElementById('input-nivel');
                LandingRouter.showHome(false);
                document.querySelector('[data-home-action="new-session"]').click();
            }''')
            page.wait_for_function("document.body.classList.contains('session-quick-mode')")
            assert page.locator('#quick-title-1').is_visible()
            page.locator('#quick-next').click()
            assert page.locator('#quick-errors').is_visible()
            page.locator('#input-nivel').select_option('INICIAL')
            page.locator('#input-grado').select_option('5 años')
            page.locator('#input-area').select_option('Matemática')
            page.locator('#input-titulo').fill('Contamos semillas')
            page.locator('#input-duracion').fill('45 min')
            # Native buttons work from keyboard, and focus follows the heading.
            page.locator('#quick-next').focus()
            page.keyboard.press('Enter')
            assert page.locator('#quick-title-2').evaluate('el => el === document.activeElement')
            page.wait_for_function("document.querySelector('#quick-curriculum-status').textContent.includes('no disponible')")
            assert page.locator('#curriculum-picker input[type=checkbox]').count() == 0
            page.locator('#input-session-activities').fill('Clasifican y cuentan semillas')
            page.locator('#input-session-criteria').fill('Explica cómo contó las semillas')
            page.locator('#input-session-evidence').fill('Agrupación de semillas y explicación oral')
            page.locator('#quick-back').click()
            assert page.locator('#input-titulo').input_value() == 'Contamos semillas'
            # Changes across levels preserve old values but cannot pass validation.
            page.locator('#input-nivel').select_option('PRIMARIA')
            page.locator('#quick-next').click()
            assert page.locator('#input-grado').get_attribute('aria-invalid') == 'true'
            page.locator('#input-grado').select_option('2°')
            page.locator('#quick-next').click()
            assert page.locator('#input-session-activities').input_value() == 'Clasifican y cuentan semillas'
            # Repeated toggles retain DOM identity, proposals, files and configuration.
            page.locator('#session-mode-advanced').click()
            assert page.locator('label[for="input-grado"]').inner_text() == 'Grado'
            page.locator('.sidebar-tab[data-tab="tab-ai"]').click()
            page.locator('#input-source-file').set_input_files({'name':'referencia.txt','mimeType':'text/plain','buffer':b'Contar semillas del aula'})
            page.wait_for_function("document.querySelector('#source-file-info').textContent.includes('referencia.txt')")
            page.locator('#select-methodology').select_option('cooperativo')
            for _ in range(2):
                page.locator('#session-mode-quick').click()
                page.locator('#session-mode-advanced').click()
            assert page.evaluate("document.querySelector('#input-nivel') === window.__originalLevelNode")
            assert page.locator('#select-methodology').input_value() == 'cooperativo'
            page.locator('#session-mode-quick').click()
            page.locator('[data-quick-step="3"]').click()
            assert 'Explica cómo' in page.locator('#quick-review').inner_text()
            assert page.locator('#textarea-alumnos').input_value() == ''
            assert page.locator('#btn-generate').is_visible()
            # Auth rejection never reaches the AI call.
            page.evaluate('window.__user = null; AuthUi.openRegister = () => {}')
            page.locator('#btn-generate').click()
            assert page.evaluate('window.__calls.length') == 0
            # Gateway/credit error leaves the teacher inputs intact.
            page.evaluate("window.__user = {id:'quick-teacher'}; window.__deny = true")
            page.locator('#btn-generate').click()
            page.wait_for_function('window.__calls.length === 1')
            assert page.evaluate('window.getCurrentSession()') is None
            assert page.locator('#input-session-criteria').input_value() == 'Explica cómo contó las semillas'
            page.evaluate('window.__deny = false')
            page.locator('#btn-generate').click()
            page.wait_for_function('window.__generated === 1')
            result = page.evaluate('window.getCurrentSession()')
            request = page.evaluate('window.__calls.at(-1)')
            assert request['nivel'] == 'PRIMARIA' and request['grado'] == '2°'
            assert request['sourceFile']['name'] == 'referencia.txt'
            assert request['criterio'] == 'Explica cómo contó las semillas'
            assert request['actividades_sugeridas'] == 'Clasifican y cuentan semillas'
            assert request['quickCurriculumReview'] is True
            assert page.locator('#select-ai-provider option[value="max_quality"]').is_disabled()
            assert page.locator('#select-ai-provider option[value="balanced"]').is_disabled()
            assert result['schemaVersion'] == '1.0'
            assert result['listaCotejo']['alumnos'] == []
            assert result['authoringPreferences']['evidence'] == 'Agrupación de semillas y explicación oral'
            page.evaluate("StorageManager.setCurrentSession(null); window.appOpenSession(window.getCurrentSession().id)")
            assert page.locator('#input-session-criteria').input_value() == 'Explica cómo contó las semillas'
            # Canonical export intentionally excludes editor-only preferences.
            assert page.evaluate("'authoringPreferences' in SessionExport.buildCanonicalPayload(window.getCurrentSession())") is False
            page.locator('#external-ficha-prompt-modal .external-ficha-close').click()
            page.locator('#quick-open-planner').click()
            # Verified secondary catalog, and stale async responses cannot leak another scope.
            page.locator('[data-quick-step="1"]').click()
            page.locator('#input-nivel').select_option('SECUNDARIA')
            page.locator('#input-grado').select_option('2°')
            page.locator('#quick-next').click()
            page.wait_for_selector('#curriculum-competency-0')
            page.locator('#curriculum-competency-0').check()
            page.locator('#curriculum-capacity-0-0').check()
            page.locator('#quick-next').click()
            assert 'Transcribe' not in page.locator('#quick-official-performances').inner_text()
            assert 'minedu-secondary-curriculum-2016' in page.locator('#quick-official-performances').inner_text()
            (ROOT / 'tests/screenshots').mkdir(exist_ok=True)
            page.wait_for_function("document.querySelectorAll('#toast-container .toast').length === 0")
            page.screenshot(path=str(ROOT / 'tests/screenshots/quick-session-desktop.png'))
            for width in (390, 768):
                page.set_viewport_size({'width':width,'height':844})
                assert page.locator('#quick-session').is_visible()
                assert page.locator('#quick-session').evaluate('el => el.scrollWidth <= el.clientWidth + 1')
                page.screenshot(path=str(ROOT / f'tests/screenshots/quick-session-{width}.png'))
                page.locator('#quick-back').focus()
                page.keyboard.press('Enter')
                assert page.locator('#quick-title-2').evaluate('el => el === document.activeElement')
                page.locator('#quick-next').click()
            page.locator('[data-quick-step="1"]').click()
            page.locator('#input-nivel').select_option('INICIAL')
            page.locator('#input-grado').select_option('5 años')
            page.locator('#input-titulo').fill('Contamos en Inicial de 5 años')
            page.locator('[data-quick-step="3"]').click()
            page.locator('#btn-generate').evaluate('button => { button.click(); button.click(); }')
            page.wait_for_function('window.__generated === 2')
            assert page.evaluate('window.__calls.length') == 3
            assert page.evaluate('window.getCurrentSession().metadata.nivel') == 'INICIAL'
            assert page.evaluate('window.getCurrentSession().metadata.grado') == '5 años'
            assert not errors, errors
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    print('ui_quick_session_smoke.py: OK (mocked AI; no live credits spent)')


if __name__ == '__main__':
    run()
