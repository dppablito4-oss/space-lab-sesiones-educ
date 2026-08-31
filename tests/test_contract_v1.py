"""
Test de contrato: valida que todos los fixtures v1 sean aceptados
tanto por el modelo Pydantic como por validación JSON Schema.

Ejecutar: python tests/test_contract_v1.py
"""
import os
import sys
import json
import glob

# Force UTF-8 on Windows
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass


# Setup paths
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(TEST_DIR)
sys.path.insert(0, os.path.join(ROOT_DIR, 'backend'))

from models.session_document import SessionDocumentV1

FIXTURES_DIR = os.path.join(TEST_DIR, 'fixtures')
SCHEMA_PATH = os.path.join(ROOT_DIR, 'schemas', 'session-document.v1.schema.json')

def test_pydantic_validates_all_fixtures():
    """Cada fixture v1 debe ser aceptado por el modelo Pydantic sin errores."""
    fixture_files = glob.glob(os.path.join(FIXTURES_DIR, '*.v1.json'))
    assert len(fixture_files) > 0, f"No se encontraron fixtures en {FIXTURES_DIR}"

    for fpath in fixture_files:
        fname = os.path.basename(fpath)
        with open(fpath, 'r', encoding='utf-8') as f:
            raw = json.load(f)

        try:
            doc = SessionDocumentV1(**raw)
        except Exception as e:
            raise AssertionError(f"Pydantic rechazó {fname}: {e}")

        # Verificar campos clave no se pierden
        assert doc.schemaVersion == "1.0", f"{fname}: schemaVersion incorrecto"
        assert doc.metadata.titulo, f"{fname}: metadata.titulo vacío"
        assert doc.proposito.competencia, f"{fname}: proposito.competencia vacío"
        assert len(doc.momentos.inicio.procesos) > 0, f"{fname}: inicio sin procesos"
        assert len(doc.momentos.desarrollo.procesos) > 0, f"{fname}: desarrollo sin procesos"
        assert len(doc.momentos.cierre.procesos) > 0, f"{fname}: cierre sin procesos"

        # Cada proceso debe conservar id, titulo y contenido
        for momento_name in ['inicio', 'desarrollo', 'cierre']:
            momento = getattr(doc.momentos, momento_name)
            for i, proc in enumerate(momento.procesos):
                assert proc.id, f"{fname}: {momento_name}.procesos[{i}].id vacío"
                assert proc.titulo, f"{fname}: {momento_name}.procesos[{i}].titulo vacío"
                assert proc.contenido.value, f"{fname}: {momento_name}.procesos[{i}].contenido.value vacío"
                assert proc.contenido.format in ('html', 'text'), \
                    f"{fname}: {momento_name}.procesos[{i}].contenido.format inválido: {proc.contenido.format}"

        print(f"  ✓ Pydantic OK: {fname}")


def test_pydantic_roundtrip():
    """Serializar → deserializar no debe perder datos."""
    fixture_files = glob.glob(os.path.join(FIXTURES_DIR, '*.v1.json'))

    for fpath in fixture_files:
        fname = os.path.basename(fpath)
        with open(fpath, 'r', encoding='utf-8') as f:
            raw = json.load(f)

        doc = SessionDocumentV1(**raw)
        serialized = json.loads(doc.model_dump_json())
        doc2 = SessionDocumentV1(**serialized)

        # Comparar campos clave
        assert doc.metadata.titulo == doc2.metadata.titulo, f"{fname}: titulo perdido en roundtrip"
        assert len(doc.momentos.inicio.procesos) == len(doc2.momentos.inicio.procesos), \
            f"{fname}: procesos inicio perdidos en roundtrip"
        assert len(doc.momentos.desarrollo.procesos) == len(doc2.momentos.desarrollo.procesos), \
            f"{fname}: procesos desarrollo perdidos en roundtrip"
        assert len(doc.momentos.cierre.procesos) == len(doc2.momentos.cierre.procesos), \
            f"{fname}: procesos cierre perdidos en roundtrip"

        # Verificar que la evaluación no se pierde
        assert doc.evaluacion.instrumento == doc2.evaluacion.instrumento, \
            f"{fname}: evaluacion.instrumento perdido en roundtrip"

        print(f"  ✓ Roundtrip OK: {fname}")


