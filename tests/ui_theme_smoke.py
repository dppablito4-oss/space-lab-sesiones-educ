from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import re
from threading import Thread

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]


def rgb(value: str) -> tuple[int, int, int]:
    channels = re.findall(r"\d+", value)
    assert len(channels) >= 3, value
    return tuple(int(channel) for channel in channels[:3])


def luminance(color: tuple[int, int, int]) -> float:
    channels = []
    for channel in color:
        value = channel / 255
        channels.append(value / 12.92 if value <= 0.03928 else ((value + 0.055) / 1.055) ** 2.4)
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]


def contrast(foreground: str, background: str) -> float:
    values = sorted((luminance(rgb(foreground)), luminance(rgb(background))), reverse=True)
    return (values[0] + 0.05) / (values[1] + 0.05)


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args) -> None:
        pass


def run() -> None:
    server = ThreadingHTTPServer(
        ("127.0.0.1", 0),
        partial(QuietHandler, directory=str(ROOT)),
    )
    Thread(target=server.serve_forever, daemon=True).start()

    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1440, "height": 900})
            page.add_init_script(
                "if (!localStorage.getItem('spacelab_theme_preference')) localStorage.setItem('spacelab_theme_preference', 'light')"
            )
            page.goto(
                f"http://127.0.0.1:{server.server_port}/index.html",
                wait_until="domcontentloaded",
            )

            assert page.locator("html").get_attribute("data-theme") == "light"
            assert page.locator("#theme-preference").input_value() == "light"

            page.locator("#theme-preference").select_option("dark")
            assert page.locator("html").get_attribute("data-theme") == "dark"
            assert page.evaluate(
                "localStorage.getItem('spacelab_theme_preference')"
            ) == "dark"

            # Mi espacio must use theme tokens rather than fixed dark surfaces.
            page.evaluate(
                """
                document.querySelector('#landing-view').classList.add('hidden');
                document.querySelector('#app-view').classList.add('hidden');
                document.querySelector('#home-view').classList.remove('hidden');
                """
            )
            workspace_styles = {}
            for theme in ("light", "dark"):
                page.evaluate("theme => window.SpaceLabTheme.setPreference(theme)", theme)
                page.wait_for_timeout(350)
                workspace_styles[theme] = page.evaluate(
                    """
                    () => {
                        const style = selector => getComputedStyle(document.querySelector(selector));
                        return {
                            page: style('.home-view').backgroundColor,
                            card: style('.home-tool-card-active').backgroundColor,
                            heading: style('.home-tool-copy h3').color,
                            secondary: style('.home-tool-copy p').color,
                            border: style('.home-tool-card-active').borderColor
                        };
                    }
                    """
                )

            assert workspace_styles["light"]["card"] != workspace_styles["dark"]["card"], workspace_styles
            assert luminance(rgb(workspace_styles["light"]["card"])) > 0.8
            assert luminance(rgb(workspace_styles["dark"]["card"])) < 0.03
            for theme in ("light", "dark"):
                styles = workspace_styles[theme]
                assert contrast(styles["heading"], styles["card"]) >= 7
                assert contrast(styles["secondary"], styles["card"]) >= 4.5
                assert styles["border"] != styles["card"]

            page.set_viewport_size({"width": 390, "height": 844})
            assert page.locator("#home-view").is_visible()
            assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
            page.set_viewport_size({"width": 1440, "height": 900})
            page.evaluate(
                """
                document.querySelector('#home-view').classList.add('hidden');
                document.querySelector('#app-view').classList.remove('hidden');
                """
            )

            export_menu = page.locator("#export-command-menu")
            assert not export_menu.get_attribute("open")
            page.locator("#export-command-menu > summary").click()
            assert export_menu.get_attribute("open") is not None
            assert page.locator("#btn-export-pdf").is_visible()
            assert page.locator("#btn-export-word").is_visible()

            page.locator('[data-tab="tab-design"]').click()
            advanced = page.locator("#tab-design .form-disclosure")
            assert advanced.is_visible()
            assert advanced.get_attribute("open") is None
            advanced.locator("summary").click()
            assert advanced.get_attribute("open") is not None
            assert page.locator("#select-design-font-family").is_visible()

            for secondary_page in ("conexion.html", "descargas_landing.html"):
                page.evaluate("localStorage.setItem('spacelab_theme_preference', 'dark')")
                page.goto(
                    f"http://127.0.0.1:{server.server_port}/{secondary_page}",
                    wait_until="domcontentloaded",
                )
                assert page.locator("html").get_attribute("data-theme") == "dark"
                assert page.locator("#theme-preference").input_value() == "dark"
                page.locator("#theme-preference").select_option("light")
                assert page.locator("html").get_attribute("data-theme") == "light"
                assert page.locator("body").evaluate(
                    "element => getComputedStyle(element).backgroundColor !== 'rgb(3, 7, 18)'"
                )

            browser.close()
    finally:
        server.shutdown()
        server.server_close()

    print("ui_theme_smoke.py: OK")


if __name__ == "__main__":
    run()
