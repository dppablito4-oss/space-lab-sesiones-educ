"""The Chromium fallback must paginate long content and configure TeX escapes."""
import json
from pathlib import Path
import sys

import pymupdf
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'backend'))
import main  # noqa: E402


def run():
    fixture = json.loads((ROOT / 'tests/fixtures/secundaria-matematica-polya.v1.json').read_text(encoding='utf-8'))
    fixture['momentos']['desarrollo']['procesos'][0]['contenido']['value'] = (
        '<p>Contenido largo para comprobar la paginación del PDF.</p>' * 80
        + r'<p>FALLBACK-END-145: calcula \(\sqrt[3]{8}\).</p>'
    )
    canonical = main.SessionDocumentV1(**fixture)
    compat = main.v1_to_legacy_pdf_payload(canonical, '')
    payload = main.SesionAprendizajeRequest(**main.normalize_sesion_data(compat))
    html = main.build_pdf_html_from_json(payload)
    assert '$x&lt;y$' in main.sanitize_rich_html('<p>$x<y$</p>')
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        try:
            page = browser.new_page()
            # This pagination test is deliberately offline; typesetting is
            # separately checked in native Word and the renderer's unit tests.
            page.route('https://**/*', lambda route: route.abort())
            page.set_content(html, wait_until='networkidle')
            delimiters = page.evaluate('window.MathJax.tex.inlineMath')
            assert delimiters[1] == [r'\(', r'\)'], delimiters
            pdf = page.pdf(print_background=True, prefer_css_page_size=True)
        finally:
            browser.close()
    with pymupdf.open(stream=pdf, filetype='pdf') as document:
        text = ''.join(page.get_text() for page in document)
        assert 'FALLBACK-END-145' in text, 'Long lesson body was clipped'
        assert len(document) >= 3
    output = ROOT / 'artifacts/math-review/fallback-long-session.pdf'
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(pdf)
    print('pdf_fallback_math_smoke.py: full long body retained; TeX delimiters correct')


if __name__ == '__main__':
    run()
