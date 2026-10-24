"""Pruebas del render híbrido LaTeX → OMML → imagen → texto."""
from __future__ import annotations

import io
import json
import sys
import zipfile
from pathlib import Path
from unittest.mock import patch

from docx import Document
from lxml import etree
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
sys.path.insert(0, str(BACKEND))

from models.session_document import SessionDocumentV1  # noqa: E402
from docx_builder import append_html_to_cell_or_paragraph  # noqa: E402
from docx_builder_v1 import build_docx_from_v1  # noqa: E402
from word_math import append_mixed_text, latex_to_omml, split_latex_segments, UnsupportedLatex, uppercase_prose  # noqa: E402


def _document_xml(stream: io.BytesIO) -> str:
    stream.seek(0)
    with zipfile.ZipFile(stream) as archive:
        return archive.read("word/document.xml").decode("utf-8")


def test_segment_detection():
    segments = list(split_latex_segments(r"Calcula $x^2$ y luego $$\frac{1}{2}$$."))
    formulas = [(value, display) for is_math, value, display, _ in segments if is_math]
    assert formulas == [("x^2", False), (r"\frac{1}{2}", True)]


def test_native_omml_structures():
    equation = latex_to_omml(r"x_{1}^{2}+\frac{3}{4}+\sqrt{y}")
    xml = etree.tostring(equation, encoding="unicode")
    assert "m:sSubSup" in xml
    assert "m:f" in xml
    assert "m:rad" in xml


def test_html_keeps_formatting_and_adds_native_equation():
    doc = Document()
    paragraph = doc.add_paragraph()
    append_html_to_cell_or_paragraph(
        paragraph,
        r"<p><strong>Resolvemos:</strong> $2x+5=21 \Rightarrow x=8$</p>",
    )
    stream = io.BytesIO()
    doc.save(stream)
    xml = _document_xml(stream)
    assert "<m:oMath" in xml
    assert "<w:b" in xml
    assert r"\Rightarrow" not in xml


def test_unknown_native_command_uses_image():
    doc = Document()
    routes = append_mixed_text(doc.add_paragraph(), r"Valor: $\binom{5}{2}$")
    assert "image" in routes
    stream = io.BytesIO()
    doc.save(stream)
    stream.seek(0)
    with zipfile.ZipFile(stream) as archive:
        media_name = next(name for name in archive.namelist() if name.startswith("word/media/"))
        with Image.open(io.BytesIO(archive.read(media_name))) as image:
            assert image.mode == "RGBA"
            assert image.getchannel("A").getextrema()[0] == 0


def test_last_resort_preserves_original_latex():
    doc = Document()
    with patch("word_math._render_formula_png", return_value=None):
        routes = append_mixed_text(doc.add_paragraph(), r"$\comandoInventado{x}$")
    assert routes == ["latex-text"]
    assert doc.paragraphs[0].text == r"$\comandoInventado{x}$"


def test_all_delimiters_and_escaped_currency():
    source = r"Precio \$20. Calcula \(\frac{1}{2}\) y \[\sqrt[3]{8}\], $x^2$ y $$y_1$$."
    formulas = [value for is_math, value, _, _ in split_latex_segments(source) if is_math]
    assert formulas == [r"\frac{1}{2}", r"\sqrt[3]{8}", 'x^2', 'y_1']
    assert uppercase_prose(r"Raíz $\sqrt{x}$") == r"RAÍZ $\sqrt{x}$"


def test_indexed_radicals_spaces_styles_and_functions():
    equation = latex_to_omml(r"\sqrt [3] {8}+\dfrac {1} {2}+x ^ {2}+\sin(\theta)+\text{cm}+\vec{v}")
    ns = {'m': 'http://schemas.openxmlformats.org/officeDocument/2006/math'}
    assert equation.xpath('string(.//m:deg/m:r/m:t)', namespaces=ns) == '3'
    assert equation.xpath('string(.//m:rad/m:e/m:r/m:t)', namespaces=ns) == '8'
    assert len(equation.xpath('.//m:f', namespaces=ns)) == 1
    assert len(equation.xpath('.//m:sSup', namespaces=ns)) == 1
    assert len(equation.xpath('.//m:acc', namespaces=ns)) == 1
    assert equation.xpath('.//m:rPr/m:sty[@m:val="p"]', namespaces=ns)
    for bad in [r'x^2^3', r'\sqrt[3{8}', r'\frac{1}', '{x']:
        try:
            latex_to_omml(bad)
        except UnsupportedLatex:
            pass
        else:
            raise AssertionError(f'Malformed expression silently accepted: {bad}')


