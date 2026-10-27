"""Real engine HTTP, GUI exports and adversarial offline PDF rendering."""
from functools import partial
from http.server import ThreadingHTTPServer
import json
from pathlib import Path
import subprocess
import sys
from threading import Thread
import time

import httpx
import pymupdf
from playwright.sync_api import expect, sync_playwright
from ui_account_recovery_smoke import SDK, QuietHandler

ROOT = Path(__file__).resolve().parents[1]


class TrapHandler(QuietHandler):
    hits = []

    def do_GET(self):
        if self.path.startswith('/audit-network-hit'):
            self.hits.append(self.path)
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'PRIVATE_NETWORK_SENTINEL')
            return
        super().do_GET()


def run():
    output = ROOT / 'artifacts/security-fixes/engine'
    output.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(TrapHandler, directory=str(ROOT)))
    Thread(target=server.serve_forever, daemon=True).start()
    process = subprocess.Popen([sys.executable, 'tests/helpers/security_engine_server.py'], cwd=ROOT,
                               stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding='utf-8')
    try:
        info = json.loads(process.stdout.readline())
        engine = f'http://127.0.0.1:{info["port"]}'
        web = f'http://127.0.0.1:{server.server_port}'
        deadline = time.monotonic() + 20
        while True:
            try:
                if httpx.get(engine + '/', timeout=1).status_code == 200:
                    break
            except httpx.HTTPError:
                pass
            if time.monotonic() > deadline:
                raise RuntimeError('Isolated engine failed to start')
            time.sleep(0.1)
        body = json.dumps({'token':'invalid','html_content':'A'*70000}).encode()
        # Real transfer-encoding chunked request, beyond the configured 64 KiB.
        for data in [body, iter([body[:40000],body[40000:]])]:
            response = httpx.post(engine + '/exportar-docx', content=data,
                                  headers={'Content-Type':'application/json','Origin':web})
            assert response.status_code == 413, response.text
            assert response.headers['access-control-allow-origin'] == web
        assert httpx.get(engine + '/').status_code == 200

        fixture = json.loads((ROOT / 'tests/fixtures/secundaria-matematica-polya.v1.json').read_text(encoding='utf-8'))
        fixture['id'] = 'security-export-session'
        fixture['momentos']['desarrollo']['procesos'][0]['contenido']['value'] += (
            r'<p>OFFLINE-MATH-SECURITY: $\frac{1}{2}$, \(\sqrt[3]{8}\) y $\int_0^1 x^2 dx$.</p>'
        )
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            page = browser.new_page(viewport={'width':1366,'height':900})
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.route('https://**/*', lambda route: route.abort())
            page.route('**/supabase-js@*', lambda route: route.fulfill(
                content_type='application/javascript', body=SDK))
            page.goto(web + '/index.html?ui=legacy', wait_until='domcontentloaded')
            page.wait_for_function("typeof appOpenSession==='function'")
            page.evaluate("__emitAuth('SIGNED_IN',{user:{id:'engine-test-user',email:'engine@example.test'}})")
            page.evaluate('''({session,host,token})=>{
                localStorage.setItem('connection_token',token);
                window.LocalExportClient=LocalExportClient.create({hosts:[host]});
                StorageManager.saveSession(session);appOpenSession(session.id);
            }''', {'session':fixture,'host':f'127.0.0.1:{info["port"]}','token':info['token']})
            page.wait_for_function("document.querySelector('#btn-download-engine')?.classList.contains('btn-connected')")
            page.wait_for_function("getCurrentSession()?.id==='security-export-session'")

            def export_click(selector):
                if selector == '#btn-export-word':
                    page.locator('#btn-export-word-preview').click()
                    return
                menu = page.locator('#export-command-menu')
                if not menu.evaluate('(element)=>element.open'):
                    menu.locator('summary').click()
                try:
                    page.locator(selector).click(timeout=5000)
                except Exception:
                    page.screenshot(path=str(output / 'export-failure.png'), full_page=True)
                    print(page.locator(selector).evaluate('''el=>{
                        const result=[];while(el){const s=getComputedStyle(el);result.push({tag:el.tagName,id:el.id,
                            cls:el.className,display:s.display,visibility:s.visibility,open:el.open});el=el.parentElement;}return result;
                    }'''))
                    raise

            with page.expect_download(timeout=60000) as downloading:
                export_click('#btn-export-pdf')
            pdf_path = output / 'offline-gui-session.pdf'
            downloading.value.save_as(pdf_path)
            with pymupdf.open(pdf_path) as doc:
                text = ''.join(p.get_text() for p in doc)
                assert 'OFFLINE-MATH-SECURITY' in text, text[-1000:]
                assert r'\frac' not in text and r'\sqrt' not in text
                first = doc[0].get_pixmap(matrix=pymupdf.Matrix(1.2,1.2))
                first.save(output / 'offline-pdf-preview.png')
            with page.expect_download() as downloading:
                export_click('#btn-export-word')
            downloading.value.save_as(output / 'gui-session.docx')
            page.screenshot(path=str(output / 'gui-export-success.png'), full_page=True)

            # Send adversarial HTML through the browser, without putting it in
            # the web DOM: only the isolated renderer could hit the trap.
            trap = web + '/audit-network-hit'
            html = (f'<script>fetch("{trap}")</script><img src="{trap}">'
                    f'<style>body{{background:url({trap})}}</style>'
                    f'<iframe src="{trap}"></iframe><p>INERT-HTML-SECURITY</p>')
            status = page.evaluate('''async({url,token,html})=>{
                const result=await fetch(url+'/exportar-pdf',{method:'POST',
                    headers:{'Content-Type':'application/json'},body:JSON.stringify({token,html_content:html,titulo:'Inert'})});
                return result.status;
            }''', {'url':engine,'token':info['token'],'html':html})
            assert status == 200
            assert not TrapHandler.hits, TrapHandler.hits

            page.locator('[data-tab="tab-general"]').click()
            page.locator('#input-docente').fill('A'*70000)
            if page.locator('#sidebar').evaluate("element=>element.classList.contains('open')"):
                page.locator('#btn-close-sidebar').click()
            export_click('#btn-export-word')
            expect(page.locator('.toast').filter(has_text='413').last).to_be_visible()
            page.screenshot(path=str(output / 'gui-size-limit.png'), full_page=True)
            page.locator('[data-tab="tab-general"]').click()
            page.locator('#input-docente').fill('Docente de prueba')
            if page.locator('#sidebar').evaluate("element=>element.classList.contains('open')"):
                page.locator('#btn-close-sidebar').click()
            with page.expect_download() as downloading:
                export_click('#btn-export-word')
            downloading.value.save_as(output / 'gui-recovered.docx')
            assert not errors, errors
            browser.close()
        print('ui_engine_security_smoke.py: chunked/declared 413, GUI error/recovery, offline math PDF/DOCX and network isolation passed.')
    finally:
        process.terminate()
        process.wait(timeout=15)
        server.shutdown()
        server.server_close()


if __name__ == '__main__':
    run()
