from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args) -> None:
        pass


def has_hidden_class(page, selector: str) -> bool:
    return page.locator(selector).evaluate("element => element.classList.contains('hidden')")


def run() -> None:
    server = ThreadingHTTPServer(
        ("127.0.0.1", 0),
        partial(QuietHandler, directory=str(ROOT)),
    )
    Thread(target=server.serve_forever, daemon=True).start()

    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            for width, height in ((375, 812), (1280, 800)):
                page = browser.new_page(viewport={"width": width, "height": height})
                page.add_init_script(
                    "Object.defineProperty(navigator, 'webdriver', { get: () => false });"
                )
                page_errors: list[str] = []
                page.on("pageerror", lambda error: page_errors.append(str(error)))
                response = page.goto(
                    f"http://127.0.0.1:{server.server_port}/index.html",
                    wait_until="domcontentloaded",
                )
                page.wait_for_function("window.AuthUi && window.SpaceLabExportController")

                assert response and response.status == 200

                page.locator('[data-action="open-login"]').first.click()
                assert not has_hidden_class(page, "#auth-modal")
                page.locator("#btn-close-auth").click()
                assert has_hidden_class(page, "#auth-modal")

                page.locator("#link-terms-footer").click()
                assert not has_hidden_class(page, "#terms-modal")
                page.locator("#btn-close-terms").click()
                assert has_hidden_class(page, "#terms-modal")

                page.evaluate("window.location.hash = '#/app'")
                page.wait_for_function(
                    "!document.getElementById('app-view').classList.contains('hidden')"
                )

                page.evaluate(
                    """() => {
                        Storage.getAllSessions = () => [{
                            id: 'composition-smoke',
                            metadata: { titulo: 'Sesión de prueba', area: 'Arte', grado: '1°' },
                            lastSaved: new Date().toISOString()
                        }];
                        document.getElementById('btn-load').click();
                    }"""
                )
                assert not has_hidden_class(page, "#load-modal")
                page.locator("#btn-close-load").click()
                assert has_hidden_class(page, "#load-modal")

                page.evaluate(
                    """() => {
                        const controller = window.SpaceLabExportController.create({
                            state: {},
                            dom: {},
                            parseMinutes: () => 0,
                            saveCurrentState: () => {}
                        });
                        controller.showEngineModal();
                    }"""
                )
                assert not has_hidden_class(page, "#engine-required-modal")
                page.locator("#engine-modal-cancel").click()
                assert has_hidden_class(page, "#engine-required-modal")

                page.evaluate(
                    """() => {
                        window.__compositionConfirmResult = 'pending';
                        ConfirmDialog.show({
                            title: 'Prueba de composición',
                            message: 'El diálogo conserva sus listeners.'
                        }).then(result => { window.__compositionConfirmResult = result; });
                    }"""
                )
                assert not has_hidden_class(page, "#confirm-dialog")
                page.locator("#confirm-accept").click()
                page.wait_for_function("window.__compositionConfirmResult === true")
                assert has_hidden_class(page, "#confirm-dialog")
                assert not page_errors, (width, page_errors)
                page.close()

            browser.close()
    finally:
        server.shutdown()
        server.server_close()

    print("ui_global_modals_smoke.py: OK (375 y 1280 px)")


if __name__ == "__main__":
    run()
