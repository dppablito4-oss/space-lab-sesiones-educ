# Frontend React de Space Lab

La interfaz pública completa se define en componentes React/TypeScript. La
portada, Mi espacio, biblioteca, editor avanzado, planificación, formularios y
ventanas comparten una entrada hidratada. Descargas y conexión del motor tienen
sus propias entradas React dentro del mismo bundle. Administración conserva su
entrada React independiente y sus límites de acceso.

No se cambiaron los endpoints de IA, permisos, RLS, formatos de documento ni
protocolo del motor local. La lógica de currículo, edición, guardado y exportación
se reutiliza mediante los controladores existentes.

## Fuentes mantenidas

| Archivo o carpeta | Responsabilidad |
| --- | --- |
| `react-ui/src/FrontendShell.tsx` | Árbol principal, límites estables de integración y arranque después de hidratar. |
| `react-ui/src/surfaces/` | Componentes de portada, espacio docente, editor, ventanas, iconos y descargas. |
| `react-ui/src/live.tsx` | Tarjetas de sesiones, acciones de cuenta y avisos actualizados por React. |
| `react-ui/src/ConnectionPage.tsx` | Enlace del motor, estados de error/espera/éxito y cancelación de solicitudes. |
| `react-ui/src/regions.tsx` | Renderizado React de vistas dinámicas de planificación, chats y galerías, conservando sus constructores de vistas y contratos. |
| `react-ui/src/App.tsx` y pasos | Generador guiado y navegación entre generador, planificación y documento. |
| `react-ui/src/runtime.ts` | Integración de controladores y transiciones de vistas. |
| `js/frontend-boot.js` | Orden de ejecución, conservación del clic durante la carga y recuperación si falta el bundle. |
| `ui/index.shell.html`, `ui/fragments/shell/head.html` | Documento, metadatos, estilos y manifiesto de módulos de dominio. |
| `ui/standalone/` | Cabeceras y estilos de las páginas independientes de descargas y conexión. |

`ui/fragments/`, salvo el head, contiene **salidas generadas desde React**, no
una segunda fuente editable de las vistas. Los snapshots individuales se
conservan para inspección y contratos existentes. La entrada incluye únicamente
el árbol React compuesto `frontend.html`; no duplica sus controles.

Los nombres internos históricos `react-preview-root`, `reactPreview`,
`showLegacy()` y `?ui=legacy` permanecen por compatibilidad con los contratos.
`?ui=legacy` selecciona el modo avanzado sobre la misma interfaz React. No carga
una segunda versión de las páginas.

## Compilación y comprobación

```powershell
npm ci --ignore-scripts
npm run build:public
npm run check:surfaces
.venv/Scripts/python.exe scripts/build_index.py --check
.venv/Scripts/python.exe scripts/version_assets.py --check
```

`build:public` renderiza las superficies React con `renderToString`, compila
los bundles público y administrativo, compone el documento y actualiza hashes
y manifiesto de caché. Usa exactamente los componentes que hidrata el navegador.
No se solicita HTML de fragmentos por red durante el arranque.

Para desarrollo y comparación, ejecutar primero `build:public` y después
`npm run dev:react`. Si se modifica el markup de las superficies, regenerar su
HTML para mantener idénticos el render inicial y la hidratación. Para servir la
distribución real basta un servidor HTTP de archivos estáticos sobre la raíz.

## Arranque y fallos

1. El servidor estático entrega el árbol ya renderizado por React.
2. `main.tsx` hidrata `frontend-root`. El shell estable no se desmonta al navegar.
3. Se registran las regiones dinámicas, notificaciones y movimiento.
4. Los módulos de dominio se descargan en paralelo y ejecutan en orden con
   `async=false`, después de hidratar sus controles.
5. `window.SpaceLabFrontend.ready` y `spacelab:frontend-ready` indican que esos
   servicios están disponibles. Las pruebas que invocan APIs globales esperan
   esta señal, también después de recargar.

El primer clic relevante durante la carga se conserva y se ejecuta al terminar.
Si el bundle falta, el arranque utiliza el HTML generado por React y los mismos
controladores en modo recuperación. Un bundle que llegue tarde no sustituye
los cambios hechos en ese modo. La prueba de entrada pública valida este caso.

## Edición e integración

Los campos de los controladores y la hoja `contenteditable` son límites de
integración estables: conservar IDs, selección, undo, adjuntos y borrador es
parte del contrato. El motor especializado sigue renderizando el contenido
editable del documento; React no lo reconstruye en cada transición de ruta.

Los constructores de vistas de planificación y otros widgets se conservan como
adaptadores. `regions.tsx` transforma su salida en nodos React dentro de un
template inerte, descarta contenido activo y atributos de eventos y reconcilia
la región de forma síncrona antes de consultar sus controles. No emplea
`dangerouslySetInnerHTML`. Limpia las raíces de regiones retiradas del DOM.
Esto mantiene la lógica existente; no implica haber reescrito todo el dominio
en hooks o eliminado cada operación DOM del editor.

Las tarjetas, acciones de cuenta y avisos usan estado React suscrito mediante
`useSyncExternalStore`. Los textos de sesiones y errores se presentan como
texto, de modo que etiquetas maliciosas no se convierten en elementos.

## Animaciones y accesibilidad

Las transiciones usan Web Animations y CSS, con desplazamientos breves y
opacidad, sin dependencias adicionales. La configuración
`prefers-reduced-motion` desactiva el movimiento de vistas y ventanas. Los
estados de espera/error siguen expresados mediante texto y controles.

## Pruebas de interfaz

La navegación compartida se implementa en `WorkspaceNavigation.tsx` y permanece
montada al cambiar entre inicio, generador, planificación, biblioteca y documento.
`Home.tsx` conserva los identificadores usados por los servicios de cuenta y
sesiones. Los estilos del espacio y sus transiciones están en `styles.css`;
no editar sus snapshots HTML generados.

La regresión `tests/ui_workspace_navigation.py` valida continuidad de borradores,
recarga, temas y navegación en tres tamaños; admite `--comet --headed`.

```powershell
.venv/Scripts/python.exe tests/ui_full_react_smoke.py
.venv/Scripts/python.exe tests/ui_full_react_smoke.py --comet --headed --live-account
```

La primera usa fixtures aislados de Auth. La segunda abre Comet con un perfil
temporal y crea una cuenta desechable de la aplicación mediante la sesión CLI
autorizada: valida ingreso por el formulario real, créditos, guardado y lectura
en Supabase; elimina la cuenta en `finally`. No envía correos ni consume IA de
pago. El perfil habitual de Comet no se utiliza.

Las pruebas adicionales del workflow cubren currículo, generación simulada,
guardar/reabrir, cuentas A/B/invitado, administración, logos, seguridad, Word/PDF,
temas y accesibilidad. La evidencia de esta migración está en
[el informe del 27/10](reports/MIGRACION_REACT_27-10-2026.md).
