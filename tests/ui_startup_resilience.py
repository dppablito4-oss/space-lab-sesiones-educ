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
            page.route(
                "**/app-version.json?*",
                lambda route: route.fulfill(
                    status=200,
                    content_type="application/json",
                    body='{"build":"new-resilient-build","strategy":"content-sha256"}',
                ),
            )

            errors: list[str] = []
            document_urls: list[str] = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.on(
                "request",
                lambda request: document_urls.append(request.url)
                if request.resource_type == "document"
                else None,
            )
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

            page.locator("#app-update-banner").wait_for(timeout=5000)
            with page.expect_navigation(wait_until="domcontentloaded"):
                page.get_by_role("button", name="Actualizar ahora").click()
            assert any("_app_build=new-resilient-build" in url for url in document_urls)
            assert any("_app_refresh=" in url for url in document_urls)
            assert "_app_build" not in page.url
            assert page.locator("#landing-view").is_visible()

            page.locator('[data-action="open-login"]').first.click()
            assert page.locator("#auth-modal").is_visible()

            # Una lectura local de autenticación bloqueada no debe ocultar ni
            # congelar el workspace provisional.
            page.locator("#btn-close-auth").click()
            page.evaluate(
                """() => {
                    window.SupabaseClient.getSessionUser = () => new Promise(() => {});
                    window.location.hash = '#/home';
                }"""
            )
            page.wait_for_timeout(3300)
            assert page.locator("#home-view").is_visible()
            assert page.locator('[data-home-action="new-session"]').first.is_enabled()

            # Restaurar una pestaña desde BFCache limpia loaders antiguos que
            # de otro modo interceptarían todos los clics.
            page.evaluate(
                """() => {
                    const loader = document.getElementById('loader-overlay');
                    loader.classList.remove('hidden');
                    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
                }"""
            )
            assert page.locator("#loader-overlay").evaluate("el => el.classList.contains('hidden')")

            # El workspace debe reconocer la sesión local aunque la validación
            # remota de auth no responda. Cada dato del encabezado se hidrata
            # independientemente y reutiliza el usuario ya reconocido.
            page.evaluate(
                """() => {
                    const user = {
                        id: 'teacher-session-1',
                        email: 'maria.quipe@example.com',
                        user_metadata: { full_name: 'María Quispe' }
                    };
                    window.__homeSummaryUsers = [];
                    window.SupabaseClient.getSessionUser = async () => user;
                    window.SupabaseClient.getCurrentUser = () => new Promise(() => {});
                    window.SupabaseClient.getUserProfile = async sessionUser => {
                        window.__homeSummaryUsers.push(['profile', sessionUser?.id]);
                        return { docente: 'María Quispe' };
                    };
                    window.SupabaseClient.getAiCreditBalance = async sessionUser => {
                        window.__homeSummaryUsers.push(['wallet', sessionUser?.id]);
                        return { balance: 87 };
                    };
                    window.SupabaseClient.getCommercialPlan = async (_force, sessionUser) => {
                        window.__homeSummaryUsers.push(['plan', sessionUser?.id]);
                        return 'beta_teacher';
                    };
                    window.SpaceLabHome.refresh({ user });
                }"""
            )
            page.locator("#home-account-name").get_by_text("María Quispe", exact=True).wait_for()
            assert page.locator("#home-credit-count").inner_text() == "87"
            assert page.locator("#home-account-plan").inner_text() == "Plan Docente Beta"
            assert page.evaluate("window.__homeSummaryUsers") == [
                ["profile", "teacher-session-1"],
                ["wallet", "teacher-session-1"],
                ["plan", "teacher-session-1"],
            ]

            browser.close()
    finally:
        server.shutdown()
        server.server_close()

    print("ui_startup_resilience.py: OK")


if __name__ == "__main__":
    run()
