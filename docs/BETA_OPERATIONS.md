# Operación y aceptación de la beta

Estado: preparación local. Este documento no acredita un despliegue ni una
restauración real. La apertura requiere completar y registrar los puntos siguientes.

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

Configurar en Auth la URL oficial del sitio y las redirecciones exactas
necesarias. Probar con una cuenta de prueba el correo real, enlace válido,
enlace vencido/usado, contraseña rechazada y acceso con la nueva contraseña.
Verificar entrega de correo y límites antes de invitar docentes.

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
- [ ] Registro, confirmación y recuperación reales funcionando.
- [ ] Generación, edición, cierre y reapertura conservan el documento.
- [ ] A → B → invitado no mezcla editor, historial, alumnos ni documentos.
- [ ] Falta de red y cuota local agotada no anuncian guardado inexistente.
- [x] Créditos correctos ante éxito, fallo, duplicado y reintento (contabilidad SQL y generación HTTP).
- [ ] DOCX y PDF reales verificados con el ejecutable descargado publicado.
- [ ] Respaldo y restauración ensayados; reversión documentada.
- [ ] Alertas y responsable de soporte activos.
- [ ] Alcance y participantes definidos; limitaciones comunicadas.

Registrar por cada casilla fecha, versión y evidencia. La suite local no marca
automáticamente ninguna de las comprobaciones remotas.
