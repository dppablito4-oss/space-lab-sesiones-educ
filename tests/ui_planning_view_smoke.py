"""Planning overview navigation, responsive layout and edit round trip."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
FIXTURE_URL = "data/pedagogy/fixtures/secondary_math_project_unit.v2.json"
MOCK_CLOUD = """() => {
    window.SupabaseClient.getCurrentUser = async () => ({ id: 'test-teacher' });
    window.SupabaseClient.getPlanningRecordsCloud = async () => [];
    window.SupabaseClient.savePlanningRecordCloud = async () => true;
}"""


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def seed_draft(page):
    page.evaluate(
        """async fixtureUrl => {
            const fixture = await (await fetch(fixtureUrl)).json();
            fixture.status = 'draft';
            fixture.revision = 1;
            localStorage.removeItem(window.PlanningRepository.STORAGE_KEY);
            window.PlanningRepository.create({ validator: window.PlanningContainerV2 }).save(fixture);
        }""",
        FIXTURE_URL,
    )


def assert_overview(page, status, revision, title):
    page.locator('.planning-view-shell').wait_for()
    assert page.locator('#planning-title').inner_text() == title
    assert page.locator('#planning-title').evaluate('el => document.activeElement === el')
    text = page.locator('.planning-view-shell').inner_text()
    for expected in (
        'Situación significativa', 'Pregunta retadora', 'Propósito de aprendizaje',
        'Propósitos curriculares', 'Aprendizaje Basado en Proyectos', 'Producto final',
        'Evaluación', 'Fases e hitos', 'Progresión', f'Estado: {status}', f'Revisión {revision}',
    ):
        assert expected in text
    for hidden in ('project_based_learning', 'map-quantity', 'session-01', 'Generar sesión'):
        assert hidden not in text
    assert page.locator('#planning-dialog').evaluate('el => el.scrollWidth <= el.clientWidth')
    assert page.evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth')


def run():
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT)))
    Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            for width in (375, 768, 1280):
                page = browser.new_page(viewport={"width": width, "height": 900})
                errors = []
                page.on('pageerror', lambda error: errors.append(str(error)))
                page.goto(f"http://127.0.0.1:{server.server_port}/index.html", wait_until='domcontentloaded')
                page.evaluate('window.LandingRouter.showHome(false)')
                page.evaluate(MOCK_CLOUD)
                seed_draft(page)

                page.locator('[data-open-planning]').click()
                page.locator('[data-planning-action="open"]').click()
                assert_overview(
                    page, 'Borrador', 1,
                    'Tomamos decisiones financieras responsables en nuestra comunidad',
                )

                edit = page.locator('[data-planning-view-action="edit"]')
                edit.focus()
                edit.press('Enter')
                page.locator('[data-path="identity.title"]').fill('Plan financiero actualizado')
                page.locator('[data-planning-action="save"]').click()
                assert_overview(page, 'Borrador', 2, 'Plan financiero actualizado')

                page.locator('[data-planning-view-action="edit"]').click()
                page.locator('[data-step="6"]').click()
                page.locator('[data-planning-action="review"]').click()
                assert_overview(page, 'Revisada', 3, 'Plan financiero actualizado')

                page.locator('[data-planning-view-action="back"]').click()
                card = page.locator('.planning-card')
                assert 'Plan financiero actualizado' in card.inner_text()
                assert 'Revisada · Revisión 3' in card.inner_text()
                page.locator('[data-planning-action="open"]').click()
                assert_overview(page, 'Revisada', 3, 'Plan financiero actualizado')

                page.locator('[data-planning-view-action="close"]').click()
                page.locator('[data-home-action="new-session"]').first.click()
                page.wait_for_function("!document.querySelector('#app-view').classList.contains('hidden')")
                assert page.locator('.sidebar-tab').count() == 6
                assert not errors, errors
                page.close()
            browser.close()
    finally:
        server.shutdown()
    print('ui_planning_view_smoke.py: OK')


if __name__ == '__main__':
    run()
