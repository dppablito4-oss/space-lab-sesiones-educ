# Space Lab - Sesiones Educativas

Aplicación para crear, editar, guardar y exportar sesiones de aprendizaje alineadas al CNEB y a formatos MINEDU.

Sitio: <https://sesiones.sypablitodp.site>

## Arquitectura

La aplicación usa un único contrato de datos, `SessionDocument v1`, definido en:

- `schemas/session-document.v1.schema.json`
- `js/ai/session-validator.js`
- `backend/models/session_document.py`

El mismo documento alimenta la vista web, la exportación DOCX y la exportación PDF. Los adaptadores legacy se conservan únicamente para abrir sesiones antiguas.

### Frontend

Frontend estático moderno alojado en GitHub Pages con arquitectura de vista dual:
- **Landing Page / Bienvenida (`#landing-view`)**: Presentación del producto, desglose del flujo pedagógico CNEB en 3 pasos, especificaciones del motor local, catálogo de modelos de IA, selector interactivo de tema y preguntas frecuentes para docentes.
- **Espacio de Trabajo / Editor (`#app-view`)**: Interfaz operacional con rail de etapas de 6 pasos, formulario contextual de competencias/capacidades, previsualización interactiva de hoja A4 y consola de comandos de exportación.

El shell visual utiliza tokens semánticos con soporte completo para tres modos: `Sistema`, `Claro` y `Oscuro` (persistidos en `localStorage`). Las responsabilidades están modularizadas:

- `js/core/app-utils.js`: formato, escape seguro contra inyecciones XSS, tiempos y tipos MIME.
- `js/services/local-export-client.js`: detección en `localhost:8000`, autenticación por token rotativo y compilación con el motor local.
- `js/services/document-source-processor.js`: lectura y renderizado de PDF usados como referencia pedagógica para IA.
- `js/theme.js`: sincronización reactiva de temas entre controles (`#theme-preference` y selectores de la landing).
- `js/ui-shell.js`: orquestación de navegación, atajos y menús del shell.

Las solicitudes de IA siguen esta ruta cifrada:

```text
Navegador -> Supabase Edge Function -> Proveedor de IA (OpenAI / DeepSeek / Gemini)
```

El navegador nunca solicita, manipula ni almacena claves secretas de proveedores.

### Supabase y Routers Multi-Modelo

Funciones activas y enrutadores de IA:

- `openai-router`: Enrutamiento seguro para **GPT-6 Luna**, **GPT-5.4 Mini** y **GPT-4o**.
- `gemini-router`: Integración con **Gemini 2.5 Flash** para respuestas ultra-rápidas.
- `deepseek-router`: Razonamiento metodológico con **DeepSeek R1** y **DeepSeek V3**.
- `pablito-mailer`: Notificaciones y comunicaciones transaccionales.

Secretos requeridos:

- `OPENAI_API_KEY`
- `API-KEY-GEMINI`
- `API-KEY-DEEPSEEK`

El sistema integra un registro y débito automatizado de créditos por usuario en Supabase (`ai-credits`), eliminando la necesidad de verificaciones manuales.

### Motor Local de Alta Fidelidad (Desktop)

Debido a que los navegadores web convencionales no disponen de APIs nativas para generar archivos OpenXML (.docx) con tablas anidadas multinivel, márgenes de imprenta exactos y fórmulas matemáticas editables (OMML), la aplicación incorpora una arquitectura híbrida:

1. El usuario planifica, diseña y edita en la interfaz web.
2. Para exportar a Word o PDF con 100% de fidelidad, el cliente web se comunica vía HTTP seguro con `pablitopyhost.exe`, un micro-servicio local FastAPI que se ejecuta en segundo plano en Windows (`http://localhost:8000`).
3. Su código fuente reside en `backend/` y su versión se define en `backend/version.py`.
4. El ejecutable se compila automáticamente con PyInstaller mediante GitHub Actions y se distribuye a través de GitHub Releases:
   `https://github.com/dppablito4-oss/space-lab-sesiones-educ/releases/latest/download/pablitopyhost.exe`.

## Estructura

```text
backend/                 Motor FastAPI y generadores DOCX/PDF
css/                     Estilos de interfaz, documento e impresión
data/                    Datos curriculares
design-system/           Tokens y criterios visuales del producto
js/                      Aplicación web y adaptadores SessionDocument
schemas/                 Contrato JSON canónico
supabase/functions/      Edge Functions y autenticación compartida
tests/                   Contratos, seguridad, render y exportación
assets/                  Marca y documentos oficiales de referencia
```

Archivos SQL:

- `database_setup.sql`: instalación principal e idempotente.
- `scripts/repair_student_roster.sql`: reparación opcional del padrón de estudiantes. La fuente de verdad del esquema es `database_setup.sql` junto con `supabase/migrations/`.

El historial Git no se reescribe durante esta estabilización. Si el tamaño histórico del repositorio se vuelve un problema, puede evaluarse posteriormente `git filter-repo` en una tarea separada, con respaldo y coordinación previa.

## Desarrollo local

Requisitos:

- Python 3.11
- Node.js 22 o posterior
- Deno 2

Instalar dependencias:

```powershell
python -m pip install -r backend/requirements.txt
python -m playwright install chromium
```

La web puede servirse con cualquier servidor estático. Por ejemplo:

```powershell
python -m http.server 5173
```

## Pruebas

Validaciones principales:

```powershell
node tests/test_contract_v1.js
node tests/test_adapter_v1.js
node tests/test_templates_v1.js
node tests/test_presentation.js
node tests/test_session_export.js
node tests/storage.test.js
node tests/ai-provider-routing.test.js
node tests/theme.test.js
node tests/app-utils.test.js
node tests/local-export-client.test.js
node tests/document-source-processor.test.js

python tests/test_contract_v1.py
python tests/test_adapter_v1_py.py
python tests/test_docx_builder_v1.py
python tests/backend_smoke.py
python tests/frontend_security.py
python tests/ui_smoke.py
python tests/ui_presentation_smoke.py
python tests/ui_theme_smoke.py
python tests/ui_accessibility_smoke.py
python tests/no_emoji_controls.py
```

GitHub Actions ejecuta estas pruebas, valida las Edge Functions y compila `pablitopyhost-windows` en cada push a `main`. Un tag como `v1.3.0` vuelve a ejecutar la validación, compila el motor y adjunta `pablitopyhost.exe` a un GitHub Release. La descarga estable es `https://github.com/dppablito4-oss/space-lab-sesiones-educ/releases/latest/download/pablitopyhost.exe`.

## Despliegue de Edge Functions

```powershell
npx supabase link --project-ref koptglmifwpzrfzvipnm
npx supabase functions deploy openai-router --no-verify-jwt
npx supabase functions deploy gemini-router --no-verify-jwt
npx supabase functions deploy deepseek-router --no-verify-jwt
npx supabase functions deploy pablito-mailer
```

`--no-verify-jwt` delega la verificación al helper compartido `supabase/functions/_shared/auth.ts`; no vuelve públicas las funciones de IA.
