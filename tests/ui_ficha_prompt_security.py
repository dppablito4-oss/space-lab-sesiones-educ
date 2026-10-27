"""Exercise external worksheet prompts in Chromium with hostile session fields."""
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
            page = browser.new_page()
            errors, requests = [], []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(f'http://127.0.0.1:{server.server_port}/robots.txt')
            page.set_content('<textarea id="input-ficha-prompt"></textarea>')
            page.add_script_tag(path=str(ROOT / 'js/sanitizer.js'))
            page.add_script_tag(path=str(ROOT / 'js/ficha-external-prompt.js'))
            page.on('request', lambda request: requests.append(request.url))
            for with_sanitizer in (True, False):
                result = page.evaluate('''withSanitizer => {
                    if (!withSanitizer) window.SpaceLabSanitizer = undefined;
                    window.fichaXss = 0;
                    const attack = '<img src="/ficha-security-trap" onerror="window.fichaXss++">'
                        + '<svg onload="window.fichaXss++"></svg>'
                        + '<iframe src="/ficha-frame-trap"></iframe>'
                        + '<script>window.fichaXss++</scr' + 'ipt>';
                    const session = {
                        metadata: {titulo: attack + '<b>Título seguro</b>', grado: '3.º', nivel: 'Secundaria'},
                        proposito: {competencia: attack + 'Resuelve problemas'},
                        enfoquesTransversales: [attack + 'Enfoque ambiental'],
                        fichaTrabajo: {
                            indicaciones: attack + 'Compara cantidades',
                            actividades: attack + '<p>Actividad segura</p>'
                        }
                    };
                    const direct = ExternalFichaPrompt.updateApartado(session);
                    ExternalFichaPrompt.showSuggestion(session);
                    const modal = document.getElementById('external-ficha-prompt-text').value;
                    session.fichaTrabajo.actividades = '';
                    session.momentos = {desarrollo: {procesos: [{contenido: {value: attack + 'Proceso seguro'}}]}};
                    const fallback = ExternalFichaPrompt.buildPrompt(session);
                    return {direct, modal, fallback};
                }''', with_sanitizer)
                # Allow detached image errors and SVG load events to be delivered.
                page.wait_for_timeout(250)
                assert page.evaluate('window.fichaXss') == 0
                assert not requests, requests
                assert result['direct'] == result['modal']
                assert 'Título seguro' in result['direct'] and 'Actividad segura' in result['direct']
                assert 'Proceso seguro' in result['fallback']
                assert '<img' not in result['direct'] and '<svg' not in result['direct']
                assert not errors, errors
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    print('ui_ficha_prompt_security.py: malicious fields, modal, activities and sanitizer fallback OK')


if __name__ == '__main__':
    run()
