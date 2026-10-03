"""Planning Studio resolves all 3 secondary Ciencia y Tecnología competencies for Ciclo VII (Grade 4).

Tests responsive viewports (375px and 1280px) and interactive competency switching:
- Indaga mediante métodos científicos: switches and verifies Cycle VII standard and Grade 4 performances
- Explica el mundo físico: switches and verifies Cycle VII standard and Grade 4 performances
- Diseña soluciones tecnológicas: switches and verifies Cycle VII standard and Grade 4 performances
- Validates no JS errors or unhandled exceptions.
"""
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
            for width in (375, 1280):
                page = browser.new_page(viewport={"width": width, "height": 900})
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.goto(f"http://127.0.0.1:{server.server_port}/index.html", wait_until="domcontentloaded")
                page.evaluate("window.LandingRouter.showHome(false)")
                page.locator('[data-open-planning]').click()
                page.evaluate("window.SupabaseClient.getUserEntitlements = async () => ({ok: true, features: {'planning.unit': true}})")
                page.locator('[data-type="unit"]').click()
                page.locator('[data-planning-action="mode-manual"]').click()

                # Step 1: Identity - select 4.º grado (Ciclo VII)
                grade = page.locator('[data-path="identity.grade"]')
                assert grade.locator('option').count() == 5
                grade.select_option('4')
                page.locator('.planning-content').filter(has_text='4.º de Secundaria · Ciclo VII').wait_for()

                # Navigate to Step 2: Curriculum
                page.locator('.planning-steps [data-step="2"]').click()

                competency_select = page.locator('#planning-competency')
                # 4 math + 3 communication + 3 science = 10 options total
                assert competency_select.locator('option').count() >= 10

                # 1. Switch to Indaga mediante métodos científicos
                competency_select.select_option('inquires-scientific-methods')
                page.wait_for_timeout(100)

                # If curriculum entry is empty, trigger add button
                if page.locator('[data-planning-action="curriculum"]').count() > 0:
                    page.locator('[data-planning-action="curriculum"]').click()
                    page.wait_for_timeout(100)

                standard = page.locator('[data-curriculum-standard]').inner_text()
                performances = page.locator('[data-curriculum-performances]').inner_text()
                assert 'teoría de errores' in standard or 'mediciones y comparaciones' in standard, f"Unexpected inquiry standard: {standard}"
                assert 'grupo de control' in performances or 'margen de error' in performances, f"Unexpected inquiry performances: {performances}"
                assert 'macromoléculas' not in performances
                assert 'prototipo' not in performances

                # 2. Switch to Explica el mundo físico
                competency_select = page.locator('#planning-competency')
                competency_select.select_option('explains-physical-world')
                page.wait_for_timeout(100)

                standard = page.locator('[data-curriculum-standard]').inner_text()
                performances = page.locator('[data-curriculum-performances]').inner_text()
                assert 'estructura microscópica' in standard or 'información genética' in standard, f"Unexpected physical-world standard: {standard}"
                assert 'macromoléculas' in performances or 'genética' in performances or 'biomoléculas' in performances, f"Unexpected physical-world performances: {performances}"
                assert 'grupo de control' not in performances
                assert 'esquemas a escala' not in performances

                # 3. Switch to Diseña y construye soluciones tecnológicas
                competency_select = page.locator('#planning-competency')
                competency_select.select_option('designs-technological-solutions')
                page.wait_for_timeout(100)

                standard = page.locator('[data-curriculum-standard]').inner_text()
                performances = page.locator('[data-curriculum-performances]').inner_text()
                assert 'esquemas o dibujos' in standard or 'soluciones tecnológicas' in standard, f"Unexpected solution standard: {standard}"
                assert 'prototipo' in performances or 'ecoeficiencia' in performances, f"Unexpected solution performances: {performances}"
                assert 'grupo de control' not in performances
                assert 'macromoléculas' not in performances

                assert not errors, f"Errors encountered at {width}px: {errors}"
                page.close()
            browser.close()
    finally:
        server.shutdown()
    print('ui_secondary_science_technology_smoke.py: OK')


if __name__ == '__main__':
    run()
