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
            for width, height in ((375, 812), (768, 900), (1024, 800), (1440, 1000)):
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

                if width <= 900:
                    page.click("#btn-menu-mobile")
                    assert page.locator("#sidebar").evaluate(
                        "element => element.classList.contains('open')"
                    )
                    assert page.locator("#chatbot-container").evaluate(
                        "element => getComputedStyle(element).display === 'none'"
                    )
                    page.click('[data-tab="tab-design"]')
                    assert page.locator("#tab-design").is_visible()
                    assert page.locator('[data-tab="tab-design"]').get_attribute(
                        "aria-selected"
                    ) == "true"

                page.close()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()

    print("ui_smoke.py: OK (375, 768, 1024 y 1440 px)")


if __name__ == "__main__":
    run()
