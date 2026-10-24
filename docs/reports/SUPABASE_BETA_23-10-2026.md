# Revisión y correcciones de Supabase — 23 de octubre de 2026

## Acceso y alcance

Se comprobó acceso efectivo por la CLI al proyecto `koptglmifwpzrfzvipnm`, que está activo. El conector MCP corresponde a otra cuenta y no tiene acceso a este proyecto; se utilizó la sesión CLI ya autorizada. No se modificaron otros proyectos.

## Correcciones aplicadas en producción

- Las seis operaciones de contabilidad de IA dejaron de ser ejecutables por `anon` y `authenticated`: reservar, completar, reembolsar, registrar ruta e iniciar/finalizar solicitudes del gateway.
- `run_ai_accounting` es una función de invocador, restringida a `service_role`, con una lista explícita de operaciones. La identidad se fija desde el usuario verificado por Auth en la Edge Function; un campo de usuario enviado en el JSON no puede reemplazarla. Se conservan las rutinas atómicas existentes y se restaura el contexto tras éxito o error.
- Se desplegaron gateway v10, OpenAI v28, Gemini v25 y DeepSeek v32. Primero se instaló la ruta de servidor, se probaron las funciones desplegadas y luego se revocaron los permisos del navegador.
- Dos migraciones nuevas están aplicadas y registradas, y coinciden los veinte registros locales/remotos. Sus nombres usan UTC: `20261024003325_beta_server_accounting.sql` y `20261024003356_beta_restrict_browser_accounting.sql`.
- El mínimo de contraseña de Auth subió de seis a ocho caracteres. El servidor rechaza una contraseña de seis; la interfaz local exige ocho al registrar y recuperar, conservando el acceso de cuentas antiguas.

Los fuentes remotos anteriores de las cuatro funciones quedaron copiados en `artifacts/beta-review-2026-10-23/remote-before/`. Para revertir el cambio de contabilidad, primero se deben restaurar los permisos anteriores y después los routers anteriores; no restaurar routers antiguos mientras los RPC de navegador permanezcan revocados.

## Validación

- SQL con roles reales y cuentas sintéticas: aislamiento, propietario inmutable, protección de perfiles, roles administrativos, reservas, cobros, devolución exacta e idempotente, rechazo de devoluciones ajenas y de operaciones no autorizadas. Las transacciones se revirtieron.
- Pruebas HTTP con cuentas temporales: registro, ingreso, recuperación sin enviar correo, contraseña nueva, guardado de sesión y planificación, aislamiento y acceso SMTP bloqueado. Acceder directamente al reembolso o a la ruta de servidor está denegado.
- Dos generaciones breves reales en las fases de despliegue: cobro de un crédito por ejecución y rechazo de solicitud duplicada sin otro cargo. Se reutilizó la configuración de IA previamente autorizada. Las cuentas de prueba se cerraron y eliminaron.
- Pasaron 24 pruebas Deno, 48 pruebas JavaScript, tipos de las cuatro Edge Functions, comprobaciones locales de seguridad/cuotas/planes y recuperación en Chromium. Composición y versiones del frontend pasan.
- Ninguna tabla de `public` quedó sin RLS; no se encontraron vistas públicas sin `security_invoker`. Esto es evidencia del alcance consultado, no una garantía de ausencia de cualquier vulnerabilidad.

## Correo: credencial actualizada y autenticación verificada

Después de que el usuario proporcionara y autorizara la nueva credencial, se actualizó `smtp_pass` mediante la API de configuración de Auth. Se retiraron los espacios de presentación de la contraseña de aplicación. La autenticación SMTP desde una función temporal restringida al servidor devolvió **235**, sin enviar mensajes. La función temporal se eliminó y la credencial no se escribió en el repositorio ni en los informes.

La configuración está en [Auth SMTP](https://supabase.com/dashboard/project/koptglmifwpzrfzvipnm/auth/smtp). Después se solicitó una recuperación desde el sitio publicado: HTTP 200 a las 20:52 de Bogotá. El usuario confirmó recepción en Recibidos. La entrega queda verificada; no se cambió la contraseña de su cuenta.

Corrección del diagnóstico anterior: el intento inicial que obtuvo 535 usó el valor de contraseña devuelto por la API de configuración. Ese campo no permite recuperar y comparar el secreto en texto plano; por ello, esa prueba no demuestra que la credencial anterior almacenada fuera inválida. La prueba final utilizó la nueva credencial autorizada directamente en memoria y sí autenticó correctamente.

## Avisos y tareas pendientes

- El asesor pasó de once avisos de funciones privilegiadas ejecutables por usuarios a cinco. Quedan las dos funciones administrativas, la consulta de permisos, `is_admin` y la sustitución del propio listado de alumnos; sus controles de rol/propiedad se mantienen. No se retiraron permisos necesarios solo para eliminar avisos. [Referencia del asesor](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
- El resultado final del asesor incluye cero errores, seis advertencias y cinco informativos. La sexta advertencia es protección de contraseñas filtradas: intentar habilitarla devolvió HTTP 402 porque requiere Pro. Sigue desactivada; no se modificó el plan. [Documentación oficial](https://supabase.com/docs/guides/auth/password-security).
- La API de respaldos sigue listando cero respaldos disponibles y PITR desactivado. La copia manual y su restauración del 19/10 siguen siendo históricas. Docker está apagado y no se generó un dump nuevo en esta revisión. Faltan automatización y destino externo protegido, con cobertura de Storage.
- Se creó `scripts/beta_health_check.py` y un workflow cada treinta minutos. El script pasó contra el sitio, su manifiesto, Auth y el rechazo de IA sin sesión. No consume IA ni envía correos. El workflow está preparado localmente: solo se activará tras publicar y habilitar las ejecuciones programadas; las notificaciones dependen de la configuración de GitHub del responsable. No sustituye alertas de presupuesto.
- Sigue pendiente protección del registro frente a creación masiva de cuentas, como CAPTCHA, que necesita su configuración propia. El registro público con confirmación automática conserva la decisión existente.
- Los cambios de frontend y el motor 1.4.5 siguen locales; no se publicó la web ni la release en esta revisión. Supabase sí contiene las correcciones descritas arriba.

El correo quedó verificado. No se considera cerrada la apertura pública hasta completar respaldo automático externo, vigilancia de gasto y publicación final. La [verificación completa](VERIFICACION_FINAL_BETA_23-10-2026.md) contiene el resultado posterior de todas las pruebas.
