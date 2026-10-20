"""Exercise the real generation controller/quality gate for standalone and linked lessons."""
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
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            page = browser.new_page(viewport={'width': 1280, 'height': 900})
            page.on('dialog', lambda dialog: dialog.accept())
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(f'http://127.0.0.1:{server.server_port}/', wait_until='domcontentloaded')
            page.evaluate('''async () => {
                SupabaseClient.getCurrentUser = async () => ({id:'structure-teacher'});
                SupabaseClient.getUserProfile = async () => null;
                SupabaseClient.getPlanningRecordsCloud = async () => [];
                SupabaseClient.savePlanningRecordCloud = async () => true;
                SupabaseClient.saveSessionCloud = async () => true;
                ConfirmDialog.show = async () => true;
                window.__structureFixture = await (await fetch('tests/fixtures/secundaria-matematica-polya.v1.json')).json();
                delete window.__structureFixture.proposito.desempeno;
                for (const moment of Object.values(window.__structureFixture.momentos)) {
                    for (const process of moment.procesos) process.contenido.value += '<p>Los estudiantes registran sus estrategias en la ficha y contrastan su respuesta con los criterios de evaluación del aula.</p>';
                }
                window.__structureCalls = 0;
                AiCopilot.generateSession = async () => {
                    window.__structureCalls += 1;
                    return structuredClone(window.__structureFixture);
                };
                const plan = await (await fetch('data/pedagogy/fixtures/secondary_math_project_unit.v2.json')).json();
                const repository = PlanningRepository.create({validator:PlanningContainerV2});
                for (const type of ['unit','learning_experience']) {
                    const copy = structuredClone(plan);
                    copy.id = 'structure-' + type.replaceAll('_', '-');
                    copy.identity.planningType = type;
                    repository.save(copy);
                }
            }''')

            for index, kind in enumerate(['individual', 'unit', 'learning_experience'], 1):
                if kind == 'individual':
                    page.evaluate('window.appStartNewSession()')
                    page.locator('#input-area').select_option('Matemática', force=True)
                    page.locator('#select-methodology').select_option('polya', force=True)
                else:
                    page.evaluate('(kind) => window.appStartLinkedSession("structure-" + kind.replaceAll("_", "-"), "session-02")', kind)
                page.evaluate('''() => {
                    LandingRouter.showApp(false);
                    document.querySelector('#external-ficha-prompt-modal')?.classList.add('hidden');
                    document.querySelector('#input-duracion').value = '90 min';
                    document.querySelector('#input-desempeno').value = 'Explica y verifica el resultado de la situación seleccionada.';
                }''')
                page.locator('#btn-generate').evaluate('button => button.click()')
                page.wait_for_function("window.getCurrentSession()?.schemaVersion === '1.0'")
                result = page.evaluate('''() => {
                    const session = window.getCurrentSession();
                    return {session, headings: Array.from(document.querySelectorAll('#session-sheet .momento-subsection-title')).map(node => node.textContent.trim()),
                        method:document.querySelector('#select-methodology').value, calls:window.__structureCalls,
                        payload:SessionExport.buildCanonicalPayload(session)};
                }''')
                assert result['calls'] == index, 'La sesión completa debe superar el validador real en un intento'
                assert result['session']['proposito']['desempeno'] == 'Explica y verifica el resultado de la situación seleccionada.'
                assert result['headings'][:4] == ['Motivación', 'Saberes previos', 'Problematización', 'Propósito y organización']
                assert 'Familiarización con el problema' in result['headings']
                assert result['payload']['momentos'] == result['session']['momentos']
                assert bool(result['session'].get('planning')) == (kind != 'individual')
                assert result['session']['metadata']['methodology'] == result['method']
                page.locator('#btn-save').evaluate('button => button.click()')
                session_id = result['session']['id']
                page.wait_for_function('id => Boolean(StorageManager.getSession(id))', arg=session_id)
                page.evaluate('id => window.appOpenSession(id)', session_id)
                assert page.locator('#select-methodology').input_value() == result['method']
            assert not errors, errors
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    print('ui_session_structure_smoke.py: OK (individual, unidad y experiencia; validador y guardado reales)')


if __name__ == '__main__':
    run()
