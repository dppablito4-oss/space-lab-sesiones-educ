# Operación y aceptación de la beta

Procedimiento de operación de la beta abierta. La evidencia de despliegue y
restauración está en `BETA_READINESS_19-10-2026.md`; este documento describe cómo
repetir las comprobaciones y distingue los pasos todavía pendientes.

## 1. Identidad del proyecto y acceso

Referencia esperada: `koptglmifwpzrfzvipnm`.

```powershell
npx --yes supabase login
npx --yes supabase projects list --output-format json
```

La cuenta debe poder ver esa referencia. No cambiar la URL del frontend para
utilizar otro proyecto solo porque la sesión CLI no tenga acceso al original.
No compartir tokens o contraseñas en chat, archivos versionados o capturas.

## 2. Inventario remoto de solo lectura

Comandos comprobados con la ayuda de Supabase CLI 2.121.0:

```powershell
npx --yes supabase migration list --project-ref koptglmifwpzrfzvipnm
npx --yes supabase functions list --project-ref koptglmifwpzrfzvipnm
npx --yes supabase db query --linked --project-ref koptglmifwpzrfzvipnm --file scripts/beta_readiness_audit.sql
npx --yes supabase db advisors --linked --project-ref koptglmifwpzrfzvipnm --type security
```

Comparar las migraciones con `supabase/migrations/README.md`. El baseline por sí
solo no instala las funciones posteriores. El inventario SQL muestra tablas,
RLS, políticas y privilegios de funciones; no consulta contenido de docentes.
Completar después pruebas de autorización reales con dos usuarios de prueba y
un administrador: lectura/escritura cruzada, cambio de propietario, edición de
roles, manejo de alumnos y asignación/consumo/reembolso de créditos. Una prueba
estática que encuentra un texto en SQL no acredita esos permisos en producción.

Revisar las cinco funciones: `ai-gateway`, `openai-router`, `gemini-router`,
`deepseek-router` y `pablito-mailer`. Revisar nombres de secretos/configuración
sin mostrar valores. Los routers autentican dentro de la aplicación; conservar
la configuración de JWT correspondiente de `supabase/config.toml`.

## 3. Configuración que debe quedar registrada

| Opción | Comportamiento del código | Validación pendiente |
| --- | --- | --- |
| `AI_GLOBAL_ENABLED=false` | Rechaza gateway y routers directos antes del proveedor | Comprobar tras desplegar |
| `PROVIDER_OPENAI_ENABLED=false` | Impide llamadas directas a OpenAI y su selección en gateway | Comprobar tras desplegar |
| `PROVIDER_GEMINI_ENABLED=false` | Equivalente para Gemini | Comprobar tras desplegar |
| `PROVIDER_DEEPSEEK_ENABLED=false` | Equivalente para DeepSeek | Comprobar tras desplegar |
| `AI_PROVIDER_TIMEOUT_MS` | 45 s por defecto; configurable entre 1 y 60 s | Medir generación real; gateway concede 10 s adicionales por intento |
| `BILLING_ENFORCEMENT=true` | Bloquea capacidades comerciales denegadas o no verificables | Registrar decisión de la beta; no activarlo sin comprobar matriz de planes |

Los créditos, límites y reembolsos se verifican en base de datos. Los permisos
comerciales son un control adicional; el modo de observación no equivale a
consumo ilimitado. Probar errores, solicitudes duplicadas y reservas abandonadas.

## 4. Recuperación de contraseña

