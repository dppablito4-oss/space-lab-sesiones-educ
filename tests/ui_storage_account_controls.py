"""Admin restriction GUI and real uploader against isolated PostgreSQL RLS."""
import json
from pathlib import Path
import subprocess

from playwright.sync_api import expect, sync_playwright
from ui_account_recovery_smoke import SDK
from ui_admin_smoke import SDK as ADMIN_SDK
from ui_session_lifecycle_smoke import SESSION

ROOT = Path(__file__).resolve().parents[1]
STORAGE_SDK = SDK.replace('storage: {from: () => query}', '''storage: {from: () => ({
    upload:async(path)=>await (await fetch('/__storage',{method:'POST',body:JSON.stringify({actor:'user',action:'upload',path})})).json(),
    list:async()=>await (await fetch('/__storage',{method:'POST',body:JSON.stringify({actor:'user',action:'list'})})).json(),
    getPublicUrl:()=>({data:{publicUrl:location.origin+'/assets/logo.png'}})
})}''')


def run():
    process = subprocess.Popen(['node', 'tests/helpers/admin-rpc-server.mjs'], cwd=ROOT,
                               stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    output = ROOT / 'artifacts/security-fixes/storage'
    output.mkdir(parents=True, exist_ok=True)
    try:
        info = json.loads(process.stdout.readline())
        base = f'http://127.0.0.1:{info["port"]}'
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            user_context = browser.new_context(viewport={'width': 1366, 'height': 900})
            user = user_context.new_page()
            user.route('https://**/*', lambda route: route.abort())
            user.route('**/supabase-js@*', lambda route: route.fulfill(
                content_type='application/javascript', body=STORAGE_SDK))
            user.goto(base + '/index.html?ui=legacy', wait_until='domcontentloaded')
            user.wait_for_function("typeof appOpenSession==='function'")
            user.evaluate("id=>__emitAuth('SIGNED_IN',{user:{id,email:'user@example.test'}})", info['ids']['user'])
            user.evaluate('session=>{StorageManager.saveSession(session);appOpenSession(session.id)}', SESSION)
            user.wait_for_function("getCurrentSession()?.id==='session-lifecycle-smoke'")
            user.locator('[data-tab="tab-design"]').click()
            user.locator('#input-upload-logo').set_input_files(str(ROOT / 'assets/logo.png'))
            expect(user.get_by_text('Logo subido correctamente', exact=True)).to_be_visible()
            expect(user.get_by_text('¿Aplicar logo?', exact=True)).to_be_visible()
            user.get_by_role('button', name='Cancelar', exact=True).click()
            expect(user.locator('#logos-container img')).to_have_count(1)
            user.screenshot(path=str(output / 'active-upload.png'), full_page=True)

            admin_context = browser.new_context(viewport={'width': 1440, 'height': 1000})
            admin = admin_context.new_page()
            admin.route('**/supabase-js@*', lambda route: route.fulfill(
                content_type='application/javascript', body=ADMIN_SDK))
            admin.goto(base + '/admin.html', wait_until='domcontentloaded')
            admin.get_by_role('link', name='Usuarios y créditos').click()
            admin.get_by_role('button', name='user@example.test', exact=True).click()
            admin.get_by_role('button', name='Verificar segundo factor', exact=True).click()
            admin.get_by_label('Código de 6 dígitos').fill('123456')
            admin.get_by_role('button', name='Verificar código', exact=True).click()
            expect(admin.get_by_text('Segundo factor verificado', exact=True).first).to_be_visible()

            for state in ('blocked', 'suspended', 'active'):
                admin.get_by_role('button', name='user@example.test', exact=True).click()
                form = admin.locator('form').filter(has=admin.get_by_role('heading', name='Acceso y restricciones'))
                try:
                    form.locator('select[name="state"]').select_option(state, timeout=5000)
                except Exception:
                    print('Restriction failure:', state, admin.locator('main').inner_text())
                    admin.screenshot(path=str(output / 'admin-failure.png'), full_page=True)
                    raise
                form.get_by_label('Motivo del cambio (8 a 300 caracteres)').fill('Validación de Storage por interfaz')
                form.get_by_role('button', name='Revisar cambio').click()
                dialog = admin.get_by_role('dialog')
                dialog.get_by_role('textbox').fill('user@example.test')
                dialog.get_by_role('button', name='Confirmar cambio').click()
                expect(dialog).not_to_be_visible()
                user.locator('#input-upload-logo').set_input_files(str(ROOT / 'assets/logo.png'))
                if state == 'active':
                    expect(user.get_by_text('¿Aplicar logo?', exact=True)).to_be_visible()
                    user.get_by_role('button', name='Cancelar', exact=True).click()
                    expect(user.locator('#logos-container img')).to_have_count(2)
                else:
                    expect(user.locator('.toast').filter(has_text='row-level security').last).to_be_visible()
                    user.locator('#btn-refresh-logos').click()
                    expect(user.locator('#logos-container img')).to_have_count(0)
                user.screenshot(path=str(output / f'{state}.png'), full_page=True)
            browser.close()
    finally:
        process.terminate()
        process.wait(timeout=15)
    print('ui_storage_account_controls.py: real admin block/suspend/reactivate and uploader RLS passed.')


if __name__ == '__main__':
    run()
