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
            page = browser.new_page(viewport={"width": 1366, "height": 768})
            page.add_init_script(
                "Object.defineProperty(navigator, 'webdriver', { get: () => false });"
            )

            # Una dependencia externa o incluso el editor completo puede fallar;
            # el shell, las rutas y el acceso deben continuar disponibles.
            page.route("https://cdn.jsdelivr.net/**", lambda route: route.abort())
            page.route("**/js/app.js?*", lambda route: route.abort())

            errors: list[str] = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            response = page.goto(
                f"http://127.0.0.1:{server.server_port}/index.html?app_version=stale",
                wait_until="domcontentloaded",
            )

            assert response and response.status == 200
            assert not errors, errors
            assert page.locator("#landing-view").is_visible()
            assert not page.locator("#home-view").is_visible()
            assert not page.locator("#app-view").is_visible()
            assert "/index.html" not in page.url
            assert "app_version" not in page.url

            page.locator('[data-action="open-login"]').first.click()
            assert page.locator("#auth-modal").is_visible()

            browser.close()
    finally:
        server.shutdown()
        server.server_close()

    print("ui_startup_resilience.py: OK")


if __name__ == "__main__":
    run()
