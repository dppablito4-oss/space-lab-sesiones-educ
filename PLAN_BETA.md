# Plan de salida a beta — 19 de octubre de 2026

Objetivo: preparar una beta cerrada con cuentas aisladas, guardado recuperable,
consumo de IA controlado y despliegue verificable. No se considera publicada
hasta comprobar la infraestructura y el recorrido real en producción.

## Etapas y criterios de aceptación

1. **Aislamiento de cuentas y persistencia** — implementado y verificado localmente.
   - Separar sesiones, borrador actual y planificaciones por usuario.
   - Mantener los datos antiguos/sin cuenta en el espacio local de invitado;
     no adjudicarlos ni subirlos automáticamente a quien inicia sesión.
   - Invalidar trabajo y sincronizaciones pendientes cuando cambia la cuenta.
   - Ante cuota agotada, informar fallo y conservar cambios pendientes.
   - Verificar cambio A → B → invitado y errores de escritura con regresiones.
2. **Resiliencia y acceso** — implementado; validación local aprobada, validación real pendiente.
   - Límites de tiempo en llamadas de IA y apagado aplicable a los routers.
   - Recuperación de contraseña y limpieza de contexto al cambiar de usuario.
   - Describir de manera precisa el envío de contenido a proveedores de IA.
3. **Auditoría de Supabase con CLI** — ejecutada; permisos corregidos y funciones desplegadas.
   - Confirmar proyecto `koptglmifwpzrfzvipnm`, historial real de migraciones,
     funciones desplegadas y nombres de configuración, sin imprimir secretos.
   - Preparar diferencias antes de aplicar cambios; comprobar permisos/RLS y
     operaciones de créditos con usuarios de prueba.
   - Registrar la decisión sobre permisos comerciales de la beta y los límites.
4. **Validación de entrega** — pruebas locales y API real aprobadas; publicación del frontend pendiente.
   - Ejecutar regresiones locales y comprobar composición/versionado del HTML.
   - Comprobar registro, recuperación, IA, guardado, reconexión y exportaciones
     reales DOCX/PDF con el motor publicado desde una instalación limpia.
   - Registrar versión/commit, resultado y límites de cada comprobación.
5. **Operación y apertura** — procedimiento preparado; ejecución real pendiente.
   - Documentar respaldo/restauración, reversión, errores y soporte.
   - Definir alcance y participantes de la beta cerrada.
   - Actualizar el informe con evidencia actual; publicar solo la versión
     verificada y registrar lo que aún no se pudo comprobar.

## Acceso CLI

Se usará `npx --yes supabase` (CLI disponible mediante npm). El inicio de sesión
se realiza en la terminal del usuario con
`npx --yes supabase login`; nunca se
pegan tokens o contraseñas en el chat ni se guardan en el repositorio.
Este comando actualiza la cuenta activa de la CLI. No usar
`--profile spacelab-beta`: en CLI 2.121.0 ese argumento intenta cargar un archivo
de configuración y falla con `Unsupported Config Type ""`.

## Evidencia inicial

- Auditoría previa: 45 archivos de pruebas JavaScript, 15 pruebas Deno,
  12 comprobaciones Python y dos pruebas de navegador aprobadas.
- Reproducidos: mezcla de borradores entre cuentas y `saveSession()` devolviendo
  éxito después de `QuotaExceededError`.
- Las validaciones anteriores son locales; no acreditan el despliegue remoto.

## Avance de esta implementación

- Sesiones, borrador y planificaciones usan espacios por cuenta. Los datos
  previos siguen en invitado y no se suben automáticamente a una cuenta.
- Cambio de cuenta limpia editor, alumnos, historial del chat y contexto
  pedagógico; descarta respuestas de IA/sincronización de la cuenta anterior.
- Guardado y autoguardado propagan errores de escritura. El indicador dice
  «Guardado local» o «Sin guardar» según el resultado; un fallo no vacía el editor.
- La sincronización conserva ediciones locales hechas mientras espera la red.
- Se implementó recuperación de contraseña con formulario de solicitud y de
  actualización al recibir el evento de recuperación de Supabase.
- Los routers verifican interruptores globales y por proveedor. Las llamadas
  tienen tiempo máximo y conservan el flujo existente de devolución de reservas.
