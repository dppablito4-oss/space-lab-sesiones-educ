"""Responsive Planning Studio smoke: shell, preview, sequence, save and review."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
MOCK_SERVICES = """() => {
    window.SupabaseClient.getUserEntitlements = async () => ({
        ok: true,
        features: {'planning.unit': true, 'planning.experience': true}
    });
    window.SupabaseClient.getCurrentUser = async () => ({id: 'studio-teacher'});
    window.SupabaseClient.getPlanningRecordsCloud = async () => [];
    window.SupabaseClient.savePlanningRecordCloud = async () => true;
}"""


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def open_studio(page):
    page.evaluate("window.LandingRouter.showHome(false)")
    page.evaluate(MOCK_SERVICES)
    page.locator('[data-open-planning]').click()
    page.locator('[data-type="unit"]').click()
    page.locator('[data-planning-action="mode-manual"]').click()
    page.locator('.planning-studio-layout').wait_for()


def run():
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT)))
    Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            for width in (375, 768, 1280, 1440):
                page = browser.new_page(viewport={"width": width, "height": 900})
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.goto(f"http://127.0.0.1:{server.server_port}/index.html", wait_until="domcontentloaded")
                open_studio(page)

                assert page.locator('.planning-form-pane').is_visible()
                assert page.locator('.planning-step').count() == 7
                assert page.locator('.planning-progress progress').get_attribute('max') == '100'

                page.locator('[data-path="identity.title"]').fill(f'Unidad Studio {width}')
                page.locator('[data-path="identity.duration.value"]').fill('3')
                page.wait_for_timeout(120)

                if width >= 1200:
                    assert page.locator('.planning-stepper').is_visible()
                    assert page.locator('.planning-preview').is_visible()
                    assert f'Unidad Studio {width}' in page.locator('.planning-preview-body').inner_text()
                    page.locator('[data-planning-action="preview-mode"][data-mode="document"]').click()
                    assert page.locator('.planning-document-preview').is_visible()
                elif width == 375:
                    assert page.locator('.planning-mobile-heading').is_visible()
                    assert page.locator('.planning-stepper').is_visible()
                    page.locator('.planning-mobile-heading [data-planning-action="preview"]').click()
                    assert page.locator('.planning-preview.is-open').is_visible()
                    page.locator('.planning-preview-header [data-planning-action="preview"]').click()
                else:
                    assert page.locator('.planning-stepper').is_visible()
                    assert not page.locator('.planning-preview').is_visible()
                    page.locator('.planning-section-heading [data-planning-action="preview"]').click()
                    assert page.locator('.planning-preview.is-open').is_visible()
                    page.locator('.planning-preview-header [data-planning-action="preview"]').click()

                page.locator('[data-step="5"]').click()
                page.locator('[data-planning-action="session"]').click()
                assert page.locator('.planning-session-card').count() == 1
                assert 'Planeada' in page.locator('.planning-session-card').inner_text()
                page.locator('[data-path="sequence.0.title"]').fill('Exploramos el reto')

                page.locator('[data-planning-action="save"]').click()
                page.locator('#planning-notice').filter(has_text='Borrador guardado').wait_for()
                assert page.locator('[data-planning-action="save"]').is_disabled()

                page.locator('[data-step="6"]').click()
                assert page.locator('.planning-review-list').is_visible()
                assert page.locator('[data-planning-action="review"]').is_disabled()
                assert page.locator('#planning-dialog').evaluate('el => el.scrollWidth <= el.clientWidth')
                assert page.evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth')
                assert not errors, errors
                page.close()
            browser.close()
    finally:
        server.shutdown()
    print('ui_planning_studio_smoke.py: OK')


if __name__ == '__main__':
    run()
