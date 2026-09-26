"""Version local assets and generate a deterministic application build manifest.

Changed JS/CSS files receive a content hash in their HTML URL. Interactive
pages also carry the same deterministic build id as ``app-version.json`` so an
already-open page can detect a newer deployment without trusting HTML caches.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HTML_FILES = sorted(ROOT.glob("*.html"))
VERSION_FILE = ROOT / "app-version.json"
ASSET_PATTERN = re.compile(
    r'(?P<prefix>\b(?:src|href)=["\'])(?P<path>(?!https?:|//|data:|#)[^"\'?]+\.(?:js|css))'
    r'(?:\?[^"\']*)?(?P<suffix>["\'])',
    re.IGNORECASE,
)
BUILD_META_PATTERN = re.compile(
    r'(?P<prefix><meta\s+name=["\']app-build["\']\s+content=["\'])(?P<build>[^"\']*)(?P<suffix>["\']\s*/?>)',
    re.IGNORECASE,
)


def asset_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:12]


def version_html(source: str) -> str:
    def replace(match: re.Match[str]) -> str:
        relative_path = match.group("path")
        asset_path = ROOT / relative_path
        if not asset_path.is_file():
            return match.group(0)
        return f'{match.group("prefix")}{relative_path}?v={asset_hash(asset_path)}{match.group("suffix")}'

    return ASSET_PATTERN.sub(replace, source)


def normalize_build_meta(source: str) -> str:
    return BUILD_META_PATTERN.sub(r"\g<prefix>BUILD_ID\g<suffix>", source)


def calculate_build_id(versioned_pages: dict[Path, str]) -> str:
    digest = hashlib.sha256()
    for path, source in sorted(versioned_pages.items()):
        digest.update(path.relative_to(ROOT).as_posix().encode("utf-8"))
        digest.update(b"\0")
        digest.update(normalize_build_meta(source).encode("utf-8"))
        digest.update(b"\0")
    return digest.hexdigest()[:16]


def set_build_meta(source: str, build_id: str) -> str:
    return BUILD_META_PATTERN.sub(
        rf"\g<prefix>{build_id}\g<suffix>",
        source,
    )


def manifest_source(build_id: str) -> str:
    return json.dumps(
        {"build": build_id, "strategy": "content-sha256"},
        ensure_ascii=False,
        indent=2,
    ) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--write", action="store_true", help="Update HTML versions and build manifest")
    mode.add_argument("--check", action="store_true", help="Fail when versions or manifest are stale")
    args = parser.parse_args()

    original_pages = {
        path: path.read_text(encoding="utf-8")
        for path in HTML_FILES
    }
    versioned_pages = {
        path: version_html(source)
        for path, source in original_pages.items()
    }
    build_id = calculate_build_id(versioned_pages)
    expected_pages = {
        path: set_build_meta(source, build_id)
        for path, source in versioned_pages.items()
    }
    expected_manifest = manifest_source(build_id)

    stale: list[str] = []
    for html_path, expected in expected_pages.items():
        if expected == original_pages[html_path]:
            continue
        if args.write:
            html_path.write_text(expected, encoding="utf-8", newline="")
            print(f"updated {html_path.relative_to(ROOT)}")
        else:
            stale.append(str(html_path.relative_to(ROOT)))

    current_manifest = VERSION_FILE.read_text(encoding="utf-8") if VERSION_FILE.exists() else ""
    if current_manifest != expected_manifest:
        if args.write:
            VERSION_FILE.write_text(expected_manifest, encoding="utf-8", newline="")
            print(f"updated {VERSION_FILE.relative_to(ROOT)}")
        else:
            stale.append(str(VERSION_FILE.relative_to(ROOT)))

    if stale:
        print("Stale asset versions: " + ", ".join(stale))
        print("Run: python scripts/version_assets.py --write")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
