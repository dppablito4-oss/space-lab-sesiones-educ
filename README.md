# Space Lab - Sesiones Educativas

[![CI Tests](https://github.com/dppablito4-oss/space-lab-sesiones-educ/actions/workflows/ci.yml/badge.svg)](https://github.com/dppablito4-oss/space-lab-sesiones-educ/actions/workflows/ci.yml)
[![Node.js Tests](https://img.shields.io/badge/Node.js-22+-green.svg)](https://nodejs.org)
[![Python Engine](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![License](https://img.shields.io/badge/License-Proprietary-orange.svg)]()

> **Plataforma web asistida por IA para la planificación, diseño curricular y exportación de sesiones de aprendizaje alineadas al CNEB (Currículo Nacional de la Educación Básica) y formatos normativos del MINEDU (Perú).**

- **Aplicación Web en Producción**: [https://sesiones.sypablitodp.site](https://sesiones.sypablitodp.site)
- **Web Personal del Creador**: [https://space.sypablitodp.site](https://space.sypablitodp.site)
- **WhatsApp de Soporte**: [+51 918 165 428](https://wa.me/51918165428)
- **Correo Electrónico**: [pabloclsa87@gmail.com](mailto:pabloclsa87@gmail.com)

---

## Tabla de Contenidos

1. [Visión General y Propósito](#visión-general-y-propósito)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
   - [Frontend Web Dual (Landing y Editor)](#1-frontend-web-dual)
   - [Motor Local de Alta Fidelidad (pablitohost.exe)](#2-motor-local-de-alta-fidelidad-desktop)
   - [Seguridad y Privacidad del Motor Local](#seguridad-y-privacidad-del-motor-local)
   - [Inteligencia Artificial y Edge Functions](#3-inteligencia-artificial-y-edge-functions)
   - [Contrato Canónico de Datos (`SessionDocument v1`)](#4-contrato-canónico-de-datos-sessiondocument-v1)
3. [Estructura del Repositorio](#estructura-del-repositorio)
4. [Instalación y Desarrollo Local](#instalación-y-desarrollo-local)
5. [Suite de Pruebas Automatizadas](#suite-de-pruebas-automatizadas)
6. [Sistema de Versión de Activos y Caché](#sistema-de-versión-de-activos-y-caché)
7. [Despliegue de Edge Functions](#despliegue-de-edge-functions)
8. [Términos y Condiciones / Seguridad](#términos-y-condiciones--seguridad)
9. [Contacto y Soporte](#contacto-y-soporte)

---

## Visión General y Propósito

**Space Lab - Sesiones Educativas** resuelve el desafío de la planificación pedagógica docente en el Perú:
- **Alineación rigurosa con el CNEB**: Selección guiada de áreas curriculares, competencias, capacidades, desempeños precisados, enfoques transversales e instrumentos de evaluación.
- **Asistencia con Inteligencia Artificial**: Generación contextualizada de secuencias didácticas (Inicio, Desarrollo, Cierre), situaciones significativas y actividades diferenciadas con modelos de última generación.
- **Exportación Fiel a Formatos Oficiales**: Generación de documentos Word (`.docx`) y PDF con tablas anidadas CNEB, tipografías normalizadas y ecuaciones matemáticas editables en formato nativo OMML de Microsoft Word.
- **Experiencia de Usuario Sobria y Fluida**: Soporte completo para tres modos de visualización (`Sistema`, `Claro` y `Oscuro`), animaciones fluidas y diseño mobile-friendly.

---

## Arquitectura del Sistema

El sistema implementa una **arquitectura híbrida** distribuida en tres capas:

```text
┌─────────────────────────────────────────────────────────────┐
│                 CLIENTE WEB (GitHub Pages)                  │
│   Landing Page (#landing-view)  |  Editor A4 (#app-view)    │
│   Vanilla JS (ES Modules)       |  Vanilla CSS con Tokens   │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
    PNA + Token Local                HTTPS (JWT Seguro)
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│   MOTOR LOCAL FASTAPI        │ │   SUPABASE EDGE FUNCTIONS   │
│   (pablitohost.exe)          │ │   - ai-gateway              │
│   - Python 3.11 + python-docx│ │   - gemini-router           │
│   - Parser OMML Math & PNG   │ │   - deepseek-router         │
│   - Generador DOCX / PDF A4  │ │   - pablito-mailer          │
│   - Puerto: 127.0.0.1:8000   │ │   - Débito automático de    │
│   - Token rotativo de sesión │ │     créditos (ai_credits)   │
└──────────────────────────────┘ └──────────────┬──────────────┘
                                                │
                                                ▼
                                 ┌─────────────────────────────┐
                                 │   PROVEEDORES DE IA         │
                                 │   - OpenAI (GPT-6, GPT-5.4) │
                                 │   - Google (Gemini 2.5)     │
                                 │   - DeepSeek (R1, V3)       │
                                 └─────────────────────────────┘
```

### 1. Frontend Web Dual

Alojado como una SPA (Single Page Application) estática en GitHub Pages con enrutamiento basado en Hash (`/#/`) para garantizar máxima compatibilidad:

- **Landing Page / Bienvenida (`#landing-view`)**:
  - Presentación visual con animaciones microinteractivas (`@keyframes landingFadeIn`, `@keyframes floatGlow`).
  - Desglose del flujo pedagógico CNEB en 3 pasos.
  - Catálogo de modelos de IA soportados.
  - Selector interactivo de temas (`Sistema`, `Claro`, `Oscuro`) con persistencia en `localStorage`.
  - Preguntas frecuentes (FAQ) docentes.
  - Detección inteligente de sesión: Si el usuario ya cuenta con sesión iniciada en Supabase, el acceso abre `Mi espacio`, desde donde puede crear o continuar sus planificaciones.
  - `Mi espacio` reúne bienvenida contextual, créditos, plan, sesiones recientes y accesos preparados para futuros proyectos y unidades.
  - Enlaces de descarga del motor local (`descargas_landing.html`) y pie de página con accesos oficiales.
- **Espacio de Trabajo / Editor (`#app-view`)**:
  - Rail lateral de navegación con 6 etapas curriculares (Datos informativos, Propósitos de aprendizaje, Criterios y evaluación, Secuencia didáctica, Recursos y materiales, Padrón de estudiantes).
  - Previsualización en tiempo real sobre lienzo de hoja A4 estándar.
  - Copiloto pedagógico de IA con chat flotante integrado (`js/chatbot.js`) y generador de sesiones (`js/ai-copilot.js`).
  - Consola de exportación directa a DOCX y PDF.

### 2. Motor Local de Alta Fidelidad (Desktop)

#### ¿Por qué es necesario `pablitohost.exe`?
Los navegadores web convencionales operan bajo restricciones de sandbox que les impiden generar archivos de Microsoft Word (`.docx`) complejos con el nivel de detalle exigido por MINEDU: tablas anidadas multinivel, saltos de sección precisos, márgenes de imprenta exactos y **ecuaciones matemáticas editables en formato OMML (Office Math Markup Language)**.

Para resolver esto sin depender de servidores externos lentos o que comprometan la privacidad, la plataforma incluye un microservicio local:
- Desarrollado en **Python 3.11** con **FastAPI** y **python-docx**.
- Se ejecuta como un proceso ligero en segundo plano en la máquina del usuario (`http://127.0.0.1:8000`).
- Su código fuente reside en `backend/` y se compila en un ejecutable autónomo (`pablitohost.exe` / `pablitopyhost.exe`) mediante PyInstaller en GitHub Actions.
- Disponible para descarga directa desde la sección de descargas o desde GitHub Releases.

#### Seguridad y Privacidad del Motor Local
- **Cero inspección de tu computadora**: El ejecutable **NO** lee, explora, rastrea ni sube archivos de tu disco duro. Su única función es recibir el JSON de la sesión pedagógica y transformarlo en un archivo Word `.docx` o PDF.
- **Tokens de autorización temporales y rotativos**: Cada vez que el motor inicia o se abre una sesión, genera un token criptográfico único en memoria. El navegador web debe enviar este token para que el motor procese cualquier solicitud.
- **Acceso por Red Privada (PNA)**: Cumple con las normativas modernas de navegadores (Chrome/Edge Private Network Access), impidiendo que sitios web externos o maliciosos puedan conectarse a tu puerto local.
- **Procesamiento 100% en tu máquina**: Tus planes curriculares y datos de estudiantes se ensamblan en tu propia computadora, sin viajar a servidores de terceros para la exportación documental.

### 3. Inteligencia Artificial y Edge Functions

Las consultas de IA se enrutan de forma cifrada a través de Supabase Edge Functions:
```text
Navegador -> ai-gateway (JWT seguro) -> router interno -> Proveedor de IA
```

- **Gateway server-authoritative**: El navegador solicita `automatic`, `fast`, `balanced` o `max_quality`; el servidor decide proveedor y modelo y registra la razón de la ruta.
- **Enrutadores internos/legacy para rollback**:
  - `openai-router`: `gpt-6-luna` (principal/predeterminado en generador y chatbot) y `gpt-5.6-terra` (avanzado y curricular).
  - `gemini-router`: `gemini-2.5-flash` (multimodal nativo).
  - `deepseek-router`: `deepseek-chat` (conversacional) y `deepseek-reasoner` (razonamiento pedagógico profundo R1).
- **Invocación Canónica Directa**: Las Edge Functions invocan de manera directa los modelos canónicos configurados sin degradar a familias de modelos anteriores (`gpt-4o` o `gpt-4o-mini`).
- **Seguridad**: El navegador del docente nunca maneja, solicita ni almacena las API Keys maestras de los proveedores de IA.
- **Monetización y Créditos Automatizados**: `credit_grants`, `credit_ledger` y `ai_usage` auditan reservas, consumo y reembolsos de forma atómica por usuario.

### 4. Contrato Canónico de Datos (`SessionDocument v1`)

Todo el flujo de datos se rige por un contrato estrictamente versionado:
- `schemas/session-document.v1.schema.json`: Esquema JSON canónico.
- `js/ai/session-validator.js`: Validador en tiempo de ejecución en el navegador.
- `backend/models/session_document.py`: Modelo Pydantic en el backend local.

El mismo documento garantiza paridad 1:1 entre lo previsualizado en el navegador y el archivo Word/PDF descargado.

---

## Estructura del Repositorio

```text
├── assets/                  # Logotipos, favicons y plantillas oficiales MINEDU
├── backend/                 # Motor local FastAPI en Python
│   ├── adapters/            # Adaptadores de versiones anteriores de sesión
│   ├── models/              # Modelos Pydantic y esquema SessionDocument v1
│   ├── docx_builder.py      # Ensamblador DOCX legacy
│   ├── docx_builder_v1.py   # Ensamblador DOCX canónico v1 con soporte OMML
│   ├── main.py              # API FastAPI y endpoints /export/docx, /health
│   ├── pablitopyhost.spec   # Especificación de empaquetado PyInstaller
│   ├── requirements.txt     # Dependencias Python
│   └── word_math.py         # Conversor LaTeX -> OMML editable y render PNG
├── css/                     # Hojas de estilo modulares
│   ├── style.css            # Estilos del editor y variables globales
│   ├── landing.css          # Estilos de la landing page y animaciones
│   └── print.css            # Reglas de impresión y formato A4
├── data/                    # Datos curriculares CNEB (competencias, áreas, ciclos)
├── design-system/           # Especificación del sistema de diseño Space Lab
│   └── space-lab-sesiones/  # Tokens, tipografía y reglas MASTER.md
├── js/                      # Lógica de la aplicación web (ES Modules)
│   ├── ai/                  # Validador de esquemas y transformadores IA
│   ├── components/          # Componentes de interfaz reutilizables
│   ├── controllers/         # Controladores de vistas y acciones
│   ├── core/                # Utilidades de seguridad, fechas y escape XSS
│   ├── services/            # Clientes HTTP (exportación local, Supabase)
│   ├── ai-copilot.js        # Generador de sesiones con IA y fallback
│   ├── auth-ui.js           # Gestión visual del modal de login/registro
│   ├── chatbot.js           # Asistente pedagógico flotante
│   ├── landing.js           # Enrutamiento y control de la landing page
│   └── theme.js             # Gestor reactivo de temas (Claro / Oscuro / Sistema)
├── schemas/                 # Contrato JSON Schema canónico v1
├── scripts/                 # Scripts de utilidad y compilación
│   └── version_assets.py    # Generador de hashes para cache-busting en CI
├── SKILLs/                  # Reglas de diseño y guía de componentes Pablito Leans
├── supabase/                # Infraestructura de backend en la nube
│   ├── functions/           # Edge Functions (Deno / TypeScript)
│   └── migrations/          # Migraciones SQL incrementales
├── tests/                   # Suite completa de pruebas unitarias y de integración
├── database_setup.sql       # Script SQL maestro e idempotente para Supabase
├── descargas_landing.html   # Página de descarga de pablitohost.exe
└── index.html               # Punto de entrada principal de la aplicación web
```

---

## Instalación y Desarrollo Local

### Requisitos Previos

- **Node.js**: Versión 22 o superior
- **Python**: Versión 3.11 o superior
- **Deno**: Versión 2.0+ (opcional, solo para depuración de Edge Functions)

### 1. Clonar el Repositorio

```bash
git clone https://github.com/dppablito4-oss/space-lab-sesiones-educ.git
cd space-lab-sesiones-educ
```

### 2. Entorno del Motor Local (Backend)

```powershell
# Crear y activar entorno virtual
python -m venv .venv
.venv\Scripts\activate

# Instalar dependencias del backend
python -m pip install -r backend/requirements.txt

# Ejecutar el motor local en desarrollo
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Servir el Frontend Web

Cualquier servidor HTTP estático puede servir la aplicación:

```powershell
# Usando Python
python -m http.server 5173

# O usando npx
npx serve .
```

Abre tu navegador en `http://localhost:5173`.

---

## Suite de Pruebas Automatizadas

El proyecto cuenta con validación rigurosa tanto en Node.js como en Python:

### Pruebas de JavaScript (Node.js)

```powershell
node tests/test_contract_v1.js            # Valida el contrato SessionDocument v1
node tests/test_adapter_v1.js             # Valida adaptadores de migración
node tests/test_templates_v1.js           # Valida templates CNEB
node tests/test_presentation.js           # Valida configuración de presentación
node tests/test_session_export.js         # Valida exportación de sesiones
node tests/storage.test.js                # Valida persistencia y tombstones
node tests/ai-provider-routing.test.js    # Valida enrutamiento y fallback de IA
node tests/theme.test.js                  # Valida persistencia y cambio de tema
node tests/app-utils.test.js              # Valida utilidades y protección XSS
node tests/local-export-client.test.js    # Valida cliente PNA del motor local
node tests/document-source-processor.test.js # Valida procesamiento de fuentes PDF
node tests/app-update.test.js              # Valida detección y aviso de nuevas versiones
node tests/home-workspace.test.js          # Valida Mi espacio y sus rutas protegidas
node tests/test_ai_gateway_routing.js      # Valida routing server-side del AI Gateway
node tests/test_model_catalog.js          # Valida catálogo y aliases de modelos
node tests/test_entitlements.js           # Valida shadow/enforcement de capacidades
node tests/test_credit_ledger_logic.js    # Valida orden de consumo y reembolsos
```

### Pruebas de Python (Backend y Exportación)

```powershell
python tests/test_contract_v1.py          # Contrato v1 en backend
python tests/test_adapter_v1_py.py        # Adaptadores v1 en backend
python tests/test_docx_builder_v1.py      # Generador de Word con tablas CNEB
python tests/test_word_math.py            # Conversor de fórmulas LaTeX a OMML
python tests/backend_smoke.py             # Prueba de humo del servidor FastAPI
python tests/frontend_security.py         # Análisis de seguridad del frontend
```

---

## Sistema de Versión de Activos y Caché

Para evitar que los navegadores o CDNs utilicen versiones obsoletas de archivos `.js` o `.css` al desplegar en GitHub Pages, el proyecto utiliza un sistema de **cache-busting basado en el hash del contenido**:

```powershell
python scripts/version_assets.py --write
```

Este script calcula el hash SHA-256 del contenido de cada script o stylesheet local y actualiza automáticamente los parámetros `?v=<hash>`. También genera `app-version.json` y sincroniza el identificador de build incluido en las páginas interactivas.

Las páginas consultan el manifiesto con `cache: no-store`. Cuando detectan un despliegue nuevo muestran un aviso para actualizar mediante una URL versionada, sin recargar automáticamente ni interrumpir trabajo sin guardar. La integración continua verifica que hashes, HTML y manifiesto permanezcan sincronizados.

---

## Despliegue de Edge Functions

Para actualizar las Edge Functions en el proyecto Supabase:

```powershell
npx supabase link --project-ref koptglmifwpzrfzvipnm
npx supabase functions deploy ai-gateway --no-verify-jwt
npx supabase functions deploy openai-router --no-verify-jwt
npx supabase functions deploy gemini-router --no-verify-jwt
npx supabase functions deploy deepseek-router --no-verify-jwt
npx supabase functions deploy pablito-mailer
```

> **Nota sobre seguridad**: La bandera `--no-verify-jwt` delega la verificación al middleware compartido `supabase/functions/_shared/auth.ts`, garantizando validación criptográfica y autenticación estricta antes de invocar a cualquier proveedor de IA.

---

## Términos y Condiciones / Seguridad

En el modal de Términos y Condiciones de la aplicación y en `descargas_landing.html` se especifica detalladamente:
1. **Uso de Datos**: El software no recopila información privada, ni rastrea el contenido de tus planificaciones fuera de tu propia cuenta de Supabase.
2. **Uso Responsable de IA**: Las sesiones generadas por IA son sugerencias didácticas y pedagógicas que deben ser supervisadas, contextualizadas y validadas por el docente titular según la realidad de su aula.
3. **Seguridad del Motor Local**: `pablitohost.exe` es un microservicio local de código abierto auditado, libre de telemetría invasiva, que únicamente se comunica con el navegador mediante tokens locales autorizados.

---

## Contacto y Soporte

Si tienes dudas, sugerencias o requieres asistencia técnica personalizada:

- **Sitio Web Personal**: [https://space.sypablitodp.site](https://space.sypablitodp.site)
- **WhatsApp**: [+51 918 165 428](https://wa.me/51918165428)
- **Correo Electrónico**: [pabloclsa87@gmail.com](mailto:pabloclsa87@gmail.com)
- **Repositorio**: [dppablito4-oss/space-lab-sesiones-educ](https://github.com/dppablito4-oss/space-lab-sesiones-educ)

---

*Desarrollado con dedicación para fortalecer la labor docente y la educación peruana.*
