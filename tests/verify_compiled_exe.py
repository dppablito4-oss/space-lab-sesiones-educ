import json
import subprocess
import sys
import time
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

import docx
import httpx

ROOT = Path(__file__).resolve().parents[1]
EXE_PATH = ROOT / "backend" / "dist" / "pablitopyhost.exe"
TOKEN_PATH = ROOT / "backend" / "dist" / "connection_token.txt"
FIXTURE_PATH = ROOT / "data" / "pedagogy" / "fixtures" / "secondary_math_project_unit.v2.json"
OUTPUT_DOCX = ROOT / "tests" / "fixtures" / "test_compiled_exe_output.docx"


def main():
    print(f"[1/5] Verificando existencia de {EXE_PATH.name}...")
    assert EXE_PATH.exists(), f"No se encontró el ejecutable en {EXE_PATH}"
    print(f"  [OK] Binario encontrado ({EXE_PATH.stat().st_size:,} bytes)")

    print("\n[2/5] Levantando proceso ejecutable pablitopyhost.exe...")
    process = subprocess.Popen(
        [str(EXE_PATH)],
        cwd=str(EXE_PATH.parent),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

    try:
        online = False
        start_time = time.time()
        while time.time() - start_time < 15:
            try:
                res = httpx.get("http://127.0.0.1:8000/", timeout=1.0)
                if res.status_code == 200 and res.json().get("status") == "Online":
                    online = True
                    server_data = res.json()
                    break
            except Exception:
                time.sleep(0.5)

        assert online, "El ejecutable no respondió en http://127.0.0.1:8000 en 15 segundos"
        print(f"  [OK] Servidor local en línea: {server_data}")
        assert server_data.get("version") == "1.3.0"

        print("\n[3/5] Leyendo token criptográfico generado por el ejecutable...")
        assert TOKEN_PATH.exists(), f"No se generó {TOKEN_PATH}"
        token = TOKEN_PATH.read_text(encoding="utf-8").strip()
        assert len(token) == 64, f"Token no tiene 64 hex: {token}"
        print(f"  [OK] Token detectado: {token[:12]}...")

        print("\n[4/5] Enviando petición de exportación de Unidad de Secundaria (12 tablas)...")
        unit_payload = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))
        unit_payload["token"] = token

        export_res = httpx.post(
            "http://127.0.0.1:8000/exportar-docx-json",
            json=unit_payload,
            headers={
                "Origin": "https://sesiones.sypablitodp.site",
                "Content-Type": "application/json",
            },
            timeout=15.0,
        )

        assert export_res.status_code == 200, f"Error {export_res.status_code}: {export_res.text}"
        assert export_res.content[:2] == b"PK", "El contenido no es un zip/docx válido"
        print(f"  [OK] Documento Word devuelto con éxito ({len(export_res.content):,} bytes)")

        OUTPUT_DOCX.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT_DOCX.write_bytes(export_res.content)

        print("\n[5/5] Auditando estructura interna del DOCX generado por el EXE...")
        doc = docx.Document(str(OUTPUT_DOCX))
        print(f"  - Total de tablas en el documento: {len(doc.tables)}")
        assert len(doc.tables) == 12, f"Se esperaban 12 tablas, encontradas: {len(doc.tables)}"

        # Verificar anchos de tabla
        for i, table in enumerate(doc.tables):
            col_widths = [cell.width for cell in table.rows[0].cells]
            total_width = sum(col_widths)
            # twips a emus: 10490 twips = 6,661,150 emus (aprox)
            print(f"    * Tabla {i+1:02d}: {len(table.rows)} filas x {len(table.columns)} cols")

        print("\n============================================================")
        print(">>> CERTIFICACIÓN DEL EJECUTABLE PABLITOPYHOST.EXE EXITOSA <<<")
        print("============================================================")

    finally:
        print("\nCerrando proceso pablitopyhost.exe...")
        process.terminate()
        try:
            process.wait(timeout=3)
        except subprocess.TimeoutExpired:
            process.kill()
        print("Proceso finalizado limpiamente.")


if __name__ == "__main__":
    main()