def test_worksheet_and_checklist_preserve_equations():
    fixture = json.loads((ROOT / 'tests/fixtures/secundaria-matematica-polya.v1.json').read_text(encoding='utf-8'))
    fixture['fichaTrabajo'] = {
        'titulo': r'Raíz $\sqrt[3]{8}$',
        'indicaciones': r'Calcula \(\frac{2}{3}\).',
        'actividades': r'Expresa $x^2=4$ y $\cos(0)=1$.'
    }
    fixture['listaCotejo'] = {'criterios': [r'Calcula $\frac{1}{2}$'], 'alumnos': []}
    doc = Document(build_docx_from_v1(SessionDocumentV1(**fixture)))
    assert len(doc._element.xpath('.//m:oMath')) >= 5
    checklist = doc.tables[-1]
    assert checklist.cell(0, 2)._tc.xpath('.//m:f')
    assert not any(r'\SQRT' in t.text for t in doc._element.xpath('.//w:t'))


def test_delimiters_and_large_operators():
    ns = {'m': 'http://schemas.openxmlformats.org/officeDocument/2006/math'}
    equation = latex_to_omml(r'\left(\sum_{i=1}^{5} x_i\right)+\int_0^1 x^2 dx')
    assert len(equation.xpath('.//m:d', namespaces=ns)) == 1
    assert len(equation.xpath('.//m:nary', namespaces=ns)) == 2
    assert equation.xpath('string(.//m:nary/m:sub/m:r/m:t)', namespaces=ns) == 'i=1'
    equation = latex_to_omml(r'\left. x\right|_0^1')
    assert equation.xpath('string(.//m:begChr/@m:val)', namespaces=ns) == ''
    assert equation.xpath('string(.//m:endChr/@m:val)', namespaces=ns) == '|'


def test_planning_title_and_cells_keep_math():
    from docx_builder_planning import build_docx_from_planning_v2
    from models.planning_document import PlanningContainerV2
    fixture = json.loads((ROOT / 'data/pedagogy/fixtures/secondary_math_project_unit.v2.json').read_text(encoding='utf-8'))
    fixture['identity']['title'] = r'Proyecto $\sqrt[3]{8}$'
    fixture['purpose']['summary'] = r'Calcular \(\frac{1}{2}\).'
    fixture['sequence'][0]['knowledge'] = [r'Potencia $x^2$']
    doc = Document(build_docx_from_planning_v2(PlanningContainerV2(**fixture)))
    assert doc.paragraphs[1]._p.xpath('.//m:rad')
    assert doc.tables[2]._tbl.xpath('.//m:f')
    assert doc.tables[6]._tbl.xpath('.//m:sSup')


def test_html_comparisons_and_multiline_display():
    doc = Document()
    append_html_to_cell_or_paragraph(doc.add_paragraph(), r'<p>Compara $x<y$ y $a>b$.</p>')
    text = ''.join(doc._element.xpath('.//m:t/text()'))
    assert 'x<y' in text and 'a>b' in text, text
    paragraph = doc.add_paragraph()
    append_html_to_cell_or_paragraph(paragraph, 'Calcula\n\\[\\frac{1}{2}\n+\\sqrt{9}\\]')
    assert paragraph._p.xpath('.//m:f') and paragraph._p.xpath('.//m:rad')


def test_v1_builder_integration():
    fixture = json.loads(
        (ROOT / "tests" / "fixtures" / "secundaria-matematica-polya.v1.json")
        .read_text(encoding="utf-8")
    )
    fixture["momentos"]["desarrollo"]["procesos"][0]["contenido"]["value"] = (
        r"<p>Aplicamos $x^2+\frac{1}{2}$ y comparamos con $\sin(\theta)$.</p>"
    )
    stream = build_docx_from_v1(SessionDocumentV1(**fixture))
    xml = _document_xml(stream)
    assert "<m:oMath" in xml
    stream.seek(0)
    with zipfile.ZipFile(stream) as archive:
        assert any(name.startswith("word/media/") for name in archive.namelist())
    stream.seek(0)
    Document(stream)  # El paquete sigue siendo un DOCX válido.


if __name__ == "__main__":
    tests = [
        test_segment_detection,
        test_native_omml_structures,
        test_html_keeps_formatting_and_adds_native_equation,
        test_unknown_native_command_uses_image,
        test_last_resort_preserves_original_latex,
        test_all_delimiters_and_escaped_currency,
        test_indexed_radicals_spaces_styles_and_functions,
        test_worksheet_and_checklist_preserve_equations,
        test_delimiters_and_large_operators,
        test_planning_title_and_cells_keep_math,
        test_html_comparisons_and_multiline_display,
        test_v1_builder_integration,
    ]
    for test in tests:
        test()
        print(f"OK {test.__name__}")
    print("test_word_math.py: OK")
