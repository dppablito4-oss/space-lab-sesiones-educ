# Barra lateral compartida y Mi espacio — 27/10/2026

La navegación principal deja de pertenecer solo al generador. Un único componente
React, `WorkspaceNavigation`, permanece montado al pasar por Mi espacio, crear
sesión, unidades/experiencias, biblioteca y documento. La portada pública y las
páginas independientes conservan su navegación propia.

- En escritorio la barra azul permanece visible y se puede contraer a iconos.
  El estado se mantiene al navegar dentro de la aplicación. Cada acción conserva
  su nombre accesible y la sección actual se indica con `aria-current`.
- En móvil hay un botón de menú disponible en esas mismas vistas y un panel con
  cierre por Escape, gestión de foco y las mismas acciones. El panel libera el
  foco antes de abrir las confirmaciones del editor o la planificación.
- Mi espacio tiene superficies suaves, tarjetas redondeadas, resumen de cuenta,
  accesos destacados y transiciones de entrada y respuesta al pasar el cursor.
  Se usan los datos existentes de sesiones, créditos y plan. Mantiene soporte,
  temas, cierre de cuenta y acciones reales de la biblioteca.
- Las animaciones respetan movimiento reducido. Se anima el contenido de las
  vistas, manteniendo fijas la navegación y las herramientas del documento.
- Volver desde Mi espacio al generador revela la vista y conserva los campos del
  borrador; no crea un documento nuevo salvo al pulsar Nueva sesión.
- Se corrigió un fallo de arranque detectado al recargar Mi espacio con cuenta:
  el router podía llamar `AuthUi.closeModal()` antes de inicializar sus referencias
  y terminar en la portada. El cierre ahora admite ese momento del arranque.

## Comprobación

`tests/ui_workspace_navigation.py`, añadido a CI, recorre el frontend real con
Auth/REST aislados. En Chromium y Comet visible comprueba 390, 1024 y 1440 px:
navegación entre vistas, identidad del nodo de navegación, barra contraída o
panel móvil, campos conservados, documento retenido, posiciones de las barras,
ausencia de desbordamiento del inicio, temas claro/oscuro, animación normal,
movimiento reducido y reapertura de Mi espacio tras recargar.

También se ejecutaron las regresiones de entrada pública/preview React,
generador en cuatro anchos con Word/PDF reales, acceso y rutas, recuperación de
cuentas, conflictos de sesiones, temas, accesibilidad y arranque con dependencias
fallidas. Se comprobaron compilación pública/administrativa/preview, TypeScript,
sintaxis JavaScript, Ruff, composición HTML, versiones e higiene.

Comet con una cuenta temporal real de Supabase verificó además ingreso por el
formulario, identidad/créditos, guardado y lectura de sesiones. La cuenta se
eliminó al terminar. No se hicieron llamadas de IA de pago.

Las capturas y resultados nuevos están en `artifacts/workspace-navigation/`
(ignorado por Git). La prueba real de cuenta usa el informe de
`artifacts/react-migration/comet-live-account.json` y su log se conserva en
`artifacts/workspace-navigation/comet-live.log`.

Cambios locales posteriores al commit `02d7a2e`, pendientes de commit y
publicación. No se modificaron migraciones ni ajustes globales de Supabase.
