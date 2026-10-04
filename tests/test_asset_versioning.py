import importlib.util
import json
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "version_assets",
    ROOT / "scripts" / "version_assets.py",
)
assert SPEC and SPEC.loader
VERSION_ASSETS = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(VERSION_ASSETS)


def main() -> None:
    with tempfile.TemporaryDirectory() as temp_dir:
        root = Path(temp_dir)
        lf_js = root / "lf.js"
        crlf_js = root / "crlf.js"
        mixed_css = root / "mixed.css"
        lf_css = root / "lf.css"

        lf_js.write_bytes(b"const value = 1;\nconsole.log(value);\n")
        crlf_js.write_bytes(b"const value = 1;\r\nconsole.log(value);\r\n")
        lf_css.write_bytes(b"body {\n  color: red;\n}\n")
        mixed_css.write_bytes(b"body {\r\n  color: red;\r}\r\n")

        assert VERSION_ASSETS.asset_hash(lf_js) == VERSION_ASSETS.asset_hash(crlf_js)
        assert VERSION_ASSETS.asset_hash(lf_css) == VERSION_ASSETS.asset_hash(mixed_css)

        binary_lf = root / "lf.bin"
        binary_crlf = root / "crlf.bin"
        binary_lf.write_bytes(b"line\n")
        binary_crlf.write_bytes(b"line\r\n")
        assert VERSION_ASSETS.asset_hash(binary_lf) != VERSION_ASSETS.asset_hash(binary_crlf)

    app_asset = VERSION_ASSETS.ROOT / "js" / "app.js"
    expected_hash = VERSION_ASSETS.asset_hash(app_asset)
    raw_page = (
        '<meta name="app-build" content="BUILD_ID">\n'
        '<script src="js/app.js"></script>\n'
    )
    stale_page = raw_page.replace("js/app.js", "js/app.js?v=stale")
    spaced_page = raw_page.replace('src="', 'src = "')
    expected_reference = f"js/app.js?v={expected_hash}"
    assert expected_reference in VERSION_ASSETS.version_html(raw_page)
    assert expected_reference in VERSION_ASSETS.version_html(stale_page)
    assert expected_reference in VERSION_ASSETS.version_html(spaced_page)
    assert VERSION_ASSETS.version_html(VERSION_ASSETS.version_html(raw_page)) == (
        VERSION_ASSETS.version_html(raw_page)
    )

    page_path = VERSION_ASSETS.ROOT / "fixture.html"
    expected_pages, expected_manifest = VERSION_ASSETS.expected_outputs({page_path: raw_page})
    manifest = json.loads(expected_manifest)
    assert expected_pages[page_path].count(expected_reference) == 1
    assert f'content="{manifest["build"]}"' in expected_pages[page_path]
    second_pages, second_manifest = VERSION_ASSETS.expected_outputs(expected_pages)
    assert second_pages == expected_pages
    assert second_manifest == expected_manifest

    print("test_asset_versioning.py: OK")


if __name__ == "__main__":
    main()
