"""Browser + real PostgreSQL RPC integration; Auth/MFA use an isolated fixture.

The fixture does not assert Supabase Auth enrollment or a deployed environment.
SQL policies/accounting are exercised separately and through the actual UI here.
"""
import json
import subprocess
from pathlib import Path

from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
SDK = r"""
window.fixtureActor='admin';window.fixtureAal='aal1';window.fixtureCallbacks=[];
window.supabase={createClient:()=>({
 rpc:async(name,args)=>{const result=await (await fetch('/__rpc',{method:'POST',body:JSON.stringify({name,args,actor:window.fixtureActor,aal:window.fixtureAal})})).json();if(name==='admin_cc_write'&&window.fixtureLoseReply){window.fixtureLoseReply=false;throw Error('Respuesta perdida de prueba; reintenta.')}return result},
 auth:{
  getSession:async()=>({data:{session:window.fixtureActor?{user:{id:window.fixtureActor}}:null},error:null}),
  onAuthStateChange:cb=>{window.fixtureCallbacks.push(cb);return {data:{subscription:{unsubscribe(){}}}}},
  signOut:async()=>{window.fixtureActor=null;window.fixtureCallbacks.forEach(cb=>cb('SIGNED_OUT',null));return {error:null}},
  mfa:{listFactors:async()=>({data:{totp:[{id:'fixture-totp',status:'verified'}]},error:null}),
   challengeAndVerify:async()=>{window.fixtureAal='aal2';return {data:{},error:null}}
  }
 }
})};
"""