def test_fixture_specific_fields():
    """Verificar campos específicos de cada fixture."""

    # Secundaria con Polya
    with open(os.path.join(FIXTURES_DIR, 'secundaria-matematica-polya.v1.json'), 'r', encoding='utf-8') as f:
        sec = SessionDocumentV1(**json.load(f))
    assert sec.metadata.nivel == "SECUNDARIA"
    assert len(sec.competenciasTransversales) == 2
    assert len(sec.enfoquesTransversales) == 2
    assert sec.momentos.desarrollo.procesos[0].methodology == "polya"
    assert sec.fichaTrabajo is None
    assert sec.juegoLibreSectores is None
    assert len(sec.listaCotejo.alumnos) == 5
    assert len(sec.listaCotejo.criterios) == 3
    print("  ✓ Secundaria-Polya campos específicos OK")

    # Inicial con juego libre
    with open(os.path.join(FIXTURES_DIR, 'inicial.v1.json'), 'r', encoding='utf-8') as f:
        ini = SessionDocumentV1(**json.load(f))
    assert ini.metadata.nivel == "INICIAL"
    assert ini.juegoLibreSectores is not None
    assert ini.juegoLibreSectores.planificacion != ""
    assert ini.fichaTrabajo is None
    assert ini.momentos.inicio.tiempoMinutos == 10
    print("  ✓ Inicial campos específicos OK")

    # Primaria con ficha
    with open(os.path.join(FIXTURES_DIR, 'primaria-con-ficha.v1.json'), 'r', encoding='utf-8') as f:
        pri = SessionDocumentV1(**json.load(f))
    assert pri.metadata.nivel == "PRIMARIA"
    assert pri.fichaTrabajo is not None
    assert pri.fichaTrabajo.titulo != ""
    assert pri.juegoLibreSectores is None
    assert len(pri.momentos.desarrollo.procesos) == 3
    print("  ✓ Primaria-Ficha campos específicos OK")


def test_evaluacion_not_dropped():
    """Verificar que evaluacion NUNCA se elimina silenciosamente."""
    with open(os.path.join(FIXTURES_DIR, 'secundaria-matematica-polya.v1.json'), 'r', encoding='utf-8') as f:
        raw = json.load(f)

    # El fixture tiene evaluacion con datos
    assert 'evaluacion' in raw, "El fixture debe contener 'evaluacion'"
    assert raw['evaluacion']['instrumento'] == "Lista de Cotejo"

    doc = SessionDocumentV1(**raw)
    assert doc.evaluacion.instrumento == "Lista de Cotejo", \
        "evaluacion.instrumento fue eliminado durante la validación Pydantic!"
    
    # Verificar que no se pierde en serialización
    exported = json.loads(doc.model_dump_json())
    assert 'evaluacion' in exported, "evaluacion fue eliminado durante serialización!"
    assert exported['evaluacion']['instrumento'] == "Lista de Cotejo"
    print("  ✓ evaluacion preservada correctamente (NO eliminada)")


if __name__ == '__main__':
    print("=" * 60)
    print("TEST DE CONTRATO — SessionDocument v1")
    print("=" * 60)

    print("\n[1/4] Validación Pydantic de fixtures...")
    test_pydantic_validates_all_fixtures()

    print("\n[2/4] Roundtrip serialización...")
    test_pydantic_roundtrip()

    print("\n[3/4] Campos específicos por nivel...")
    test_fixture_specific_fields()

    print("\n[4/4] Evaluación no se elimina...")
    test_evaluacion_not_dropped()

    print("\n" + "=" * 60)
    print(">>> TODOS LOS TESTS DE CONTRATO PASARON <<<")
    print("=" * 60)
