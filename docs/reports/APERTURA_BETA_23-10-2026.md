# Cierre operativo de beta — 23/10/2026

La web con las correcciones de exportación y contabilidad está publicada. La
beta dispone ahora de límites globales, respaldo externo cifrado y monitor
programado. El motor **1.4.5** está publicado y su descarga real pasó la prueba
local de unidad Word, PDF y documento conjunto.

## Publicación y exportación

- Código principal: `a60e4ea254cf58efc050eed8d31abc76b2cfef56`.
- [Validación Linux y compilación Windows aprobadas](https://github.com/dppablito4-oss/space-lab-sesiones-educ/actions/runs/40053292350).
- [Release 1.4.5](https://github.com/dppablito4-oss/space-lab-sesiones-educ/releases/tag/v1.4.5),
  publicada el 23/10 a las 21:24 Bogotá (24/10 02:24 UTC).
- [Pipeline de release](https://github.com/dppablito4-oss/space-lab-sesiones-educ/actions/runs/40053631759):
  repite validación, compila y prueba el ejecutable antes de publicarlo.
- Descarga verificada: **106.536.121 bytes**, SHA-256
  `46f3cabde6a5b58c8f59d5e15e811e33c7d66917da84d9ba5a53bcd34620bdab`;
  coincide con el digest del asset de GitHub.
- `tests/verify_compiled_exe.py` ejecutado sobre ese archivo descargado:
  versión 1.4.5, unidad A4 horizontal con sus ocho tablas, PDF real que conserva
  el bloque matemático y Word conjunto con planificación y sesiones. El proceso
  se cerró al terminar. La página de descarga enlaza esa release y muestra su hash.

Se conservan la sesión en vertical y la unidad en horizontal en el documento
conjunto. La revisión OMML cubre fracciones, raíces, potencias, sumatorias y
los casos descritos en [revisión matemática](REVISION_OMML_23-10-2026.md).

## Controles activos

| Control | Configuración inicial |
| --- | --- |
| IA global | 500 créditos/día, 8 solicitudes concurrentes |
| Presupuesto | Bloqueo por USD 10/día de gasto estimado registrado |
| Registro público | 20 cuentas/hora, 100/día; 10 por IP/hora |
| Contabilidad | Ruta de servidor; RPC internos cerrados al navegador |
| Recuperación | Formulario público HTTP 200; llegada a Recibidos confirmada |
| Copia externa | Diaria 04:23 Bogotá; cifrada; retención 14 días |
| Disponibilidad y consumo | Cada hora a los minutos 17 y 47 |

Los controles están en `private.beta_limits` y el hook
`public.beta_before_user_created`, habilitado en Auth. Los contadores de IP
utilizan claves con sal, sin guardar la IP literal. Se probó registro real
después de habilitar el hook y se limpiaron las dos cuentas temporales.
Las pruebas de límites y permisos utilizan rollback.

El presupuesto usa telemetría y no constituye un límite de facturación en el
proveedor. CAPTCHA continúa sin configurar. Los límites de registro reducen
abuso por volumen, sin acreditar que cada solicitante sea una persona.

## Evidencia de respaldo

La primera [ejecución automática manualmente iniciada](https://github.com/dppablito4-oss/space-lab-sesiones-educ/actions/runs/40053310053)
terminó correctamente. El mismo workflow queda programado diariamente:
`.github/workflows/beta-backup.yml`.

- Restauración SQL aislada: **56 tablas y 1.043 filas**.
- Storage: **20 objetos**, incluidos en la copia y con SHA-256 comprobado.
- Archivo cifrado: **1.730.147 bytes**; artefacto GitHub **12544087302**.
- Se descargó la copia externa y se descifró en memoria con la clave de la
  bóveda local; se comprobaron manifiesto e integridad de todos los objetos.

Incluye `public`, `auth`, `storage`, `private` y `supabase_migrations` y los
blobs públicos de Storage. Cada ejecución prueba la restauración en PostgreSQL
17.6 sin red ni puertos. Si aparece un bucket privado, la tarea falla hasta
configurar su descarga autorizada; no lo omite silenciosamente.

La conexión usa `spacelab_backup` con lectura global y transacciones de solo
lectura; se comprobó el rechazo de escritura. Solo se sube contenido cifrado
con NaCl SealedBox. No incluye secretos de proveedores, contraseña SMTP ni
toda la configuración de Supabase. La restauración comprobada corresponde a
la base SQL; los blobs conservados necesitarían reponerse en Storage al migrar.
No hay PITR configurado. Una copia diaria puede perder cambios posteriores
a la última ejecución aprobada.

## Monitor

La primera [ejecución del monitor](https://github.com/dppablito4-oss/space-lab-sesiones-educ/actions/runs/40053311650)
pasó. Comprueba sitio, manifiesto, Auth e IA sin sesión; no envía correos ni
consume IA. Consulta consumo y errores con el rol de lectura.

Marca fallo al llegar al 80 % del presupuesto/créditos, o con al menos cinco
respuestas completadas y un 30 % de errores de servidor en los últimos 30
minutos. Los fallos quedan en Actions. Las notificaciones dependen de la
configuración GitHub del propietario; no se configuró un destinatario propio
de correo/SMS. GitHub puede retrasar los horarios o pausar tareas por inactividad.

## Recuperación y claves

La contraseña de lectura y el par de claves están en Windows Credential Manager,
entrada `SpaceLab Backup:koptglmifwpzrfzvipnm`. GitHub Actions guarda
`BETA_BACKUP_PASSWORD` y `BETA_BACKUP_PRIVATE_KEY` como secretos; la clave pública
es la variable `BETA_BACKUP_RECIPIENT`. No se versionan sus valores.

Para recuperar en un entorno separado:

1. Descargar un artefacto aprobado antes de que expire su retención de 14 días.
   Guardarlo en una carpeta privada e instalar `scripts/requirements-ops.txt`.
2. Obtener la clave privada del gestor de secretos y cargarla en memoria o en
   una variable de entorno sin escribirla en comandos o logs. Utilizar
   `scripts/beta_backup.py:unseal` para descifrar el `.sealed`: contiene un tar.gz.
3. Revisar `manifest.json` y sus hashes antes de extraer a una carpeta protegida.
   `database.dump` contiene información sensible de autenticación.
4. Preparar PostgreSQL 17 con los roles estructurales de Supabase y extensiones
   `pgcrypto` y `uuid-ossp`. Restaurar en una base nueva con
   `pg_restore --no-owner --no-acl --exit-on-error --single-transaction`.
   El ensayo está en `scripts/beta_backup.py:isolated_restore`. Comparar todas
   las tablas con `manifest.table_counts`.
5. Reponer los archivos `objects/` en el bucket y nombre que indica
   `manifest.objects`. Comprobar permisos, URLs y SHA-256. La restauración SQL
   por sí sola no repone los blobs.
6. Desplegar Edge Functions desde Git y configurar Auth y secretos mediante el
   gestor seguro. Probar ingreso, documentos, archivos y créditos antes de
   cambiar el sitio al proyecto recuperado.

Conservar acceso a la bóveda o una copia segura de la clave privada fuera de
Git. Actions no permite descargar sus secretos desde la interfaz. Al rotar el
par de claves, conservar las antiguas hasta que expiren sus copias. Al rotar la
contraseña de lectura, actualizar el secreto y repetir el workflow manualmente.
Nunca ensayar una restauración sobre producción.

## Alcance de apertura

Recomendación: **beta pública de convocatoria gradual**, observando los límites
anteriores. El propietario del proyecto asume la operación inicial; debe revisar
Actions y activar sus notificaciones de fallos. Un canal visible de soporte y
un segundo destinatario operativo siguen siendo mejoras antes de ampliar uso.

La generación de una experiencia completa todavía depende de mantener viva la
petición del navegador. No hay una cola persistente que garantice continuar
al cerrar la pestaña. Los documentos recibidos sí tienen guardado, sincronización
y reapertura comprobados. La mejora posterior de mayor utilidad es una cola
recuperable con progreso y reintentos por sesión.

La [verificación funcional](VERIFICACION_FINAL_BETA_23-10-2026.md) pasó
43 comprobaciones Python, 48 archivos JavaScript y 24 pruebas Deno; incluye
exportación y conservación de fórmulas. No implica compatibilidad perfecta con
todo Word, todas las fórmulas o todos los tamaños de contenido.

Revisión adicional de Supabase: las cinco funciones están activas (gateway 10,
OpenAI 29, Gemini 26, DeepSeek 33, mailer 8). El sitio y Auth devolvieron 200;
IA sin sesión devolvió 401. El asesor de seguridad no informó errores críticos:
mantiene avisos de cinco funciones SECURITY DEFINER de administración/permisos
y alumnos, revisadas con pruebas de autorización, y protección de contraseñas
filtradas deshabilitada (requiere cambio de plan para activarla). Persisten avisos
de rendimiento sobre políticas e índices; no se presenta esta apertura como
una auditoría sin hallazgos ni se modifican permisos para silenciar avisos.