def run():
    process = subprocess.Popen(['node', 'tests/helpers/admin-rpc-server.mjs'], cwd=ROOT,
                               stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    try:
        info = json.loads(process.stdout.readline())
        base = f"http://127.0.0.1:{info['port']}/admin.html"
        output = ROOT / 'artifacts/admin-validation'
        output.mkdir(parents=True, exist_ok=True)
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            page = browser.new_page(viewport={'width': 1440, 'height': 1000}, reduced_motion='reduce')
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.route('**/supabase-js@2.39.8', lambda route: route.fulfill(content_type='text/javascript', body=SDK))
            page.goto(base, wait_until='domcontentloaded')
            expect(page.get_by_role('heading', name='Vista general', exact=True)).to_be_visible()
            expect(page.get_by_text('Usuarios registrados', exact=True)).to_be_visible()
            expect(page.locator('.ac-kpis strong').first).to_have_text('4')
            assert page.locator('.ac-brand img').evaluate('img=>img.complete&&img.naturalWidth>0')
            page.get_by_role('link', name='Usuarios y créditos').click()
            page.get_by_role('button', name='user@example.test', exact=True).click()
            credit_form = page.locator('form').filter(has=page.get_by_role('heading', name='Ajustar créditos'))
            expect(credit_form.get_by_role('button', name='Revisar cambio')).to_be_disabled()
            page.get_by_role('button', name='Verificar segundo factor', exact=True).click()
            page.get_by_label('Código de 6 dígitos').fill('123456')
            page.get_by_role('button', name='Verificar código', exact=True).click()
            expect(page.get_by_text('Segundo factor verificado', exact=True).first).to_be_visible()
            credit_form.get_by_label('Cantidad a añadir o retirar').fill('5')
            credit_form.get_by_label('Motivo del cambio (8 a 300 caracteres)').fill('Créditos de validación GUI')
            credit_form.get_by_role('button', name='Revisar cambio').click()
            dialog = page.get_by_role('dialog')
            expect(dialog).to_be_visible()
            expect(dialog.get_by_role('button', name='Confirmar cambio')).to_be_disabled()
            dialog.get_by_role('textbox').fill('user@example.test')
            page.evaluate('window.fixtureLoseReply=true')
            dialog.get_by_role('button', name='Confirmar cambio').click()
            expect(dialog.get_by_role('alert')).to_contain_text('Respuesta perdida')
            # PostgreSQL committed the first request. Retrying the same proposal
            # must reuse its key and display five credits, not ten.
            dialog.get_by_role('button', name='Confirmar cambio').click()
            expect(dialog).not_to_be_visible()
            expect(credit_form.get_by_text('5', exact=True)).to_be_visible()
            page.get_by_role('link', name='Auditoría', exact=True).click()
            expect(page.get_by_role('cell', name='Créditos de validación GUI', exact=True)).to_be_visible()
            page.get_by_role('link', name='Operación de la beta', exact=True).click()
            expect(page.get_by_role('heading', name='Controles operativos')).to_be_visible()
            runtime_form = page.locator('form').filter(has=page.get_by_label('Permitir nuevas generaciones de IA'))
            runtime_form.get_by_label('Permitir nuevas generaciones de IA').uncheck()
            runtime_form.get_by_label('Motivo del cambio (8 a 300 caracteres)').fill('Pausa de validación GUI')
            runtime_form.get_by_role('button', name='Revisar cambio').click()
            dialog.get_by_role('textbox').fill('CONFIRMAR')
            dialog.get_by_role('button', name='Confirmar cambio').click()
            expect(dialog).not_to_be_visible()
            expect(page.get_by_label('Permitir nuevas generaciones de IA')).not_to_be_checked()
            assert page.evaluate("async()=>!(await SupabaseClient.client.rpc('admin_cc_read',{p_resource:'runtime',p_query:{}})).data.aiEnabled")
            page.get_by_label('Tema', exact=True).select_option('dark')
            assert page.locator('html').get_attribute('data-theme') == 'dark'
            assert page.locator('.ac-layout').evaluate("el=>getComputedStyle(el).backgroundColor") == 'rgb(5, 5, 6)'
            page.screenshot(path=str(output / 'desktop-dark.png'), full_page=True)
            page.get_by_label('Tema', exact=True).select_option('light')
            page.screenshot(path=str(output / 'desktop-light.png'), full_page=True)
            page.set_viewport_size({'width': 390, 'height': 844})
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            page.get_by_role('button', name='Abrir menú').click()
            expect(page.get_by_role('link', name='Usuarios y créditos')).to_be_visible()
            page.get_by_role('link', name='Usuarios y créditos').click()
            expect(page.get_by_role('heading', name='Usuarios y créditos')).to_be_visible()
            page.screenshot(path=str(output / 'mobile-light.png'), full_page=True)
            page.get_by_role('button', name='Salir', exact=True).click()
            expect(page.get_by_role('heading', name='Acceso protegido')).to_be_visible()
            expect(page.locator('.ac-table')).to_have_count(0)
            assert not errors, errors
            page.close()
            # A teacher must see a denied state, never admin metrics.
            page = browser.new_page()
            page.route('**/supabase-js@2.39.8', lambda route: route.fulfill(
                content_type='text/javascript', body=SDK.replace("fixtureActor='admin'", "fixtureActor='user'")))
            page.goto(base, wait_until='domcontentloaded')
            expect(page.get_by_text('Tu cuenta no tiene permiso para esta operación.', exact=True)).to_be_visible()
            expect(page.locator('.ac-kpis')).to_have_count(0)
            page.close()
            # A backend that has not installed the migration must be explicit.
            page = browser.new_page()
            page.route('**/supabase-js@2.39.8', lambda route: route.fulfill(content_type='text/javascript', body=SDK))
            page.route('**/__rpc', lambda route: route.fulfill(json={
                'data': None, 'error': {'code': 'PGRST202', 'message': 'Could not find the function'}}))
            page.goto(base, wait_until='domcontentloaded')
            expect(page.get_by_text('El centro necesita su migración de base de datos. Todavía no está instalado en este entorno.', exact=True)).to_be_visible()
            browser.close()
    finally:
        process.terminate()
        process.wait(timeout=15)
    print('ui_admin_smoke.py: real SQL through browser; MFA fixture, credits, audit, themes, mobile, logout and denied access OK')


if __name__ == '__main__':
    run()
