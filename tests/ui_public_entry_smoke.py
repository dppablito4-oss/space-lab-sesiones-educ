"""Compare the actual Pages entry with the local React build, not just the preview."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright
from ui_planning_smoke import MOCK_CLOUD

ROOT=Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self,*_args):
        pass


def start_server(directory):
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=str(directory)))
    Thread(target=server.serve_forever,daemon=True).start()
    return server


def run():
    servers=[start_server(ROOT),start_server(ROOT/'artifacts/react-preview-dist')]
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True)
            for width in (390,1440):
                palettes=[]
                for server in servers:
                    page=browser.new_page(viewport={'width':width,'height':1000},reduced_motion='reduce')
                    errors=[]
                    page.on('pageerror',lambda error:errors.append(str(error)))
                    base=f'http://127.0.0.1:{server.server_port}/'
                    page.goto(base+'index.html#/sessions/new',wait_until='domcontentloaded')
                    page.locator('.sl-app').wait_for()
                    assert page.locator('#react-preview-root').count()==1
                    assert page.locator('#session-form').count()==1
                    logo=page.locator('.sl-mobile-brand .sl-brand-logo' if width<800 else '.sl-sidebar .sl-brand-logo')
                    assert logo.is_visible()
                    assert logo.get_attribute('src')=='assets/favicon.svg'
                    assert logo.evaluate('image=>image.complete && image.naturalWidth>0')
                    assert page.locator('.sl-main').evaluate('e=>e.scrollWidth<=e.clientWidth')
                    page.locator('#react-titulo').fill('La misma interfaz publicada y local')
                    assert page.locator('#input-titulo').input_value()=='La misma interfaz publicada y local'
                    page.locator('#react-grado').select_option('2°')
                    page.locator('#react-area').select_option('Matemática')
                    page.evaluate("Toast.success('Acceso de prueba confirmado')")
                    page.get_by_role('button',name='Continuar',exact=True).click()
                    assert page.locator('#react-step-heading').inner_text()=='Define los aprendizajes'
                    page.evaluate("SpaceLabTheme.setPreference('dark')")
                    palettes.append(page.evaluate('''()=>Object.fromEntries(['.sl-app','.sl-primary-button','.sl-step.current','.sl-sidebar'].map(selector=>{const style=getComputedStyle(document.querySelector(selector));return [selector,[style.backgroundColor,style.backgroundImage,style.color]]}))'''))
                    page.evaluate(MOCK_CLOUD)
                    if width<800:page.get_by_role('button',name='Abrir navegación').click()
                    page.get_by_role('button',name='Mi espacio',exact=True).click()
                    page.locator('#home-view').wait_for(state='visible')
                    assert not page.locator('.sl-app').count()
                    page.locator('[data-home-action="new-session"]').first.click()
                    page.locator('.sl-app').wait_for()
                    assert page.locator('#react-step-heading').inner_text()=='Cuéntanos sobre tu clase'
                    if width<800:page.get_by_role('button',name='Abrir navegación').click()
                    page.get_by_role('button',name='Unidades y experiencias',exact=True).click()
                    page.locator('.sl-planning-surface #planning-dialog[open]').wait_for()
                    page.evaluate("SupabaseClient.getUserEntitlements=async()=>({ok:true,features:{'planning.unit':true}})")
                    page.locator('[data-type="unit"]').click()
                    page.locator('[data-planning-action="mode-manual"]').click()
                    page.locator('[data-path="identity.title"]').fill('Unidad desde la entrada pública')
                    page.locator('[data-path="identity.duration.value"]').fill('3')
                    page.locator('[data-planning-action="save"]').click()
                    page.locator('#planning-notice').filter(has_text='Borrador guardado').wait_for()
                    if width<800:page.get_by_role('button',name='Abrir navegación').click()
                    page.get_by_role('button',name='Crear sesión',exact=True).click()
                    page.locator('.sl-main').wait_for()
                    page.get_by_role('button',name='Modo avanzado',exact=True).click()
                    page.get_by_role('button',name='Volver al nuevo generador').click()
                    page.locator('.sl-main').wait_for()
                    assert not errors,errors
                    page.close()
                assert palettes[0]==palettes[1],(width,palettes)
            page=browser.new_page()
            base=f'http://127.0.0.1:{servers[0].server_port}/'
            page.goto(base+'index.html?ui=legacy#/app',wait_until='domcontentloaded')
            page.locator('#app-view').wait_for(state='visible')
            page.wait_for_function("!document.getElementById('react-preview-root')")
            assert page.evaluate('!window.SpaceLabReactBridge')
            page.close()
            page=browser.new_page()
            page.route('**/assets/react-ui/app.js*',lambda route:route.abort())
            page.goto(base+'index.html#/sessions/new',wait_until='domcontentloaded')
            page.locator('#app-view').wait_for(state='visible')
            page.wait_for_function('Boolean(window.appStartNewSession)')
            assert page.locator('#session-form').count()==1
            assert page.evaluate("document.body.dataset.reactPreview !== 'wizard'")
            page.close()
            browser.close()
    finally:
        for server in servers:
            server.shutdown()
            server.server_close()
    print('ui_public_entry_smoke.py: public/local parity; mobile/desktop; home; planning; legacy and failed-bundle fallback OK')


if __name__=='__main__':
    run()
