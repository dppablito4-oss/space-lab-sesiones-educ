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

    print(f"backend_smoke.py: OK ({len(word.content)} bytes, CORS y límite OK)")


if __name__ == "__main__":
    run()
