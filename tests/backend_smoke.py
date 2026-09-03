import json
from pathlib import Path
import sys

from fastapi.testclient import TestClient


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

import main  # noqa: E402


def run() -> None:
    client = TestClient(main.app)

    status = client.get("/")
    assert status.status_code == 200
    assert status.json()["status"] == "Online"

    unauthorized = client.post("/exportar-docx-json", json={"token": "incorrecto"})
    assert unauthorized.status_code == 401

    allowed_preflight = client.options(
        "/exportar-docx-json",
        headers={
            "Origin": "https://sesiones.sypablitodp.site",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
            "Access-Control-Request-Private-Network": "true",
        },
    )
    assert allowed_preflight.status_code == 200
    assert allowed_preflight.headers["access-control-allow-origin"] == (
        "https://sesiones.sypablitodp.site"
    )
    assert allowed_preflight.headers["access-control-allow-private-network"] == "true"

    blocked_origin = client.options(
        "/exportar-docx-json",
        headers={
            "Origin": "https://malicioso.example",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert "access-control-allow-origin" not in blocked_origin.headers

    oversized = client.post(
        "/exportar-docx-json",
        content=b"{}",
        headers={"content-length": str(main.MAX_REQUEST_BYTES + 1)},
    )
    assert oversized.status_code == 413

    payload = {
        "metadata": {
            "institucion": "I.E. Prueba",
            "nivel": "SECUNDARIA",
            "grado": "1",
            "seccion": "A",
            "area": "Matemática",
            "titulo": "Prueba funcional",
        },
        "proposito": {
            "competencia": "Resuelve problemas de cantidad",
            "capacidades": ["Traduce cantidades"],
            "criterios": ["Resuelve el reto"],
        },
        "momentos": {
            "inicio": {
                "actividades": ["Presentación del reto"],
                "tiempo_total": "10 min",
            },
            "desarrollo": {
                "procesos": [
                    {
                        "clave": "p1",
                        "titulo": "Resolución",
                        "contenido": ["Trabajo guiado"],
                    }
                ],
                "tiempo_total": "30 min",
            },
            "cierre": {
                "metacognicion": ["¿Qué aprendimos?"],
                "evaluacion": [],
                "extension": [],
                "tiempo_total": "5 min",
            },
        },
        "recursos": {"materiales": "Pizarra"},
        "alumnos": ["Ana Pérez", "Luis Díaz"],
        "token": main.CONNECTION_TOKEN,
    }

    word = client.post("/exportar-docx-json", json=payload)
    assert word.status_code == 200, word.text
    assert word.headers["content-type"].startswith(
        "application/vnd.openxmlformats-officedocument"
    )
    assert word.content[:2] == b"PK"
    assert len(word.content) > 10_000

    v1_payload = json.loads(
        (ROOT / "tests" / "fixtures" / "secundaria-matematica-polya.v1.json").read_text(
            encoding="utf-8"
        )
    )
    rich_html = main.sanitize_rich_html(
        '<p onclick="evil()"><strong>Pregunta</strong></p>'
        '<table style="border:1px solid #000"><tr><td>Dato</td></tr></table>'
        '<script>alert(1)</script>'
    )
    assert '<strong>Pregunta</strong>' in rich_html
    assert '<table style="border:1px solid #000">' in rich_html
    assert 'onclick' not in rich_html and '<script' not in rich_html

    canonical = main.SessionDocumentV1(**v1_payload)
    pdf_compat = main.v1_to_legacy_pdf_payload(canonical, main.CONNECTION_TOKEN)
    cierre = pdf_compat['momentos']['cierre']
    assert cierre['metacognicion'], 'El cierre v1 debe llegar al PDF'
    assert cierre['evaluacion'], 'La evaluación formativa v1 debe llegar al PDF'
    assert cierre['extension'], 'La extensión v1 debe llegar al PDF'

    v1_payload["token"] = main.CONNECTION_TOKEN
    word_v1 = client.post("/exportar-docx-json", json=v1_payload)
    assert word_v1.status_code == 200, word_v1.text
    assert word_v1.content[:2] == b"PK"
    assert len(word_v1.content) > 10_000

    print(
        "backend_smoke.py: OK "
        f"({len(word.content)} legacy, {len(word_v1.content)} v1, CORS y límite OK)"
    )


if __name__ == "__main__":
    run()
