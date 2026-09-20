"""Guard against reintroducing emoji into application controls and status copy."""

from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[1]
UI_FILES = (
    "index.html",
    "admin.html",
    "conexion.html",
    "js/admin.js",
    "js/app.js",
    "js/auth-ui.js",
    "js/storage.js",
    "js/supabase-client.js",
)

# Main emoji blocks plus dingbats and miscellaneous pictographs commonly used as UI icons.
EMOJI = re.compile(
    "["
    "\U0001F000-\U0001FAFF"
    "\U00002600-\U000027BF"
    "]"
)


def main() -> None:
    findings: list[str] = []
    for relative_path in UI_FILES:
        path = ROOT / relative_path
        for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            if EMOJI.search(line):
                findings.append(f"{relative_path}:{line_number}: {line.strip()}")

    if findings:
        raise AssertionError("Emoji found in application controls:\n" + "\n".join(findings))

    print("no_emoji_controls.py: OK")


if __name__ == "__main__":
    main()
