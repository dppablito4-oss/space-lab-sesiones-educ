"""Audit an exported landscape unit; defaults to the canonical planning fixture.

Usage: python tests/audit_docx_geometry.py [exported_unit.docx]
"""
import json
from pathlib import Path
import sys

from docx import Document
from test_planning_docx_geometry import ROOT, assert_geometry

sys.path.insert(0, str(ROOT/'backend'))
from docx_builder_planning import build_docx_from_planning_v2
from models.planning_document import PlanningContainerV2


if __name__ == '__main__':
    if len(sys.argv)>1:
        document=Document(Path(sys.argv[1]))
    else:
        data=json.loads((ROOT/'data/pedagogy/fixtures/secondary_math_project_unit.v2.json').read_text(encoding='utf-8'))
        document=Document(build_docx_from_planning_v2(PlanningContainerV2(**data)))
    assert_geometry(document)
    print('Landscape unit geometry: OK')
