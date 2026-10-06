# Composición del frontend

`index.html` es un artefacto generado y comprometido porque GitHub Pages lo sirve directamente. No debe editarse a mano ni se cargan fragmentos con `fetch()` en el navegador.

## Arquitectura de fragmentos

La estructura visual y modular de la aplicación está descompuesta en `ui/index.shell.html` y fragmentos estáticos bajo `ui/fragments/`:

### 1. Vistas principales
- **Landing (`ui/fragments/landing.html`)**: Presentación institucional, catálogo de características y accesos rápidos.
- **Mi espacio (`ui/fragments/home.html`)**: Dashboard docente, historial y gestión de sesiones guardadas.
- **Host dinámico de Planning (`ui/fragments/planning-host.html`)**: Elemento `<dialog id="planning-dialog">` para Planning Studio 2.0.
- **Editor de sesión (`ui/fragments/session-editor.html`)**: Encabezado `#app-view`, flujo de etapas y formulario lateral `#sidebar`. Incluye:
  - **Vista previa (`ui/fragments/session-preview.html`)**: Barra de herramientas de impresión, advertencia de balance de tiempo y hoja A4 `#session-sheet`. Contenedor DOM limpio sin modales internos.

### 2. Overlays y Diálogos
- **Overlays globales (`ui/fragments/shell/global-overlays.html`)**:
  Contenedores compartidos y modales accesibles desde cualquier vista (Landing, Home, Planning Studio, Editor):
  - `#toast-container` (notificaciones flotantes)
  - Diálogo de confirmación (`ui/fragments/modals/confirm.html` → `#confirm-dialog`)
  - Autenticación y registro (`ui/fragments/modals/auth.html` → `#auth-modal`)
  - Términos, privacidad y soporte (`ui/fragments/modals/terms.html` → `#terms-modal`)
  - Pantalla de carga global (`#loader-overlay`)
  - Guía de exportación PDF (`ui/fragments/modals/pdf-guide.html` → `#pdf-guide-modal`)
  - Requerimiento de motor local (`ui/fragments/modals/engine-required.html` → `#engine-required-modal`)
  - Fondo de partículas de estrellas (`#space-bg`)

- **Overlays del editor (`ui/fragments/shell/editor-overlays.html`)**:
  Componentes exclusivos del flujo de trabajo dentro del editor `#app-view`:
  - Copiloto flotante (`#chatbot-container`)
  - Carga de sesiones guardadas (`ui/fragments/modals/load-session.html` → `#load-modal`)
  - Popover de ajuste de logos (`#logo-editor-popover`)
  - Refinamiento de texto con IA (`ui/fragments/modals/refine-text.html` → `#refine-text-modal`)
  - Galería de logos institucionales (`ui/fragments/modals/logos-gallery.html` → `#logos-gallery-modal`)
  - Menú contextual del editor (`#editor-context-menu`)

### 3. Shell base y Metadatos
- **Head (`ui/fragments/shell/head.html`)**: Metadatos SEO, preconnects, hojas de estilo CSS y tipografía.
- **Iconos inline (`ui/fragments/shell/icons.html`)**: Sprites SVG del sistema.
- **Shell raíz (`ui/index.shell.html`)**: Raíz del documento HTML5, enlace skip-to-content, puntos de inclusión y orden determinista de scripts `<script defer>`.

## Directivas de inclusión

Los includes usan una directiva de línea completa y una ruta relativa a la raíz:

```html
<!-- include:ui/fragments/landing.html -->
```

El compositor admite includes recursivos, rechaza ciclos, rutas fuera del repositorio y fragmentos faltantes. Cada fragmento debe ser alcanzable y estar incluido exactamente una vez.

## Flujo de compilación y regeneración

Al modificar cualquier fragmento o el shell, ejecutar siempre ambos pasos en este orden:

```bash
python scripts/build_index.py --write
python scripts/version_assets.py --write
```

1. **`build_index.py --write`**: Compone el archivo `index.html` unificado sin hashes manuales de versión.
2. **`version_assets.py --write`**: Inyecta los parámetros de caché `?v=<hash>` para recursos estáticos y sincroniza el meta tag `<meta name="app-build">` con `app-version.json`.

## Validación y pruebas automáticas

El pipeline de CI y las pruebas locales ejecutan:

```bash
python scripts/build_index.py --check
python tests/test_index_composition.py
python tests/test_asset_versioning.py
python scripts/version_assets.py --check
```

- `build_index.py --check` verifica que `index.html` refleje exactamente los fragmentos editados sin desincronización.
- `test_index_composition.py` comprueba:
  - Detección de ciclos y tolerancia a fallos.
  - Conjunto exacto de fragmentos reconocidos (`EXPECTED_FRAGMENTS`).
  - Prohibición de hashes `?v=` manuales en las fuentes de `ui/`.
  - Inclusión única y alcance de cada fragmento.
  - Presencia de IDs críticos del DOM (`CRITICAL_IDS`) y ausencia de duplicados.
  - Orden estricto de scripts y dependencias del sistema.
