"""Linked-session lifecycle, active-session protection and responsive smoke."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PLANNING_FIXTURE = 'data/pedagogy/fixtures/secondary_math_project_unit.v2.json'
SESSION_FIXTURE = 'tests/fixtures/secundaria-matematica-polya.v1.json'
PLAN_ID = 'plan-secondary-math-finance-001'


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def seed(page):
    page.evaluate("""async ({ planningUrl, sessionUrl }) => {
        const fixture = await (await fetch(planningUrl)).json();
        const draft = structuredClone(fixture);
        draft.id = 'plan-draft-blocked';
        draft.status = 'draft';
        const repository = window.PlanningRepository.create({ validator: window.PlanningContainerV2 });
        repository.save(fixture);
        repository.save(draft);
        window.__linkedSessionFixture = await (await fetch(sessionUrl)).json();
        const active = { ...structuredClone(window.__linkedSessionFixture), id: 'active-standalone', template: 'estandar' };
        window.StorageManager.saveSession(active);
        window.appOpenSession(active.id);
        SessionValidator.validateGeneratedContent = () => ({ valid: true, errors: [], warnings: [] });
        window.AiCopilot.generateSession = async metadata => {
            window.__linkedGenerationInput = structuredClone(metadata);
            return structuredClone(window.__linkedSessionFixture);
        };
    }""", {"planningUrl": PLANNING_FIXTURE, "sessionUrl": SESSION_FIXTURE})


def assert_pending(page, expected):
    assert page.evaluate('Boolean(window.getPendingPlanningLink())') is expected


def run_width(browser, port, width):
    context = browser.new_context(viewport={"width": width, "height": 900})
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(f"http://127.0.0.1:{port}/index.html", wait_until='domcontentloaded')
    page.evaluate("""() => {
        window.SupabaseClient.getCurrentUser = async () => ({ id: 'linked-teacher' });
        window.SupabaseClient.getUserProfile = async () => null;
        window.SupabaseClient.getPlanningRecordsCloud = async () => [];
        window.SupabaseClient.savePlanningRecordCloud = async () => true;
        window.SupabaseClient.saveSessionCloud = async () => true;
    }""")
    seed(page)

    blocked = page.evaluate("""async () => {
        try { await window.appStartLinkedSession('plan-draft-blocked', 'session-01'); return ''; }
        catch (error) { return error.message; }
    }""")
    assert 'revisada' in blocked

    # Cancelar la confirmación conserva la sesión activa y no filtra un link.
    active_before = page.evaluate('structuredClone(window.getCurrentSession())')
    page.evaluate('ConfirmDialog.show = async () => false')
    cancelled = page.evaluate(f"window.appStartLinkedSession('{PLAN_ID}', 'session-02')")
    assert cancelled is None
    assert page.evaluate('window.getCurrentSession()') == active_before
    assert_pending(page, False)
    untouched = page.evaluate(f"window.PlanningRepository.create({{validator: window.PlanningContainerV2}}).get('{PLAN_ID}')")
    assert untouched['sequence'][1]['linkedDocumentRef'] is None

    # Aceptar limpia el editor de forma segura y asigna el nuevo link al final.
    page.evaluate('ConfirmDialog.show = async () => true')
    page.evaluate(f"window.appStartLinkedSession('{PLAN_ID}', 'session-02')")
    assert page.evaluate('window.getCurrentSession()') is None
    assert_pending(page, True)
    page.evaluate('window.LandingRouter.showApp(false)')
    assert page.locator('#input-titulo').input_value() == 'Comparamos el costo real'
    assert page.locator('#input-area').input_value() == 'Matemática'
    assert page.locator('#input-numero-sesion').input_value() == '2'
    assert page.locator('#input-grado').input_value() == '2°'
    assert page.locator('#select-methodology').input_value() == 'project_based_learning'

    # Cerrar un editor linked aún vacío limpia el pending link.
    page.locator('#btn-close-session').evaluate('button => button.click()')
    assert_pending(page, False)

    # Nueva sesión standalone y cargar una existente también limpian el link.
    page.evaluate(f"window.appStartLinkedSession('{PLAN_ID}', 'session-02')")
    assert_pending(page, True)
    page.evaluate('window.appStartNewSession()')
    assert_pending(page, False)
    page.evaluate(f"window.appStartLinkedSession('{PLAN_ID}', 'session-02')")
    assert_pending(page, True)
    page.evaluate("window.appOpenSession('active-standalone')")
    assert_pending(page, False)

    # Generación y guardado reales sobre el motor existente.
    page.evaluate(f"window.appStartLinkedSession('{PLAN_ID}', 'session-02')")
    assert_pending(page, True)
    page.locator('#btn-generate').evaluate('button => button.click()')
    page.wait_for_function("window.getCurrentSession()?.planning?.mode === 'linked'")
    assert_pending(page, False)
    generated = page.evaluate('window.getCurrentSession()')
    original_snapshot = generated['planning']['inheritedContextSnapshot']
    assert generated['schemaVersion'] == '1.0'
    assert generated['planning']['planningRevision'] == 1
    assert generated['planning']['sequenceItemId'] == 'session-02'
    assert page.evaluate('SessionValidator.validate(window.getCurrentSession()).valid')
    assert page.evaluate('SessionExport.buildCanonicalPayload(window.getCurrentSession()).planning') is None

    page.locator('#btn-save').evaluate('button => button.click()')
    page.wait_for_function("window.StorageManager.getAllSessions().some(item => item.planning?.mode === 'linked')")
    saved = page.evaluate("window.StorageManager.getAllSessions().find(item => item.planning?.mode === 'linked')")
    updated = page.evaluate(f"window.PlanningRepository.create({{validator: window.PlanningContainerV2}}).get('{PLAN_ID}')")
    assert saved['planning']['inheritedContextSnapshot'] == original_snapshot
    assert updated['status'] == 'reviewed' and updated['revision'] == 1
    assert updated['sequence'][1]['status'] == 'generated'
    assert updated['sequence'][1]['linkedDocumentRef'] == {
        'id': saved['id'], 'schemaVersion': '1.0', 'revision': 1, 'status': 'draft'
    }

    # Guardar como crea una copia standalone y deja intacta la sesión linked.
    linked_id = saved['id']
    page.once('dialog', lambda dialog: dialog.accept('Copia independiente'))
    page.locator('#btn-save-as').evaluate('button => button.click()')
    page.wait_for_function("id => window.getCurrentSession()?.id !== id", arg=linked_id)
    assert page.evaluate("window.getCurrentSession().planning") is None
    assert page.evaluate("id => window.StorageManager.getSession(id).planning.mode", linked_id) == 'linked'
    assert page.evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth')
    assert not errors, errors
    context.close()


def run():
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT)))
    Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            for width in (375, 1280):
                run_width(browser, server.server_port, width)
            browser.close()
    finally:
        server.shutdown()
    print('ui_linked_session_smoke.py: OK')


if __name__ == '__main__':
    run()
