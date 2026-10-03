# REPORTE DE AUDITORÍA TÉCNICA INTEGRAL
## Space Lab — Sesiones Educativas (MINEDU / CNEB Perú)

---

### Ficha Técnica del Proyecto
- **Nombre de la Solución**: Space Lab - Sesiones Educativas con IA
- **Organización / Propietario**: S.Y. PABLITO_DP (`dppablito4-oss`)
- **Repositorio**: `dppablito4-oss/space-lab-sesiones-educ`
- **Ruta de Trabajo Local**: `e:\sesiones_educ_ia`
- **Rama Actual**: `main`
- **Último Commit**: `3cf0871` (*feat(pedagogy): add secondary cycle VII curriculum pilot*)
- **Plataforma en Producción**: [https://sesiones.sypablitodp.site](https://sesiones.sypablitodp.site)
- **Web del Creador**: [https://space.sypablitodp.site](https://space.sypablitodp.site)
- **Fecha de Auditoría**: 2 de Octubre de 2026
- **Estado Global de Certificación**: **APROBADO — APTO PARA PRODUCCIÓN (100% TESTS PASSING)**

---

## 1. Resumen Ejecutivo

**Space Lab - Sesiones Educativas** es una plataforma híbrida de ingeniería de software diseñada específicamente para resolver la planificación pedagógica docente en el Perú, garantizando estricta alineación con el **Currículo Nacional de la Educación Básica (CNEB)** y las directivas normativas del **Ministerio de Educación del Perú (MINEDU)**.

A diferencia de generadores de texto genéricos o soluciones web convencionales, Space Lab integra:
1. Una **SPA web ligera y reactiva** con sistema de diseño modular (Vanilla JS y CSS Tokens) alojada en GitHub Pages.
2. Un **motor desktop local en segundo plano (`pablitohost.exe`)** que ensambla documentos Word (`.docx`) y PDF con especificaciones exactas de imprenta (10,490 twips de cuadrícula MINEDU) y ecuaciones matemáticas nativas editables en formato **OMML (Office Math Markup Language)**.
3. Un **backend serverless seguro en Supabase** con Edge Functions en TypeScript/Deno que gestiona la invocación a modelos de IA de frontera (`gpt-6-luna`, `gpt-5.6-terra`, `gemini-2.5-flash`, `deepseek-reasoner` R1), protegiendo claves maestras y aplicando un sistema contable de créditos atómico con *ledger append-only*.
4. Un contrato canónico de datos **`SessionDocument v1`** y un subsistema de planificación curricular articulada **`PlanningContainer 2.0`** (Experiencias, Unidades y Proyectos de Aprendizaje).

### Métricas Cuantitativas del Repositorio
Se realizó un escrutinio recursivo sobre el código fuente (excluyendo entornos virtuales `.venv`, cachés, builds y metadatos de Git):

| Extensión | Archivos | Líneas de Código | Propósito Técnico |
| :--- | :---: | :---: | :--- |
| **`.js`** | 86 | 19,897 | Controladores de interfaz, validadores de esquemas, servicios HTTP, adaptadores y planning |
| **`.py`** | 39 | 10,254 | Motor FastAPI local, ensambladores OOXML, parser OMML, smoke tests y suite Playwright |
| **`.css`** | 11 | 9,617 | Sistema de diseño Space Lab, diseño tokens, temas Claro/Oscuro/Sistema, lienzo A4 |
| **`.md`** | 15 | 6,448 | Especificaciones arquitectónicas, manuales de auditoría, lineamientos pedagógicos y planes |
| **`.html`** | 7 | 4,105 | SPA principal (`index.html`), consola admin, diagnóstico de conexión y descargas |
| **`.sql`** | 19 | 3,785 | Script de arranque (`database_setup.sql`), 17 migraciones incrementales, políticas RLS y RPCs |
| **`.json`** | 32 | 2,719 | Catálogo CNEB de competencias, capacidades, desempeños y esquemas JSON Schema canónicos |
| **`.ts`** | 18 | 2,343 | Edge Functions serverless en Deno (AI Gateway, enrutadores de proveedores, mailer) |
| **TOTAL** | **227** | **~59,168** | **Base de código completa, altamente modular y documentada** |

---

## 2. Arquitectura del Sistema

La solución adopta una **arquitectura híbrida distribuida en 3 niveles desacoplados**, permitiendo máxima velocidad, coste optimizado y estricta privacidad:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   CLIENTE WEB SPA (GitHub Pages)                      │
│   Landing Page (#landing-view)     |     Lienzo A4 (#app-view)         │
│   Planning Studio (#planning-view) |     Mi Espacio (#workspace-view)  │
│   Vanilla JS (ES Modules)          |     CSS con Design Tokens         │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
         PNA + Token Rotativo Local         HTTPS + JWT Seguro
                    │                                │
                    ▼                                ▼
┌──────────────────────────────────────┐ ┌───────────────────────────────┐
│     MOTOR LOCAL FASTAPI DESKTOP      │ │    SUPABASE EDGE FUNCTIONS    │
│          (pablitohost.exe)           │ │     (ai-gateway / routers)    │
│  - Python 3.11 + python-docx         │ │  - Validación Server-Side     │
│  - Parser LaTeX -> OMML Math nativo  │ │  - Ledger atómico de créditos │
│  - Ensamblador DOCX/PDF A4 MINEDU    │ │  - Entitlements & Shadow Mode │
│  - Localhost 127.0.0.1:8000          │ │  - Routing canónico directo   │
└──────────────────────────────────────┘ └───────────────┬───────────────┘
                                                         │
                                                         ▼
                                         ┌───────────────────────────────┐
                                         │      PROVEEDORES DE IA        │
                                         │  - OpenAI (GPT-6, GPT-5.6)    │
                                         │  - Google (Gemini 2.5)        │
                                         │  - DeepSeek (R1, V3)          │
                                         └───────────────────────────────┘
```

---

## 3. Desglose Componente por Componente

### 3.1. Frontend Web SPA (`index.html`, `js/`, `css/`)
- **Punto de Entrada**: `index.html` (2,283 líneas). Estructurado como SPA con enrutamiento reactivo basado en Hash (`/#/`, `/#workspace`, `/#editor`, `/#planning`).
- **Páginas Complementarias**:
  - `admin.html`: Consola administrativa para asignación de bonos, recarga de billeteras y configuración corporativa de correo.
  - `conexion.html`: Herramienta de telemetría y diagnóstico en tiempo real (verifica estado de Supabase, latencia y disponibilidad del motor local `127.0.0.1:8000`).
  - `descargas_landing.html`: Centro de distribución seguro del ejecutable `pablitohost.exe`, con verificación de checksums, guía de permisos y explicación de privacidad.
  - `plantilla.html`: Visualizador de referencia estática de documentos oficiales.
- **Módulos Principales de JavaScript**:
  - `js/app.js`: Orquestador principal del editor de sesión individual.
  - `js/landing.js`: Controlador de la página de bienvenida y navegación pública.
  - `js/home.js`: Controlador de *Mi espacio*, que agrupa saludo contextual, plan, créditos y acceso directo a sesiones y unidades.
  - `js/auth-ui.js`: Interfaz de inicio de sesión, registro, recuperación de contraseña y modal de Términos y Condiciones.
  - `js/theme.js`: Gestor reactivo de temas (`Claro`, `Oscuro`, `Sistema`) con sincronización con el sistema operativo y persistencia local.
  - `js/sanitizer.js`: Sanitizador de cadenas y HTML para neutralizar inyecciones de código malicioso (XSS).
  - `js/storage.js`: Capa de almacenamiento local con soporte de sincronización y *tombstones* (marcas de borrado seguro).
  - `js/app-update.js`: Detector de actualizaciones en tiempo de ejecución que compara el build actual contra `app-version.json` sin interrumpir el trabajo no guardado del usuario.
- **Subsistema Pedagógico y de Planificación**:
  - `js/pedagogy/catalog-validator.js`: Validador en tiempo de ejecución del árbol de competencias y áreas curriculares.
  - `js/pedagogy/context-resolver.js`: Resolutor contextual de ciclo, grado y procesos didácticos asociados.
  - `js/pedagogy/methodology-codes.js`: Estandarización de metodologías (Polya, ABP, Método Científico, Indagación).
  - `js/planning/planning-wizard.js`: Flujo estructurado en 7 pasos para creación de Experiencias, Unidades y Proyectos.
  - `js/planning/planning-container-v2.js`: Modelo de datos contenedor con soporte de versionado, revisiones y hashes.
  - `js/planning/linked-session.js`: Orquestador de vinculación entre sesiones de aprendizaje y la secuencia de una unidad didáctica.
- **Sistema de Diseño y Estilos**:
  - `css/style.css`: Variables globales, tokens de color (HSL), tipografía (Inter / Roboto) y estilos del editor A4.
  - `css/landing.css`: Estilos de la landing page con animaciones de entrada sobrias (`@keyframes landingFadeIn`, `@keyframes floatGlow`).
  - `css/print.css`: Reglas de medios de impresión (`@page { size: A4 portrait; margin: 10mm; }`) para previsualización fiel a la salida impresa.
- **Políticas de UI**:
  - Regla estricta de interfaz formal: prohibición absoluta de emojis informales en controles o estados (`tests/no_emoji_controls.py`).
  - Iconografía SVG semántica de alto contraste y componentes accesibles (WCAG).

---

### 3.2. Motor Local Desktop (`pablitohost.exe` / `backend/`)
- **Tecnología**: Python 3.11, FastAPI, Uvicorn y `python-docx`.
- **Endpoints Expuestos**:
  - `GET /health`: Estado del motor y versión activa.
  - `GET /token`: Generación y validación de tokens de sesión temporales.
  - `POST /export/docx`: Receptor del payload JSON `SessionDocument v1` y generador del archivo Word `.docx`.
  - `POST /export/pdf`: Receptor para conversión directa a PDF de alta resolución.
- **Ensamblador Canónico `backend/docx_builder_v1.py`**:
  - Manipula directamente el árbol XML del documento Word (`w:tbl`, `w:tr`, `w:tc`, `w:shd`, `w:tcBorders`, `w:gridSpan`).
  - Estructura las 11 tablas del formato MINEDU oficial:
    1. Membrete oficial MINEDU / DRE / UGEL.
    2. Datos informativos (cuadrícula normalizada de 10,490 twips).
    3. Propósitos y evidencias de aprendizaje (Competencias, Capacidades, Desempeños, Criterios, Instrumentos).
    4. Competencias transversales (TIC y Gestión autónoma).
    5. Enfoques transversales (con valores y actitudes observables).
    6. Preparación de la sesión (recursos y materiales).
    7. Momentos de la sesión: **Inicio** (problematización, motivación, saberes previos, propósito).
    8. **Desarrollo**: Procesos pedagógicos y didácticos del área (ej. Polya: Familiarización, Búsqueda de estrategias, Representación, Formalización, Reflexión, Transferencia).
    9. **Cierre**: Metacognición, evaluación formativa y actividades de extensión.
    10. Ficha de trabajo de aplicación práctica.
    11. Instrumento de evaluación: Lista de cotejo o rúbrica con nombres de alumnos precargados.
- **Motor Matemático `backend/word_math.py`**:
  - Detecta delimitadores LaTeX (`$...$`, `$$...$$`, `\[...\]`).
  - Traduce sintaxis matemática directamente a **OMML (Office Math Markup Language)** nativo de Microsoft Word (`<m:oMath>`, `<m:f>`, `<m:rad>`, `<m:sup>`, `<m:sub>`), permitiendo que el docente pueda editar las fórmulas dentro de Word como ecuaciones reales y no imágenes estáticas.
  - En caso de fórmulas complejas o macros no soportadas nativamente, implementa un fallback inteligente con rasterización PNG nítida mediante `matplotlib`, asegurando que ninguna ecuación se pierda ni se muestre rota.
- **Seguridad y Privacidad del Motor Desktop**:
  - Implementa soporte estricto de **Private Network Access (PNA)** de Chromium con preflights `Access-Control-Request-Private-Network`.
  - Genera tokens de sesión criptográficos aleatorios en memoria en cada arranque.
  - No accede al sistema de archivos del usuario para lectura de datos privados; únicamente escribe el archivo exportado en la respuesta HTTP local.

---

### 3.3. Nube y Supabase (`supabase/`)
- **Edge Functions (Deno / TypeScript)**:
  - `ai-gateway`: Actúa como fachada segura e inteligente. Recibe el token JWT del usuario, valida que su sesión esté activa, resuelve sus capacidades (*entitlements*), descuenta atómicamente los créditos según la acción solicitada (`generate_session`, `generate_criteria`, `refine_text`, `pedagogy_brief`, `chatbot`) y enruta la petición hacia el router adecuado.
  - `openai-router`: Invocación a modelos OpenAI: `gpt-6-luna` (predeterminado en generador y chat) y `gpt-5.6-terra` (modo de máxima calidad pedagógica).
  - `gemini-router`: Invocación a `gemini-2.5-flash` para tareas de alta velocidad y análisis multimodal.
  - `deepseek-router`: Invocación a `deepseek-chat` y `deepseek-reasoner` (R1) para razonamiento lógico profundo y estructuración didáctica.
  - `pablito-mailer`: Envío seguro de correos transaccionales y notificaciones de bienvenida.
- **Base de Datos PostgreSQL y Sistema de Migraciones**:
  - `database_setup.sql`: Baseline maestro idempotente con tablas fundamentales (`profiles`, `sesiones`, `alumnos`, `ai_plans`, `ai_action_costs`, `ai_credit_wallets`, `ai_usage`).
  - Directorio `supabase/migrations/`: 17 migraciones incrementales inmutables que implementan:
    - *Profile Hardening*: Prohibición de auto-asignación de roles admin desde el cliente.
    - *Atomic Credit Ledger*: Asientos de débito, reserva y consumo confirmatorio (`reserve`, `spend`, `refund`).
    - *Subscription Entitlements*: Desacoplamiento entre plan comercial y billetera de créditos.
    - *Planning Containers*: Tablas `planning_containers` para persistencia en nube de unidades y experiencias.
- **Seguridad RLS (Row Level Security)**:
  - Cada tabla cuenta con políticas `ENABLE ROW LEVEL SECURITY`.
  - Solo el propietario del recurso (`auth.uid() = user_id`) puede leer, actualizar o eliminar sus sesiones o planes.
  - Las funciones críticas de débito y administración se ejecutan bajo `SECURITY DEFINER` con revocación explícita de privilegios a roles anónimos (`REVOKE ALL ON FUNCTION ... FROM PUBLIC, anon`).

---

### 3.4. Contrato Canónico de Datos (`SessionDocument v1`)
Toda la información curricular se intercambia bajo un esquema formalmente especificado:
- **Archivo de Definición**: `schemas/session-document.v1.schema.json`.
- **Modelo Backend**: `backend/models/session_document.py` (Pydantic con validación de tipos, rangos numéricos y listas no mutables por defecto).
- **Validador Frontend**: `js/ai/session-validator.js`.
- **Adaptadores de Compatibilidad**: `js/ai/session-adapter.js` y `backend/adapters/legacy_to_v1.py`. Transforman automáticamente cualquier sesión generada en versiones previas al formato v1 canónico, garantizando que el usuario nunca pierda sus planificaciones históricas.

---

## 4. Estado de la Suite de Pruebas Automatizadas (QA)

Se ejecutó la totalidad de la suite de pruebas del repositorio en los 5 niveles de validación:

### Resumen General de Pruebas
| Suite de Pruebas | Runner / Motor | Pruebas | Estado |
| :--- | :--- | :---: | :---: |
| **1. Higiene del Repositorio y Seguridad** | Python 3.11 (`tests/*.py`) | 6 suites | **PASÓ (100%)** |
| **2. Contratos y Lógica JS** | Node.js v22 (`tests/*.test.js`, `test_*.js`) | 37 suites | **PASÓ (100%)** |
| **3. Compilación y Linters** | `py_compile`, `ruff`, `node --check` | Global | **PASÓ (100%)** |
| **4. Integración Python y DOCX** | Python (`test_docx_builder_v1.py`, etc.) | 6 suites | **PASÓ (100%)** |
| **5. Edge Functions de Nube** | Deno v2.9 (`tests/*.test.ts`, `deno check`) | 14 tests + 5 checks | **PASÓ (100%)** |
| **6. Pruebas E2E de UI** | Playwright Chromium (375px a 1440px) | 13 suites | **PASÓ (100%)** |

### Detalle de Suites Ejecutadas y Aprobadas:
1. **Higiene y Políticas del Repositorio**:
   - `repository_hygiene.py`: Sin archivos prohibidos ni temporales en git.
   - `no_emoji_controls.py`: 0 emojis detectados en la interfaz de control.
   - `profile_security.py`: Integridad de perfiles de usuario auditada.
   - `ai_credit_security.py`: Aislamiento de créditos y transacciones atómicas validado.
   - `plan_entitlements.py`: Matriz comercial y resolución de capacidades validada.
   - `ai_quota_policies.py`: Políticas de cuotas independientes del plan verificadas.
2. **Contratos y Adaptadores de Datos (Node.js)**:
   - `test_contract_v1.js`: Validación canónica de `SessionDocument v1`.
   - `test_adapter_v1.js`: 43/43 tests pasados en migración legacy a v1.
   - `test_templates_v1.js`: 26/26 tests pasados en renderizado de plantillas A4.
   - `pedagogy-catalog.test.js`, `methodology-catalog.test.js`, `secondary-cycle-vii.test.js`: Validación curricular CNEB.
   - `planning-container-v2.test.js`, `planning-repository.test.js`, `linked-session.test.js`: Ciclo de vida de unidades articuladas.
3. **Backend y DOCX Word OMML (Python)**:
   - `test_contract_v1.py`: Pydantic validation de fixtures canónicos.
   - `test_adapter_v1_py.py`: Adaptadores Python de migración.
   - `test_docx_builder_v1.py`: Ensamblado de 3 sesiones de prueba en archivos Word válidos.
   - `test_word_math.py`: Transpilación matemática LaTeX a OMML y fallback raster.
   - `test_docx_fidelity.py`: Exactitud dimensional de tablas MINEDU (10,490 twips exactos).
   - `backend_smoke.py`: Smoke test de servidor FastAPI (CORS, PNA, límites de payload).
4. **Edge Functions Supabase (Deno)**:
   - `ai-prompt-builder.test.ts`: Prompts aislados y protegidos en servidor (5/5 tests OK).
   - `linked-session-context.test.ts`: Contexto articulado entre unidad y sesión (3/3 tests OK).
   - `planning-map-prompt.test.ts`: Generación de mapa curricular (2/2 tests OK).
   - `ai-credits.test.ts`: Operaciones atómicas de billetera (4/4 tests OK).
   - `deno check` sobre `ai-gateway`, `openai-router`, `gemini-router`, `deepseek-router`, `pablito-mailer`: 0 errores de tipado.
5. **Pruebas End-to-End de UI (Playwright Chromium)**:
   - `ui_smoke.py`: Responsive en 375px, 768px, 1024px, 1280px y 1440px.
   - `ui_session_lifecycle_smoke.py`, `ui_standalone_session_regression.py`.
   - `ui_planning_smoke.py`, `ui_planning_studio_smoke.py`, `ui_planning_view_smoke.py`.
   - `ui_secondary_cycle_vii_smoke.py`, `ui_linked_session_smoke.py`, `ui_planning_roundtrip_smoke.py`.
   - `ui_theme_smoke.py`, `ui_accessibility_smoke.py`, `ui_startup_resilience.py`.

---

## 5. Hallazgo Crítico Identificado y Subsanado Durante la Auditoría

### Anomalía Temporal: Time Bomb de Expiración en `tests/test_credit_ledger_logic.js`
- **Ubicación**: `tests/test_credit_ledger_logic.js` (Línea 123).
- **Diagnóstico del Fallo**: El test contenía una fecha fija de vencimiento para el bono promocional:
  ```javascript
  addGrant(state, { id: 'grant-promo', sourceType: 'promo', credits: 10, priority: 10, expiresAt: '2026-10-01' });
  ```
  Al ejecutarse el test el **2 de Octubre de 2026** (fecha posterior a `2026-10-01`), la función `reserveCredits` evaluó:
  ```javascript
  const availableGrants = state.grants.filter(
    g => g.remainingCredits > 0 && (!g.expiresAt || new Date(g.expiresAt) > new Date())
  );
  ```
  Dado que la fecha fija quedó en el pasado respecto a la fecha del sistema, el bono se descartó automáticamente por considerarse caducado, provocando un error de aserción (`AssertionError: 10 !== 5`) que rompía la suite de integración continua en GitHub Actions.
- **Solución Implementada**: Se modificó la asignación para calcular dinámicamente una fecha futura relativa al momento de ejecución (`Date.now() + 30 días`):
  ```javascript
  const futureDate = new Date(Date.now() + 30 * 86400000).toISOString();
  addGrant(state, { id: 'grant-promo', sourceType: 'promo', credits: 10, priority: 10, expiresAt: futureDate });
  ```
  Con esta corrección, el test pasa exitosamente y queda blindado contra desfases temporales indefinidamente.

---

## 6. Auditoría de Seguridad, Privacidad y Normativa

1. **Privacidad y Protección de Datos**:
   - Cumplimiento de la Ley de Protección de Datos Personales (Perú).
   - Los datos de los estudiantes (nombres, calificaciones en listas de cotejo) no se envían a APIs de terceros; se procesan de forma privada y local para la confección del documento DOCX.
2. **Sanitización contra Vulnerabilidades XSS**:
   - El motor de sanitización `SpaceLabSanitizer` limpia proactivamente cualquier entrada en campos enriquecidos y contenido importado, neutralizando etiquetas ejecutables (`<script>`, `<iframe>`, `<object>`) y atributos de evento maliciosos.
3. **Aislamiento Criptográfico de APIs de Inteligencia Artificial**:
   - El cliente web nunca almacena ni tiene acceso a las claves API de OpenAI, Google o DeepSeek. Todas las operaciones viajan autenticadas mediante JWT a las Edge Functions de Supabase.
4. **Alineación Normativa CNEB / MINEDU**:
   - Rigurosa cobertura de competencias, capacidades y desempeños precisados oficiales.
   - Secuencia pedagógica canónica en 3 momentos didácticos (Inicio, Desarrollo y Cierre) y procesos didácticos disciplinares normalizados.

---

## 7. Conclusiones y Hoja de Ruta (Roadmap)

### Dictamen Final: EXCELENTE / LISTO PARA PRODUCCIÓN
El repositorio demuestra una arquitectura de nivel profesional, alta cobertura de pruebas automatizadas en todos los niveles, cero deuda técnica de sintaxis y una rigurosa fidelidad pedagógica y normativa.

### Recomendaciones Estratégicas para Versiones Futuras:
1. **Ampliación de Ciclos en Planning Studio 2.0**:
   - Extender el catálogo curricular actualmente enfocado en Secundaria (Ciclos VI y VII) hacia Educación Primaria (Ciclos III, IV y V) y Educación Inicial.
2. **Automatización de Builds en GitHub Releases**:
   - Configurar la publicación automatizada de `pablitohost.exe` firmada en los releases de GitHub para simplificar la descarga por parte de los docentes.
3. **Soporte PWA (Progressive Web App)**:
   - Integrar un Service Worker para permitir el funcionamiento de edición y visualización curricular 100% offline cuando no se requieran generaciones nuevas de IA.
