"""Standalone generation stays independent before and after linked-session flows."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
PLAN_FIXTURE = "data/pedagogy/fixtures/secondary_math_project_unit.v2.json"
SESSION_FIXTURE = "tests/fixtures/secundaria-matematica-polya.v1.json"
PLAN_ID = "plan-secondary-math-finance-001"


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def fill_and_generate(page, unit, title):
    page.evaluate("""() => {
        document.querySelector('#external-ficha-prompt-modal')?.classList.add('hidden');
        document.querySelector('.sidebar-tab[data-tab="tab-general"]')?.click();
    }""")
    page.locator("#input-unidad").fill(unit)
    page.locator("#input-area").select_option("Matemática")
    page.locator("#input-titulo").fill(title)
    page.locator("#btn-generate").evaluate("button => button.click()")
    page.wait_for_function("expected => window.getCurrentSession()?.metadata?.titulo === expected", arg=title)
    return page.evaluate("structuredClone(window.getCurrentSession())")


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
            page.evaluate(
                """async ({planUrl, sessionUrl}) => {
                    window.SupabaseClient.getCurrentUser = async () => ({id: 'standalone-teacher'});
                    window.SupabaseClient.getUserProfile = async () => null;
                    window.SupabaseClient.getPlanningRecordsCloud = async () => [];
                    window.SupabaseClient.savePlanningRecordCloud = async () => true;
                    window.SupabaseClient.saveSessionCloud = async () => true;
                    const plan = await (await fetch(planUrl)).json();
                    window.PlanningRepository.create({validator: window.PlanningContainerV2}).save(plan);
                    window.__sessionFixture = await (await fetch(sessionUrl)).json();
                    window.__generationInputs = [];
                    SessionValidator.validateGeneratedContent = () => ({valid: true, errors: [], warnings: []});
                    window.AiCopilot.generateSession = async input => {
                        window.__generationInputs.push(structuredClone(input));
                        return structuredClone(window.__sessionFixture);
                    };
                }""",
                {"planUrl": PLAN_FIXTURE, "sessionUrl": SESSION_FIXTURE},
            )

            # Abrir una planificación no debe contaminar una nueva sesión individual.
            page.evaluate(f"window.PlanningView.open('{PLAN_ID}')")
            page.locator('[data-planning-view-action="close"]').click()
            page.evaluate("window.LandingRouter.showHome(false)")
            page.locator('[data-home-action="new-session"]').first.evaluate("button => button.click()")
            page.wait_for_function("!document.querySelector('#app-view').classList.contains('hidden')")
            assert page.evaluate("window.getPendingPlanningLink()") is None
            assert page.evaluate("window.getCurrentSession()") is None
            assert not page.locator("#linked-planning-context").is_visible()

            standalone = fill_and_generate(page, "UNIDAD MANUAL TEST", "Sesión standalone uno")
            standalone_input = page.evaluate("window.__generationInputs[0]")
            assert standalone["metadata"]["unidad"] == "UNIDAD MANUAL TEST"
            assert standalone.get("planning") is None
            for key in ("inheritedContextSnapshot", "planningContext", "planningContainerId", "sequenceItemId"):
                assert key not in standalone_input

            # Linked conserva la unidad y el snapshot heredados.
            page.evaluate("ConfirmDialog.show = async () => true")
            page.evaluate(f"window.PlanningView.open('{PLAN_ID}')")
            page.locator('[data-planning-view-action="generate-session"][data-sequence-item-id="session-02"]').click()
            page.wait_for_function("Boolean(window.getPendingPlanningLink())")
            linked_unit = page.locator("#input-unidad").input_value()
            assert linked_unit
            linked = fill_and_generate(page, linked_unit, "Sesión linked")
            linked_input = page.evaluate("window.__generationInputs[1]")
            assert linked["metadata"]["unidad"] == linked_unit
            assert linked["planning"]["mode"] == "linked"
            assert linked["planning"]["inheritedContextSnapshot"]
            assert linked_input["inheritedContextSnapshot"]

            # Una nueva standalone posterior vuelve a quedar completamente limpia.
            page.evaluate("window.LandingRouter.showHome(false)")
            page.locator('[data-home-action="new-session"]').first.evaluate("button => button.click()")
            page.wait_for_function("window.getCurrentSession() === null && window.getPendingPlanningLink() === null")
            standalone_after_linked = fill_and_generate(page, "OTRA UNIDAD MANUAL", "Sesión standalone dos")
            final_input = page.evaluate("window.__generationInputs[2]")
            assert standalone_after_linked["metadata"]["unidad"] == "OTRA UNIDAD MANUAL"
            assert standalone_after_linked.get("planning") is None
            assert "inheritedContextSnapshot" not in final_input
            assert not page.locator("#linked-planning-context").is_visible()
            assert not errors, errors
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    print("ui_standalone_session_regression.py: OK")


if __name__ == "__main__":
    run()
