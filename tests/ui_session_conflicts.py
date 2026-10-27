"""Recover concurrent edits through the actual editor and storage/client modules.

Default: shared HTTP database fixture and explicit Auth fixture. --live uses
temporary Supabase users; --comet --headed opens the external browser.
"""
import argparse
import json
import sys
from copy import deepcopy
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Lock, Thread
from typing import ClassVar

from playwright.sync_api import expect, sync_playwright
from ui_account_recovery_smoke import SDK
from ui_session_lifecycle_smoke import SESSION

ROOT = Path(__file__).resolve().parents[1]
FIXTURE_API = """
const makeClientBeforeRest = window.supabase.createClient;
window.supabase.createClient = (...args) => {
    const client=makeClientBeforeRest(...args),from=client.from.bind(client);
    client.from=table=>{
        if(table!=='sesiones')return from(table);
        const body={operation:'read',filters:[],user:window.__session?.user?.id};
        const query={select:()=>query,order:()=>query,
            eq:(key,value)=>{body.filters.push([key,value]);return query;},
            insert:value=>{body.operation='insert';body.payload=value;return query;},
            update:value=>{body.operation='update';body.payload=value;return query;},
            maybeSingle:()=>{body.single=true;return query;},
            then:(resolve,reject)=>fetch('/__sessions',{method:'POST',headers:{'Content-Type':'application/json'},
                body:JSON.stringify(body)}).then(response=>response.json()).then(resolve,reject)};
        return query;
    };return client;
};
"""


class Handler(SimpleHTTPRequestHandler):
    rows: ClassVar[dict] = {}
    lock = Lock()

    def log_message(self, *_args):
        pass

    def do_POST(self):
        if self.path != '/__sessions':
            self.send_error(404)
            return
        body = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        with self.lock:
            matching = [row for row in self.rows.values() if row['user_id'] == body['user']
                        and all(row.get(key) == value for key, value in body['filters'])]
            payload = body.get('payload')
            if body['operation'] == 'insert' and payload['id'] in self.rows:
                result = {'data': None, 'error': {'code': '23505'}}
            elif body['operation'] == 'insert' or body['operation'] == 'update' and matching:
                self.rows[payload['id']] = payload
                result = {'data': [{'last_saved': payload['last_saved']}], 'error': None}
            else:
                result = {'data': (matching[0] if matching else None) if body.get('single') else matching, 'error': None}
        encoded = json.dumps(result).encode()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)


