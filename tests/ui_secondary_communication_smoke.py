"""Planning Studio resolves all 3 secondary Comunicación competencies for Ciclo VII (Grade 4).

Tests responsive viewports (375px and 1280px) and interactive competency switching:
- Se comunica oralmente: verifies Cycle VII standard and Grade 4 performances
- Lee diversos tipos de textos: switches and verifies Cycle VII standard and Grade 4 performances
- Escribe diversos tipos de textos: switches and verifies Cycle VII standard and Grade 4 performances
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
                # 4 math + 3 communication = 7 options total
                assert competency_select.locator('option').count() == 7

                # 1. Switch to Comunicación Oral
                competency_select.select_option('communicates-orally')
                page.wait_for_timeout(100)

                # If curriculum entry is empty, trigger add button
                if page.locator('[data-planning-action="curriculum"]').count() > 0:
                    page.locator('[data-planning-action="curriculum"]').click()
                    page.wait_for_timeout(100)

                standard = page.locator('[data-curriculum-standard]').inner_text()
                performances = page.locator('[data-curriculum-performances]').inner_text()
                assert 'falacias' in standard or 'interlocutores' in standard, f"Unexpected oral standard: {standard}"
                assert 'discursos persuasivos' in performances or 'modula el timbre' in performances or 'timbre' in performances, f"Unexpected oral performances: {performances}"
                assert 'tratados filosóficos' not in performances
                assert 'artículos de opinión' not in performances

                # 2. Switch to Lectura
                competency_select = page.locator('#planning-competency')
                competency_select.select_option('reads-texts')
                page.wait_for_timeout(100)

                standard = page.locator('[data-curriculum-standard]').inner_text()
                performances = page.locator('[data-curriculum-performances]').inner_text()
                assert 'relaciones de poder' in standard or 'estrategias discursivas' in standard, f"Unexpected reading standard: {standard}"
                assert 'tratados filosóficos' in performances or 'marcos teóricos implícitos' in performances or 'ensayos académicos' in performances, f"Unexpected reading performances: {performances}"
                assert 'modula el timbre' not in performances
                assert 'cadena de razonamiento' not in performances

                # 3. Switch to Escritura
                competency_select = page.locator('#planning-competency')
                competency_select.select_option('writes-texts')
                page.wait_for_timeout(100)

                standard = page.locator('[data-curriculum-standard]').inner_text()
                performances = page.locator('[data-curriculum-performances]').inner_text()
                assert 'párrafos, capítulos o apartados' in standard or 'contraargumentar' in standard, f"Unexpected writing standard: {standard}"
                assert 'cadena de razonamiento' in performances or 'artículos de opinión' in performances, f"Unexpected writing performances: {performances}"
                assert 'modula el timbre' not in performances
                assert 'obras de la literatura universal' not in performances

                assert not errors, f"Errors encountered at {width}px: {errors}"
                page.close()
            browser.close()
    finally:
        server.shutdown()
    print('ui_secondary_communication_smoke.py: OK')


if __name__ == '__main__':
    run()
