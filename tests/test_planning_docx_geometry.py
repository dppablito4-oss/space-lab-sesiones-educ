"""Test autónomo de Geometría y Cuadrícula DOCX PlanningContainer 2.0 (CNEB / MINEDU).

Verifica que el documento Word (.docx) generado en memoria por el builder:
1. Formato de hoja A4 estricto (8.27 in x 11.69 in / ~11,906 x 16,838 twips)
2. Márgenes institucionales uniformes de 0.75 in (1,080 twips) en los 4 lados
3. Exactamente 12 tablas oficiales generadas
4. Cuadrícula de 10,490 twips exactos (sum(w:gridCol) == 10490) en el 100% de tablas
5. Sangría institucional w:tblInd = -289 twips en el 100% de tablas
6. Filas protegidas contra quiebre de página (w:cantSplit) en el 100% de filas
7. Encabezados repetibles (w:tblHeader) en todas las tablas extensas/multilínea
8. Estructura y contenido de la Tabla Dual (Propósito vs Producto Final)
9. Resiliencia de geometría en borradores mínimos (12 tablas, 10,490 twips, -289 twips)

Ejecutar: python tests/test_planning_docx_geometry.py
"""
import io
import json
import os
import sys

# Forzar UTF-8 en stdout/stderr
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

TEST_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(TEST_DIR)
sys.path.insert(0, os.path.join(ROOT_DIR, "backend"))

import docx
from docx.oxml.ns import qn
from models.planning_document import PlanningContainerV2
from docx_builder_planning import build_docx_from_planning_v2


def get_table_grid_width(tbl) -> int:
    grid = tbl._tbl.find(qn("w:tblGrid"))
    if grid is None:
        return 0
    return sum(int(col.attrib.get(qn("w:w"), 0)) for col in grid.findall(qn("w:gridCol")))


def get_table_indent_twips(tbl) -> int:
    tblPr = tbl._tbl.tblPr
    if tblPr is None:
        return 0
    ind = tblPr.find(qn("w:tblInd"))
    if ind is None:
        return 0
    return int(ind.attrib.get(qn("w:w"), 0))


def row_has_cant_split(row) -> bool:
    trPr = row._tr.get_or_add_trPr()
    return trPr.find(qn("w:cantSplit")) is not None


def table_has_repeat_header(tbl) -> bool:
    if not tbl.rows:
        return False
    trPr = tbl.rows[0]._tr.get_or_add_trPr()
    return trPr.find(qn("w:tblHeader")) is not None


