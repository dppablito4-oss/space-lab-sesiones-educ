from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args) -> None:
        pass


def run() -> None:
    server = ThreadingHTTPServer(
        ("127.0.0.1", 0),
        partial(QuietHandler, directory=str(ROOT)),
    )
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()

    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            for width, height in ((375, 812), (768, 900), (1024, 800), (1280, 800), (1440, 1000)):
                page = browser.new_page(viewport={"width": width, "height": height})
                page_errors: list[str] = []
                page.on("pageerror", lambda error: page_errors.append(str(error)))
                response = page.goto(
                    f"http://127.0.0.1:{server.server_port}/index.html",
                    wait_until="domcontentloaded",
                )
                page.wait_for_timeout(400)

                assert response and response.status == 200
                assert not page_errors
                assert page.locator(".sidebar-tab").count() == 5
                assert page.locator('[data-tab="tab-design"]').count() == 1
                assert page.evaluate(
                    "document.documentElement.scrollWidth <= window.innerWidth"
                )
                assert not page.locator("#sidebar").evaluate(
                    "element => element.classList.contains('open')"
                )
                rail_width = page.locator("#workflow-rail").evaluate(
                    "element => element.getBoundingClientRect().width"
                )
                assert rail_width in (58, 68)
                assert page.locator("#preview-area").evaluate(
                    "element => element.getBoundingClientRect().left >= 58"
                )
                hierarchy_colors = page.evaluate("""() => {
                    const styles = getComputedStyle(document.documentElement);
                    return ['--color-background', '--color-card', '--color-card-surface', '--color-elevated', '--color-popover']
                        .map(token => styles.getPropertyValue(token).trim());
                }""")
                assert len(set(hierarchy_colors)) == 5
                step_surfaces = page.locator(".step-item").evaluate_all(
                    "elements => elements.map(element => getComputedStyle(element).backgroundColor)"
                )
                assert len(set(step_surfaces)) == 4
                if width > 1100:
                    assert page.evaluate("""() => {
                        const leading = document.querySelector('.header-leading').getBoundingClientRect();
                        const save = document.querySelector('.save-indicator').getBoundingClientRect();
                        const actions = document.querySelector('.header-actions').getBoundingClientRect();
                        return leading.right <= save.left && save.right <= actions.left;
                    }""")

                page.click('[data-tab="tab-ai"]')
                page.wait_for_timeout(250)
                assert page.locator("#sidebar").evaluate(
                    "element => element.classList.contains('open')"
                )
                assert page.locator("#btn-menu-mobile").get_attribute(
                    "aria-expanded"
                ) == "true"
                first_tab = page.locator('.sidebar-tab[data-tab="tab-ai"]')
                assert page.locator("#workflow-rail").evaluate(
                    "element => [58, 68].includes(element.getBoundingClientRect().width)"
                )
                assert first_tab.locator(".tab-copy").evaluate(
                    "element => getComputedStyle(element).visibility === 'hidden'"
                )
                assert page.locator("#btn-generate").is_visible()
                drawer_surfaces = page.evaluate("""() => [
                    getComputedStyle(document.querySelector('.session-form')).backgroundColor,
                    getComputedStyle(document.querySelector('.ai-model-card')).backgroundColor,
                    getComputedStyle(document.querySelector('.form-select')).backgroundColor
                ]""")
                assert len(set(drawer_surfaces)) == 3
                assert page.locator("#btn-generate").evaluate(
                    "element => element.getBoundingClientRect().bottom <= window.innerHeight"
                )

                first_tab.focus()
                first_tab.press("ArrowDown")
                page.wait_for_timeout(50)
                assert page.locator('[data-tab="tab-general"]').get_attribute(
                    "aria-selected"
                ) == "true"
                first_state = first_tab.locator(".tab-state").text_content()
                assert first_state == "Completado", (width, first_state)

                assert page.locator("#chatbot-container").evaluate(
                    "element => getComputedStyle(element).display === 'none'"
                )
                page.click('[data-tab="tab-design"]')
                assert page.locator("#tab-design").is_visible()
                assert page.locator('[data-tab="tab-design"]').get_attribute(
                    "aria-selected"
                ) == "true"

                if width > 500:
                    page.mouse.click(width - 20, 100)
                else:
                    page.click("#btn-close-sidebar")
                page.wait_for_timeout(220)
                assert not page.locator("#sidebar").evaluate(
                    "element => element.classList.contains('open')"
                )
                assert page.locator("#btn-menu-mobile").get_attribute(
                    "aria-expanded"
                ) == "false"

                page.click("#btn-toggle-rail")
                page.wait_for_timeout(200)
                assert page.locator("#btn-toggle-rail").get_attribute(
                    "aria-expanded"
                ) == "true"
                assert page.locator("#workflow-rail").evaluate(
                    "element => element.getBoundingClientRect().width > 150"
                )

                page.close()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()

    print("ui_smoke.py: OK (375, 768, 1024, 1280 y 1440 px)")


if __name__ == "__main__":
    run()
