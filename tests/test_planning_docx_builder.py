"""
Test DOCX Builder Planning — Verifica la generación nativa de documentos Word (.docx)
para Unidades, Proyectos y Experiencias de Aprendizaje (PlanningContainer 2.0).

Ejecutar: python tests/test_planning_docx_builder.py
"""
import io
import json
import os
import sys

# Force UTF-8 on Windows
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

TEST_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(TEST_DIR)
sys.path.insert(0, os.path.join(ROOT_DIR, 'backend'))

import docx
from docx.oxml.ns import qn
from models.planning_document import PlanningContainerV2
from docx_builder_planning import build_docx_from_planning_v2


def test_fixture_planning_unit():
    print("\n[1/3] Generando DOCX para Unidad de Proyecto de Secundaria (Fixture)...")
    fixture_path = os.path.join(ROOT_DIR, 'data', 'pedagogy', 'fixtures', 'secondary_math_project_unit.v2.json')
    with open(fixture_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    container = PlanningContainerV2(**data)
    stream = build_docx_from_planning_v2(container)

    assert isinstance(stream, io.BytesIO), "Debe devolver io.BytesIO"
    size = stream.getbuffer().nbytes
    assert size > 8000, f"El archivo DOCX debe tener al menos 8KB (generado: {size} bytes)"

    # Reabrir y validar estructura interna
    stream.seek(0)
    doc = docx.Document(stream)

    # 1. Validar secciones y márgenes A4
    sec = doc.sections[0]
    assert abs(sec.page_width.inches - 8.27) < 0.05, f"Ancho de página no es A4: {sec.page_width.inches}"
    assert abs(sec.page_height.inches - 11.69) < 0.05, f"Alto de página no es A4: {sec.page_height.inches}"
    assert abs(sec.left_margin.inches - 0.75) < 0.05, f"Margen izquierdo no es 0.75 in: {sec.left_margin.inches}"
    assert abs(sec.right_margin.inches - 0.75) < 0.05, f"Margen derecho no es 0.75 in: {sec.right_margin.inches}"

    # 2. Validar presencia de títulos y encabezados
    all_text = " ".join(p.text for p in doc.paragraphs)
    assert "MINISTERIO DE EDUCACIÓN DEL PERÚ" in all_text
    assert "UNIDAD DE APRENDIZAJE" in all_text
    assert "Tomamos decisiones financieras responsables" in all_text
    assert "I. DATOS INFORMATIVOS" in all_text
    assert "II. SITUACIÓN SIGNIFICATIVA Y PREGUNTA RETADORA" in all_text
    assert "III. PROPÓSITOS DE APRENDIZAJE Y MATRIZ DE EVALUACIÓN (CNEB)" in all_text
    assert "IV. ENFOQUES TRANSVERSALES Y ACTITUDES OBSERVABLES" in all_text
    assert "V. SECUENCIA DIDÁCTICA Y PROGRESIÓN DE SESIONES DE APRENDIZAJE" in all_text
    assert "VI. PRODUCTO O EVIDENCIA FINAL DE LA UNIDAD" in all_text
    assert "VII. MATERIALES Y RECURSOS EDUCATIVOS" in all_text
    assert "VIII. ORIENTACIONES PARA LA EVALUACIÓN FORMATIVA" in all_text
    assert "IX. FIRMAS DE RESPONSABILIDAD PEDAGÓGICA" in all_text

    # 3. Validar fidelidad de cuadrícula (10,490 twips) en todas las tablas
    assert len(doc.tables) >= 8, f"Debe tener al menos 8 tablas oficiales (tiene {len(doc.tables)})"
    for i, tbl in enumerate(doc.tables):
        tblGrid = tbl._tbl.find(qn('w:tblGrid'))
        assert tblGrid is not None, f"Tabla {i} no tiene w:tblGrid"
        col_widths = [int(gc.attrib.get(qn('w:w'), 0)) for gc in tblGrid.findall(qn('w:gridCol'))]
        total_w = sum(col_widths)
        assert total_w == 10490, f"Tabla {i} no cumple con 10,490 twips exactos (tiene {total_w})"

    # 4. Validar contenido específico en la matriz curricular
    tbl_mat = next(tbl for tbl in doc.tables if "DESEMPEÑOS PRECISADOS" in " ".join(c.text for row in tbl.rows for c in row.cells))
    mat_text = " ".join(cell.text for row in tbl_mat.rows for cell in row.cells)
    assert "Resuelve problemas de cantidad" in mat_text
    assert "Traduce cantidades a expresiones numéricas" in mat_text
    assert "Establece relaciones entre datos y las transforma en expresiones con porcentajes" in mat_text
    assert "Representa descuentos y aumentos porcentuales" in mat_text

    # 5. Validar secuencia de sesiones
    tbl_seq = next(tbl for tbl in doc.tables if "SESIÓN DE" in " ".join(c.text for row in tbl.rows for c in row.cells) or "SESIÓN /" in " ".join(c.text for row in tbl.rows for c in row.cells))
    seq_text = " ".join(cell.text for row in tbl_seq.rows for cell in row.cells)
    assert "SESIÓN 01" in seq_text or "Sesión 01" in seq_text
    assert "¿Qué dicen realmente las promociones?" in seq_text
    assert "SESIÓN 02" in seq_text or "Sesión 02" in seq_text
    assert "Comparamos el costo real" in seq_text
    assert "SESIÓN 03" in seq_text or "Sesión 03" in seq_text
    assert "Presentamos recomendaciones responsables" in seq_text

    print(f"  ✓ Fixture probado con éxito ({size} bytes, {len(doc.tables)} tablas, 10,490 twips verificado)")


def test_multidisciplinary_unit():
    print("\n[2/3] Generando DOCX para Unidad Multidisciplinaria (Ciencia + Matemática)...")
    multi_data = {
        "schemaVersion": "2.0",
        "id": "plan-multi-stem-001",
        "revision": 1,
        "status": "reviewed",
        "identity": {
            "title": "Indagamos el consumo de energía eléctrica y su impacto económico familiar",
            "planningType": "project",
            "level": "secondary",
            "cycle": "VII",
            "grade": "4",
            "duration": {"value": 4, "unit": "weeks"}
        },
        "administrativeContext": {
            "institution": "I.E. Mariscal Castilla",
            "dre": "Junín",
            "ugel": "Huancayo",
            "teacher": "Prof. Ana Torres",
            "academicYear": "2026",
            "period": "II Bimestre"
        },
        "significantSituation": {
            "context": "En la temporada de invierno, los recibos de energía eléctrica se incrementan notablemente en los hogares.",
            "problemOrOpportunity": "Desconocimiento del consumo en watts de los electrodomésticos y falta de hábitos de ecoeficiencia.",
            "expectedResponse": "Plan de ahorro energético y modelación del consumo familiar."
        },
        "drivingQuestion": "¿Cómo influye el consumo de artefactos eléctricos en el presupuesto familiar y cómo reducirlo?",
        "purpose": {
            "summary": "Indagar experimentalmente el consumo eléctrico y modelar funciones lineales para la optimización de recursos."
        },
        "curriculumMap": [
            {
                "id": "map-science",
                "area": {"id": "science-technology", "officialName": "Ciencia y Tecnología"},
                "competency": {"id": "inquires-scientific-methods", "officialName": "Indaga mediante métodos científicos"},
                "capacities": [
                    {"id": "problematizes", "officialName": "Problematiza situaciones para hacer indagación"},
                    {"id": "designs", "officialName": "Diseña estrategias para hacer indagación"}
                ],
                "standard": {"description": "Indaga a partir de preguntas y plantea hipótesis con variables científicas."},
                "performances": [{"id": "p1", "description": "Formula preguntas sobre el consumo de potencia eléctrica."}],
                "criteria": [{"id": "c1", "description": "Plantea hipótesis con variables independiente y dependiente."}],
                "expectedEvidence": [{"id": "e1", "description": "Informe de indagación con tablas de medición."}]
            },
            {
                "id": "map-math",
                "area": {"id": "mathematics", "officialName": "Matemática"},
                "competency": {"id": "solves-regularity-problems", "officialName": "Resuelve problemas de regularidad, equivalencia y cambio"},
                "capacities": [
                    {"id": "translates", "officialName": "Traduce datos y condiciones a expresiones algebraicas y gráficas"}
                ],
                "standard": {"description": "Modela regularidades y funciones afines."},
                "performances": [{"id": "p2", "description": "Modela el costo de kilowatt-hora mediante funciones lineales."}],
                "criteria": [{"id": "c2", "description": "Determina la pendiente y el costo fijo en el recibo de luz."}],
                "expectedEvidence": [{"id": "e2", "description": "Gráfica cartesiana del consumo eléctrico."}]
            }
        ],
        "sequence": [
            {
                "id": "s1", "index": 1, "type": "session", "title": "Medimos la potencia de los artefactos del hogar",
                "week": 1, "duration": {"value": 90, "unit": "minutes"},
                "competencyRefs": ["inquires-scientific-methods"],
                "knowledge": ["potencia eléctrica", "watts"],
                "activities": ["Calcular consumo en watts por hora."],
                "evidence": [{"description": "Ficha de registro de electrodomésticos."}]
            },
            {
                "id": "s2", "index": 2, "type": "session", "title": "Modelamos el costo mensual en función del consumo",
                "week": 2, "duration": {"value": 90, "unit": "minutes"},
                "competencyRefs": ["solves-regularity-problems"],
                "knowledge": ["función lineal", "tarifa eléctrica"],
                "activities": ["Construir la fórmula de costo total."],
                "evidence": [{"description": "Ecuación y gráfica del modelo de costo."}]
            }
        ]
    }

    container = PlanningContainerV2(**multi_data)
    stream = build_docx_from_planning_v2(container)
    doc = docx.Document(stream)

    all_text = " ".join(p.text for p in doc.paragraphs)
    assert "PROYECTO DE APRENDIZAJE" in all_text
    assert "Indagamos el consumo de energía eléctrica" in all_text

    tbl_mat = next(tbl for tbl in doc.tables if "DESEMPEÑOS PRECISADOS" in " ".join(c.text for row in tbl.rows for c in row.cells))
    mat_text = " ".join(cell.text for row in tbl_mat.rows for cell in row.cells)
    assert "Ciencia y Tecnología" in mat_text
    assert "Indaga mediante métodos científicos" in mat_text
    assert "Matemática" in mat_text
    assert "Resuelve problemas de regularidad, equivalencia y cambio" in mat_text

    print("  ✓ Unidad multidisciplinaria generada y validada exitosamente")


def test_draft_resilience():
    print("\n[3/3] Probando resiliencia frente a borradores con campos mínimos...")
    draft_data = {
        "schemaVersion": "2.0",
        "id": "plan-minimal-draft",
        "revision": 1,
        "status": "draft",
        "identity": {
            "title": "Borrador inicial de unidad",
            "planningType": "unit",
            "level": "secondary",
            "cycle": "VI",
            "grade": "1"
        }
    }
    container = PlanningContainerV2(**draft_data)
    stream = build_docx_from_planning_v2(container)
    doc = docx.Document(stream)
    assert len(doc.tables) >= 8
    print("  ✓ Borrador mínimo procesado sin errores")


if __name__ == '__main__':
    test_fixture_planning_unit()
    test_multidisciplinary_unit()
    test_draft_resilience()
    print("\n============================================================")
    print(">>> TODOS LOS TESTS DE DOCX BUILDER PLANNING PASARON <<<")
    print("============================================================")
