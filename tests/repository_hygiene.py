from html.parser import HTMLParser
from pathlib import Path
import subprocess
import re
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
FORBIDDEN_TRACKED_PREFIXES = (
    ".venv/",
    ".pytest_cache/",
    ".ruff_cache/",
    ".agents/",
    "artifacts/",
    "backend/build/",
    "backend/dist/",
    "supabase/.temp/",
)


class AssetParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.assets: list[str] = []

    def handle_starttag(self, _tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        for key in ("src", "href"):
            if values.get(key):
                self.assets.append(values[key] or "")


def tracked_files() -> list[str]:
    output = subprocess.check_output(
        ["git", "ls-files", "-z"], cwd=ROOT, text=True, encoding="utf-8"
    )
    return [line.replace("\\", "/") for line in output.split("\0") if line]


def check_tracked_files() -> None:
    forbidden = [
        path
        for path in tracked_files()
        if path.endswith(".log") or path.startswith(FORBIDDEN_TRACKED_PREFIXES)
    ]
    assert not forbidden, f"Generated/local files are tracked: {forbidden}"


def check_html_assets() -> None:
    missing: list[str] = []
    for page in ROOT.glob("*.html"):
        parser = AssetParser()
        parser.feed(page.read_text(encoding="utf-8"))
        for value in parser.assets:
            if value.startswith(("#", "http://", "https://", "mailto:", "tel:", "data:")):
                continue
            local_path = urlsplit(value).path
            if local_path and not (page.parent / local_path).exists():
                missing.append(f"{page.name}: {value}")
    assert not missing, "Missing local HTML assets:\n" + "\n".join(missing)


def check_document_links() -> None:
    """Keep moved documentation and design references navigable."""
    documents = list(ROOT.glob("*.md"))
    for directory in ("docs", "SKILLs", "design-system"):
        documents.extend((ROOT / directory).rglob("*.md"))
    missing: list[str] = []
    for document in documents:
        for target in re.findall(r"\]\(([^\s)]+)\)", document.read_text(encoding="utf-8")):
            url = urlsplit(target)
            if url.scheme or url.netloc or not url.path:
                continue
            if not (document.parent / unquote(url.path)).exists():
                missing.append(f"{document.relative_to(ROOT)}: {target}")
    assert not missing, "Missing documentation targets:\n" + "\n".join(missing)


if __name__ == "__main__":
    check_tracked_files()
    check_html_assets()
    check_document_links()
    print("repository_hygiene.py: OK")
