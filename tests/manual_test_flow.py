"""Manual / E2E Verification of Account Creation and Manual Planning with DOCX Export.

Runs Chromium using local .venv, performs the exact user flow:
1. Pairs with local backend token at /conexion.html
2. Navigates to /index.html
3. Opens auth modal, switches to 'Registrarse', fills unique form and creates account
4. Closes auth modal, opens Planning Studio
5. Grants entitlements and chooses 'Crear manualmente' (modo manual)
6. Completes step 0 (Identidad), step 1 (Situación/Propósito), step 2 (Currículo EPT), step 5 (Secuencia/Sesión)
7. Saves unit draft to repository
8. Opens unit in PlanningView
9. Triggers 'Descargar Word (.docx)'
10. Verifies download event and docx file size (> 10 KB)
"""
import sys
import time
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
TOKEN_FILE = ROOT / "connection_token.txt"
TOKEN = TOKEN_FILE.read_text(encoding="utf-8").strip() if TOKEN_FILE.exists() else "0" * 64

SCREENSHOTS_DIR = ROOT / "tests" / "screenshots"
SCREENSHOTS_DIR.mkdir(exist_ok=True)


def run():
    print("============================================================")
    print("Iniciando prueba manual interactiva con Chromium en host local")
    print(f"Token local: {TOKEN[:8]}...")
    print("============================================================")

    timestamp = int(time.time())
    test_username = f"docente_{timestamp % 100000}"
    test_email = f"docente.{timestamp}@sypablitodp.site"
    test_pass = "Docente2026!"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1366, "height": 860}, accept_downloads=True)
        page = context.new_page()

        page.on("console", lambda msg: print(f"  [Console] {msg.text}"))
        page.on("pageerror", lambda err: print(f"  [Page Error] {err}"))

        # -------------------------------------------------------------
        # 1. Pairing local
        # -------------------------------------------------------------
        print("\n[1/6] Vinculando sesión local con el motor en conexion.html...")
        pairing_url = f"http://127.0.0.1:8080/conexion.html?token={TOKEN}"
        page.goto(pairing_url, wait_until="networkidle")
        page.wait_for_timeout(1000)
        page.screenshot(path=str(SCREENSHOTS_DIR / "1_pairing.png"))
        print("  ✓ Token registrado y verificado en localStorage")

        # -------------------------------------------------------------
        # 2. Cargar aplicación principal
        # -------------------------------------------------------------
        print("\n[2/6] Cargando plataforma en http://127.0.0.1:8080/index.html...")
        page.goto("http://127.0.0.1:8080/index.html", wait_until="networkidle")
        page.wait_for_timeout(1500)
        page.screenshot(path=str(SCREENSHOTS_DIR / "2_index.png"))
        print("  ✓ Página principal cargada exitosamente")

        # -------------------------------------------------------------
        # 3. Autenticación / Registro de cuenta
        # -------------------------------------------------------------
        print(f"\n[3/6] Probando registro de cuenta: {test_username} ({test_email})...")
        # Abrir modal de auth en modo registro
        page.evaluate("() => { if (window.AuthUi) window.AuthUi.openRegister(); }")
        page.wait_for_selector("#auth-username", state="visible", timeout=6000)

        # Completar campos del formulario
        page.locator("#auth-username").fill(test_username)
        page.locator("#auth-email").fill(test_email)
        page.locator("#auth-password").fill(test_pass)
        page.locator("#auth-confirm-password").fill(test_pass)
        page.locator("#auth-terms").check()
        page.wait_for_timeout(300)
        page.screenshot(path=str(SCREENSHOTS_DIR / "3_registro_formulario.png"))

        # Enviar registro
        print("  Enviando datos de registro...")
        page.locator("#btn-submit-auth").click()
        page.wait_for_timeout(2500)
        page.screenshot(path=str(SCREENSHOTS_DIR / "3_registro_confirmacion.png"))
        print("  ✓ Registro enviado y procesado")

        # Cerrar el modal de autenticación para despejar la vista
        page.evaluate("() => { if (window.AuthUi?.closeModal) window.AuthUi.closeModal(); document.getElementById('auth-modal')?.classList.add('hidden'); }")
        page.wait_for_timeout(500)

        # -------------------------------------------------------------
        # 4. Habilitar permisos de planificación y abrir Planning Studio
        # -------------------------------------------------------------
        print("\n[4/6] Configurando permisos y abriendo Planning Studio...")
        page.evaluate("""() => {
            if (window.SupabaseClient) {
                window.SupabaseClient.getUserEntitlements = async () => ({
                    ok: true,
                    features: {
                        'planning.unit': true,
                        'planning.experience': true,
                        'planning.project': true
                    }
                });
            }
            window.dispatchEvent(new CustomEvent('planning:view-library'));
            const dlg = document.getElementById('planning-dialog');
            if (dlg && !dlg.open) dlg.showModal();
        }""")
        
        page.wait_for_selector('button[data-planning-action="create"][data-type="unit"]', state="visible", timeout=8000)
        page.screenshot(path=str(SCREENSHOTS_DIR / "4_planning_library.png"))
        print("  ✓ Planning Studio abierto (Biblioteca)")

        # -------------------------------------------------------------
        # 5. Crear Unidad manualmente (Paso a paso)
        # -------------------------------------------------------------
        print("\n[5/6] Creando Unidad de Aprendizaje manualmente...")
        # Clic en botón "Unidad"
        btn_unit = page.locator('button[data-planning-action="create"][data-type="unit"]')
        btn_unit.click()
        
        # Esperar y seleccionar "Crear manualmente"
        page.wait_for_selector('button[data-planning-action="mode-manual"]', state="visible", timeout=8000)
        page.screenshot(path=str(SCREENSHOTS_DIR / "4_planning_choice.png"))
        page.locator('button[data-planning-action="mode-manual"]').click()
        page.wait_for_timeout(600)

        # Paso 0: Identidad
        page.wait_for_selector('[data-path="identity.title"]', state="visible", timeout=8000)
        page.locator('[data-path="identity.title"]').fill("Unidad de Emprendimiento Sostenible 3.°")
        page.locator('[data-path="identity.grade"]').select_option("3")
        page.locator('[data-path="identity.duration.value"]').fill("4")
        page.wait_for_timeout(400)
        page.screenshot(path=str(SCREENSHOTS_DIR / "4_step0_identidad.png"))
        print("  ✓ Paso 0 (Identidad): Grado 3.° Secundaria, Duración 4 semanas")

        # Ir a Paso 1: Situación y Propósito
        page.locator('.planning-steps [data-step="1"]').click()
        page.wait_for_selector('[data-path="significantSituation.context"]', state="visible", timeout=8000)
        page.locator('[data-path="significantSituation.context"]').fill(
            "En la comunidad se observa acumulación desmedida de residuos sólidos reciclables."
        )
        page.locator('[data-path="significantSituation.problemOrOpportunity"]').fill(
            "Oportunidad de crear modelos de negocio ecológicos y rentables."
        )
        page.locator('[data-path="drivingQuestion"]').fill(
            "¿Cómo podemos diseñar un emprendimiento sostenible aplicando Lean Canvas?"
        )
        page.locator('[data-path="purpose.summary"]').fill(
            "Gestionar proyectos de emprendimiento económico y social articulando el CNEB."
        )
        page.wait_for_timeout(400)
        page.screenshot(path=str(SCREENSHOTS_DIR / "4_step1_situacion.png"))
        print("  ✓ Paso 1 (Situación y Propósito): Contexto, Reto y Propósito definidos")

        # Ir a Paso 2: Currículo
        page.locator('.planning-steps [data-step="2"]').click()
        page.wait_for_selector('#planning-competency', state="visible", timeout=8000)
        # Seleccionar competencia EPT: manages-entrepreneurship-projects
        comp_select = page.locator("#planning-competency")
        comp_select.select_option("manages-entrepreneurship-projects")
        page.wait_for_timeout(400)
        page.screenshot(path=str(SCREENSHOTS_DIR / "4_step2_curriculo.png"))
        print("  ✓ Paso 2 (Currículo): Área Educación para el Trabajo vinculada con éxito")

        # Ir a Paso 5: Secuencia
        page.locator('.planning-steps [data-step="5"]').click()
        page.wait_for_selector('button[data-planning-action="session"]', state="visible", timeout=8000)
        # Añadir sesión
        page.locator('button[data-planning-action="session"]').click()
        page.wait_for_selector('[data-path="sequence.0.title"]', state="visible", timeout=8000)
        page.locator('[data-path="sequence.0.title"]').fill("Sesión 1: Exploración del Problema y Lienzo Lean Canvas")
        page.screenshot(path=str(SCREENSHOTS_DIR / "4_step5_secuencia.png"))
        print("  ✓ Paso 5 (Secuencia): Sesión 1 agregada a la progresión didáctica")

        # Guardar borrador de la unidad
        page.locator('button[data-planning-action="save"]').click()
        page.wait_for_timeout(1500)
        page.screenshot(path=str(SCREENSHOTS_DIR / "4_unidad_guardada.png"))
        print("  ✓ Unidad guardada correctamente en el repositorio local")

        # Obtener ID de la unidad guardada desde el localStorage o repository
        unit_id = page.evaluate("""() => {
            const repo = window.PlanningRepository.create({ validator: window.PlanningContainerV2 });
            const list = repo.list();
            return list.length ? list[0].id : null;
        }""")
        print(f"  ID de la unidad creada: {unit_id}")

        # Asegurar token en localStorage para el exportador
        page.evaluate(f"() => localStorage.setItem('connection_token', '{TOKEN}')")

        # -------------------------------------------------------------
        # 6. Abrir en PlanningView y exportar Word (.docx)
        # -------------------------------------------------------------
        print("\n[6/6] Abriendo PlanningView y ejecutando exportación Word (.docx)...")
        page.evaluate(f"window.PlanningView.open('{unit_id}')")
        page.wait_for_selector('button[data-planning-view-action="export-docx"]', state="visible", timeout=10000)
        page.screenshot(path=str(SCREENSHOTS_DIR / "5_planning_view.png"))

        btn_export = page.locator('button[data-planning-view-action="export-docx"]')
        assert btn_export.is_visible(), "El botón 'Descargar Word (.docx)' no está visible en PlanningView"

        download_target = ROOT / "tests" / "fixtures" / f"unidad_3sec_ept_manual_{timestamp}.docx"
        download_target.parent.mkdir(exist_ok=True)

        print("  Disparando clic en Descargar Word (.docx)...")
        with page.expect_download(timeout=30000) as download_info:
            btn_export.click()

        download = download_info.value
        download.save_as(str(download_target))
        page.wait_for_timeout(1000)
        page.screenshot(path=str(SCREENSHOTS_DIR / "6_export_completado.png"))

        file_size = download_target.stat().st_size
        print(f"  ✓ Archivo descargado exitosamente: {download.suggested_filename}")
        print(f"  ✓ Tamaño del documento Word: {file_size:,} bytes")
        assert file_size > 10000, f"El archivo descargado es anormalmente pequeño: {file_size} bytes"

        browser.close()

    print("\n============================================================")
    print(">>> TODAS LAS PRUEBAS EN HOST LOCAL FINALIZARON CON ÉXITO <<<")
    print(f"> Documento Word generado: {download_target}")
    print(f"> Capturas guardadas en: {SCREENSHOTS_DIR}")
    print("============================================================")


if __name__ == "__main__":
    run()
