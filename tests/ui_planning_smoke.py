"""Manual wizard round trip and standalone editor regression at mobile/desktop sizes."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
MOCK_CLOUD = """() => {
    window.SupabaseClient.getCurrentUser = async () => ({ id: 'test-teacher' });
    window.SupabaseClient.getPlanningRecordsCloud = async () =>
        JSON.parse(sessionStorage.getItem('planning-test-cloud') || '[]');
    window.SupabaseClient.savePlanningRecordCloud = async record => {
        const rows = JSON.parse(sessionStorage.getItem('planning-test-cloud') || '[]');
        const index = rows.findIndex(row => row.id === record.id);
        if (index < 0) rows.push(record); else rows[index] = record;
        sessionStorage.setItem('planning-test-cloud', JSON.stringify(rows));
        return true;
    };
}"""


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def run():
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT)))
    Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            for width in (375, 1280):
                page = browser.new_page(viewport={"width": width, "height": 900})
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.goto(f"http://127.0.0.1:{server.server_port}/index.html", wait_until="domcontentloaded")
                page.evaluate("window.LandingRouter.showHome(false)")
                page.locator('[data-open-planning]').click()
                page.evaluate(MOCK_CLOUD)
                page.evaluate("window.SupabaseClient.getUserEntitlements = async () => ({ok: true, features: {}})")
                page.locator('[data-type="unit"]').click()
                page.locator('#planning-notice').filter(has_text='permisos de tu cuenta').wait_for()
                page.evaluate("window.SupabaseClient.getUserEntitlements = async () => ({ok: true, features: {'planning.unit': true, 'planning.experience': true}})")
                page.locator('[data-type="unit"]').click()
                page.locator('[data-planning-action="mode-manual"]').click()
                page.locator('[data-path="identity.title"]').fill('Mi unidad <segura>')
                page.locator('[data-path="identity.duration.value"]').fill('3')
                page.locator('[data-planning-action="save"]').click()
                page.locator('#planning-notice').filter(has_text='Borrador guardado').wait_for()
                assert page.locator('[data-planning-action="save"]').is_disabled()
                page.locator('[data-step="6"]').click()
                assert page.locator('[data-planning-action="review"]').is_disabled()
                page.locator('.planning-steps [data-step="2"]').click()
                page.locator('[data-planning-action="curriculum"]').click()
                page.locator('[data-path="curriculumMap.0.criteria"]').fill('Argumenta su respuesta\nVerifica sus resultados')
                page.locator('[data-step="1"]').click()
                page.locator('[data-path="significantSituation.context"]').fill('La comunidad analiza decisiones de consumo.')
                page.locator('[data-path="significantSituation.problemOrOpportunity"]').fill('Se necesita comparar cantidades.')
                page.locator('[data-path="drivingQuestion"]').fill('¿Cómo decidimos usando cantidades?')
                page.locator('[data-path="purpose.summary"]').fill('Resolver problemas de cantidad y justificar decisiones.')
                page.locator('[data-step="3"]').click()
                page.locator('#planning-methodology').select_option('custom')
                page.locator('[data-path="methodologyConfig.custom.name"]').fill('Trabajo colaborativo')
                page.locator('[data-step="4"]').click()
                if page.locator('[data-planning-action="product"]').is_visible():
                    page.locator('[data-planning-action="product"]').click()
                page.locator('[data-path="finalProduct.title"]').fill('Guía de decisiones')
                page.locator('[data-step="5"]').click()
                page.locator('[data-planning-action="milestone"]').click()
                page.locator('[data-planning-action="session"]').click()
                page.locator('[data-path="sequence.0.title"]').fill('Primera sesión')
                milestone = page.locator('[data-path="sequence.0.milestoneId"] option').nth(1).get_attribute('value')
                page.locator('[data-path="sequence.0.milestoneId"]').select_option(milestone)
                page.locator('[data-path="sequence.0.evidence"]').fill('Explicación escrita')
                page.locator('[data-planning-action="partial"]').click()
                page.locator('[data-path="sequence.0.partialProduct.title"]').fill('Borrador de guía')
                page.locator('[data-planning-action="session"]').click()
                page.locator('[data-planning-action="up"][data-index="1"]').click()
                page.locator('[data-step="6"]').click()
                assert page.locator('#planning-dialog').inner_text().find('Campos de revisión completos') >= 0
                assert page.locator('[data-planning-action="review"]').is_enabled()
                screenshots = ROOT / 'artifacts' / 'planning-wizard'
                screenshots.mkdir(parents=True, exist_ok=True)
                page.screenshot(path=str(screenshots / f'review-{width}.png'))
                page.locator('[data-planning-action="review"]').click()
                page.locator('#planning-notice').filter(has_text='Planificación revisada').wait_for()
                assert page.locator('[data-planning-action="review"]').is_disabled()
                assert page.locator('[data-planning-action="review"]').inner_text() == 'Planificación revisada'
                saved_review = page.evaluate("JSON.parse(localStorage.getItem('spacelab_planning_containers'))[0].containerData")
                assert saved_review['revision'] == 2 and saved_review['status'] == 'reviewed'
                assert page.locator('[data-planning-action="save"]').is_disabled()
                unchanged_review = page.evaluate("JSON.parse(localStorage.getItem('spacelab_planning_containers'))[0].containerData")
                assert unchanged_review['revision'] == 2 and unchanged_review['status'] == 'reviewed'
                page.locator('[data-planning-action="close"]').click()
                page.evaluate("localStorage.removeItem('spacelab_planning_containers')")
                page.reload(wait_until='domcontentloaded')
                page.evaluate("window.LandingRouter.showHome(false)")
                page.evaluate(MOCK_CLOUD)
                page.locator('[data-open-planning]').click()
                page.locator('[data-planning-action="sync"]').click()
                page.locator('#planning-notice').filter(has_text='Biblioteca sincronizada').wait_for()
                assert page.locator('.planning-library').inner_text().find('Mi unidad <segura>') >= 0
                assert page.locator('.planning-library').inner_text().find('Revisada') >= 0
                page.locator('[data-planning-action="open"]').click()
                page.locator('.planning-view-shell').wait_for()
                assert page.locator('#planning-title').inner_text() == 'Mi unidad <segura>'
                assert 'Estado: Revisada' in page.locator('.planning-view-header').inner_text()
                page.locator('[data-planning-view-action="edit"]').click()
                assert page.locator('[data-path="identity.title"]').input_value() == 'Mi unidad <segura>'
                page.locator('[data-path="identity.title"]').fill('Unidad revisada')
                assert page.locator('[data-planning-action="save"]').is_enabled()
                page.locator('[data-planning-action="save"]').click()
                page.locator('.planning-view-shell').wait_for()
                assert page.locator('#planning-title').inner_text() == 'Unidad revisada'
                saved = page.evaluate("JSON.parse(localStorage.getItem('spacelab_planning_containers'))[0].containerData")
                assert saved['schemaVersion'] == '2.0' and saved['revision'] == 3
                assert saved['status'] == 'draft'
                assert saved['sequence'][1]['title'] == 'Primera sesión'
                assert saved['sequence'][1]['milestoneId'] == milestone
                assert saved['sequence'][1]['criterionRefs'] == [c['id'] for c in saved['curriculumMap'][0]['criteria']]
                assert saved['sequence'][1]['partialProduct']['title'] == 'Borrador de guía'
                assert saved['milestones'][0]['sequenceItemIds'] == [saved['sequence'][1]['id']]
                page.locator('[data-planning-view-action="edit"]').click()
                page.locator('[data-step="6"]').click()
                assert page.locator('[data-planning-action="review"]').is_enabled()
                page.locator('[data-planning-action="review"]').click()
                page.locator('.planning-status-reviewed').wait_for()
                reviewed_again = page.evaluate("JSON.parse(localStorage.getItem('spacelab_planning_containers'))[0].containerData")
                assert reviewed_again['status'] == 'reviewed' and reviewed_again['revision'] == 4
                assert page.locator('#planning-dialog').evaluate('el => el.scrollWidth <= el.clientWidth')
                page.locator('[data-planning-view-action="close"]').click()
                page.locator('[data-home-action="new-session"]').first.click()
                page.wait_for_function("!document.querySelector('#app-view').classList.contains('hidden')")
                assert page.locator('.sidebar-tab').count() == 6
                assert not errors, errors
                page.close()
            browser.close()
    finally:
        server.shutdown()
    print('ui_planning_smoke.py: OK')


if __name__ == '__main__':
    run()
