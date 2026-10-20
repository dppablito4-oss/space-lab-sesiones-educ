# Preparación de beta — evidencia del 19 y 20 de octubre de 2026

## Estado de entrega

Modalidad elegida: **beta abierta con registro público**. Supabase y motor 1.4.1
publicados y verificados. El frontend corregido se entrega con este informe;
la comprobación de GitHub Pages queda al final. Quedan tareas operativas de
correo, respaldo automático y alertas, detalladas abajo.

## Comprobación del 20 de octubre, 16:22 (Bogotá)

- El acceso de la CLI al proyecto sigue vigente. Management API confirma activos
  `ai-gateway` v7, OpenAI v21, Gemini v18 y DeepSeek v25.
- La versión publicada es `1e98594`, build `f87b46ff82aa6b93`.
  [Publicación](https://github.com/dppablito4-oss/space-lab-sesiones-educ/actions/runs/39353284895)
  y [validación](https://github.com/dppablito4-oss/space-lab-sesiones-educ/actions/runs/39353284820)
  terminaron correctamente. El arreglo previo `045d8da` también pasó Linux y Windows.
- Se cotejaron contra el commit publicado el cliente Supabase, ambos adaptadores
  de sesión y el manifiesto. Los cuatro archivos coinciden. Esto no incluye los
  cambios locales de diseño aún sin publicar.
- OPTIONS real acepta el origen público y `http://127.0.0.1:3000`, junto con todos
  los encabezados declarados del SDK. Chromium desde el sitio real obtiene 401
  HTTP al invocar IA sin sesión: la respuesta llega al navegador y Auth impide
  generar sin autenticación. Esta comprobación no consumió una generación de IA.
- La ventana de registros de las últimas 24 horas contiene tres POST HTTP 200
  del gateway v7; el último es del 20/10 a las 00:46 (Bogotá). No hay diagnósticos
  `[AI CORS]` registrados en esa ventana. Los errores 502 observados pertenecen
  a versiones anteriores; no se atribuyen estas solicitudes a una persona.
- El usuario confirmó **«Ya funciona»** después de recargar el sitio. Se cierra
  la incidencia de conexión/generación de IA con esa verificación y las pruebas
  anteriores. No se identificó el origen del preflight que falló inicialmente;
  no se atribuye una causa única a aquella captura.

Evidencia local sin secretos: `ai-status-2026-10-20.json` y
`ai-transport-2026-10-20.json`, en `artifacts/beta-readiness/` (ignorada por Git).
Se conservan debajo las comprobaciones históricas del 19/10.

## Supabase y recorrido real

Proyecto `koptglmifwpzrfzvipnm`, acceso CLI confirmado.

- Las 17 migraciones previas coincidían. Se aplicó
  `20261019221350_beta_privilege_hardening.sql`: permisos sobrantes de 81 a cero
  y funciones SECURITY DEFINER accesibles a anónimos de cuatro a cero.
- Funciones publicadas: gateway v5, OpenAI v19, Gemini v16, DeepSeek v23 y mailer
  v8. JWT conserva la configuración previa; cada función aplica sus controles.
  Todas rechazan POST sin autenticar; mailer GET ya no provoca error 500.
  Se conservó copia local del código previo.
- SQL real con docentes y administrador: aislamiento, propietario inmutable,
  perfil protegido y créditos/reservas/reembolsos idempotentes. Los datos de
  prueba se revierten con ROLLBACK. No se borraron documentos existentes.
- HTTP real con dos cuentas temporales: registro por el endpoint público,
  ingreso y guardado de sesión/planificación canónica; bloqueados lectura
  cruzada, cambio de propietario, escalada de rol y acceso a SMTP.
- Recuperación sin correo: enlace administrativo, verificación de token,
  cambio de contraseña e ingreso con ella. Falta la llegada al buzón.
- Corregida la configuración remota de Auth: `site_url` apuntaba a
  `http://localhost:3000` y no había redirecciones permitidas. Ahora utiliza el
  dominio público y permite las rutas exactas raíz e `index.html`. Se revisó
  `config diff`, se aplicaron solo esos dos campos y se comprobó un enlace real
  que vuelve a la beta. Los otros ajustes remotos se conservaron.
- Generación corta real: HTTP 200, OpenAI `gpt-6-luna`, un crédito, cero fallbacks.
  Repetir el identificador devuelve 409 sin otro descuento. Se reutilizó la clave
  remota existente; no se imprimieron ni guardaron claves o tokens de API.
- Ambas cuentas temporales se cerraron y eliminaron en cada ejecución.

### Diagnóstico posterior del error de IA

La captura «Failed to send a request to the Edge Function» corresponde a IA,
según aclaración del usuario. No es el error de Auth SMTP documentado por separado.
Los logs de las 18:02 (Bogotá) mostraron dos OPTIONS 200 a `ai-gateway` sin POST;
se pidió el dominio/puerto del navegador para investigar un posible bloqueo CORS.
Se actualizaron los encabezados permitidos del SDK (incluidos trazas y reintentos)
y el diagnóstico de preflight registra origen y nombres de encabezados rechazados,
sin tokens, claves ni cuerpo de solicitud. El origen sigue restringido al sitio
oficial y localhost. El preflight desplegado se comprobó después del cambio.

Una prueba adicional desde el sitio público detectó un fallo distinto: generar
la sesión completa agotaba los 45 s en cada proveedor. Se desplegó el ajuste de
plazos y después el diagnóstico CORS (gateway v7, OpenAI v21, Gemini v18 y
DeepSeek v25). Documentos tienen 90 s por defecto (máximo
100 s configurable), dentro de un presupuesto compartido de 125 s con margen
para contabilidad y respuesta. El respaldo recibe solo el tiempo restante.
Luna usa `reasoning_effort=low`; se conserva el modelo existente. Los errores de
plazo ahora devuelven 504 y `AI_PROVIDER_TIMEOUT`, con CORS y requestId.

La repetición real en Chromium contra el sitio publicado produjo SessionDocument
v1 válido en 75,06 s. La cuenta temporal se cerró y eliminó. Hay regresiones para
límites, respaldo acotado, errores de plazo, conexión y mensajes de créditos.
El mensaje de transporte del cliente se preparó en español, con diagnóstico
sin credenciales y sin reintentos automáticos de generación. Esa prueba aislada
no acreditaba resolver el fallo del usuario. El 20/10 el usuario confirmó que
la IA ya funciona tras recargar, como consta en la actualización de este informe.

## Frontend y regresiones

Actualización pedagógica del 20/10: recuperada la secuencia explícita de inicio,
procesos metodológicos y cierre del Word de referencia, tanto para sesiones
individuales como para las vinculadas a unidades y experiencias. El método y
el currículo seleccionado se conservan al guardar/reabrir/exportar. Pasaron 46
archivos de pruebas JS y 23 pruebas Deno; Chromium comprobó los tres recorridos
con el validador real. Dos generaciones sintéticas produjeron Word con títulos
y orden verificados y PDF generado por Microsoft Word. Detalles y límites en
`docs/SESSION_STRUCTURE_20-10-2026.md`. Generador remoto actualizado a gateway v8,
OpenAI v23, Gemini v20 y DeepSeek v27; prompt `2026-10-v4-secuencia`.

Separación de cuentas para sesiones/borrador/planificaciones; limpieza de editor,
alumnos y chat al cambiar de cuenta; protección frente a respuestas antiguas.
Guardado honesto ante cuota agotada y conservación de ediciones concurrentes.
Recuperación y privacidad corregidas. Los documentos antiguos quedan en invitado
hasta importación explícita.

46 archivos JavaScript, 17 pruebas Deno y 38 comprobaciones Python aprobados
localmente, incluidos 20 de navegador. Composición, versiones, Ruff y tipos
comprobados. Suite completa Linux y prueba del EXE Windows aprobadas en
[GitHub Actions](https://github.com/dppablito4-oss/space-lab-sesiones-educ/actions/runs/39334966722).

## Motor publicado

Corrección local del 20/10: el enlace clicable de la ventana quedaba vencido
porque el arranque de FastAPI cambiaba el token que ya había mostrado la GUI.
Ahora ambos comparten una inicialización por proceso. La regresión reproduce
el recorrido escritorio → servidor y comprueba que el enlace mostrado devuelve
200; antes del arreglo devolvía 401. También se verificó el arranque directo y
el rechazo de tokens incorrectos. Esta corrección requiere abrir el ejecutable
local recompilado; la release pública 1.4.1 descrita debajo sigue siendo histórica.

[Motor 1.4.1](https://github.com/dppablito4-oss/space-lab-sesiones-educ/releases/tag/v1.4.1),
commit `f5a069cd647caa609e679adc44dc9956a1d4af86`, publicado 19/10, 22:31 UTC.

- SHA-256: `BB224881BA5B595507BDBF137A67F301B00F3E4FA8233153383D3B5BDD97B0CB`.
- Tamaño: 95 950 603 bytes. Descarga cotejada con el digest del asset de GitHub.
- Ejecutable descargado iniciado en carpeta separada, reporta 1.4.1 y devuelve
  DOCX de 66 168 bytes y PDF canónico de 118 456 bytes, ambos HTTP 200.
- CI prueba DOCX/PDF del binario antes de crear la release.
- 1.4.0 tenía un error 422 en PDF canónico; la página mostraba el hash de otra
  compilación. Corregidos ambos para 1.4.1.

Ver `AUDITORIA_SEGURIDAD_MOTOR_LOCAL.md` para integridad y límites de las pruebas.

## Respaldo y restauración

Copiados esquema/datos de `public` y `auth`, y roles, mediante CLI. Archivos en
`artifacts/beta-readiness/backups/2026-10-19`, excluidos de Git, con ACL restringida
al usuario local y manifiesto SHA-256. Contienen datos privados: no compartirlos.

Restauración completada en PostgreSQL Supabase 17.6.1.155, Docker sin red ni
puertos publicados, base separada de producción. Coincidieron 44 tablas y 734
filas del dump. `tests/beta_database_security.sql` pasó también en la copia.
Se eliminó el contenedor de ensayo; no se restauró nada sobre producción.

Copia manual local: excluye objetos de Storage, secretos Edge y configuración
Auth/proyecto. Falta automatización y copia externa. Inventario remoto de
respaldos físicos vacío; PITR desactivado.

## Trabajo operativo pendiente

1. **Corregir credenciales SMTP y repetir la entrega de recuperación.** La prueba
   autorizada del 19/10, 18:01 (Bogotá), desde el formulario publicado devolvió
   HTTP 500. Los logs de Auth confirman Gmail `535 5.7.8 Username and Password
   not accepted`. Host `smtp.gmail.com`, puerto 465, usuario y remitente son los
   esperados; falta renovar/corregir la contraseña de aplicación en Auth SMTP.
   Se hizo un solo intento; no se ha confirmado ningún correo entregado.
   Auth mantiene registro abierto y confirmación automática por decisión del usuario.
2. Automatizar respaldos, copia externa protegida, retención y cobertura de Storage.
3. Activar alertas de caída/gasto y asignar responsable de soporte.
4. Revisar protección de contraseñas filtradas y once avisos de RPCs privilegiados
   accesibles a autenticados. Los casos cubiertos pasan; no es una demostración
   de ausencia de vulnerabilidades en todas las rutas.
5. Antes de vender planes, validar y aplicar la matriz comercial. Hoy
   `BILLING_ENFORCEMENT` ausente opera en observación; créditos aplicados en
   servidor. No se cambió plan ni facturación de Supabase.

## Repetir comprobaciones

```powershell
npx --yes supabase db query --linked --project-ref koptglmifwpzrfzvipnm --file tests/beta_database_security.sql
npx --yes supabase db query --linked --project-ref koptglmifwpzrfzvipnm --file scripts/beta_readiness_audit.sql
python scripts/beta_remote_smoke.py
```

`--public-signup` prueba altas solo si Auth declara confirmación automática,
sin correo. `--with-ai` consume proveedor en una generación corta. Son pruebas
manuales de producción; no automatizarlas en CI. Resultados locales ignorados
por Git en `artifacts/beta-readiness/`.

## Publicación web

[sesiones.sypablitodp.site](https://sesiones.sypablitodp.site) despliega el código
`defe39c`, build `587a595f23ac0753`. [GitHub Pages](https://github.com/dppablito4-oss/space-lab-sesiones-educ/actions/runs/39336913209)
terminó correctamente. Se contrastaron nueve archivos con el código local,
incluidos Auth, almacenamiento, editor e indicador de créditos.

Chromium contra el sitio real, sin reemplazar SDK ni archivos: cero errores no
capturados, formulario de recuperación visible, persistencia de invitado tras
recarga y descarga 1.4.1 con hash correcto. Con otras dos cuentas temporales:
ingreso A, guardado y sincronización a Supabase, recarga y borrador conservado,
cierre A, ingreso B sin documentos/editor de A y regreso a invitado vacío.
Una cuota local simulada en esa página devolvió fallo de guardado. Ambas cuentas
se eliminaron después de cerrar sesión.

Este recorrido detectó y permitió corregir un bloqueo real al cerrar sesión
después de recargar: el callback de Auth devolvía la promesa de actualización de
créditos. Ahora difiere las consultas hasta salir del callback y rechaza respuestas
atrasadas de otro refresco. La regresión prueba ambos comportamientos. El patrón
está documentado por [Supabase](https://supabase.com/docs/guides/troubleshooting/why-is-my-supabase-api-call-not-returning-PGzXw0).

Resultados locales: `published-site.json` y `published-accounts.json`, dentro de
la carpeta de artefactos ignorada. La suite completa del commit `defe39c` pasó en
Linux y Windows, incluida la regresión final de Auth:
[validación](https://github.com/dppablito4-oss/space-lab-sesiones-educ/actions/runs/39336914596).
