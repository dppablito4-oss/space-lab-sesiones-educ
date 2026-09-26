import importlib.util
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

    print("test_asset_versioning.py: OK")


if __name__ == "__main__":
    main()
