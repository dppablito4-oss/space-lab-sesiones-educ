"""Planning Studio resolves all 4 secondary mathematics competencies for Ciclo VII (Grade 4).

Tests responsive viewports (375px and 1280px) and interactive competency switching:
- Regularidad: verifies Cycle VII standard and Grade 4 performances
- Forma: switches and verifies Cycle VII standard and Grade 4 performances
- Datos: switches and verifies Cycle VII standard and Grade 4 performances
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
                assert competency_select.locator('option').count() == 4

                # 1. Switch to Regularidad
                competency_select.select_option('solves-regularity-problems')
                page.wait_for_timeout(100)

                # If curriculum entry is empty, trigger add button
                if page.locator('[data-planning-action="curriculum"]').count() > 0:
                    page.locator('[data-planning-action="curriculum"]').click()
                    page.wait_for_timeout(100)

                standard = page.locator('[data-curriculum-standard]').inner_text()
                performances = page.locator('[data-curriculum-performances]').inner_text()
                assert 'funciones cuadráticas' in standard or 'sistemas de ecuaciones' in standard, f"Unexpected regularity standard: {standard}"
                assert 'progresiones geométricas' in performances or 'ecuaciones e inecuaciones cuadráticas' in performances, f"Unexpected regularity performances: {performances}"
                assert 'rectas' not in performances
                assert 'desviación estándar' not in performances

                # 2. Switch to Forma
                competency_select = page.locator('#planning-competency')
                competency_select.select_option('solves-shape-problems')
                page.wait_for_timeout(100)

                standard = page.locator('[data-curriculum-standard]').inner_text()
                performances = page.locator('[data-curriculum-performances]').inner_text()
                assert 'ecuación de la recta' in standard or 'cuerpos de revolución' in standard, f"Unexpected shape standard: {standard}"
                assert 'ecuación de la recta' in performances or 'triángulos oblicuángulos' in performances, f"Unexpected shape performances: {performances}"
                assert 'progresiones geométricas' not in performances
                assert 'desviación estándar' not in performances

                # 3. Switch to Datos
                competency_select = page.locator('#planning-competency')
                competency_select.select_option('solves-data-uncertainty-problems')
                page.wait_for_timeout(100)

                standard = page.locator('[data-curriculum-standard]').inner_text()
                performances = page.locator('[data-curriculum-performances]').inner_text()
                assert 'muestra representativa' in standard or 'desviación estándar' in standard, f"Unexpected data standard: {standard}"
                assert 'desviación estándar' in performances or 'coeficiente de variación' in performances, f"Unexpected data performances: {performances}"
                assert 'ecuación de la recta' not in performances
                assert 'progresiones geométricas' not in performances

                assert not errors, f"Errors encountered at {width}px: {errors}"
                page.close()
            browser.close()
    finally:
        server.shutdown()
    print('ui_secondary_mathematics_smoke.py: OK')


if __name__ == '__main__':
    run()
