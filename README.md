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

El backend FastAPI de `backend/` genera Word y PDF. El ejecutable de Windows se compila con PyInstaller y se publica como artefacto de GitHub Actions.

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
- `student_roster.sql`: instalación o reparación del padrón de estudiantes.

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
node tests/storage.test.js
node tests/ai-provider-routing.test.js

python tests/test_contract_v1.py
python tests/test_adapter_v1_py.py
python tests/test_docx_builder_v1.py
python tests/backend_smoke.py
python tests/frontend_security.py
python tests/ui_smoke.py
python tests/ui_presentation_smoke.py
```

GitHub Actions ejecuta estas pruebas, valida las Edge Functions y compila `pablitopyhost-windows` en cada push a `main`.

## Despliegue de Edge Functions

```powershell
npx supabase link --project-ref koptglmifwpzrfzvipnm
npx supabase functions deploy openai-router --no-verify-jwt
npx supabase functions deploy gemini-router --no-verify-jwt
npx supabase functions deploy deepseek-router --no-verify-jwt
npx supabase functions deploy pablito-mailer
```

`--no-verify-jwt` delega la verificación al helper compartido `supabase/functions/_shared/auth.ts`; no vuelve públicas las funciones de IA.
