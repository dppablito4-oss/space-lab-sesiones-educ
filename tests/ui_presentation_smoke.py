import json
import os
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
    fixture = json.loads((ROOT / 'tests' / 'fixtures' / 'secundaria-matematica-polya.v1.json').read_text(encoding='utf-8'))
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
    Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            page = browser.new_page(viewport={'width': 1440, 'height': 1000})
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(f'http://127.0.0.1:{server.server_port}/index.html', wait_until='domcontentloaded')
            page.wait_for_timeout(300)
            page.evaluate("""fixture => {
                const sheet = document.querySelector('#session-sheet');
                sheet.innerHTML = Templates.render('estandar', fixture, false);
                document.querySelector('#empty-state').classList.add('hidden');
                document.querySelector('#print-preview').classList.remove('hidden');
            }""", fixture)
            page.click('[data-tab="tab-design"]')
            page.select_option('#select-design-preset', 'moderno')
            values = page.locator('#session-sheet').evaluate("""el => ({
                border: getComputedStyle(el).getPropertyValue('--theme-border-color').trim(),
                accent: getComputedStyle(el).getPropertyValue('--theme-accent-color').trim(),
                header: getComputedStyle(el).getPropertyValue('--theme-label-bg').trim(),
                overflow: el.scrollWidth <= el.clientWidth
            })""")
            assert values == {'border': '#334155', 'accent': '#0F766E', 'header': '#CCFBF1', 'overflow': True}
            assert not errors, errors
            if os.environ.get('SPACE_LAB_QA_SCREENSHOT'):
                output = ROOT / 'artifacts' / 'qa' / 'web-moderno.png'
                output.parent.mkdir(parents=True, exist_ok=True)
                page.screenshot(path=str(output), full_page=True)
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    print('ui_presentation_smoke.py: OK')


if __name__ == '__main__':
    run()
