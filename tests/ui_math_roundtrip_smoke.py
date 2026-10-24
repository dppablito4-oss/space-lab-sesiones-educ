"""Browser regression: rendered KaTeX must persist as a single TeX source."""
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


def main():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        try:
            page = browser.new_page()
            page.goto('about:blank')
            page.add_script_tag(path=str(ROOT / 'js/sanitizer.js'))
            result = page.evaluate(r'''() => {
                // Representative KaTeX DOM: two render trees and an annotation.
                const formula = '<span class="katex"><span class="katex-mathml"><math><semantics>' +
                    '<mfrac><mn>1</mn><mn>2</mn></mfrac><annotation encoding="application/x-tex">' +
                    '\\frac{1}{2}</annotation></semantics></math></span>' +
                    '<span class="katex-html" aria-hidden="true">VISUAL DUPLICATE</span></span>';
                const source = '<p><strong>Calcula</strong> ' + formula + '</p>' +
                    '<span class="katex-display">' + formula + '</span>';
                const saved = SpaceLabSanitizer.sanitizeSessionHTML(source);
                const reopened = SpaceLabSanitizer.sanitizeSessionHTML(saved);
                const fragment = SpaceLabSanitizer.sanitizeFragment(source);
                const unsafe = SpaceLabSanitizer.sanitizeSessionHTML('<script>alert(1)</script>' + source);
                const comparisons = SpaceLabSanitizer.sanitizeFragment('<p>$x<y$ y $a>b$</p>');
                return {saved, reopened, fragment, unsafe, comparisons};
            }''')
            expected = r'<p><strong>Calcula</strong> $\frac{1}{2}$</p>$$\frac{1}{2}$$'
            assert result['saved'] == expected, result
            assert result['reopened'] == expected, result
            assert result['fragment'] == expected, result
            assert result['unsafe'] == expected, result
            assert result['comparisons'] == '<p>$x&lt;y$ y $a&gt;b$</p>', result
            print('ui_math_roundtrip_smoke.py: inline/display TeX preserved once; sanitization remains safe')
        finally:
            browser.close()


if __name__ == '__main__':
    main()
