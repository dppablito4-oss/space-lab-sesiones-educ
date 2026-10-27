# Conservación de sesiones ante conflictos — 27/10/2026

Se corrigió la sobrescritura silenciosa al guardar la misma sesión desde dos
dispositivos o pestañas. El primer guardado conserva su documento. Si otro
editor guarda una versión anterior con cambios distintos, sus cambios se guardan
en una **copia recuperada**, con otro identificador. El editor continúa sobre esa
copia y muestra un aviso. No se intenta fusionar automáticamente el contenido.

## Cambio

- `js/core/session-sync.js` conserva la revisión remota, el propietario y la rama
  de edición de cada instantánea. Los metadatos internos no se envían como
  contenido del documento.
- `js/supabase-client.js` reemplaza el upsert por inserción o actualización
  condicionada a `id`, `user_id` y `last_saved`. Una revisión antigua no puede
  actualizar la fila. Un reintento cuyo contenido ya llegó al servidor reconoce
  ese resultado sin escribir otra vez.
- `js/storage.js` serializa los guardados de cada editor, utiliza la revisión
  confirmada para el siguiente y recupera el último borrador pendiente si hay
  conflicto. La sincronización deja de elegir el ganador por el reloj local.
- La copia recuperada tiene además una clave local independiente del índice de
  sesiones, separada por cuenta. Una pestaña que reemplace el índice no la borra.
  Si falta espacio, se conserva la versión local original y se solicita exportar
  JSON. No se afirma que una copia haya subido cuando la red falla.
- El controlador cambia el documento activo a la copia sin sustituir el DOM del
  editor: conserva el texto que se haya seguido escribiendo durante la petición.
  Las copias de sesiones vinculadas se independizan de la planificación para no
  reemplazar silenciosamente su referencia.
- Se expone la fachada de avisos como `window.Toast`, usada por persistencia,
  para que el aviso de conflicto se muestre también con las notificaciones React.
  La regresión GUI comprueba expresamente que el aviso sea visible.

## Validación

Las regresiones Node cubren escrituras competidoras, versión obsoleta, respuesta
perdida después de un commit, colisión de importación, guardar como copia,
guardados consecutivos del mismo editor, sincronización limpia sin copias falsas,
última edición en cola, cuota local, índice reemplazado, registro corrupto y
separación entre cuentas A/B/invitado.

`tests/ui_session_conflicts.py` usa el frontend real. Se ejecutó con una frontera
HTTP reproducible y con **Comet visible, Supabase real y una cuenta temporal**:

1. Dos contextos independientes abren la misma revisión; el cambio del primero
   permanece y el cuerpo editado por el segundo llega a otra sesión.
2. Dos pestañas con el mismo localStorage repiten el conflicto y conservan una
   segunda copia distinta.
3. La copia se reabre después de recargar y sincronizar sin crear duplicados.

`scripts/beta_acceptance_remote.py --browser` también aprobó conexión
interrumpida, recuperación desde otra pestaña, sincronización entre dispositivos,
ambos contenidos en conflicto, reservas/reembolsos concurrentes, límites y MFA
TOTP real. Todas las cuentas temporales se eliminaron; cero llamadas de IA de
pago en esta ronda. No se cambiaron cuentas docentes ni ajustes globales.

Build público, administrativo y preview React aprobados, con comprobación de
tipos. Los resultados de la batería y sus logs están en
`artifacts/session-conflicts/`, ignorado por Git. Las nuevas regresiones Node y
GUI están incluidas en CI.

- `cli-results.json`: **88 comandos aprobados**, ninguno fallido.
- `gui-results.json`: **36 recorridos aprobados**, ninguno fallido.
- `remote-acceptance.json`: **40 comprobaciones reales aprobadas**,
  `acceptance_passed: true` y limpieza de ambas cuentas confirmada.
- `gui-live.json` y `temporary-account.json`: recorrido en Comet/Supabase y
  eliminación de su cuenta temporal.
- `recovered-device.png` y `recovered-after-reload.png`: evidencia visual.

## Entrega y límites

Cambios guardados localmente, **sin commit, push ni publicación**. Se usa el
esquema existente; no se aplicaron migraciones a producción. La protección
condicional pertenece al cliente actualizado: una pestaña o cliente antiguo que
todavía haga upsert no queda protegido por este parche. Al publicar, actualizar
los clientes y repetir el recorrido sobre el sitio servido.

Este cambio conserva las versiones de documentos guardados; la continuación de
una generación de IA tras cerrar la pestaña sigue requiriendo una cola persistente.
Los otros pendientes operativos continúan en el informe de continuidad.
