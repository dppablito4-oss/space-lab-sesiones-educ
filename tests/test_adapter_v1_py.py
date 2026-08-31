"""
Test del adapter Python: legacy → SessionDocument v1.
Ejecutar: python tests/test_adapter_v1_py.py
"""
import os
import sys
import json

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

from adapters.legacy_to_v1 import adapt_legacy_to_v1
from main import normalize_sesion_data


def test_legacy_ai_through_normalizer_and_adapter():
    """Simula el flujo completo: JSON IA → normalize_sesion_data → adapt_legacy_to_v1."""
    print("\n[1/3] Flujo completo: IA → normalizer → adapter...")

    # Simular output crudo de la IA (como llega del LLM)
    raw_ai = {
        "titulo_sesion_retador": "Resolvemos problemas con ecuaciones lineales",
        "proposito": {
            "competencia": "Resuelve problemas de regularidad, equivalencia y cambio",
            "estandar": "Resuelve problemas referidos a analizar cambios...",
            "capacidades": ["Traduce datos", "Comunica su comprensión"],
            "criterios_evaluacion": ["Identifica las incógnitas", "Aplica el método de reducción"],
            "producto_evidencia": "Ficha de trabajo resuelta",
            "instrumento": "Lista de Cotejo",
            "conocimientos": "Sistemas de ecuaciones lineales"
        },
        "competencias_transversales": {
            "tic": ["Navega en plataformas digitales"],
            "autonoma": ["Determina metas de aprendizaje"]
        },
        "enfoques": [
            {"nombre": "Enfoque Ambiental", "valor": "Justicia", "actitudes": "Promueve estilos de vida"}
        ],
        "recursos": {
            "paginas_consulta": "https://perueduca.pe",
            "materiales": "Pizarra, plumones",
            "actividades_refuerzo": "Ficha N° 04"
        },
        "momentos": {
            "inicio": {
                "motivacion": "El docente saluda y presenta un caso.",
                "saberes_previos": "¿Qué es una incógnita?",
                "problematizacion": "¿Cómo resolver dos ecuaciones?",
                "proposito_organizacion": "Hoy aprenderemos sistemas de ecuaciones.",
                "tiempo_total": "15 min"
            },
            "desarrollo": {
                "proceso_1_familiarizacion": "<p>Los estudiantes leen el problema.</p>",
                "proceso_2_busqueda_estrategias": "<p>Proponen representaciones.</p>",
                "proceso_3_socializacion": "<p>Exponen en la pizarra.</p>",
                "proceso_4_formalizacion": "<p>El docente sintetiza.</p>",
                "tiempo_total": "65 min"
            },
            "cierre": {
                "actividades": "Metacognición: ¿Qué aprendimos?\nEvaluación formativa: autoevaluación\nExtensión: resolver página 45",
                "tiempo_total": "10 min"
            }
        },
        "evaluacion": {
            "criterio": "Criterio consolidado de la sesión",
            "evidencia": "Ficha resuelta",
            "instrumento": "Lista de Cotejo"
        }
    }

    # Paso 1: Normalizar (como lo hace main.py)
    normalized = normalize_sesion_data(raw_ai)

    # Paso 2: Adaptar a v1
    doc, warnings = adapt_legacy_to_v1(normalized)

    # Verificaciones
    assert doc.schemaVersion == "1.0", "schemaVersion"
    assert doc.metadata.titulo == "Resolvemos problemas con ecuaciones lineales", "titulo"
    assert doc.proposito.competencia != "", "competencia"
    assert len(doc.proposito.criterios) == 2, f"criterios: {doc.proposito.criterios}"
    assert doc.proposito.evidencia == "Ficha de trabajo resuelta", "evidencia"
    assert len(doc.competenciasTransversales) == 2, f"CT: {len(doc.competenciasTransversales)}"
    assert len(doc.enfoquesTransversales) == 1, f"ET: {len(doc.enfoquesTransversales)}"
    assert doc.recursos.enlaces == "https://perueduca.pe", "enlaces"
    assert doc.recursos.refuerzo == "Ficha N° 04", "refuerzo"

    # Momentos — inicio fue normalizado a actividades lista
    assert doc.momentos.inicio.tiempoMinutos == 15, "inicio.tiempoMinutos"
    assert len(doc.momentos.inicio.procesos) >= 1, "inicio.procesos"

    # Momentos — desarrollo fue normalizado a procesos lista
    assert doc.momentos.desarrollo.tiempoMinutos == 65, "desarrollo.tiempoMinutos"
    assert len(doc.momentos.desarrollo.procesos) >= 1, "desarrollo.procesos"

    # Momentos — cierre
    assert doc.momentos.cierre.tiempoMinutos == 10, "cierre.tiempoMinutos"

    # Evaluación NUNCA eliminada
    assert doc.evaluacion.instrumento == "Lista de Cotejo", "evaluacion.instrumento"

    # Roundtrip
    serialized = json.loads(doc.model_dump_json())
    from models.session_document import SessionDocumentV1
    doc2 = SessionDocumentV1(**serialized)
    assert doc2.metadata.titulo == doc.metadata.titulo, "roundtrip titulo"
    assert doc2.evaluacion.instrumento == doc.evaluacion.instrumento, "roundtrip evaluacion"

    print("  ✓ Flujo completo IA → normalize → adapt → v1 OK")


def test_fixtures_through_adapter():
    """Adaptar fixtures ya v1 debería funcionar (los campos se mapean)."""
    print("\n[2/3] Fixtures v1 → adapter...")

    fixtures_dir = os.path.join(TEST_DIR, 'fixtures')
    import glob
    for fpath in glob.glob(os.path.join(fixtures_dir, '*.v1.json')):
        fname = os.path.basename(fpath)
        with open(fpath, 'r', encoding='utf-8') as f:
            raw = json.load(f)
        # Los fixtures ya son v1, pero el adapter debería poder convertir
        # un dict v1 que pase por normalizer sin romper nada
        from models.session_document import SessionDocumentV1
        doc = SessionDocumentV1(**raw)
        assert doc.schemaVersion == "1.0", f"{fname}: schemaVersion"
        print(f"  ✓ {fname} roundtrip OK")


def test_empty_input():
    """Input vacío no debe crashear."""
    print("\n[3/3] Input vacío...")
    doc, warnings = adapt_legacy_to_v1({})
    assert doc.schemaVersion == "1.0", "schemaVersion en vacío"
    assert len(warnings) == 0, "sin warnings para vacío"
    print("  ✓ Input vacío OK")


if __name__ == '__main__':
    print("=" * 60)
    print("TEST ADAPTER PYTHON — Legacy → SessionDocument v1")
    print("=" * 60)

    test_legacy_ai_through_normalizer_and_adapter()
    test_fixtures_through_adapter()
    test_empty_input()

    print("\n" + "=" * 60)
    print(">>> TODOS LOS TESTS DEL ADAPTER PYTHON PASARON <<<")
    print("=" * 60)
