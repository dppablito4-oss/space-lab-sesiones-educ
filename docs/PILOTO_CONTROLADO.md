# Apertura controlada: 10–20 docentes

Preparación del 27/10/2026, America/Bogota. **Sin convocatoria iniciada.**
La [validación actual](reports/VALIDACION_APERTURA_27-10-2026.md) contiene las
pruebas realizadas y los impedimentos para abrir el grupo.

## Condiciones antes de invitar

- Publicar y repetir la prueba del [parche de conflictos](reports/CONFLICTOS_SESIONES_27-10-2026.md),
  ya aprobado localmente en Comet con Supabase real. Conserva ambos cambios
  mediante una copia recuperada; no ofrece coedición en tiempo real. Actualizar
  las pestañas antiguas que aún utilizan guardados sin revisión.
- Revisar y publicar coordinadamente migraciones administrativas, Edge
  Functions, frontend y motor 1.4.6. Repetir los recorridos sobre el sitio
  publicado. La instalación aislada local ya pasó, pero no sustituye esa prueba.
- Confirmar que el responsable recibe una alerta real de prueba. El monitor
  programado aprobado solo demuestra ejecución; no recepción de notificaciones.
- Confirmar un responsable de soporte y su disponibilidad. Se mantienen
  `pabloclsa87@gmail.com` y el WhatsApp publicado `+51 918 165 428`.
- Conservar la copia externa más reciente y acceso a su clave de recuperación.
  La del 27/10 pasó restauración SQL aislada y hashes de Storage.
- Mantener el estado de `BILLING_ENFORCEMENT` visible en la revisión operativa:
  no está configurado en el proyecto público. No iniciar cobros ni anunciar
  restricciones comerciales activas sin decidir, activar y verificar ese modo.

## Incorporación gradual

1. Incorporar primero 10 docentes que acepten participar en la beta. Incluir
   distintos niveles/áreas, equipos Windows y navegadores habituales. No cargar
   listas de estudiantes para las primeras comprobaciones.
2. Cada participante prueba ingreso, una generación breve, revisión pedagógica,
   guardado, reapertura en otro acceso y Word/PDF. La falta de una cola persistente
   implica mantener abierta la pestaña durante la generación; una interrupción
   no garantiza continuar el resultado automáticamente.
3. Registrar incidencias sin contraseñas, tokens ni documentos de alumnos:
   fecha de Bogotá, navegador, versión del motor, acción, resultado esperado,
   mensaje observado e identificador de solicitud si aparece.
4. Revisar diariamente respaldo, errores, gasto estimado y consultas de soporte.
   Ampliar hasta 20 solo después de cerrar incidentes que afecten datos,
   privacidad, exportación o cargos y de una ronda satisfactoria del grupo inicial.

El propietario conserva el registro privado de participantes; el repositorio
no debe contener sus correos ni documentos. No se han creado cuentas para
docentes, enviado invitaciones ni cambiado sus planes.

## Seguimiento y pausa

| Señal | Acción prevista |
| --- | --- |
| Pérdida de datos, acceso cruzado o doble cargo | Detener la ampliación e investigar antes de continuar. |
| Alerta al 80 % de créditos/presupuesto | Revisar consumo y capacidad antes de ampliar cupos. |
| Al menos cinco solicitudes completadas y 30 % de errores de servidor en 30 minutos | Investigar proveedor y funciones; mantener soporte informado. |
| Copia fallida o sin restauración verificada | Recuperar una copia válida antes de ampliar uso. |

Los límites documentados son 500 créditos/día, ocho reservas globales y USD
10/día de gasto **estimado** registrado. El presupuesto de la aplicación no
reemplaza los límites de facturación del proveedor. Los horarios de Actions
pueden retrasarse; revisar la fecha efectiva de cada ejecución.

No depender del nuevo botón de pausa administrativa hasta publicar la
migración y las funciones compatibles. La pausa de IA no cancela solicitudes
ya iniciadas ni sustituye una recuperación de datos.

## Cierre de cada ronda

El responsable conserva una lista de incidencias resueltas/pendientes, la
versión publicada, la última copia recuperable y la decisión de mantener,
ampliar o pausar el grupo. Si hay pérdida de contenido, se preservan las copias
locales y la evidencia antes de reintentar una sincronización.
