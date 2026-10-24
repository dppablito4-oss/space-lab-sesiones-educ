"""A delayed login completion must not replace a session the teacher has started."""
import json
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
from ui_session_lifecycle_smoke import SESSION

ROOT=Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self,*_args):
        pass


def run():
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=str(ROOT)))
    Thread(target=server.serve_forever,daemon=True).start()
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True)
            for route in ('#/app','#/landing'):
                page=browser.new_page(viewport={'width':1440,'height':1000},reduced_motion='reduce')
                page.goto(f'http://127.0.0.1:{server.server_port}/index.html{route}',wait_until='domcontentloaded')
                page.wait_for_function('Boolean(window.SpaceLabReactBridge?.isReady())')
                page.evaluate('''session=>{
                    let current=null;
                    const user={id:'delayed-login-teacher',email:'qa@example.invalid'};
                    SupabaseClient.getSessionUserSync=()=>current;
                    SupabaseClient.getCurrentUser=async()=>current;
                    SupabaseClient.getUserRole=async()=> 'user';
                    SupabaseClient.getUserProfile=async()=>null;
                    SupabaseClient.saveSessionCloud=async()=>true;
                    SupabaseClient.signIn=async()=>{
                        current=user;
                        StorageManager.saveSession({...session,id:'older-saved-session'});
                        return {user};
                    };
                    StorageManager.syncSessions=()=>new Promise(resolve=>{window.__releaseLoginSync=()=>resolve(true)});
                    const reload=window.appReloadSessions;
                    window.appReloadSessions=options=>{window.__reloadOptions=options;reload(options)};
                }''',SESSION)
                if route=='#/app':page.locator('.sl-account').click()
                else:page.locator('#landing-view [data-action="open-login"]').first.click()
                page.locator('#auth-email').fill('qa@example.invalid')
                page.locator('#auth-password').fill('synthetic-test-password')
                page.locator('#btn-submit-auth').click()
                page.wait_for_function('Boolean(window.__releaseLoginSync)')
                page.locator('#auth-modal').wait_for(state='hidden')
                if route=='#/landing':page.locator('#landing-view [data-action="enter-app"]').first.click()
                page.locator('#react-titulo').fill('Mi borrador mientras termina la sincronización')
                page.evaluate('window.__releaseLoginSync()')
                page.wait_for_function("!document.getElementById('btn-submit-auth').disabled")
                assert page.locator('.sl-app').is_visible()
                assert page.locator('#react-titulo').input_value()=='Mi borrador mientras termina la sincronización'
                assert page.evaluate('window.__reloadOptions.preserveEditor') is True
                assert page.evaluate('window.getCurrentSession()') is None
                page.close()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    print('ui_auth_editor_navigation_smoke.py: delayed login preserves route, fields and new draft (Auth/cloud mocked)')


if __name__=='__main__':
    run()
