"""Reviewed planning to existing AI session generator and storage integration."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PLANNING_FIXTURE = 'data/pedagogy/fixtures/secondary_math_project_unit.v2.json'
SESSION_FIXTURE = 'tests/fixtures/secundaria-matematica-polya.v1.json'


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def run():
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT)))
    Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1280, "height": 900})
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(f"http://127.0.0.1:{server.server_port}/index.html", wait_until='domcontentloaded')
            page.evaluate("""() => {
                window.SupabaseClient.getCurrentUser = async () => ({ id: 'linked-teacher' });
                window.SupabaseClient.getUserProfile = async () => null;
                window.SupabaseClient.getPlanningRecordsCloud = async () => [];
                window.SupabaseClient.savePlanningRecordCloud = async () => true;
                window.SupabaseClient.saveSessionCloud = async () => true;
            }""")
            page.evaluate("""async ({ planningUrl, sessionUrl }) => {
                const fixture = await (await fetch(planningUrl)).json();
                const draft = structuredClone(fixture);
                draft.id = 'plan-draft-blocked';
                draft.status = 'draft';
                const repository = window.PlanningRepository.create({ validator: window.PlanningContainerV2 });
                repository.save(fixture);
                repository.save(draft);
                window.__linkedSessionFixture = await (await fetch(sessionUrl)).json();
                SessionValidator.validateGeneratedContent = () => ({ valid: true, errors: [], warnings: [] });
                window.AiCopilot.generateSession = async metadata => {
                    window.__linkedGenerationInput = structuredClone(metadata);
                    return structuredClone(window.__linkedSessionFixture);
                };
            }""", {"planningUrl": PLANNING_FIXTURE, "sessionUrl": SESSION_FIXTURE})

            blocked = page.evaluate("""async () => {
                try {
                    await window.appStartLinkedSession('plan-draft-blocked', 'session-01');
                    return '';
                } catch (error) {
                    return error.message;
                }
            }""")
            assert 'revisada' in blocked

            page.evaluate("window.appStartLinkedSession('plan-secondary-math-finance-001', 'session-02')")
            page.evaluate('window.LandingRouter.showApp(false)')
            assert page.locator('#input-titulo').input_value() == 'Comparamos el costo real'
            assert page.locator('#input-area').input_value() == 'Matemática'
            assert page.locator('#input-numero-sesion').input_value() == '2'
            assert page.locator('#input-grado').input_value() == '2°'
            assert page.locator('#input-unidad').input_value() == 'Tomamos decisiones financieras responsables en nuestra comunidad'
            assert page.locator('#select-methodology').input_value() == 'project_based_learning'

            page.locator('#btn-generate').evaluate('button => button.click()')
            page.wait_for_function("window.getCurrentSession()?.planning?.mode === 'linked'")
            generated = page.evaluate("window.getCurrentSession()")
            assert generated['schemaVersion'] == '1.0'
            assert generated['planning']['planningRevision'] == 1
            assert generated['planning']['sequenceItemId'] == 'session-02'
            assert generated['planning']['inheritedContextSnapshot']['sequenceItem']['status'] == 'planned'
            assert page.evaluate("SessionValidator.validate(window.getCurrentSession()).valid")
            sent = page.evaluate('window.__linkedGenerationInput')
            assert sent['inheritedContextSnapshot']['planningRevision'] == 1
            assert sent['inheritedContextSnapshot']['sequenceItemId'] == 'session-02'
            assert len(sent['inheritedContextSnapshot']['precedingSequence']) == 1
            assert len(sent['inheritedContextSnapshot']['followingSequence']) == 1

            page.locator('#btn-save').evaluate('button => button.click()')
            page.wait_for_function("window.StorageManager.getAllSessions().length === 1")
            saved = page.evaluate("window.StorageManager.getAllSessions()[0]")
            updated = page.evaluate("window.PlanningRepository.create({validator: window.PlanningContainerV2}).get('plan-secondary-math-finance-001')")
            assert saved['planning']['sequenceItemId'] == 'session-02'
            assert updated['status'] == 'reviewed' and updated['revision'] == 1
            assert updated['sequence'][1]['status'] == 'generated'
            assert updated['sequence'][1]['linkedDocumentRef'] == saved['id']

            page.evaluate('window.appStartNewSession()')
            page.wait_for_function('window.getCurrentSession() === null')
            assert not errors, errors
            page.close()
            browser.close()
    finally:
        server.shutdown()
    print('ui_linked_session_smoke.py: OK')


if __name__ == '__main__':
    run()
