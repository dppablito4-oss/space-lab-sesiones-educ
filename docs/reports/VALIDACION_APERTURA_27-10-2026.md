# Validación de apertura — 27 de octubre de 2026

Trabajo retomado desde [continuidad del 26](CONTINUIDAD_26-10-2026.md).
Los cambios de esta sesión permanecen locales, sin commit, push ni despliegue.
**La apertura completa sigue pendiente:** se reprodujo pérdida de cambios en
edición simultánea y falta promover el conjunto validado y comprobar recepción
de alertas. No se enviaron invitaciones a docentes.

## Estado de los seis puntos

| Punto | Resultado |
| --- | --- |
| Ruta vulnerable de fichas | Corregida; regresión CLI/Chromium aprobada y añadida al CI; assets y caché reconstruidos. |
| Supabase real | Migraciones, Auth/MFA, REST, RLS, administración y Storage aprobados en una instalación local real aislada. El proyecto público mantiene las dos migraciones pendientes. |
| Restricciones y costes IA | Gratuito/prémium reales, cobro y duplicados, reservas concurrentes, reembolsos y MFA probados. Cuota diaria y saldo insuficiente probados en servicios locales reales. `BILLING_ENFORCEMENT` sigue sin configurar en producción. |
| Conexión y concurrencia | Dos pestañas y otro contexto de navegador recuperan el guardado offline. Editar el mismo documento en dos dispositivos sobrescribe cambios anteriores sin aviso. No existe recuperación automática de un trabajo de IA al cerrar la pestaña. |
| Word/PDF y motor | Descarga pública 1.4.5 verificada por hash y ejecución; Word con ocho tablas, PDF extenso y documento conjunto aprobados. Motor local 1.4.6 aprobado con inventario, fórmulas y controles de seguridad. |
| Apertura controlada | Soporte añadido al espacio docente y editores; copia externa restaurada; plan de 10–20 docentes preparado. Faltan resolver los impedimentos y comprobar recepción de alertas. |

## Fichas, interfaz y build

`js/ficha-external-prompt.js` sanitiza el contenido antes de extraer texto desde
un template inerte. Sin sanitizador no inserta contenido no confiable en el DOM.
El modal conserva únicamente su HTML estático.

La nueva prueba `tests/ui_ficha_prompt_security.py` **rechaza la implementación
original vulnerable** y aprueba el parche. Cubre imágenes con eventos, SVG,
iframe, scripts, campos de sesión, modal, actividades y falta de sanitizador;
no se ejecutan eventos ni se solicitan recursos maliciosos.

Se añadieron accesos de soporte al inicio docente, al editor clásico y al
generador React utilizando el correo publicado. WhatsApp conserva el contacto
de la presentación pública confirmado por el usuario.

Pasaron el build público/administrativo, tipos, recorrido React en cuatro
anchos, modales a 375/1280 px, fichas CLI/GUI, composición del HTML, versiones
de assets, higiene y Ruff de los scripts nuevos.

## Supabase público: alcance efectivo

Se reutilizó la sesión CLI autorizada para `koptglmifwpzrfzvipnm`; no se pidió
ni se guardó una nueva contraseña. No se cambió de proyecto público ni se
usó el proyecto personal visible como entorno de pruebas.

Las pruebas HTTP utilizaron exclusivamente cuentas desechables, eliminadas al
terminar. Se asignaron planes `free` y `pro` solo a esas cuentas. Se comprobaron:

- Matriz de capacidades del RPC para ambos planes.
- Una reserva ante solicitudes duplicadas simultáneas; límite de una reserva
  gratuita y cuatro prémium, con rechazo de la quinta.
- Reembolsos simultáneos idempotentes, saldo exacto recuperado y rechazo del
  reembolso solicitado para otra identidad.
- Recuperación de una reserva propia envejecida para simular abandono; no se
  modificaron reservas de usuarios existentes.
- Límite por minuto y rechazo sin descontar créditos.
- Enrolamiento TOTP real, desafío, verificación y JWT firmado con `aal2`.
  MFA no concede por sí mismo permisos administrativos.
- Generaciones breves reales en ambos planes: un crédito por resultado y
  HTTP 409 al repetir el identificador, sin un cargo adicional.

La última comprobación de costes registró `gpt-6-luna`: gratuito, 103 tokens
de entrada y 15 de salida, USD 0,000024 estimados; prémium, 103 de entrada y
72 de salida, USD 0,000059 estimados. Ambos descontaron exactamente un crédito.
Son valores de telemetría de la aplicación, no una conciliación de la factura
del proveedor. El informe conserva los números, sin texto de los documentos.