- Se corrigieron las afirmaciones de privacidad sobre proveedores, secretos,
  archivos del motor y copias locales.
- Se añadieron regresiones de seguridad, recuperación y errores de escritura a CI.
- Validación acumulada aprobada: 46 archivos de pruebas JavaScript, 17 pruebas
  Deno y 38 comprobaciones Python (incluyen 20 pruebas de navegador). También
  pasaron el análisis Ruff y la comprobación de tipos de los cuatro endpoints
  de IA. Composición y versiones de assets están sincronizadas.
- El inventario remoto de solo lectura está en `scripts/beta_readiness_audit.sql`.
- El procedimiento de validación, respaldo y reversión está en
  `docs/BETA_OPERATIONS.md`; no se han ejecutado respaldos ni restauraciones.

### Acceso y límites de la verificación

Acceso administrativo confirmado por CLI 2.121.0 al proyecto correcto.
Se comprobaron las 17 migraciones previas y se aplicó una nueva:
`20261019221350_beta_privilege_hardening.sql`. Retira 81 permisos sobrantes y
la ejecución anónima de funciones internas; no cambia documentos ni usuarios.

Se probaron en la base real roles de docente y administrador, aislamiento de
filas, bloqueo de reasignación de propietario y escalada de perfil, y reserva,
consumo y reembolso idempotentes. Las pruebas SQL se revierten con ROLLBACK.
Las comprobaciones HTTP crearon dos cuentas temporales mediante la API de
administración, probaron acceso y documentos reales y eliminaron ambas cuentas.
No se enviaron correos ni se imprimieron/guardaron claves o tokens.

Funciones publicadas: ai-gateway v5, openai-router v19, gemini-router v16,
deepseek-router v23 y pablito-mailer v8. La configuración JWT se mantuvo.
Se guardó una copia del código anterior en `artifacts/beta-readiness/before-deploy`.
El mailer ya rechaza GET y las cinco funciones rechazan POST sin autenticación.

Se hizo una generación real corta con OpenAI `gpt-6-luna` a través del gateway:
HTTP 200, cero fallbacks y un crédito consumido. Repetir el identificador devolvió
409 y no volvió a consumir créditos. La clave existente de Supabase se reutilizó
según lo autorizado; no se crearon ni rotaron claves de proveedor.

Auditoría posterior: cero permisos sobrantes y cero funciones SECURITY DEFINER
ejecutables por anónimos. Persisten once avisos de funciones privilegiadas
accesibles a usuarios autenticados (operaciones con validaciones internas,
probadas en los casos cubiertos) y el aviso de protección de contraseñas filtradas.

La configuración pública de Auth declara `mailer_autoconfirm=true`. Antes de
abrir una beta cerrada se debe revisar la verificación de correo y el control
de altas/invitaciones, junto con la entrega real de mensajes de recuperación.
Decisión del usuario: beta abierta con registro público. Se conserva el registro
habilitado; no se desactivan altas ni se añade una lista de invitaciones.

El inventario de respaldos físicos está vacío y PITR está desactivado. No se
considera probado un respaldo/restauración. No se contrató un plan de pago ni
se modificó facturación. Los permisos comerciales siguen en observación
(`BILLING_ENFORCEMENT` no configurado); los créditos sí se validan en servidor.

Siguen pendientes la entrega real del correo de recuperación, la publicación y
validación del frontend actualizado, la decisión de acceso a la beta,
respaldo/restauración y validación del ejecutable descargado publicado.
El estado detallado se registra en `BETA_READINESS_19-10-2026.md`.

### Corrección adicional del motor PDF

La descarga oficial 1.4.0 coincide con la huella de GitHub, pero su SHA-256
publicado en la página era el de otra compilación. Al ejecutarla, Word funcionó
y el PDF canónico devolvió 422: el adaptador enviaba simultáneamente actividades
y procesos y el normalizador sobrescribía textos con objetos.
Se corrigió el adaptador, se añadió una regresión de normalización y una prueba
de PDF real del ejecutable al workflow de publicación. El código corregido ya
produjo un PDF canónico real de 188 345 bytes. La versión del motor pasa a 1.4.1;
su publicación debe esperar al build y comprobaciones de GitHub Actions.