def test_fixture_docx_geometry():
    print("[1/2] Verificando geometría de documento completo (Fixture Secundaria)...")
    fixture_path = os.path.join(ROOT_DIR, "data", "pedagogy", "fixtures", "secondary_math_project_unit.v2.json")
    with open(fixture_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    container = PlanningContainerV2(**data)
    stream = build_docx_from_planning_v2(container)
    assert isinstance(stream, io.BytesIO), "Debe devolver io.BytesIO"
    doc = docx.Document(stream)

    # 1. Dimensiones de página A4 y márgenes de 0.75 in
    sec = doc.sections[0]
    assert abs(sec.page_width.inches - 8.27) < 0.05, f"Ancho de página incorrecto: {sec.page_width.inches:.3f} in"
    assert abs(sec.page_height.inches - 11.69) < 0.05, f"Alto de página incorrecto: {sec.page_height.inches:.3f} in"
    assert abs(sec.left_margin.inches - 0.75) < 0.05, f"Margen izquierdo incorrecto: {sec.left_margin.inches:.3f} in"
    assert abs(sec.right_margin.inches - 0.75) < 0.05, f"Margen derecho incorrecto: {sec.right_margin.inches:.3f} in"
    assert abs(sec.top_margin.inches - 0.75) < 0.05, f"Margen superior incorrecto: {sec.top_margin.inches:.3f} in"
    assert abs(sec.bottom_margin.inches - 0.75) < 0.05, f"Margen inferior incorrecto: {sec.bottom_margin.inches:.3f} in"

    # 2. Conteo estricto de tablas: 12 tablas oficiales
    assert len(doc.tables) == 12, f"Se esperaban exactamente 12 tablas oficiales, se encontraron {len(doc.tables)}"

    table_names = [
        "0. Datos Informativos",
        "1. Situación Significativa y Reto",
        "2. Tabla Dual: Propósito vs Producto Final",
        "3. Estándares de Aprendizaje (Ciclo)",
        "4. Matriz Curricular (Criterios y Desempeños)",
        "5. Competencias Transversales CNEB",
        "6. Enfoques Transversales y Valores",
        "7. Secuencia Didáctica Semanal (7 Columnas)",
        "8. Producto Final Integrador",
        "9. Materiales de Aula y Recursos MINEDU",
        "10. Orientaciones de Evaluación Formativa",
        "11. Firmas de Responsabilidad Pedagógica",
    ]

    # Tablas que requieren encabezado repetible (tblHeader)
    repeat_header_indices = {2, 3, 4, 5, 6, 7, 8, 9, 10}

    # 3. Validación exhaustiva de cada una de las 12 tablas
    for idx, tbl in enumerate(doc.tables):
        name = table_names[idx]

        # Cuadrícula: suma exacta de 10,490 twips
        total_w = get_table_grid_width(tbl)
        assert total_w == 10490, f"Tabla [{name}] no suma 10,490 twips (suma {total_w} twips)"

        # Sangría institucional: -289 twips (-0.2 pulgadas)
        indent_w = get_table_indent_twips(tbl)
        assert indent_w == -289, f"Tabla [{name}] no tiene sangría -289 twips (tiene {indent_w})"

        # Renglones protegidos contra quiebre de página
        for r_idx, row in enumerate(tbl.rows):
            assert row_has_cant_split(row), f"Fila {r_idx} de tabla [{name}] no tiene w:cantSplit"

        # Encabezado repetible
        if idx in repeat_header_indices:
            assert table_has_repeat_header(tbl), f"Tabla [{name}] debe tener w:tblHeader en la fila 0"

    # 4. Validar contenido específico de la Tabla Dual
    tbl_dual = doc.tables[2]
    header_text_0 = tbl_dual.rows[0].cells[0].text
    header_text_1 = tbl_dual.rows[0].cells[1].text
    assert "PROPÓSITO" in header_text_0 and "UNIDAD DIDÁCTICA" in header_text_0
    assert "PRODUCTO FINAL" in header_text_1 and "UNIDAD DIDÁCTICA" in header_text_1

    body_purpose = tbl_dual.rows[1].cells[0].text
    body_product = tbl_dual.rows[1].cells[1].text
    assert container.purpose.summary in body_purpose
    assert container.finalProduct.title in body_product
    assert container.finalProduct.description in body_product

    print(f"  ✓ 12/12 tablas certificadas con 10,490 twips, -289 twips indent y cantSplit al 100%")


def test_minimal_draft_geometry():
    print("[2/2] Verificando geometría en borrador mínimo...")
    draft_data = {
        "schemaVersion": "2.0",
        "id": "draft-geometry-test",
        "revision": 1,
        "status": "draft",
        "identity": {
            "title": "Borrador de prueba de geometría",
            "planningType": "unit",
            "level": "secondary",
            "cycle": "VI",
            "grade": "1",
        },
    }
    container = PlanningContainerV2(**draft_data)
    stream = build_docx_from_planning_v2(container)
    assert isinstance(stream, io.BytesIO), "Debe devolver io.BytesIO"
    doc = docx.Document(stream)

    assert len(doc.tables) == 12, f"El borrador mínimo debe generar 12 tablas oficiales (tiene {len(doc.tables)})"

    for idx, tbl in enumerate(doc.tables):
        assert get_table_grid_width(tbl) == 10490, f"Tabla {idx} en borrador no suma 10,490 twips"
        assert get_table_indent_twips(tbl) == -289, f"Tabla {idx} en borrador no tiene sangría -289 twips"
        for r_idx, row in enumerate(tbl.rows):
            assert row_has_cant_split(row), f"Fila {r_idx} de tabla {idx} en borrador no tiene cantSplit"

    print("  ✓ Borrador mínimo certificado: 12 tablas, 10,490 twips y cantSplit al 100%")


if __name__ == "__main__":
    test_fixture_docx_geometry()
    test_minimal_draft_geometry()
    print("\n============================================================")
    print(">>> CERTIFICACIÓN GEOMÉTRICA DOCX PLANNING: ÉXITO TOTAL <<<")
    print("============================================================")