En total se hicieron cinco generaciones breves durante la validación: dos
iniciales, una durante un intento de comprobar costes y dos finales. El intento
intermedio falló en el test al buscar el ID del gateway como ID contable; el
gateway asigna IDs propios a cada intento de proveedor. Se corrigió el test
para seguir esos IDs y la reconciliación final aprobó 45 comprobaciones.

Se ejecutaron además `beta_database_security.sql`, `beta_server_accounting.sql`
y `beta_operational_limits.sql` contra PostgreSQL remoto. Sus transacciones
revirtieron las cuentas y configuraciones sintéticas. No instalaron migraciones.

El entorno público continúa sin `20261024224011_admin_control_center.sql` y
`20261026024247_account_storage_boundary.sql`. La ausencia observada del secreto
`BILLING_ENFORCEMENT`, junto con el código que exige el valor exacto `true`,
corresponde a modo de observación comercial. Los controles contables y técnicos
probados sí aplican; no atribuirles restricciones comerciales activadas.

## Supabase local con servicios reales

Se inició el proyecto local desechable `spacelab-acceptance-20261027`, separado
del proyecto público, con API en 55431 y PostgreSQL en 55432. Usa servicios
reales de Supabase Auth, PostgREST y Storage, no fixtures de Auth/MFA.

El baseline y todas las migraciones posteriores, incluidas las dos pendientes
en producción, se instalaron. El arranque reveló una dependencia histórica de
`public.rls_auto_enable()`, existente en el proyecto administrado y ausente en
una instalación nueva. Se añadió `supabase/bootstrap/platform_helpers.sql` y se
documentó el orden de instalación. Conserva una función existente y no instala
event triggers. Ambas ramas del bootstrap pasaron en PostgreSQL, con rollback.
No se editaron migraciones ya aplicadas.

`scripts/beta_acceptance_local.py` aprobó **60 comprobaciones**:

- Administrador sintético, permisos por RPC y rechazo de promoción propia.
- JWT real `aal1` rechazado en escrituras; JWT real `aal2` autorizado.
- Ajuste de cinco créditos y repetición idempotente, con auditoría.
- Administrador sin acceso a los documentos del docente.
- Suspensión efectiva para un JWT ya emitido: documentos ocultos, nuevas
  reservas bloqueadas, subida de logos rechazada y listado autenticado vacío.
- Reembolso permitido durante la suspensión y reactivación sin pérdida de saldo.
- Subida real de logos antes y después de la suspensión.
- Cuota diaria gratuita: tres reservas sintéticas de cinco créditos completadas;
  la cuarta rechazada sin cargo. Proveedor no invocado en estos casos.
- Grants y billetera vacíos de otra cuenta sintética: `INSUFFICIENT_CREDITS`, sin
  saldo negativo.

Las cuatro cuentas locales y sus archivos de prueba se eliminaron. El advisor
local con umbral de errores no encontró incidencias. Esta evidencia acredita
servicios reales locales; todavía falta aceptación del despliegue administrado
con sus Edge Functions compatibles.

Al terminar se detuvo exclusivamente `spacelab-acceptance-20261027` y se
eliminaron sus volúmenes desechables. Para repetir el comando local hay que
volver a iniciar ese entorno; los demás proyectos Docker no se detuvieron.

## Conexión, dispositivos y fallo reproducido

La prueba manual `scripts/beta_acceptance_remote.py --browser` utiliza el SDK,
cliente y almacenamiento del producto contra el Supabase público, con dos
pestañas del mismo contexto y otro contexto independiente como segundo
dispositivo. No reemplaza las llamadas de Storage/REST por mocks.

Pasó guardar documento y borrador offline, leerlos desde la segunda pestaña,
cerrar la primera, reconectar, sincronizar y recuperar el contenido desde el
otro contexto. Son contextos de navegador en un equipo; no una matriz física
de equipos, redes y sistemas operativos.

**Fallo observado:** los dos dispositivos leen el mismo documento; el primero
actualiza el título y el segundo actualiza el cuerpo usando su copia anterior.
La segunda escritura conserva el cuerpo nuevo, pero restaura el título antiguo.
`saveSessionCloud()` utiliza upsert sin revisión condicional. La cola de guardado
por pestaña no resuelve conflictos entre dispositivos. Las aserciones del
recorrido pueden pasar y, aun así, su informe marca `acceptance_passed: false`
por este hallazgo. No declarar cerrada la aceptación de concurrencia.

