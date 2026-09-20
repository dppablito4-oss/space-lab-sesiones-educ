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
            page = browser.new_page(viewport={"width": 1440, "height": 900}, reduced_motion="reduce")

            for path in ("index.html", "conexion.html", "descargas_landing.html"):
                errors: list[str] = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.goto(
                    f"http://127.0.0.1:{server.server_port}/{path}",
                    wait_until="domcontentloaded",
                )
                page.wait_for_timeout(100)
                assert not errors, (path, errors)
                assert page.locator("html").get_attribute("lang") == "es"
                assert page.locator("h1").count() >= 1

                missing_names = page.evaluate("""() => {
                    const visible = element => Boolean(element.getClientRects().length)
                        && getComputedStyle(element).visibility !== 'hidden';
                    const labelText = element => {
                        if (element.getAttribute('aria-label')) return element.getAttribute('aria-label').trim();
                        if (element.labels?.length) return [...element.labels].map(label => label.textContent.trim()).join(' ');
                        if (element.textContent?.trim()) return element.textContent.trim();
                        if (element.getAttribute('title')) return element.getAttribute('title').trim();
                        return '';
                    };
                    return [...document.querySelectorAll('button, a[href], input, select, textarea, summary')]
                        .filter(element => visible(element) && element.type !== 'hidden')
                        .filter(element => !labelText(element))
                        .map(element => `${element.tagName.toLowerCase()}#${element.id || '(sin-id)'}`);
                }""")
                assert not missing_names, (path, missing_names)

                missing_alt = page.locator("img:not([alt])").count()
                assert missing_alt == 0, (path, missing_alt)

            browser.close()
    finally:
        server.shutdown()
        server.server_close()

    print("ui_accessibility_smoke.py: OK")


if __name__ == "__main__":
    run()
