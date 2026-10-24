from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright
from ui_session_lifecycle_smoke import SESSION


ROOT = Path(__file__).resolve().parents[1]
SDK = """
window.__authCallbacks = [];
window.__session = null;
window.__emitAuth = (event, session) => {
    window.__session = session;
    for (const callback of window.__authCallbacks) callback(event, session);
};
const query = new Proxy({}, { get(_target, name) {
    if (name === 'then') return resolve => resolve({ data: [], error: null });
    return () => query;
}});
window.supabase = { createClient: () => ({
    auth: {
        onAuthStateChange(callback) { window.__authCallbacks.push(callback); return {data:{subscription:null}}; },
        async getSession() { return {data:{session:window.__session}}; },
        async getUser() { return {data:{user:window.__session?.user || null}}; },
        async signOut() { window.__emitAuth('SIGNED_OUT', null); return {}; },
        async resetPasswordForEmail(email, options) { window.__resetRequest = {email,options}; return {}; },
        async updateUser(options) { window.__passwordUpdated = Boolean(options.password); return {}; }
    },
    from() { return query; },
    rpc: async () => ({data:{ok:true,plan:'free',features:{}},error:null}),
    storage: {from: () => query}
})};
"""


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def run():
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT)))
    Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1280, "height": 800})
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@*",
                       lambda route: route.fulfill(status=200, content_type="application/javascript", body=SDK))
            page.goto(f"http://127.0.0.1:{server.server_port}/index.html", wait_until="domcontentloaded")
            page.wait_for_function("() => typeof window.appOpenSession === 'function'")

            page.evaluate("window.AuthUi.openRegister()")
            assert page.locator('#auth-password').get_attribute('minlength') == '8'
            page.locator('#btn-close-auth').click()

            page.evaluate("window.AuthUi.openModal()")
            assert page.locator('#auth-password').get_attribute('minlength') == '1'
            page.locator("#btn-forgot-password").click()
            page.locator("#auth-email").fill("teacher@example.test")
            page.locator("#btn-submit-auth").click()
            page.wait_for_function("() => window.__resetRequest?.email === 'teacher@example.test'")
            assert page.locator("#auth-recovery-description").inner_text().startswith("Si el correo")
            page.locator("#btn-close-auth").click()

            page.evaluate("window.__emitAuth('PASSWORD_RECOVERY', {user:{id:'account-a', email:'a@example.test'}})")
            page.locator("#auth-confirm-password").wait_for(state="visible")
            page.locator("#auth-password").fill("recovered-password")
            page.locator("#auth-confirm-password").fill("recovered-password")
            page.locator("#btn-submit-auth").click()
            page.wait_for_function("() => window.__passwordUpdated === true")
            assert not page.locator("#auth-modal").is_visible()

            fixture = json.loads((ROOT / "data/pedagogy/fixtures/secondary_math_project_unit.v2.json").read_text(encoding="utf-8"))
            page.evaluate("""({session, plan}) => {
                window.StorageManager.saveSession(session);
                window.StorageManager.setCurrentSession(session);
                window.PlanningRepository.create().save(plan);
                window.appOpenSession(session.id);
            }""", {"session": SESSION, "plan": fixture})
            page.wait_for_function("() => window.getCurrentSession()?.id === 'session-lifecycle-smoke'")
            page.evaluate("document.getElementById('textarea-alumnos').value = 'Nombre privado A'")
            page.evaluate("window.__emitAuth('SIGNED_IN', {user:{id:'account-b',email:'b@example.test'}})")
            assert page.evaluate("window.StorageManager.getAllSessions().length") == 0
            assert page.evaluate("window.StorageManager.getCurrentSession()") is None
            assert page.evaluate("window.getCurrentSession()") is None
            assert page.evaluate("window.PlanningRepository.create().list().length") == 0
            assert page.locator("#textarea-alumnos").input_value() == ""
            assert not page.locator("#session-sheet").inner_text().strip()

            page.evaluate("window.__emitAuth('SIGNED_IN', {user:{id:'account-a',email:'a@example.test'}})")
            page.wait_for_function("() => window.getCurrentSession()?.id === 'session-lifecycle-smoke'")
            assert page.evaluate("window.PlanningRepository.create().list().length") == 1
            page.evaluate("""() => {
                window.__storagePrototype = Object.getPrototypeOf(localStorage);
                window.__originalSetItem = window.__storagePrototype.setItem;
                window.__storagePrototype.setItem = function(key, value) {
                    if (key.startsWith('spacelab_')) throw new DOMException('full', 'QuotaExceededError');
                    return window.__originalSetItem.call(this, key, value);
                };
                document.querySelector('#session-sheet p').textContent = 'Edición pendiente con almacenamiento lleno';
                window.StorageManager.triggerAutoSave(0);
            }""")
            page.wait_for_function("() => document.querySelector('#save-indicator .save-text').textContent.includes('Sin guardar')")
            assert 'Edición pendiente' in page.locator('#session-sheet').inner_text()
            assert page.evaluate("window.getCurrentSession() !== null")
            page.evaluate("() => { window.__storagePrototype.setItem = window.__originalSetItem; }")
            page.evaluate("window.__emitAuth('SIGNED_OUT', null)")
            assert page.evaluate("window.StorageManager.getSession('session-lifecycle-smoke')") is None
            assert not errors, errors
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    print("ui_account_recovery_smoke.py: OK (recuperación, A/B/invitado, editor y planificaciones)")


if __name__ == "__main__":
    run()
