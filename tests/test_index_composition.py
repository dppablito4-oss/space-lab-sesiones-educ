import importlib.util
import re
import tempfile
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "build_index",
    ROOT / "scripts" / "build_index.py",
)
assert SPEC and SPEC.loader
BUILD_INDEX = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BUILD_INDEX)

CRITICAL_IDS = {
    "landing-view",
    "home-view",
    "app-view",
    "planning-dialog",
    "preview-area",
    "print-preview",
    "linked-planning-context",
    "btn-return-planning",
    "auth-modal",
    "terms-modal",
    "load-modal",
    "confirm-dialog",
    "engine-required-modal",
    "refine-text-modal",
    "logos-gallery-modal",
}
EXPECTED_FRAGMENTS = {
    "ui/fragments/home.html",
    "ui/fragments/landing.html",
    "ui/fragments/modals/auth.html",
    "ui/fragments/modals/confirm.html",
    "ui/fragments/modals/engine-required.html",
    "ui/fragments/modals/load-session.html",
    "ui/fragments/modals/logos-gallery.html",
    "ui/fragments/modals/pdf-guide.html",
    "ui/fragments/modals/refine-text.html",
    "ui/fragments/modals/terms.html",
    "ui/fragments/planning-host.html",
    "ui/fragments/session-editor.html",
    "ui/fragments/session-preview.html",
    "ui/fragments/shell/editor-overlays.html",
    "ui/fragments/shell/global-overlays.html",
    "ui/fragments/shell/head.html",
    "ui/fragments/shell/icons.html",
}
CRITICAL_SCRIPT_ORDER = [
    "js/planning/planning-container-v2.js",
    "js/planning/planning-repository.js",
    "js/planning/linked-session.js",
    "js/planning/planning-view.js",
    "js/controllers/export-controller.js",
    "js/controllers/ai-controller.js",
    "js/controllers/workflow-controller.js",
    "js/controllers/students-controller.js",
    "js/controllers/session-controller.js",
    "js/controllers/design-controller.js",
    "js/app.js",
]
LOCAL_VERSION_PATTERN = re.compile(
    r"\b(?:src|href)\s*=\s*[\"'](?!https?:|//|data:|#)[^\"']+\.(?:js|css)\?",
    re.IGNORECASE,
)


class IndexInventoryParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=False)
        self.ids: list[str] = []
        self.script_sources: list[str] = []
        self.stylesheet_count = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        element_id = attributes.get("id")
        if element_id is not None:
            self.ids.append(element_id)
        if tag == "script" and attributes.get("src"):
            self.script_sources.append(attributes["src"].split("?", 1)[0])
        if tag == "link" and attributes.get("rel", "").lower() == "stylesheet":
            self.stylesheet_count += 1


def assert_failure(action, expected_message: str) -> None:
    try:
        action()
    except BUILD_INDEX.CompositionError as exc:
        assert expected_message in str(exc), str(exc)
    else:
        raise AssertionError(f"Expected CompositionError containing: {expected_message}")


def test_recursive_includes_and_fail_fast() -> None:
    with tempfile.TemporaryDirectory() as temp_directory:
        root = Path(temp_directory)
        (root / "fragments").mkdir()
        (root / "index.shell.html").write_text(
            "before\n<!-- include:fragments/a.html -->\nafter\n",
            encoding="utf-8",
        )
        (root / "fragments" / "a.html").write_text(
            "A\n<!-- include:fragments/b.html -->\n",
            encoding="utf-8",
        )
        (root / "fragments" / "b.html").write_text("B\n", encoding="utf-8")

        result = BUILD_INDEX.compose(Path("index.shell.html"), root)
        assert result == "before\nA\nB\nafter\n"

        (root / "fragments" / "b.html").write_text(
            "<!-- include:fragments/a.html -->\n",
            encoding="utf-8",
        )
        assert_failure(
            lambda: BUILD_INDEX.compose(Path("index.shell.html"), root),
            "Include cycle detected",
        )

        (root / "fragments" / "a.html").write_text(
            "<!-- include:fragments/missing.html -->\n",
            encoding="utf-8",
        )
        assert_failure(
            lambda: BUILD_INDEX.compose(Path("index.shell.html"), root),
            "Missing fragment:\nfragments/missing.html",
        )

        output = root / "index.html"
        BUILD_INDEX.write_output("first\n", output)
        assert output.read_text(encoding="utf-8") == "first\n"
        BUILD_INDEX.write_output("second\n", output)
        assert output.read_text(encoding="utf-8") == "second\n"


def test_repository_composition() -> None:
    first = BUILD_INDEX.compose()
    second = BUILD_INDEX.compose()
    assert first == second, "Composition is not reproducible"
    assert "<!-- include:" not in first, "Generated output contains an unresolved include"
    assert '<meta name="app-build" content="BUILD_ID">' in first

    fragment_files = sorted((ROOT / "ui" / "fragments").rglob("*.html"))
    fragment_paths = {path.relative_to(ROOT).as_posix() for path in fragment_files}
    assert fragment_paths == EXPECTED_FRAGMENTS, (
        f"Unexpected fragment set: missing={sorted(EXPECTED_FRAGMENTS - fragment_paths)}, "
        f"extra={sorted(fragment_paths - EXPECTED_FRAGMENTS)}"
    )

    source_files = [BUILD_INDEX.SOURCE_FILE, *fragment_files]
    for source_file in source_files:
        source = source_file.read_text(encoding="utf-8")
        assert not LOCAL_VERSION_PATTERN.search(source), (
            f"Source HTML must not maintain asset hashes manually: {source_file.relative_to(ROOT)}"
        )

    reference_counts: Counter[str] = Counter()

    def visit(source_file: Path) -> None:
        source = source_file.read_text(encoding="utf-8")
        for match in BUILD_INDEX.INCLUDE_PATTERN.finditer(source):
            reference = match.group("path").strip()
            reference_counts[reference] += 1
            visit(ROOT / reference)

    visit(BUILD_INDEX.SOURCE_FILE)
    assert set(reference_counts) == EXPECTED_FRAGMENTS, (
        f"Every fragment must be reachable from the composition root: {reference_counts}"
    )
    duplicate_references = {
        reference: count
        for reference, count in reference_counts.items()
        if count != 1
    }
    assert not duplicate_references, (
        f"Every fragment must be included exactly once: {duplicate_references}"
    )

    expected = BUILD_INDEX.expected_distribution_index(first)
    actual = BUILD_INDEX.OUTPUT_FILE.read_text(encoding="utf-8")
    assert actual == expected, (
        "index.html is stale; run build_index.py --write and version_assets.py --write"
    )

    parser = IndexInventoryParser()
    parser.feed(actual)
    assert CRITICAL_IDS <= set(parser.ids), CRITICAL_IDS - set(parser.ids)

    duplicate_ids = sorted({element_id for element_id in parser.ids if parser.ids.count(element_id) > 1})
    assert not duplicate_ids, f"Duplicate HTML IDs: {duplicate_ids}"
    assert len(parser.script_sources) == 47, len(parser.script_sources)
    assert parser.stylesheet_count == 11, parser.stylesheet_count

    positions = [parser.script_sources.index(source) for source in CRITICAL_SCRIPT_ORDER]
    assert positions == sorted(positions), list(zip(CRITICAL_SCRIPT_ORDER, positions))


def main() -> None:
    test_recursive_includes_and_fail_fast()
    test_repository_composition()
    print("test_index_composition.py: OK")


if __name__ == "__main__":
    main()
