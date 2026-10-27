# Continuidad — 27 de octubre de 2026

**Corrección posterior:** resuelta localmente la sobrescritura entre dispositivos
con revisión condicional y copias recuperadas; probada en Comet visible contra
Supabase real. Ver [cambio y evidencia](CONFLICTOS_SESIONES_27-10-2026.md).
Todavía requiere publicación y comprobación sobre el sitio servido.

**Trabajo posterior del mismo día:** se migró el frontend completo a superficies
React y se validó en Chromium y Comet con cuenta temporal. Ver
[migración y pruebas](MIGRACION_REACT_27-10-2026.md) y la
[guía de mantenimiento](../FRONTEND_REACT.md). Estos cambios también permanecen
sin commit, push ni publicación; conservar las fuentes nuevas y snapshots.

Se completó la ronda de validación solicitada. El detalle está en
[validación de apertura](VALIDACION_APERTURA_27-10-2026.md) y el procedimiento
operativo en [piloto controlado](../PILOTO_CONTROLADO.md).

Los cambios permanecen **sin commit, push ni despliegue**. Conservar los
archivos nuevos y modificados. No reinstalar migraciones en producción ni
activar `BILLING_ENFORCEMENT` basándose solamente en este informe.

## Terminado

- Parche de fichas, regresión que falla contra el código original y aprueba
  con el parche, inclusión en CI, assets y caché reconstruidos.
- Acceso visible a soporte en espacio docente y editores, manteniendo los
  contactos publicados confirmados por el usuario.
- Supabase público: cuentas desechables `free`/`pro`, generaciones y telemetría,
  duplicados, límites, reservas concurrentes, reembolsos y MFA reales.
- Supabase local aislado con Auth, REST y Storage reales: todas las migraciones,
  MFA obligatorio, permisos, suspensión, logos, reactivación, cuota diaria y
  saldo insuficiente; 60 comprobaciones aprobadas.
- Bootstrap de compatibilidad para instalaciones nuevas, sin editar migraciones
  históricas; probado crear la función ausente y preservar la existente.
- Descarga pública 1.4.5 y motor local 1.4.6: integridad, Word/PDF, fórmulas,
  tablas y documentos extensos. Locks fijados a LF para que Git no invalide el
  digest del inventario del motor en Windows.
- Copia externa del 27/10 restaurada en PostgreSQL sin red: 56 tablas,
  738 filas y 20 objetos comprobados por hash.
- Plan de grupo inicial de 10–20 docentes preparado, sin invitaciones enviadas.

Todas las cuentas temporales se eliminaron. Se detuvo y eliminó el entorno
Docker desechable `spacelab-acceptance-20261027`; no se detuvieron otros proyectos.
Los ejecutables y evidencias continúan en `artifacts/apertura-controlada/`,
ignorados por Git. No hubo correos enviados ni cambios en cuentas docentes.

## Pendientes concretos

1. **Publicar y comprobar el parche de conflictos.** La nueva prueba real
   conserva el título remoto y recupera el cuerpo del segundo dispositivo en
   otra sesión. `artifacts/session-conflicts/remote-acceptance.json` aprueba la
   aceptación. Los informes anteriores conservan el fallo histórico. El cliente
   actualizado evita el upsert incondicional; las pestañas antiguas deben
   actualizarse al publicar.
2. La generación sigue sin cola persistente. La devolución de una reserva
   abandonada no recupera automáticamente el texto al cerrar la pestaña.
3. Producción mantiene las dos migraciones pendientes. Coordinar migración,
   funciones, frontend y motor 1.4.6, previa revisión; luego probar el despliegue.
4. `BILLING_ENFORCEMENT` no está configurado: no presentar restricciones
   comerciales como activadas ni activar el flag sin una decisión explícita.
5. Confirmar recepción real de una alerta por el responsable. Las ejecuciones
   aprobadas de Actions no acreditan recepción.
6. Confirmar responsable y lista privada de 10–20 docentes antes de convocar.

## Scripts y evidencia para retomar

- `scripts/beta_acceptance_remote.py`: pruebas manuales contra el proyecto
  público. `--browser` usa dos pestañas y otro contexto contra REST real.
  `--with-ai` hace dos generaciones breves adicionales; sin ese flag no consume IA.
- `scripts/beta_acceptance_local.py --workdir ...`: solo admite una API local;
  requiere preparar e iniciar el stack desechable nuevamente.
- `supabase/bootstrap/platform_helpers.sql`: prerrequisito de instalaciones
  nuevas documentado en el README de migraciones.
- `tests/ui_ficha_prompt_security.py`: nueva regresión Chromium añadida a CI.
- `artifacts/apertura-controlada/acceptance-remote-with-ai.json`,
  `acceptance-remote-no-ai.json`, `acceptance-costs.json`, `acceptance-local.json`
  y `backup-restored.json`: resultados. El primer intento de costes también se
  conserva como diagnóstico del test, no como fallo de la contabilidad real.

Pasaron build público/administrativo, tipos, React en cuatro anchos, modales,
fichas CLI/GUI, Word/PDF extenso, integridad del EXE, higiene, composición HTML,
versiones de assets y Ruff. No repetir toda la batería si el código no cambió;
priorizar la regresión de pérdida de cambios y las comprobaciones del próximo
parche.
