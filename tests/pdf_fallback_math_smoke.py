"""The offline Chromium fallback must paginate and typeset all TeX delimiters."""
import asyncio
import json
from pathlib import Path
import sys
from tempfile import NamedTemporaryFile

import pymupdf
from playwright.async_api import async_playwright

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
    async def render():
        async with async_playwright() as playwright:
            browser = await playwright.chromium.launch(headless=True)
            try:
                return await main.render_pdf_html(browser, html, typeset_math=True)
            finally:
                await browser.close()
    pdf = asyncio.run(render())
    with pymupdf.open(stream=pdf, filetype='pdf') as document:
        text = ''.join(page.get_text() for page in document)
        assert 'FALLBACK-END-145' in text, 'Long lesson body was clipped'
        assert len(document) >= 3
        assert r'\sqrt' not in text, 'Local MathJax must replace TeX even with scripts/network disabled'
    output_dir = ROOT / 'artifacts/math-review'
    output_dir.mkdir(parents=True, exist_ok=True)
    # A previous QA PDF may still be open in a Windows viewer. Preserve it.
    with NamedTemporaryFile(prefix='fallback-long-session-', suffix='.pdf', dir=output_dir, delete=False) as output:
        output.write(pdf)
    print('pdf_fallback_math_smoke.py: full long body retained; offline TeX rendered without document scripts')


if __name__ == '__main__':
    run()
