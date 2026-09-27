"""End-to-end PlanningView ↔ linked session round trip at mobile and desktop widths."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PLANNING_FIXTURE = "data/pedagogy/fixtures/secondary_math_project_unit.v2.json"
SESSION_FIXTURE = "tests/fixtures/secundaria-matematica-polya.v1.json"
PLAN_ID = "plan-secondary-math-finance-001"


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def seed(page):
    page.evaluate(
        """async ({ planningUrl, sessionUrl }) => {
            const planning = await (await fetch(planningUrl)).json();
            const session = await (await fetch(sessionUrl)).json();
            localStorage.removeItem(window.PlanningRepository.STORAGE_KEY);
            window.PlanningRepository.create({ validator: window.PlanningContainerV2 }).save(planning);
            window.__roundtripSession = session;
            window.__generationCalls = 0;
            SessionValidator.validateGeneratedContent = () => ({ valid: true, errors: [], warnings: [] });
            window.AiCopilot.generateSession = async () => {
                window.__generationCalls += 1;
                const generated = structuredClone(window.__roundtripSession);
                generated.id = `linked-roundtrip-${window.__generationCalls}`;
                return generated;
            };
        }""",
        {"planningUrl": PLANNING_FIXTURE, "sessionUrl": SESSION_FIXTURE},
    )


def planning(page):
    return page.evaluate(
        "id => window.PlanningRepository.create({ validator: window.PlanningContainerV2 }).get(id)",
        PLAN_ID,
    )


def generate_and_save(page, sequence_id):
    page.locator(
        f'[data-planning-view-action="generate-session"][data-sequence-item-id="{sequence_id}"]'
    ).click()
    page.locator("#btn-generate").evaluate("button => button.click()")
    page.wait_for_function(
        "id => window.getCurrentSession()?.planning?.sequenceItemId === id", arg=sequence_id
    )
    page.locator("#btn-save").evaluate("button => button.click()")
    page.wait_for_function(
        "({ planId, itemId }) => window.PlanningRepository.create({ validator: window.PlanningContainerV2 })"
        ".get(planId).sequence.find(item => item.id === itemId).status === 'generated'",
        arg={"planId": PLAN_ID, "itemId": sequence_id},
    )
    return page.evaluate("window.getCurrentSession().id")


def run_width(browser, port, width):
    context = browser.new_context(viewport={"width": width, "height": 900})
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(f"http://127.0.0.1:{port}/index.html", wait_until="domcontentloaded")
    page.evaluate(
        """() => {
            window.SupabaseClient.getCurrentUser = async () => ({ id: 'roundtrip-teacher' });
            window.SupabaseClient.getUserProfile = async () => null;
            window.SupabaseClient.getPlanningRecordsCloud = async () => [];
            window.SupabaseClient.savePlanningRecordCloud = async () => true;
            window.SupabaseClient.saveSessionCloud = async () => true;
        }"""
    )
    seed(page)
    page.evaluate("window.LandingRouter.showApp(false)")
    page.evaluate(f"window.PlanningView.open('{PLAN_ID}')")

    first = page.locator('[data-sequence-card-id="session-01"]')
    assert "Planeada" in first.inner_text()
    assert first.locator('[data-planning-view-action="generate-session"]').count() == 1
    assert page.locator('[data-sequence-card-id="session-03"] [data-planning-view-action]').count() == 0

    first_id = generate_and_save(page, "session-01")
    context_bar = page.locator("#linked-planning-context")
    assert context_bar.is_visible()
    assert "Unidad: Tomamos decisiones financieras responsables" in context_bar.inner_text()
    assert "Sesión 1 de 3" in context_bar.inner_text()
    page.locator("#btn-return-planning").evaluate("button => button.click()")

    first = page.locator('[data-sequence-card-id="session-01"]')
    assert first.evaluate("el => document.activeElement === el")
    assert "Generada" in first.inner_text()
    assert first.locator('[data-planning-view-action="open-session"]').count() == 1
    revision_after_first = planning(page)["revision"]
    assert planning(page)["status"] == "reviewed"

    calls_before_open = page.evaluate("window.__generationCalls")
    first.locator('[data-planning-view-action="open-session"]').click()
    page.wait_for_function("id => window.getCurrentSession()?.id === id", arg=first_id)
    assert page.locator("#planning-dialog").evaluate("el => !el.open")
    assert page.evaluate("window.__generationCalls") == calls_before_open
    assert context_bar.is_visible()

    # An unsaved edit must offer the existing three-way lifecycle; cancel keeps the editor.
    page.locator("#session-sheet").evaluate(
        "el => { el.insertAdjacentHTML('beforeend', '<p>cambio pendiente</p>'); el.dispatchEvent(new Event('input', { bubbles: true })); }"
    )
    page.evaluate("() => { ConfirmDialog.show = async () => 'cancel'; }")
    page.locator("#btn-return-planning").evaluate("button => button.click()")
    page.wait_for_timeout(100)
    assert page.locator("#planning-dialog").evaluate("el => !el.open")
    assert page.evaluate("window.getCurrentSession().id") == first_id
    page.evaluate("() => { ConfirmDialog.show = async options => options.showDenyButton ? 'deny' : true; }")
    page.locator("#btn-return-planning").evaluate("button => button.click()")
    first.locator('[data-planning-view-action="open-session"]').wait_for()
    assert page.evaluate("window.__generationCalls") == calls_before_open

    # The next item receives a fresh link and an independent snapshot.
    page.evaluate("() => { ConfirmDialog.show = async options => options.showDenyButton ? 'confirm' : true; }")
    second_id = generate_and_save(page, "session-02")
    assert second_id != first_id
    page.locator("#btn-return-planning").evaluate("button => button.click()")
    second = page.locator('[data-sequence-card-id="session-02"]')
    assert "Generada" in first.inner_text()
    assert "Generada" in second.inner_text()
    assert planning(page)["revision"] == revision_after_first == 1
    assert planning(page)["status"] == "reviewed"
    sessions = page.evaluate(
        "window.StorageManager.getAllSessions().filter(item => item.planning?.mode === 'linked')"
    )
    links = {item["planning"]["sequenceItemId"] for item in sessions}
    assert {"session-01", "session-02"}.issubset(links)
    assert page.evaluate("window.__generationCalls") == 2

    # A deleted linked document leaves an explicit unavailable state and never regenerates.
    page.evaluate("id => window.StorageManager.deleteSession(id)", first_id)
    page.evaluate(f"window.PlanningView.open('{PLAN_ID}', {{ focusSequenceItemId: 'session-01' }})")
    first = page.locator('[data-sequence-card-id="session-01"]')
    assert "Sesión no disponible" in first.inner_text()
    assert first.locator('[data-planning-view-action="generate-session"]').count() == 0
    assert first.locator('[data-planning-view-action="open-session"]').count() == 0
    assert page.evaluate("window.__generationCalls") == 2
    assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
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
    print("ui_planning_roundtrip_smoke.py: OK")


if __name__ == "__main__":
    run()
