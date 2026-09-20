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
    Thread(target=server.serve_forever, daemon=True).start()

    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1440, "height": 900})
            page.add_init_script(
                "localStorage.setItem('spacelab_theme_preference', 'light')"
            )
            page.goto(
                f"http://127.0.0.1:{server.server_port}/index.html",
                wait_until="domcontentloaded",
            )

            assert page.locator("html").get_attribute("data-theme") == "light"
            assert page.locator("#theme-preference").input_value() == "light"

            page.locator("#theme-preference").select_option("dark")
            assert page.locator("html").get_attribute("data-theme") == "dark"
            assert page.evaluate(
                "localStorage.getItem('spacelab_theme_preference')"
            ) == "dark"

            export_menu = page.locator("#export-command-menu")
            assert not export_menu.get_attribute("open")
            page.locator("#export-command-menu > summary").click()
            assert export_menu.get_attribute("open") is not None
            assert page.locator("#btn-export-pdf").is_visible()
            assert page.locator("#btn-export-word").is_visible()

            page.locator('[data-tab="tab-design"]').click()
            advanced = page.locator("#tab-design .form-disclosure")
            assert advanced.is_visible()
            assert advanced.get_attribute("open") is None
            advanced.locator("summary").click()
            assert advanced.get_attribute("open") is not None
            assert page.locator("#select-design-font-family").is_visible()

            browser.close()
    finally:
        server.shutdown()
        server.server_close()

    print("ui_theme_smoke.py: OK")


if __name__ == "__main__":
    run()
