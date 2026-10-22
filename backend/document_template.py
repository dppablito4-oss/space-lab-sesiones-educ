"""Shared template loading for session and planning DOCX exports."""

from pathlib import Path
import sys

from docx import Document
from docx.document import Document as DocumentObject
from docx.oxml.ns import qn


def resource_root() -> Path:
    frozen_root = getattr(sys, "_MEIPASS", None)
    return Path(frozen_root) if frozen_root else Path(__file__).resolve().parent.parent


def reference_template_path() -> Path | None:
    """Find the production template, falling back to the original reference."""
    assets_dir = resource_root() / "assets"
    candidates = (
        assets_dir / "templates" / "session_template_v1.docx",
        assets_dir / "sesion plantilla.docx",
    )
    return next((path for path in candidates if path.exists()), None)


def new_document_from_template() -> DocumentObject:
    """Clear sample content while retaining headers, styles and page settings."""
    template_path = reference_template_path()
    doc = Document(template_path) if template_path else Document()
    body = doc._element.body
    for child in list(body):
        if child.tag != qn("w:sectPr"):
            body.remove(child)
    return doc
