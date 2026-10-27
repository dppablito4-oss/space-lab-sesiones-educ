"""Real minichat DOM and client; only Auth and provider responses are fixtures."""
from functools import partial
from http.server import ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import expect, sync_playwright
from ui_account_recovery_smoke import SDK, QuietHandler
from ui_session_lifecycle_smoke import SESSION

ROOT = Path(__file__).resolve().parents[1]
SDK_WITH_AI = SDK.replace('from() { return query; },', '''
    functions:{invoke:(_name,{body})=>['pedagogy_brief','summarize_brief'].includes(body.action)
        ? new Promise((resolve,reject)=>window.pendingBrief.push({resolve,reject}))
        : Promise.resolve({data:{ok:true},error:null})},
    from() { return query; },''') + '\nwindow.pendingBrief=[];'


def run():
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
    Thread(target=server.serve_forever, daemon=True).start()
    output = ROOT / 'artifacts/security-fixes/minichat'
    output.mkdir(parents=True, exist_ok=True)
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            page = browser.new_page(viewport={'width': 1366, 'height': 900})
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.route('https://**/*', lambda route: route.abort())
            page.route('**/supabase-js@*', lambda route: route.fulfill(
                content_type='application/javascript', body=SDK_WITH_AI))
            page.goto(f'http://127.0.0.1:{server.server_port}/index.html?ui=legacy', wait_until='domcontentloaded')
            page.wait_for_function("typeof window.appOpenSession==='function'")
            page.evaluate("__emitAuth('SIGNED_IN',{user:{id:'account-a',email:'a@example.test'}})")
            page.evaluate('''session=>{
                StorageManager.saveSession(session); appOpenSession(session.id);
                window.briefEvents=[];
                document.addEventListener('pedagogy-brief-ready',event=>briefEvents.push(event.detail));
            }''', SESSION)
            page.wait_for_function("getCurrentSession()?.id==='session-lifecycle-smoke'")
            page.locator('[data-tab="tab-ai"]').click()
            page.locator('#btn-pedagogy-brief').click()
            try:
                page.wait_for_function('pendingBrief.length===1', timeout=5000)
            except Exception:
                page.screenshot(path=str(output / 'startup-failure.png'), full_page=True)
                print(page.evaluate('''()=>({pending:pendingBrief.length,user:SupabaseClient.getSessionUserSync(),
                    modal:!!document.getElementById('pedagogy-brief-modal'),
                    messages:document.getElementById('pb-messages')?.textContent,
                    toasts:document.querySelector('#toast-container')?.textContent})'''))
                raise
            page.evaluate('''()=>pendingBrief[0].resolve({data:
                '<strong>Texto válido</strong><img src=x onerror="window.briefXss=true">'+
                '<svg onload="window.briefXss=true"></svg><script>window.briefXss=true</script>',error:null})''')
            expect(page.locator('.pb-bubble-ai strong')).to_have_text('Texto válido')
            assert page.locator('.pb-bubble-ai img,.pb-bubble-ai svg,.pb-bubble-ai script').count() == 0
            assert not page.evaluate('window.briefXss===true')
            page.wait_for_function("getComputedStyle(document.querySelector('.pb-panel')).opacity==='1'")
            page.screenshot(path=str(output / 'sanitized-ai.png'), full_page=True)
            page.locator('#pb-input').fill('Un enfoque con ejemplos cotidianos')
            page.locator('#pb-send-btn').click()
            page.wait_for_function('pendingBrief.length===2')
            page.evaluate("pendingBrief[1].resolve({data:'[LISTO_PARA_GENERAR] Listo',error:null})")
            expect(page.locator('#pb-generate-btn')).to_be_visible()
            page.locator('#pb-generate-btn').click()
            page.wait_for_function('pendingBrief.length===3')
            page.evaluate('''()=>{
                __emitAuth('SIGNED_IN',{user:{id:'account-b',email:'b@example.test'}});
                PedagogyBrief.open({area:'Cuenta B',titulo:'Documento B'});
            }''')
            page.wait_for_function('pendingBrief.length===4')
            # The real client rejects A's response; its catch must not affect B.
            page.evaluate("pendingBrief[2].resolve({data:'RESUMEN PRIVADO A',error:null})")
            page.evaluate("pendingBrief[3].resolve({data:'Respuesta vigente B',error:null})")
            expect(page.locator('#pb-messages')).to_contain_text('Respuesta vigente B')
            expect(page.locator('.pb-subtitle')).to_contain_text('Documento B')
            expect(page.locator('#pedagogy-brief-modal')).to_be_visible()
            assert page.evaluate('briefEvents.length') == 0
            assert 'RESUMEN PRIVADO A' not in page.locator('body').inner_text()
            page.wait_for_function("getComputedStyle(document.querySelector('.pb-panel')).opacity==='1'")
            page.screenshot(path=str(output / 'account-switch.png'), full_page=True)
            # Reopening within the same account also invalidates pending answers.
            page.locator('#pb-input').fill('Pregunta anterior')
            page.locator('#pb-send-btn').click()
            page.wait_for_function('pendingBrief.length===5')
            page.locator('#pb-close-btn').click()
            page.evaluate("PedagogyBrief.open({area:'Cuenta B',titulo:'Documento nuevo'})")
            page.wait_for_function('pendingBrief.length===6')
            page.evaluate("pendingBrief[4].resolve({data:'RESPUESTA VENCIDA',error:null})")
            page.evaluate("pendingBrief[5].resolve({data:'Nueva conversación',error:null})")
            expect(page.locator('#pb-messages')).to_contain_text('Nueva conversación')
            assert 'RESPUESTA VENCIDA' not in page.locator('#pb-messages').inner_text()
            page.evaluate('''()=>{
                window.savedSanitizer=window.SpaceLabSanitizer;
                window.SpaceLabSanitizer=null;
                PedagogyBrief.open({area:'Cuenta B',titulo:'Sin sanitizador disponible'});
            }''')
            page.wait_for_function('pendingBrief.length===7')
            page.evaluate('''pendingBrief[6].resolve({data:'<img src=x onerror="window.briefXss=true">',error:null})''')
            expect(page.locator('.pb-bubble-ai')).to_have_text('<img src=x onerror="window.briefXss=true">')
            assert page.locator('.pb-bubble-ai img').count() == 0
            assert not page.evaluate('window.briefXss===true')
            page.evaluate('window.SpaceLabSanitizer=window.savedSanitizer')
            assert not errors, errors
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    print('ui_pedagogy_brief_security.py: XSS blocked; real-client A/B summary and reopen races blocked.')


if __name__ == '__main__':
    run()
