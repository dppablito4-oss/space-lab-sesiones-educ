"""Ordered bundle export retains native equations and rejects incomplete links."""
import copy
import json
from pathlib import Path
import sys

from docx import Document
from docx.oxml.ns import qn

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'backend'))
from docx_bundle import build_planning_bundle
from models.planning_document import PlanningContainerV2


def main():
    plan = json.loads((ROOT / 'data/pedagogy/fixtures/secondary_math_project_unit.v2.json').read_text(encoding='utf-8'))
    fixture = json.loads((ROOT / 'tests/fixtures/secundaria-matematica-polya.v1.json').read_text(encoding='utf-8'))
    first = plan['sequence'][0]
    plan['sequence'] = []
    sessions = []
    for index in range(1, 8):
        item = copy.deepcopy(first)
        item.update(id=f'item-{index}', index=index, title=f'Lesson {index}', status='generated',
                    linkedDocumentRef={'id': f'session-{index}'})
        plan['sequence'].append(item)
        session = copy.deepcopy(fixture)
        session.update(id=f'session-{index}', planning={'planningContainerId':plan['id'], 'sequenceItemId':item['id']})
        session['metadata']['titulo'] = f'Unique lesson {index}'
        session['metadata']['numeroSesion'] = str(index)
        session['momentos']['desarrollo']['procesos'][0]['contenido']['value'] += '<p>Calculamos $\\frac{3}{4}+\\frac{1}{2}=\\frac{5}{4}$.</p>'
        sessions.append(session)
    sessions[0]['fichaTrabajo'] = {
        'titulo': 'Water worksheet', 'instrucciones': 'Measure real values.',
        'secciones': [{'nombre': 'Measurement record', 'campos': ['Record the litres measured.']}]
    }
    container = PlanningContainerV2(**plan)
    doc = Document(build_planning_bundle(container, list(reversed(sessions))))
    text = '\n'.join(doc._element.body.itertext())
    positions = [text.index(f'Unique lesson {index}') for index in range(1, 8)]
    assert positions == sorted(positions), 'Sessions must follow sequence order, not request order'
    assert 'Measurement record' in text and 'Record the litres measured.' in text
    assert len(doc._element.findall('.//' + qn('m:oMath'))) >= 7
    assert len(doc._element.findall('.//' + qn('m:f'))) >= 7
    assert doc.sections[0].page_width > doc.sections[0].page_height
    assert all(section.page_width < section.page_height for section in doc.sections[1:])
    assert all(section.header._element.xpath('.//w:drawing') for section in doc.sections)
    for invalid in [sessions[:-1], sessions + [sessions[0]]]:
        try:
            build_planning_bundle(container, invalid)
        except ValueError:
            pass
        else:
            raise AssertionError('Incomplete or duplicated bundle was accepted')
    print('test_docx_bundle.py: seven ordered sessions, OMML and missing-link checks OK')


if __name__ == '__main__':
    main()
