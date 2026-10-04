"""Compose the root ``index.html`` from build-time HTML fragments.

Source files use whole-line directives such as::

    <!-- include:ui/fragments/landing.html -->

Composition happens before deployment. The browser still receives one complete
document and never fetches fragments at runtime. Local asset hashes and the
application build id remain owned by ``scripts/version_assets.py``.
"""

from __future__ import annotations

import argparse
import os
import re
import sys
import tempfile
from pathlib import Path
from typing import Sequence

SCRIPT_DIRECTORY = Path(__file__).resolve().parent
if str(SCRIPT_DIRECTORY) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIRECTORY))
import version_assets


ROOT = SCRIPT_DIRECTORY.parent
SOURCE_FILE = ROOT / "ui" / "index.shell.html"
OUTPUT_FILE = ROOT / "index.html"
INCLUDE_PATTERN = re.compile(
    r"^[ \t]*<!--\s*include:(?P<path>[^>\r\n]+?)\s*-->[ \t]*(?P<newline>\r?\n|$)",
    re.MULTILINE,
)
UNRESOLVED_INCLUDE_PATTERN = re.compile(r"<!--\s*include:", re.IGNORECASE)


class CompositionError(RuntimeError):
    """Raised when the source tree cannot be composed safely."""


def _relative_label(path: Path, root: Path) -> str:
    try:
        return path.relative_to(root).as_posix()
    except ValueError:
        return str(path)


def _resolve_include_path(reference: str, root: Path) -> Path:
    include_path = Path(reference.strip())
    if include_path.is_absolute():
        raise CompositionError(f"Include must be repository-relative:\n{reference.strip()}")

    resolved_root = root.resolve()
    resolved = (resolved_root / include_path).resolve()
    try:
        resolved.relative_to(resolved_root)
    except ValueError as exc:
        raise CompositionError(
            f"Include escapes repository root:\n{reference.strip()}"
        ) from exc
    return resolved


def _compose_file(path: Path, root: Path, stack: tuple[Path, ...]) -> str:
    resolved = path.resolve()
    if resolved in stack:
        cycle_start = stack.index(resolved)
        cycle = stack[cycle_start:] + (resolved,)
        labels = " -> ".join(_relative_label(item, root) for item in cycle)
        raise CompositionError(f"Include cycle detected:\n{labels}")
    if not resolved.is_file():
        raise CompositionError(f"Missing fragment:\n{_relative_label(resolved, root)}")

    source = resolved.read_text(encoding="utf-8")
    next_stack = stack + (resolved,)

    def replace(match: re.Match[str]) -> str:
        included_path = _resolve_include_path(match.group("path"), root)
        included = _compose_file(included_path, root, next_stack).rstrip("\r\n")
        return included + ("\n" if match.group("newline") else "")

    composed = INCLUDE_PATTERN.sub(replace, source)
    if UNRESOLVED_INCLUDE_PATTERN.search(composed):
        raise CompositionError(
            f"Unresolved include directive in:\n{_relative_label(resolved, root)}"
        )
    return composed


def compose(source_file: Path = SOURCE_FILE, root: Path = ROOT) -> str:
    """Resolve all build-time includes rooted at ``root``."""
    resolved_root = root.resolve()
    source_path = source_file if source_file.is_absolute() else resolved_root / source_file
    return _compose_file(source_path, resolved_root, ())


def expected_distribution_index(composed: str) -> str:
    """Apply the existing asset-versioning pipeline to a composed index."""
    original_pages = {
        path: path.read_text(encoding="utf-8")
        for path in version_assets.HTML_FILES
    }
    original_pages[OUTPUT_FILE] = composed
    expected_pages, _ = version_assets.expected_outputs(original_pages)
    return expected_pages[OUTPUT_FILE]


def write_output(source: str, output_file: Path = OUTPUT_FILE) -> None:
    """Atomically write a fully composed, unversioned HTML document."""
    output_file.parent.mkdir(parents=True, exist_ok=True)
    temporary_name: str | None = None
    try:
        with tempfile.NamedTemporaryFile(
            "w",
            encoding="utf-8",
            newline="",
            delete=False,
            dir=output_file.parent,
            prefix=f".{output_file.name}.",
            suffix=".tmp",
        ) as temporary:
            temporary.write(source)
            temporary_name = temporary.name
        os.replace(temporary_name, output_file)
    finally:
        if temporary_name:
            Path(temporary_name).unlink(missing_ok=True)


def check_output(composed: str, output_file: Path = OUTPUT_FILE) -> bool:
    """Return whether the committed output matches composition + versioning."""
    if not output_file.is_file():
        return False
    expected = expected_distribution_index(composed)
    actual = output_file.read_text(encoding="utf-8")
    return actual == expected


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--write", action="store_true", help="Compose the unversioned index.html")
    mode.add_argument(
        "--check",
        action="store_true",
        help="Fail when index.html differs from composed, versioned sources",
    )
    args = parser.parse_args(argv)

    try:
        composed = compose()
    except (CompositionError, UnicodeError, OSError) as exc:
        print(exc)
        return 1

    if args.write:
        write_output(composed)
        print("generated index.html")
        print("Next: python scripts/version_assets.py --write")
        return 0

    if not check_output(composed):
        print("Generated index.html is stale.")
        print("Run: python scripts/build_index.py --write")
        print("Then: python scripts/version_assets.py --write")
        return 1
    print("index.html matches composed and versioned sources")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
