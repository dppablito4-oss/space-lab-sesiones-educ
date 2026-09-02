from pathlib import Path
import sys

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]


def launch_browser(playwright):
    try:
        return playwright.chromium.launch(headless=True)
    except Exception:
        candidates = [
            Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
            Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
            Path(r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"),
        ]
        for executable in candidates:
            if executable.exists():
                return playwright.chromium.launch(headless=True, executable_path=str(executable))
        raise


def run() -> None:
    with sync_playwright() as playwright:
        browser = launch_browser(playwright)
        page = browser.new_page()
        page.set_content("<!doctype html><html><body></body></html>")
        page.add_script_tag(path=str(ROOT / "js" / "sanitizer.js"))

        result = page.evaluate(
            """
            () => {
                const payload = `
                    <script>window.pwned = true</script>
                    <iframe srcdoc="bad"></iframe>
                    <div onclick="window.pwned=true" style="color:red;background:url(javascript:bad)">
                        <img src="x" onerror="window.pwned=true">
                        <table><tbody><tr><td data-key="criterio" contenteditable="true">Contenido</td></tr></tbody></table>
                    </div>`;
                const session = SpaceLabSanitizer.sanitizeSessionHTML(payload);
                const fragment = SpaceLabSanitizer.sanitizeFragment(
                    '<strong>Seguro</strong><img src=x onerror=alert(1)><object>mal</object>'
                );
                const criteria = SpaceLabSanitizer.sanitizeCriteria(
                    '<li onclick=alert(1)>Primero</li><li><img src=x onerror=alert(1)>Segundo</li>'
                );
                return { session, fragment, criteria, pwned: window.pwned === true };
            }
            """
        )
        browser.close()

    forbidden = ("<script", "<iframe", "<object", "onerror", "onclick", "javascript:")
    assert not result["pwned"]
    assert all(token not in result["session"].lower() for token in forbidden)
    assert "<table>" in result["session"]
    assert 'contenteditable="true"' in result["session"]
    assert 'data-key="criterio"' in result["session"]
    assert all(token not in result["fragment"].lower() for token in forbidden)
    assert result["criteria"].count("<li>") == 2
    assert all(token not in result["criteria"].lower() for token in forbidden)

    admin_source = (ROOT / "js" / "admin.js").read_text(encoding="utf-8")
    admin_html = (ROOT / "admin.html").read_text(encoding="utf-8")
    assert 'sandbox="allow-same-origin"' in admin_source
    assert "sessionData.htmlContent" in admin_source
    assert "SpaceLabSanitizer.sanitizeSessionHTML" in admin_source
    assert "js/sanitizer.js" in admin_html

    print("frontend_security.py: OK")


if __name__ == "__main__":
    try:
        run()
    except Exception as exc:
        print(f"frontend_security.py: FAILED: {exc}", file=sys.stderr)
        raise
