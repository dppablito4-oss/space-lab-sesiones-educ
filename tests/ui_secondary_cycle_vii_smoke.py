"""Planning Studio resolves grade 4 to cycle VII and shows only its official curriculum slice."""
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
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT)))
    Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1280, "height": 900})
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto(f"http://127.0.0.1:{server.server_port}/index.html", wait_until="domcontentloaded")
            page.evaluate("window.LandingRouter.showHome(false)")
            page.locator('[data-open-planning]').click()
            page.evaluate("window.SupabaseClient.getUserEntitlements = async () => ({ok: true, features: {'planning.unit': true}})")
            page.locator('[data-type="unit"]').click()
            page.locator('[data-planning-action="mode-manual"]').click()

            grade = page.locator('[data-path="identity.grade"]')
            assert grade.locator('option').count() == 5
            grade.select_option('4')
            page.locator('.planning-content').filter(has_text='4.º de Secundaria · Ciclo VII').wait_for()

            page.locator('.planning-steps [data-step="2"]').click()
            page.locator('[data-planning-action="curriculum"]').click()
            standard = page.locator('[data-curriculum-standard]').inner_text()
            performances = page.locator('[data-curriculum-performances]').inner_text()
            assert 'cantidades muy grandes o muy pequeñas' in standard
            assert 'densidad de racionales' in performances
            assert 'impuesto a las transacciones financieras' not in performances
            assert 'números irracionales' not in performances
            assert not errors, errors
            browser.close()
    finally:
        server.shutdown()
    print('ui_secondary_cycle_vii_smoke.py: OK')


if __name__ == '__main__':
    run()
