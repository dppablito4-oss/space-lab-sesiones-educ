"""React/legacy integration in a real browser. Account and AI calls are mocked."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import sys
from threading import Thread
import zipfile

from docx import Document
import pymupdf
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def verify_exports(payload, browser):
    sys.path.insert(0, str(ROOT / 'backend'))
    import main
    from docx_builder_v1 import build_docx_from_v1

    model = main.SessionDocumentV1(**payload)
    stream = build_docx_from_v1(model)
    document = Document(stream)
    assert len(document.tables) >= 5
    stream.seek(0)
    with zipfile.ZipFile(stream) as archive:
        xml = archive.read('word/document.xml').decode()
        assert 'REACT-EXPORT-OK' in xml and '<m:f>' in xml
    compat = main.v1_to_legacy_pdf_payload(model, '')
    request = main.SesionAprendizajeRequest(**main.normalize_sesion_data(compat))
    page = browser.new_page()
    page.route('https://**/*', lambda route: route.abort())
    page.set_content(main.build_pdf_html_from_json(request), wait_until='networkidle')
    pdf = page.pdf(print_background=True, prefer_css_page_size=True)
    with pymupdf.open(stream=pdf, filetype='pdf') as result:
        text = ''.join(sheet.get_text() for sheet in result)
        assert 'REACT-EXPORT-OK' in text
    output = ROOT / 'artifacts/react-preview-qa'
    output.mkdir(parents=True, exist_ok=True)
    (output / 'react-generated.docx').write_bytes(stream.getvalue())
    (output / 'react-generated.pdf').write_bytes(pdf)
    page.close()


def run():
    parser = argparse.ArgumentParser(__doc__)
    parser.add_argument('--base-url')
    args = parser.parse_args()
    server = None
    if not args.base_url:
        build = ROOT / 'artifacts/react-preview-dist'
        assert (build / 'index.html').exists(), 'Run npm run build:react first'
        server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(build)))
        Thread(target=server.serve_forever, daemon=True).start()
        args.base_url = f'http://127.0.0.1:{server.server_port}/'
    fixture = json.loads((ROOT / 'tests/fixtures/inicial.v1.json').read_text(encoding='utf-8'))
    fixture['momentos']['desarrollo']['procesos'][0]['contenido']['value'] += r'<p>REACT-EXPORT-OK: $\frac{1}{2}$</p>'
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            for width in (360, 390, 768, 1440):
                context = browser.new_context(viewport={'width':width, 'height':900}, reduced_motion='reduce')
                page = context.new_page()
                errors = []
                page.on('pageerror', lambda error: errors.append(str(error)))
                page.goto(args.base_url, wait_until='domcontentloaded')
                page.locator('.sl-app').wait_for()
                assert page.locator('#session-form').count() == 1
                assert page.locator('.sl-main').evaluate('e => e.scrollWidth <= e.clientWidth')
                if width < 800:
                    page.get_by_role('button', name='Abrir navegación').click()
                    assert page.get_by_role('dialog', name='Navegación de Space Lab').is_visible()
                    page.keyboard.press('Escape')
                    assert not page.get_by_role('dialog', name='Navegación de Space Lab').is_visible()

                page.get_by_role('button', name='Continuar', exact=True).click()
                assert page.locator('.sl-notice').is_visible()
                page.get_by_role('button', name='Inicial', exact=True).click()
                page.locator('#react-grado').select_option('5 años')
                page.get_by_role('button', name='Primaria', exact=True).click()
                assert page.locator('#react-grado').input_value() == '5 años'
                page.get_by_role('button', name='Continuar', exact=True).click()
                assert page.locator('#react-grado').get_attribute('aria-invalid') == 'true'
                page.locator('#react-grado').select_option('2°')
                page.locator('#react-area').select_option('Matemática')
                page.locator('#react-titulo').fill('Contamos semillas en el aula')
                assert page.locator('#input-titulo').input_value() == 'Contamos semillas en el aula'
                page.get_by_role('button', name='Continuar', exact=True).focus()
                page.keyboard.press('Enter')
                assert page.locator('#react-step-heading').inner_text() == 'Define los aprendizajes'
                assert page.locator('#react-step-heading').evaluate('el => el === document.activeElement')
                page.locator('#react-activities').fill('Contamos semillas y comparamos cantidades')
                page.locator('#react-criteria').fill('Explica cómo contó las semillas')
                page.locator('#react-evidence').fill('Agrupación de semillas y explicación')
                page.get_by_role('button', name='Anterior', exact=True).click()
                assert page.locator('#react-titulo').input_value() == 'Contamos semillas en el aula'
                page.get_by_role('button', name='Continuar', exact=True).click()
                assert page.locator('#react-criteria').input_value() == 'Explica cómo contó las semillas'
                page.get_by_role('button', name='Continuar', exact=True).click()
                page.get_by_role('button', name='Material de referencia', exact=False).click()
                page.get_by_label('Adjuntar referencia').set_input_files({'name':'semillas.txt', 'mimeType':'text/plain', 'buffer':b'Contamos semillas'})
                page.locator('.sl-attached-file').get_by_text('semillas.txt', exact=True).wait_for()
                page.locator('#react-sourceInstruction').fill('Usa esta situación del aula')
                page.get_by_role('button', name='Modo avanzado', exact=True).click()
                assert page.locator('#session-mode-advanced').get_attribute('aria-pressed') == 'true'
                assert page.locator('#input-session-criteria').input_value() == 'Explica cómo contó las semillas'
                assert page.locator('#input-source-file').evaluate('el => el.files[0].name') == 'semillas.txt'
                page.get_by_role('button', name='Volver al nuevo generador').click()
                assert page.locator('.sl-app').is_visible()
                assert page.locator('#react-step-heading').inner_text() == 'Tu sesión está tomando forma'

                # A guest cannot reach the provider; the original Auth UI remains usable.
                page.evaluate('SupabaseClient.getCurrentUser = async () => null')
                page.get_by_role('button', name='Generar mi sesión').click()
                page.locator('#auth-modal').wait_for(state='visible')
                page.evaluate('AuthUi.closeModal()')
                page.evaluate('''fixture => {
                    SupabaseClient.getCurrentUser = async () => ({id:'react-teacher'});
                    SupabaseClient.getUserProfile = async () => null;
                    SupabaseClient.saveSessionCloud = async () => true;
                    SupabaseClient.invokeFunction = async () => ({qualities:['automatic','fast']});
                    window.__reactCalls=[];
                    window.__denyReact=true;
                    AiCopilot.generateSession = async input => {
                        window.__reactCalls.push(structuredClone(input));
                        if (window.__denyReact) throw new Error('Créditos insuficientes');
                        return structuredClone(fixture);
                    };
                    SessionValidator.validateGeneratedContent = () => ({valid:true,errors:[],warnings:[]});
                }''', fixture)
                page.get_by_role('button', name='Generar mi sesión').click()
                page.wait_for_function('window.__reactCalls.length === 1')
                page.wait_for_function('!SpaceLabReactBridge.getSnapshot().busy')
                assert page.locator('.sl-app').is_visible()
                assert 'Contamos semillas' in page.locator('.sl-review-title').inner_text()
                page.evaluate('window.__denyReact=false')
                page.get_by_role('button', name='Generar mi sesión').click()
                page.wait_for_function('window.getCurrentSession()?.schemaVersion === "1.0"')
                page.locator('.sl-return-bar').wait_for()
                sent = page.evaluate('window.__reactCalls.at(-1)')
                assert sent['nivel'] == 'PRIMARIA' and sent['grado'] == '2°'
                assert sent['criterio'] == 'Explica cómo contó las semillas'
                assert sent['sourceFile']['name'] == 'semillas.txt'
                assert sent['sourceInstruction'] == 'Usa esta situación del aula'
                assert sent['quickCurriculumReview'] is True
                payload = page.evaluate('SessionExport.buildCanonicalPayload(window.getCurrentSession())')
                assert 'authoringPreferences' not in payload
                assert page.evaluate('window.getCurrentSession().listaCotejo.alumnos.length') == 0
                assert page.evaluate('StorageManager.getAllSessions().length') >= 1
                if width == 1440:
                    verify_exports(payload, browser)

                page.reload(wait_until='domcontentloaded')
                page.locator('.sl-app').wait_for()
                assert page.locator('#react-titulo').input_value() == 'Contamos semillas en el aula'
                page.get_by_role('button', name='Continuar', exact=True).click()
                assert page.locator('#react-criteria').input_value() == 'Explica cómo contó las semillas'
                page.locator('#react-criteria').fill('Explica cómo contó las semillas y verifica el resultado')
                if width < 800:
                    page.get_by_role('button', name='Abrir navegación').click()
                page.get_by_role('button', name='Nueva sesión', exact=True).click()
                page.locator('#confirm-dialog').wait_for(state='visible')
                assert not page.get_by_role('dialog', name='Navegación de Space Lab').is_visible()
                page.locator('#confirm-cancel').click()
                assert page.locator('#react-criteria').input_value() == 'Explica cómo contó las semillas y verifica el resultado'
                assert page.evaluate('window.getCurrentSession() !== null')
                page.get_by_role('button', name='Ayuda del generador').click()
                assert page.get_by_role('dialog', name='De tu idea a tu próxima clase.').is_visible()
                page.keyboard.press('Escape')
                page.get_by_role('button', name='Usar tema oscuro').click()
                page.wait_for_function('document.documentElement.dataset.theme === "dark"')
                primary = page.get_by_role('button', name='Continuar', exact=True).bounding_box()
                assert primary['y'] >= 0 and primary['y'] + primary['height'] <= 900
                assert page.locator('.sl-main').evaluate('el => el.scrollWidth <= el.clientWidth')
                output=ROOT / 'tests/screenshots'
                output.mkdir(exist_ok=True)
                page.screenshot(path=str(output / f'react-session-{width}.png'))
                assert not errors, errors
                context.close()
            browser.close()
    finally:
        if server:
            server.shutdown()
            server.server_close()
    print('ui_react_session_smoke.py: OK (4 widths; auth/credits mocked; real DOCX/OMML/PDF)')


if __name__ == '__main__':
    run()
