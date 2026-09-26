"""Attach deterministic content hashes to local JS/CSS references in HTML files.

Unchanged assets keep their URL and browser cache. Changed assets receive a new
URL automatically, forcing browsers and CDNs to fetch the new content.
"""

from __future__ import annotations

import argparse
import hashlib
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HTML_FILES = sorted(ROOT.glob("*.html"))
ASSET_PATTERN = re.compile(
    r'(?P<prefix>\b(?:src|href)=["\'])(?P<path>(?!https?:|//|data:|#)[^"\'?]+\.(?:js|css))'
    r'(?:\?[^"\']*)?(?P<suffix>["\'])',
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


def main() -> int:
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--write", action="store_true", help="Update HTML asset versions")
    mode.add_argument("--check", action="store_true", help="Fail when versions are stale")
    args = parser.parse_args()

    stale: list[str] = []
    for html_path in HTML_FILES:
        source = html_path.read_text(encoding="utf-8")
        expected = version_html(source)
        if expected == source:
            continue
        if args.write:
            html_path.write_text(expected, encoding="utf-8", newline="")
            print(f"updated {html_path.relative_to(ROOT)}")
        else:
            stale.append(str(html_path.relative_to(ROOT)))

    if stale:
        print("Stale asset versions: " + ", ".join(stale))
        print("Run: python scripts/version_assets.py --write")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
