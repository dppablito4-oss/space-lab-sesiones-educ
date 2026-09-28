from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args) -> None:
        pass


SESSION = {
    "id": "session-lifecycle-smoke",
    "schemaVersion": "1.0",
    "template": "estandar",
    "metadata": {
        "institucion": "",
        "dre": "",
        "ugel": "",
        "docente": "",
        "director": "",
        "fecha": "",
        "nivel": "Secundaria",
        "grado": "2",
        "seccion": "A",
        "area": "Matemática",
        "numeroSesion": "1",
        "duracionMinutos": 90,
        "unidad": "Unidad de prueba",
        "titulo": "Primera sesión",
        "logos": {"institucional": None, "regional": None},
    },
    "proposito": {
        "texto": "",
        "competencia": "Resuelve problemas de cantidad",
        "capacidades": [],
        "estandar": "",
        "desempeno": "",
        "conocimientos": "",
        "criterios": [],
        "evidencia": "",
        "instrumento": "",
    },
    "momentos": {
        "inicio": {"tiempoMinutos": 15, "procesos": []},
        "desarrollo": {"tiempoMinutos": 65, "procesos": []},
        "cierre": {"tiempoMinutos": 10, "procesos": []},
    },
    "htmlContent": "<p>Primera sesión generada</p>",
}


def run() -> None:
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT)))
    Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1280, "height": 800})
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto(f"http://127.0.0.1:{server.server_port}/index.html#/app", wait_until="domcontentloaded")
            page.wait_for_function("() => typeof window.appStartNewSession === 'function'")

            page.evaluate(
                """session => {
                    window.StorageManager.saveSession(session);
                    window.appOpenSession(session.id);
                    // Simula una lectura de perfil/red que nunca responde.
                    window.SupabaseClient.getUserProfile = () => new Promise(() => {});
                }""",
                SESSION,
            )
            page.wait_for_function("() => window.getCurrentSession()?.id === 'session-lifecycle-smoke'")

            result = page.evaluate(
                """() => Promise.race([
                    Promise.resolve(window.appStartNewSession()).then(() => 'resolved'),
                    new Promise(resolve => setTimeout(() => resolve('timeout'), 600))
                ])"""
            )

            assert result == "resolved", result
            assert page.evaluate("window.getCurrentSession() === null")
            assert page.locator("#empty-state").is_visible()
            assert not page.locator("#loader-overlay").is_visible()
            assert not page.locator("#load-modal").is_visible()
            assert not errors, errors

            browser.close()
    finally:
        server.shutdown()
        server.server_close()

    print("ui_session_lifecycle_smoke.py: OK")


if __name__ == "__main__":
    run()