La recuperación contable de reservas no implica reanudar el texto de una
generación interrumpida. No se incorporó una cola persistente en esta sesión.

## Motor e integridad

| Ejecutable | Verificación |
| --- | --- |
| Descarga pública v1.4.5 | 106.536.121 bytes; SHA-256 `46f3cabde6a5b58c8f59d5e15e811e33c7d66917da84d9ba5a53bcd34620bdab`. Coincide con el asset de GitHub. |
| Motor local 1.4.6 | 104.557.584 bytes; SHA-256 `e42dfb89da94e4922e1478f9ccb5166f8074c1e4b4f558b0752b5d2cc4c0b329`. Inventario de 40 paquetes y MathJax empaquetado verificados. |

El ejecutable descargado se probó con el verificador de su tag 1.4.5, fijando
esa versión esperada y ampliando el PDF con cien párrafos y marcador final:
no se truncó y produjo al menos tres páginas. Word conserva las ocho tablas de
la unidad y el documento conjunto contiene sus sesiones y fórmulas.

El motor 1.4.6 pasó el verificador actual, incluidas fórmulas, aislamiento de
scripts/red y rechazo 413 de un cuerpo chunked excesivo. También pasaron el
PDF offline extenso y el Word conjunto de siete sesiones con OMML.

La primera comprobación del digest del lock local falló por conversión CRLF
de Git, no por un cambio en paquetes o ejecutable. `.gitattributes` fija ahora
`*.lock.txt` a LF. Tras normalizar los finales de línea, el digest coincide y
la prueba completa del EXE pasa. No se alteró el binario para superar la prueba.

## Respaldo, monitor y operación

Se descargó el artefacto del [backup del 27/10](https://github.com/dppablito4-oss/space-lab-sesiones-educ/actions/runs/40531166522),
se descifró en memoria mediante la clave de la bóveda Windows y se restauró en
PostgreSQL 17.6 dentro de un contenedor sin red ni puertos. Coinciden **56 tablas,
738 filas y 20 hashes de objetos**. No se escribieron datos descifrados en el
host; el contenedor de restauración se eliminó al terminar. Los blobs se
verificaron, pero no se reinsertaron en un servicio Storage de recuperación.

El fallo del backup del 25/10 ocurrió en la etapa de exportación/restauración y
guardó diagnóstico cifrado; no se dedujo una causa exacta de sus logs públicos.
Las copias del 26/10 y 27/10 terminaron correctamente; la del 27/10 tiene además
la restauración independiente descrita arriba.

El [monitor programado del 27/10](https://github.com/dppablito4-oss/space-lab-sesiones-educ/actions/runs/40570869669)
terminó correctamente. Esto no demuestra que el responsable reciba alertas.
No se enviaron mensajes de prueba ni se cambiaron destinatarios.

El [plan del piloto](../PILOTO_CONTROLADO.md) define entrada de 10 docentes,
ampliación hasta 20, soporte, registro de incidentes y criterios de pausa. Los
nombres y la aceptación de participantes siguen pendientes del propietario.

## Evidencia y comandos

Los artefactos están ignorados por Git en `artifacts/apertura-controlada/`:
`acceptance-remote-with-ai.json`, `acceptance-remote-no-ai.json`,
`acceptance-costs.json`, `acceptance-local.json`, `backup-restored.json`,
`backup-verification.json`, ZIP cifrado y ejecutable descargado. No versionar
claves locales, tokens, copias, entornos ni datos descifrados.

```powershell
# HTTP real con cuentas temporales; sin coste de IA por defecto.
.venv/Scripts/python.exe scripts/beta_acceptance_remote.py --browser
# Opcional: dos generaciones breves de pago para revisar créditos y telemetría.
.venv/Scripts/python.exe scripts/beta_acceptance_remote.py --with-ai
# Solo acepta un Supabase local ya instalado; rechaza URLs de nube.
.venv/Scripts/python.exe scripts/beta_acceptance_local.py --workdir artifacts/apertura-controlada/supabase-local
```

No promover todavía esta rama como apertura terminada. Siguiente prioridad:
resolver y probar conflictos de escritura; después coordinar el despliegue,
verificar el sitio publicado y la recepción de alertas y confirmar participantes.
