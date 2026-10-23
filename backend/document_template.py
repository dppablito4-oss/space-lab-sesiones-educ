"""Shared template loading for session and planning DOCX exports."""

from pathlib import Path
import sys
from copy import deepcopy
from io import BytesIO

from docx import Document
from docx.document import Document as DocumentObject
from docx.oxml.ns import qn
from docx.opc.constants import RELATIONSHIP_TYPE as RT


def resource_root() -> Path:
    frozen_root = getattr(sys, "_MEIPASS", None)
    return Path(frozen_root) if frozen_root else Path(__file__).resolve().parent.parent


def reference_template_path(kind: str = 'session') -> Path | None:
    """Find the production template, falling back to the original reference."""
    assets_dir = resource_root() / "assets"
    candidates = (
        assets_dir / 'templates' / f'{kind}_template_v1.docx',
        assets_dir / "templates" / "session_template_v1.docx",
        assets_dir / "sesion plantilla.docx",
    )
    return next((path for path in candidates if path.exists()), None)


def new_document_from_template(kind: str = 'session') -> DocumentObject:
    """Clear sample content while retaining headers, styles and page settings."""
    template_path = reference_template_path(kind)
    doc = Document(template_path) if template_path else Document()
    body = doc._element.body
    for child in list(body):
        if child.tag != qn("w:sectPr"):
            body.remove(child)
    return doc


def copy_story(source, target) -> None:
    """Copy a header/footer and rebind its artwork to the target DOCX package."""
    relationships = {}
    for relationship in source.part.rels.values():
        if relationship.reltype == RT.IMAGE:
            relationships[relationship.rId] = target.part.get_or_add_image(
                BytesIO(relationship.target_part.blob))[0]
        elif relationship.is_external:
            relationships[relationship.rId] = target.part.relate_to(
                relationship.target_ref, relationship.reltype, is_external=True)
    for child in list(target._element):
        target._element.remove(child)
    for original in source._element:
        child = deepcopy(original)
        for element in child.iter():
            for attribute, value in list(element.attrib.items()):
                if attribute.startswith('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}') and value in relationships:
                    element.set(attribute, relationships[value])
        target._element.append(child)
