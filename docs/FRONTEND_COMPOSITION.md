# Composición del frontend

`index.html` es un artefacto generado y comprometido porque GitHub Pages lo sirve directamente. No debe editarse a mano ni se cargan fragmentos con `fetch()` en el navegador.

## Dónde editar

- Landing: `ui/fragments/landing.html`
- Mi espacio: `ui/fragments/home.html`
- Editor de sesión y formulario lateral: `ui/fragments/session-editor.html`
- Vista previa, contexto de planificación y sesión imprimible: `ui/fragments/session-preview.html`
- Host dinámico de Planning: `ui/fragments/planning-host.html`
- Modales: `ui/fragments/modals/`
- Iconos inline, overlays y metadatos: `ui/fragments/shell/`
- Orden de scripts y raíz de composición: `ui/index.shell.html`

Los includes usan una directiva de línea completa y una ruta relativa a la raíz:

```html
<!-- include:ui/fragments/landing.html -->
```

El compositor admite includes recursivos, rechaza ciclos, rutas fuera del repositorio y fragmentos faltantes.

## Regenerar

Ejecutar siempre ambos pasos, en este orden:

```bash
python scripts/build_index.py --write
python scripts/version_assets.py --write
```

El primer comando compone un documento único con referencias locales sin versión. El segundo añade `?v=<hash>` y sincroniza `<meta name="app-build">` con `app-version.json`. `version_assets.py` continúa siendo la única fuente de verdad para hashes y build ID.

## Validar

```bash
python scripts/build_index.py --check
python tests/test_index_composition.py
python tests/test_asset_versioning.py
python scripts/version_assets.py --check
```

`build_index.py --check` compone las fuentes y reutiliza el versionado existente para comparar el resultado final con `index.html`. La prueba adicional verifica fragmentos, recursión, ciclos, IDs duplicados, IDs funcionales, número de scripts y hojas de estilo, y orden de dependencias críticas.