def run():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--live', action='store_true')
    parser.add_argument('--comet', action='store_true')
    parser.add_argument('--headed', action='store_true')
    args = parser.parse_args()
    output = ROOT / 'artifacts/session-conflicts'
    output.mkdir(parents=True, exist_ok=True)
    suite = user = None
    if args.live:
        sys.path.insert(0, str(ROOT / 'scripts'))
        from beta_acceptance_remote import Acceptance
        suite = Acceptance(output / 'temporary-account.json')
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=str(ROOT)))
    Thread(target=server.serve_forever, daemon=True).start()
    report = {'database': 'Supabase' if suite else 'HTTP fixture', 'browser': 'Comet' if args.comet else 'Chromium', 'checks': []}
    try:
        if suite:
            user = suite.create_user('free')
        with sync_playwright() as pw:
            options = {'headless': not args.headed}
            if args.comet:
                options['executable_path'] = r'C:\Program Files\Perplexity\Comet\Application\comet.exe'
            browser = pw.chromium.launch(**options)
            context = browser.new_context(viewport={'width': 1440, 'height': 1000}, reduced_motion='reduce')
            device = browser.new_context(viewport={'width': 1366, 'height': 900}, reduced_motion='reduce')

            def open_page(owner):
                page = owner.new_page()
                if not suite:
                    page.route('**/supabase-js@*', lambda route: route.fulfill(content_type='application/javascript', body=SDK + FIXTURE_API))
                page.goto(f'http://127.0.0.1:{server.server_port}/index.html?ui=legacy#/app', wait_until='domcontentloaded')
                page.wait_for_function('window.SpaceLabFrontend?.ready')
                if user:
                    # Sign-in may trigger the application's version reload.
                    try:
                        page.evaluate('''async credentials => {
                            await SupabaseClient.signIn(credentials.email,credentials.password);
                        }''', {'email': user['email'], 'password': user['password']})
                    except Exception as error:
                        if 'Execution context was destroyed' not in str(error):
                            raise
                        page.wait_for_load_state('domcontentloaded')
                        page.wait_for_function('window.SpaceLabFrontend?.ready')
                else:
                    page.evaluate("__emitAuth('SIGNED_IN',{user:{id:'conflict-teacher',email:'conflict@example.test'}})")
                page.wait_for_function('SupabaseClient.getSessionUserSync()?.id')
                return page

            a, b = open_page(context), open_page(device)
            doc = deepcopy(SESSION)
            doc['id'] = 'session-conflict-browser'
            doc['metadata']['titulo'] = 'Versión inicial'
            doc['htmlContent'] = '<p contenteditable="true">Texto inicial</p>'
            a.evaluate('session=>StorageManager.saveSession(session)', doc)
            a.wait_for_function('id=>!!StorageManager.getSession(id)?._cloudSync?.version', arg=doc['id'])
            a.evaluate('id=>appOpenSession(id)', doc['id'])
            b.evaluate('() => StorageManager.syncSessions()')
            b.evaluate('id=>appOpenSession(id)', doc['id'])

            def save_title(page, title):
                page.evaluate('''title=>{
                    getCurrentSession().metadata.titulo=title;
                    document.getElementById('input-titulo').value=title;
                    document.getElementById('btn-save').click();
                }''', title)
                wait_cloud(page, doc['id'], title=title)

            def wait_cloud(page, document_id, *, title=None, text=None):
                page.evaluate('''async ({id,title,text})=>{
                    const deadline=Date.now()+30000;
                    while(Date.now()<deadline){
                        const row=(await SupabaseClient.getSessionsCloud()).find(row=>row.id===id);
                        if(row && (!title || row.metadata.titulo===title) && (!text || row.htmlContent.includes(text))) return;
                        await new Promise(resolve=>setTimeout(resolve,100));
                    }
                    throw new Error('Expected document did not reach Supabase');
                }''', {'id': document_id, 'title': title, 'text': text})

            def recover_body(page, text):
                page.locator('#session-sheet p[contenteditable="true"]').fill(text)
                page.evaluate("document.getElementById('btn-save').click()")
                page.wait_for_function('id=>getCurrentSession()?.id!==id && getCurrentSession()?._recoveryOf===id', arg=doc['id'])
                expect(page.locator('#session-sheet')).to_contain_text(text)
                expect(page.get_by_text('La sesión cambió en otro dispositivo.', exact=False)).to_be_visible()
                assert 'copia recuperada' in page.evaluate('getCurrentSession().metadata.titulo')
                copy_id = page.evaluate('getCurrentSession().id')
                wait_cloud(page, copy_id, text=text)
                return copy_id

            save_title(a, 'Título conservado del dispositivo A')
            first_copy = recover_body(b, 'Edición conservada del dispositivo B')
            rows = b.evaluate('()=>SupabaseClient.getSessionsCloud()')
            original = next(row for row in rows if row['id'] == doc['id'])
            assert original['metadata']['titulo'] == 'Título conservado del dispositivo A'
            assert 'Texto inicial' in original['htmlContent']
            assert first_copy != doc['id']
            report['checks'].append('Independent devices preserve both snapshots and active editor switches to recovered copy')
            b.screenshot(path=str(output / 'recovered-device.png'))

            c = open_page(context)
            c.evaluate('id=>appOpenSession(id)', doc['id'])
            save_title(a, 'Título más reciente de A')
            second_copy = recover_body(c, 'Edición conservada de la segunda pestaña')
            assert first_copy != second_copy
            report['checks'].append('Two tabs sharing localStorage preserve the remote edit and a second recovered copy')
            c.reload(wait_until='domcontentloaded')
            c.wait_for_function('window.SpaceLabFrontend?.ready')
            if not user:
                c.evaluate("__emitAuth('SIGNED_IN',{user:{id:'conflict-teacher',email:'conflict@example.test'}})")
            c.evaluate('id=>appOpenSession(id)', second_copy)
            expect(c.locator('#session-sheet')).to_contain_text('Edición conservada de la segunda pestaña')
            assert c.evaluate('() => StorageManager.syncSessions()')
            rows = c.evaluate('()=>SupabaseClient.getSessionsCloud()')
            assert len([row for row in rows if row.get('_recoveryOf') == doc['id']]) == 2
            report['checks'].append('Recovered edits survive reload and resynchronization without duplicate recovery copies')
            c.screenshot(path=str(output / 'recovered-after-reload.png'))
            browser.close()
        report['ok'] = True
        if suite:
            suite.check('Actual GUI: device/tab conflicts recovered and persisted', True)
    finally:
        server.shutdown()
        server.server_close()
        if suite:
            suite.cleanup()
        (output / ('gui-live.json' if suite else 'gui-fixture.json')).write_text(json.dumps(report, indent=2), encoding='utf-8')
    print('ui_session_conflicts.py: devices, shared tabs, recovered editor and reload OK (' + report['database'] + ')')


if __name__ == '__main__':
    run()