El cliente envía la solicitud con `resetPasswordForEmail`, vuelve a la página
que la originó y muestra el formulario al recibir `PASSWORD_RECOVERY`; la nueva
contraseña se envía con `updateUser`. Referencias oficiales:
[recuperación](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail),
[redirecciones](https://supabase.com/docs/guides/auth/redirect-urls).

Auth ya utiliza `https://sesiones.sypablitodp.site` y admite las redirecciones
exactas `/` e `/index.html`, declaradas en `supabase/config.toml`. Se corrigió
el destino anterior `localhost:3000` y se verificó el enlace generado. Probar
con una cuenta de prueba el correo real, enlace válido,
enlace vencido/usado, contraseña rechazada y acceso con la nueva contraseña.
Verificar entrega de correo y límites antes de invitar docentes.

El protocolo ya se verificó contra Auth real con un enlace generado por la API
administrativa sin enviar correo: token válido, cambio de contraseña e ingreso.
La entrega al buzón sigue pendiente. La beta mantiene registro público con
confirmación automática, según decisión del usuario.

Para cambios posteriores, ejecutar `config diff --project-ref` antes de
`config push`. CLI 2.121.0 aplica solo propiedades declaradas; conservar los
ajustes remotos no gestionados. El `--yes` de `npx` no responde a las preguntas
de Supabase: si automatizas un cambio ya revisado, la CLI necesita su propio
`--yes` después de `supabase config push`.

## 5. Datos locales y actualización

Las claves sin sufijo conservan el espacio invitado y los datos de versiones
anteriores. Las cuentas usan `:user:<id>` en sesiones, borrador y planificaciones.
No se asignan datos antiguos a la primera persona que inicia sesión. Si un
docente necesita recuperar un documento antiguo, comprobar primero su copia en
la nube; para documentos solo locales, exportar/importar explícitamente desde
su espacio invitado. El borrado de datos del navegador elimina las copias locales.

El guardado confirma persistencia en el dispositivo. La sincronización ocurre
por separado; ante error, conservar el borrador y reintentar. Una cuota agotada
debe mostrar fallo de guardado y permitir exportar el documento que sigue abierto.

## 6. Respaldo, reversión y observación

Antes del despliegue, registrar: commit/versiones actualmente publicados,
funciones y configuración actuales, historial de migraciones y fecha del último
respaldo disponible. Comprobar qué incluye ese respaldo (base de datos, Storage,
configuración) en el plan del proyecto. Descargar por separado los recursos que
no cubra; no incorporar respaldos ni secretos al repositorio.

Realizar una restauración en un entorno separado y verificar acceso, sesiones,
alumnos y créditos antes de considerar probado el respaldo. No probar restauración
sobre los datos de producción. Registrar duración y resultado.

El 19/10 se completó una copia manual de `public` y `auth` y una restauración
aislada: 44 tablas, 734 filas y prueba de seguridad aprobadas. Copias bajo
`artifacts/beta-readiness/backups/2026-10-19` con ACL local restringida. El esquema
y los datos pueden incluir credenciales de correo y autenticación: no versionar
ni enviar estos archivos. El manifiesto contiene tamaños y SHA-256.

Para repetir el dump con Docker activo, preparar primero una carpeta protegida,
fuera de Git, y usar rutas dentro de ella. En PowerShell entrecomillar la lista
de esquemas para conservarla como un argumento:

```powershell
npx --yes supabase db dump --linked --project-ref koptglmifwpzrfzvipnm --schema 'public,auth' --file '<carpeta-protegida>/schema.sql'
npx --yes supabase db dump --linked --project-ref koptglmifwpzrfzvipnm --schema 'public,auth' --data-only --use-copy --file '<carpeta-protegida>/data.sql'
npx --yes supabase db dump --linked --project-ref koptglmifwpzrfzvipnm --role-only --file '<carpeta-protegida>/roles.sql'
```

El ensayo utilizó `public.ecr.aws/supabase/postgres:17.6.1.155` en un contenedor
sin red ni puertos, una base nueva desde `template0` y el rol `supabase_admin`.
Se restauró esquema y después datos con triggers desactivados solo en esa copia;
se compararon las cantidades con el dump y se ejecutó el SQL de seguridad.
El contenedor se eliminó al terminar. Los secretos de la copia no se imprimieron.
Faltan respaldo programado, copia externa y cobertura de objetos Storage y
configuración del proyecto. No hay respaldo físico disponible informado ni PITR.

Ante errores tras publicar:

1. Detener nuevas invitaciones. Si falla IA, deshabilitarla en la configuración
   de servidor; el interruptor es efectivo cuando las funciones ya contienen
   esta implementación.
2. Volver al commit y a las versiones de funciones previamente registradas.
3. Revisar compatibilidad antes de revertir esquema. No ejecutar SQL destructivo
   ni un reset de base como mecanismo de reversión.
4. Comprobar el recorrido mínimo antes de reabrir.

Vigilar errores y latencia de Edge Functions, solicitudes fallidas, créditos
reservados sin cerrar y gasto por proveedor. Definir alertas externas de caída y
presupuesto y asignar una persona que las reciba. Configuración real pendiente.

## 7. Criterio de apertura

- [x] RLS y privilegios remotos comprobados con cuentas de prueba.
- [x] Registro público e ingreso comprobados; confirmación automática conservada.
- [x] Recuperación por token y contraseña nueva comprobadas sin envío de correo.
- [ ] Entrega de correo de recuperación comprobada desde un buzón.
- [x] Guardado, sincronización y recarga conservan el documento en el sitio publicado.
- [x] A → B → invitado: aislamiento probado con cuentas reales en el sitio publicado.
- [x] Cuota local agotada devuelve fallo en el sitio publicado; red/sincronización con regresiones locales.
- [x] Créditos correctos ante éxito, fallo, duplicado y reintento (contabilidad SQL y generación HTTP).
- [x] DOCX y PDF reales verificados con la descarga publicada 1.4.1.
- [x] Respaldo manual y restauración aislada ensayados; reversión documentada.
- [ ] Respaldo automático y copia externa protegida activos.
- [ ] Alertas y responsable de soporte activos.
- [x] Alcance definido: beta abierta con registro público; limitaciones en el informe.

Registrar por cada casilla fecha, versión y evidencia. La suite local no marca
automáticamente ninguna de las comprobaciones remotas.
