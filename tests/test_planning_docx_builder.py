"""Test DOCX Builder Planning — Certificación oficial del motor Word (.docx)
para Unidades, Proyectos y Experiencias de Aprendizaje (PlanningContainer 2.0).
Especializado para Educación Secundaria (JEC y Regular).

Verifica:
1. Conteo estricto de 12 tablas oficiales (len(doc.tables) == 12)
2. Identificación explícita de las 12 estructuras oficiales MINEDU
3. Tabla Dual: Propósito vs Producto Final
4. Datos Administrativos y Contexto (I.E., DRE, UGEL, Director, Coordinador, Docente, Ciclo, Grado, Secciones, Periodo)
5. Matriz Curricular y Estándares (sin inventar criterios C1-C4 inexistentes)
6. Secuencia Didáctica Semanal (Semana, Duración, Campo Temático, Evidencia, Instrumento)
7. Planificaciones Multidisciplinarias (Ciencia y Tecnología + Matemática)
8. Resiliencia de Borradores mínimos (12 tablas sin crash)

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
    print("\n[1/4] Generando y certificando DOCX para Unidad de Secundaria (Fixture)...")
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
    assert abs(sec.top_margin.inches - 0.75) < 0.05, f"Margen superior no es 0.75 in: {sec.top_margin.inches}"
    assert abs(sec.bottom_margin.inches - 0.75) < 0.05, f"Margen inferior no es 0.75 in: {sec.bottom_margin.inches}"

    # 2. Validar presencia de títulos y numerales oficiales
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

    # 3. Exigir exactamente 12 tablas oficiales y cuadrícula de 10,490 twips
    assert len(doc.tables) == 12, f"Debe tener exactamente 12 tablas oficiales (tiene {len(doc.tables)})"
    for i, tbl in enumerate(doc.tables):
        tblGrid = tbl._tbl.find(qn('w:tblGrid'))
        assert tblGrid is not None, f"Tabla {i} no tiene w:tblGrid"
        col_widths = [int(gc.attrib.get(qn('w:w'), 0)) for gc in tblGrid.findall(qn('w:gridCol'))]
        total_w = sum(col_widths)
        assert total_w == 10490, f"Tabla {i} no cumple con 10,490 twips exactos (tiene {total_w})"

    # 4. Identificar explícitamente las 12 estructuras oficiales
    # Tabla 1: Datos Informativos
    tbl_0 = doc.tables[0]
    t0_text = " ".join(c.text for row in tbl_0.rows for c in row.cells)
    assert "Institución Educativa:" in t0_text
    assert "Docente Responsable:" in t0_text
    assert "Nivel y Ciclo:" in t0_text

    # Tabla 2: Situación Significativa y Reto
    tbl_1 = doc.tables[1]
    t1_text = " ".join(c.text for row in tbl_1.rows for c in row.cells)
    assert "Contexto y Diagnóstico" in t1_text
    assert "Pregunta Retadora" in t1_text

    # Tabla 3: Tabla Dual (Propósito vs Producto Final)
    tbl_2 = doc.tables[2]
    assert "PROPÓSITO DE LA EXPERIENCIA / UNIDAD DIDÁCTICA" in tbl_2.rows[0].cells[0].text
    assert "PRODUCTO FINAL DE LA UNIDAD DIDÁCTICA" in tbl_2.rows[0].cells[1].text
    assert container.purpose.summary in tbl_2.rows[1].cells[0].text
    assert container.finalProduct.title in tbl_2.rows[1].cells[1].text
    assert container.finalProduct.description in tbl_2.rows[1].cells[1].text

    # Tabla 4: Estándares de Aprendizaje del Ciclo
    tbl_3 = doc.tables[3]
    t3_text = " ".join(c.text for row in tbl_3.rows for c in row.cells)
    assert "ESTÁNDARES DE APRENDIZAJE DE LAS COMPETENCIAS" in t3_text
    assert "Resuelve problemas de cantidad" in t3_text

    # Tabla 5: Matriz Curricular (Criterios y Desempeños)
    tbl_4 = doc.tables[4]
    t4_text = " ".join(c.text for row in tbl_4.rows for c in row.cells)
    assert "DESEMPEÑOS PRECISADOS" in t4_text
    assert "CRITERIOS DE" in t4_text
    assert "EVIDENCIA E" in t4_text
    assert "Traduce cantidades a expresiones numéricas" in t4_text
    assert "Establece relaciones entre datos y las transforma en expresiones con porcentajes" in t4_text
    assert "Representa descuentos y aumentos porcentuales" in t4_text
    assert "Tabla comparativa con cálculos verificados" in t4_text
    assert "Lista de cotejo" in t4_text

    # Tabla 6: Competencias Transversales CNEB
    tbl_5 = doc.tables[5]
    t5_text = " ".join(c.text for row in tbl_5.rows for c in row.cells)
    assert "COMPETENCIAS TRANSVERSALES" in t5_text
    assert "Se desenvuelve en entornos virtuales" in t5_text
    assert "Gestiona su aprendizaje de manera autónoma" in t5_text

    # Tabla 7: Enfoques Transversales y Valores
    tbl_6 = doc.tables[6]
    t6_text = " ".join(c.text for row in tbl_6.rows for c in row.cells)
    assert "ENFOQUE TRANSVERSAL" in t6_text
    assert "Orientación al bien común" in t6_text

    # Tabla 8: Secuencia Didáctica Semanal (7 Columnas)
    tbl_7 = doc.tables[7]
    t7_text = " ".join(c.text for row in tbl_7.rows for c in row.cells)
    assert "SESIÓN DE" in t7_text or "SESIÓN /" in t7_text
    assert "SEMANA 1" in t7_text
    assert "¿Qué dicen realmente las promociones?" in t7_text
    assert "(90 min)" in t7_text
    assert "porcentajes" in t7_text
    assert "Ficha con datos y representación de promociones" in t7_text
    assert "Lista de cotejo" in t7_text
    assert "SEMANA 2" in t7_text
    assert "Comparamos el costo real" in t7_text
    assert "Rúbrica analítica" in t7_text

    # Validar C1-C4 sin inventar criterios ficticios
    # Sesión 1: contiene sólo 1 criterio ("criterion-model") -> debe tener C1 pero NO C2
    s1_crits = tbl_7.rows[1].cells[3].text
    assert "❖ C1: Representa descuentos y aumentos porcentuales" in s1_crits
    assert "C2" not in s1_crits, "Sesión 1 no debe inventar criterio C2 inexistente"

    # Sesión 2: contiene 2 criterios ("criterion-strategy", "criterion-argument") -> C1 y C2 pero NO C3
    s2_crits = tbl_7.rows[2].cells[3].text
    assert "❖ C1: Selecciona y ejecuta estrategias" in s2_crits
    assert "❖ C2: Sustenta una recomendación" in s2_crits
    assert "C3" not in s2_crits, "Sesión 2 no debe inventar criterio C3 inexistente"

    # Tabla 9: Producto Final Integrador
    tbl_8 = doc.tables[8]
    t8_text = " ".join(c.text for row in tbl_8.rows for c in row.cells)
    assert "DENOMINACIÓN DEL PRODUCTO INTEGRADOR" in t8_text
    assert "Guía para comparar promociones y pagos" in t8_text

    # Tabla 10: Materiales y Recursos Educativos
    tbl_9 = doc.tables[9]
    t9_text = " ".join(c.text for row in tbl_9.rows for c in row.cells)
    assert "MATERIALES DE AULA" in t9_text
    assert "RECURSOS Y MEDIOS EDUCATIVOS" in t9_text

    # Tabla 11: Orientaciones para la Evaluación Formativa
    tbl_10 = doc.tables[10]
    t10_text = " ".join(c.text for row in tbl_10.rows for c in row.cells)
    assert "FINALIDAD Y ENFOQUE FORMATIVO" in t10_text
    assert "TÉCNICAS E INSTRUMENTOS DE EVALUACIÓN" in t10_text

    # Tabla 12: Firmas de Responsabilidad Pedagógica
    tbl_11 = doc.tables[11]
    t11_text = " ".join(c.text for row in tbl_11.rows for c in row.cells)
    assert "COORDINADOR(A) PEDAGÓGICO(A)" in t11_text
    assert "DOCENTE RESPONSABLE DEL ÁREA" in t11_text

    print(f"  ✓ Fixture probado con éxito ({size} bytes, exactamente 12 tablas, 10,490 twips verificado)")


def test_administrative_context_fidelity():
    print("\n[2/4] Verificando conservación de todos los datos administrativos nuevos...")
    admin_data = {
        "schemaVersion": "2.0",
        "id": "plan-admin-test-001",
        "revision": 1,
        "status": "reviewed",
        "identity": {
            "title": "Unidad de Certificación Administrativa",
            "planningType": "unit",
            "level": "secondary",
            "cycle": "VII",
            "grade": "5",
            "duration": {"value": 5, "unit": "weeks"}
        },
        "administrativeContext": {
            "institution": "I.E. Emblemática San Ramón",
            "director": "Dr. Fernando Morales Castro",
            "coordinator": "Mg. Patricia Delgado (Coordinadora Pedagógica)",
            "teacher": "Lic. Manuel Quispe Ramos",
            "dre": "DRE Cajamarca",
            "ugel": "UGEL Chota",
            "academicYear": "2026",
            "period": "Trimestre I",
            "sections": ["A", "B", "C"]
        },
        "significantSituation": {
            "context": "Contexto de prueba administrativa.",
            "problemOrOpportunity": "Desafío de prueba.",
            "expectedResponse": "Respuesta esperada."
        },
        "drivingQuestion": "¿Cómo certificamos los datos administrativos?",
        "purpose": {"summary": "Validar fidelidad de metadatos administrativos."},
        "curriculumMap": [{
            "id": "map-adm",
            "area": {"id": "math", "officialName": "Matemática"},
            "competency": {"id": "c1", "officialName": "Resuelve problemas de gestión de datos"},
            "capacities": [{"id": "cap1", "officialName": "Representa datos con gráficos"}],
            "standard": {"description": "Estándar de gestión de datos."},
            "performances": [{"id": "p1", "description": "Desempeño administrativo."}],
            "criteria": [{"id": "crit1", "description": "Criterio administrativo."}],
            "expectedEvidence": [{"id": "ev1", "description": "Evidencia administrativa."}]
        }]
    }

    container = PlanningContainerV2(**admin_data)
    stream = build_docx_from_planning_v2(container)
    doc = docx.Document(stream)

    assert len(doc.tables) == 12, "Debe generar exactamente 12 tablas"

    # Verificar Tabla 0 (Datos Informativos)
    tbl_info = doc.tables[0]
    info_text = " ".join(c.text for row in tbl_info.rows for c in row.cells)

    assert "I.E. Emblemática San Ramón" in info_text
    assert "Dr. Fernando Morales Castro" in info_text
    assert "Mg. Patricia Delgado (Coordinadora Pedagógica)" in info_text
    assert "Lic. Manuel Quispe Ramos" in info_text
    assert "DRE Cajamarca" in info_text
    assert "UGEL Chota" in info_text
    assert "5.º de Secundaria" in info_text
    assert "Ciclo VII" in info_text
    assert "A, B, C" in info_text
    assert "2026" in info_text
    assert "Trimestre I" in info_text

    # Verificar Firmas (Tabla 11)
    tbl_sig = doc.tables[11]
    sig_text = " ".join(c.text for row in tbl_sig.rows for c in row.cells)
    assert "Mg. Patricia Delgado (Coordinadora Pedagógica)" in sig_text
    assert "Lic. Manuel Quispe Ramos" in sig_text

    print("  ✓ Metadatos administrativos conservados al 100% en el DOCX")


def test_multidisciplinary_unit():
    print("\n[3/4] Generando DOCX para Unidad Multidisciplinaria (Ciencia + Matemática)...")
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

    assert len(doc.tables) == 12, f"La unidad multidisciplinaria debe generar exactamente 12 tablas (tiene {len(doc.tables)})"

    all_text = " ".join(p.text for p in doc.paragraphs)
    assert "PROYECTO DE APRENDIZAJE" in all_text
    assert "Indagamos el consumo de energía eléctrica" in all_text

    tbl_mat = doc.tables[4]
    mat_text = " ".join(cell.text for row in tbl_mat.rows for cell in row.cells)
    assert "Ciencia y Tecnología" in mat_text
    assert "Indaga mediante métodos científicos" in mat_text
    assert "Matemática" in mat_text
    assert "Resuelve problemas de regularidad, equivalencia y cambio" in mat_text

    print("  ✓ Unidad multidisciplinaria generada con 12 tablas y validada exitosamente")


def test_draft_resilience():
    print("\n[4/4] Probando resiliencia frente a borradores con campos mínimos...")
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
    assert len(doc.tables) == 12, f"El borrador mínimo debe generar exactamente 12 tablas (tiene {len(doc.tables)})"
    print("  ✓ Borrador mínimo procesado con exactamente 12 tablas oficiales sin errores")


if __name__ == '__main__':
    test_fixture_planning_unit()
    test_administrative_context_fidelity()
    test_multidisciplinary_unit()
    test_draft_resilience()
    print("\n============================================================")
    print(">>> TODOS LOS TESTS DE DOCX BUILDER PLANNING PASARON (12/12 TABLAS CERTIFICADAS) <<<")
    print("============================================================")
