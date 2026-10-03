"""Planning Studio renders all 10 official MINEDU secondary courses and allows switching.

Verifies:
- All 10 curricular areas are present in optgroups
- Total of 26 competencies selectable in UI
- Switching dynamically updates standard and isolated performances in Grade 3 (Ciclo VII)
- Responsive viewports: 375px and 1280px
- Zero console / page errors
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

                # Step 1: Select 3.º grado (Ciclo VII)
                grade = page.locator('[data-path="identity.grade"]')
                grade.select_option('3')
                page.locator('.planning-content').filter(has_text='3.º de Secundaria · Ciclo VII').wait_for()

                # Navigate to Step 2: Curriculum
                page.locator('.planning-steps [data-step="2"]').click()

                competency_select = page.locator('#planning-competency')
                # Must have 26 options across all 10 areas
                opt_count = competency_select.locator('option').count()
                assert opt_count == 26, f"Expected 26 options in competency selector, found {opt_count}"

                # Verify all 10 optgroups are present
                optgroups = competency_select.locator('optgroup').all_text_contents()
                assert len(optgroups) >= 10, f"Expected 10 optgroups, found {len(optgroups)}"

                # Test switching to EPT (manages-entrepreneurship-projects)
                competency_select.select_option('manages-entrepreneurship-projects')
                page.wait_for_timeout(100)
                if page.locator('[data-planning-action="curriculum"]').count() > 0:
                    page.locator('[data-planning-action="curriculum"]').click()
                    page.wait_for_timeout(100)

                standard = page.locator('[data-curriculum-standard]').inner_text()
                performances = page.locator('[data-curriculum-performances]').inner_text()
                assert 'emprendimiento' in standard.lower(), f"Unexpected EPT standard: {standard}"
                assert 'propuestas de valor' in performances.lower() or 'lean' in performances.lower() or 'insumos' in performances.lower(), f"Unexpected EPT performances: {performances}"

                # Test switching to Inglés (reads-texts-english)
                competency_select = page.locator('#planning-competency')
                competency_select.select_option('reads-texts-english')
                page.wait_for_timeout(100)

                standard = page.locator('[data-curriculum-standard]').inner_text()
                performances = page.locator('[data-curriculum-performances]').inner_text()
                assert 'inglés' in standard.lower() or 'english' in standard.lower(), f"Unexpected English standard: {standard}"
                assert 'vocabulario' in performances.lower() or 'textos' in performances.lower(), f"Unexpected English performances: {performances}"

                assert not errors, f"Errors encountered at {width}px: {errors}"
                page.close()
            browser.close()
    finally:
        server.shutdown()
    print('ui_secondary_all_courses_smoke.py: OK')


if __name__ == '__main__':
    run()
