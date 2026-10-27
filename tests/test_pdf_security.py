"""PDF policy tests; live browser/export coverage is in ui_engine_security_smoke."""
import base64
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
from urllib.error import URLError

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'backend'))
import pdf_security as security  # noqa: E402
import main  # noqa: E402


class PdfSecurityTests(unittest.TestCase):
    def test_url_allowlist_rejects_lateral_and_spoofed_targets(self):
        self.assertTrue(security.allowed_logo_url(f'https://{security.LOGO_HOST}{security.LOGO_PATH}user/logo.png'))
        for value in [
            'http://127.0.0.1/secret', 'http://localhost/secret', 'http://[::1]/secret',
            'http://169.254.169.254/latest/meta-data', 'file:///C:/secret.txt',
            f'https://{security.LOGO_HOST}.attacker.test{security.LOGO_PATH}logo.png',
            f'https://attacker@{security.LOGO_HOST}{security.LOGO_PATH}logo.png',
            f'https://{security.LOGO_HOST}:8443{security.LOGO_PATH}logo.png',
            f'https://{security.LOGO_HOST}/other-bucket/file.png',
            f'https://{security.LOGO_HOST}{security.LOGO_PATH}%2e%2e/secret',
        ]:
            with self.subTest(value=value):
                self.assertFalse(security.allowed_logo_url(value))

    def test_no_request_is_made_for_untrusted_images(self):
        with patch.object(security, 'build_opener') as opener:
            html = security.sanitize_pdf_html('''<script>evil()</script><iframe srcdoc="bad"></iframe>
                <meta http-equiv="refresh" content="0;url=http://localhost">
                <p onclick="evil()">Safe text</p><img src="http://127.0.0.1/secret">
                <svg onload="evil()"></svg><a href="javascript:evil()">Link</a>''')
            opener.assert_not_called()
        for forbidden in ['<script','<iframe','onclick','http-equiv','<img','<svg','href=']:
            self.assertNotIn(forbidden, html)
        self.assertIn('Safe text', html)

    def test_inline_raster_images_survive_and_svg_data_is_rejected(self):
        data = (ROOT / 'assets/logo.png').read_bytes()
        value = security.validated_image(data)
        self.assertEqual(security.load_logo(value), value)
        self.assertIn('data:image/png;base64,', security.sanitize_pdf_html(f'<img src="{value}">'))
        self.assertEqual(security.load_logo('data:image/svg+xml;base64,' + base64.b64encode(b'<svg/>').decode()), '')
        self.assertEqual(security.load_logo('data:image/png;base64,invalid!!'), '')

    def test_redirects_and_oversize_images_are_rejected(self):
        with self.assertRaises(URLError):
            security.NoRedirects().redirect_request(None,None,302,'',{},'http://127.0.0.1/')
        with patch.object(security, 'MAX_IMAGE_BYTES', 8):
            self.assertEqual(security.validated_image(b'\x89PNG\r\n\x1a\nlarge'), '')

    def test_math_asset_is_pinned_and_integrity_checked(self):
        self.assertTrue(security.mathjax_source())
        security.mathjax_source.cache_clear()
        with tempfile.TemporaryDirectory() as directory:
            asset = Path(directory) / 'assets/vendor/mathjax/tex-svg.js'
            asset.parent.mkdir(parents=True)
            asset.write_text('tampered', encoding='utf-8')
            with patch.object(security, 'resource_root', return_value=Path(directory)):
                with self.assertRaisesRegex(ValueError, 'recurso local'):
                    security.mathjax_source()
        security.mathjax_source.cache_clear()

    def test_json_logo_attributes_cannot_break_out(self):
        from bs4 import BeautifulSoup
        import json
        fixture = json.loads((ROOT / 'tests/fixtures/secundaria-matematica-polya.v1.json').read_text(encoding='utf-8'))
        doc = main.SessionDocumentV1(**fixture)
        doc.metadata.logos.institucional = 'x" onerror="evil()'
        payload = main.SesionAprendizajeRequest(**main.v1_to_legacy_pdf_payload(doc, 'test-token'))
        soup = BeautifulSoup(main.build_pdf_html_from_json(payload), 'html.parser')
        self.assertFalse(soup.select('[onerror]'))
        self.assertFalse(soup.find_all('script'))

    def test_browser_fallback_uses_playwright_installer(self):
        with patch.object(main.subprocess, 'run') as run:
            main.descargar_chromium_nativo()
        command = run.call_args.args[0]
        self.assertEqual(command[-2:], ['install', 'chromium'])
        self.assertTrue(command[1].endswith('cli.js'))
        self.assertNotIn('shell', run.call_args.kwargs)


if __name__ == '__main__':
    unittest.main()
