"""Compose a planning document and its saved sessions in curricular order."""
from io import BytesIO

from docx import Document
from docxcompose.composer import Composer
from docx.enum.section import WD_SECTION
from document_template import copy_story

from docx_builder_planning import build_docx_from_planning_v2
from docx_builder_v1 import build_docx_from_v1
from models.session_document import SessionDocumentV1


def build_planning_bundle(container, sessions: list[dict]) -> BytesIO:
    items = sorted((item for item in container.sequence if item.type == 'session'),
                   key=lambda item: item.index)
    by_id = {session.get('id'): session for session in sessions}
    if not items or len(by_id) != len(sessions):
        raise ValueError('La secuencia está vacía o hay sesiones duplicadas.')
    ordered = []
    for item in items:
        reference = item.linkedDocumentRef or {}
        session = by_id.get(reference.get('id'))
        if not session:
            raise ValueError(f'Falta generar y guardar la sesión {item.index}: {item.title}')
        link = session.get('planning') or {}
        if link.get('planningContainerId') != container.id or link.get('sequenceItemId') != item.id:
            raise ValueError(f'El vínculo de la sesión {item.index} no coincide con la planificación.')
        ordered.append(SessionDocumentV1(**session))
    if len(ordered) != len(sessions):
        raise ValueError('Se recibieron sesiones ajenas a la secuencia.')
    master = Document(build_docx_from_planning_v2(container))
    composer = Composer(master, preserve_styles=True)
    for session in ordered:
        # Units are landscape; each session must retain its portrait geometry.
        child = Document(build_docx_from_v1(session))
        first_section = len(master.sections)
        master.add_section(WD_SECTION.NEW_PAGE)
        composer.append(child)
        for offset, source in enumerate(child.sections):
            target = master.sections[first_section + offset]
            for name in ('orientation', 'page_width', 'page_height', 'top_margin',
                         'bottom_margin', 'left_margin', 'right_margin',
                         'header_distance', 'footer_distance'):
                setattr(target, name, getattr(source, name))
            target.start_type = WD_SECTION.NEW_PAGE if offset == 0 else source.start_type
            target.header.is_linked_to_previous = False
            copy_story(source.header, target.header)
            target.footer.is_linked_to_previous = False
            copy_story(source.footer, target.footer)
    output = BytesIO()
    composer.save(output)
    output.seek(0)
    return output
