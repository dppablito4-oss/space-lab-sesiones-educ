"""Compose admin.html from its source, preserving the shared versioning pipeline."""
from __future__ import annotations

import argparse

import build_index
import version_assets


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--write', action='store_true')
    mode.add_argument('--check', action='store_true')
    args = parser.parse_args()
    target = build_index.ROOT / 'admin.html'
    source = build_index.compose(build_index.ROOT / 'ui' / 'admin.shell.html')
    if args.write:
        build_index.write_output(source, target)
        print('generated admin.html')
        return 0
    pages = {p: p.read_text(encoding='utf-8') for p in version_assets.HTML_FILES}
    pages[target] = source
    expected, _ = version_assets.expected_outputs(pages)
    if not target.is_file() or target.read_text(encoding='utf-8') != expected[target]:
        print('admin.html is stale: run build_admin.py --write and version_assets.py --write')
        return 1
    print('admin.html matches its source')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
