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

Frontend estático desplegado con GitHub Pages. La interfaz principal está en `index.html`; los controladores están en `js/` y los estilos en `css/`.

El shell usa tokens semánticos y tres preferencias visuales persistentes: `Sistema`, `Claro` y `Oscuro`. Las responsabilidades transversales del editor están separadas de `app.js`:

- `js/core/app-utils.js`: formato, escape seguro, tiempos y tipos MIME.
- `js/services/local-export-client.js`: detección, autenticación y exportación mediante el motor local.
- `js/services/document-source-processor.js`: lectura y renderizado de PDF usados como referencia para IA.
- `js/theme.js`: preferencia de tema y sincronización con el sistema operativo.
- `js/ui-shell.js`: comportamiento de menús del shell.

Las solicitudes de IA siguen esta ruta:

```text
Navegador -> Supabase Edge Function -> proveedor de IA
```

El navegador nunca solicita ni almacena claves de proveedores.

### Supabase

Funciones activas:

- `openai-router`
- `gemini-router`
- `deepseek-router`
- `pablito-mailer`

Secretos requeridos:

- `OPENAI_API_KEY`
- `API-KEY-GEMINI`
- `API-KEY-DEEPSEEK`

Los routers de IA requieren una sesión autenticada de Supabase antes de consumir créditos.

### Motor local

El backend FastAPI de `backend/` genera Word y PDF. Su versión se define en `backend/version.py`. El ejecutable de Windows se compila con PyInstaller y se publica en GitHub Releases al crear un tag `v*` que coincida con esa versión.

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
