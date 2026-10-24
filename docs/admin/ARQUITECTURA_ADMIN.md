# Arquitectura administrativa

## Componentes

- Entrada estática independiente en `admin.html`, con un bundle React propio y el cohete original. Comparte el origen y Supabase Auth; no añade un servidor web Node ni reemplaza el panel docente.
- Cliente administrativo tipado y componentes por módulo. La autorización del navegador solo decide presentación; cada operación exige permiso nuevamente en Postgres.
- RPCs administrativas con contratos acotados: contexto, métricas verificables, usuarios paginados, detalle, ajustes de créditos, restricciones, asignación manual de planes, cuotas y controles de IA, auditoría.
- RLS y permisos explícitos. La cuenta propietaria deriva del superadmin existente; no se promueve automáticamente al primer usuario ni se usa user_metadata para autorizar.
- Operaciones de escritura con motivo, MFA/AAL2, concurrencia optimista e idempotencia. Un registro administrativo y el cambio se confirman en la misma transacción.
- La contabilidad reutiliza las funciones y tablas del ledger; no crea otro saldo. Las restricciones se comprueban en las reservas del servidor y las políticas de acceso de datos, incluso con un JWT previamente emitido.

## Separaciones

Plan comercial, cuota técnica, saldo, permisos administrativos y límites globales son conceptos distintos. Un administrador no puede superar con un ajuste los topes de infraestructura configurados en el despliegue.

Los contenidos privados, claves de IA, contraseñas SMTP, parámetros de gestión de Supabase y tarjetas no forman parte de las respuestas administrativas generales. El listado de generaciones devuelve metadatos.

La suspensión operativa de Space Lab no equivale a borrar un usuario de Auth. Revocación global de sesiones de Auth, correos, pagos y configuración del proyecto requieren integraciones específicas antes de habilitar sus botones.

## Distribución

Los bundles de administración y docencia se generan separadamente y se versionan por contenido. El panel debe mostrar un estado de migración pendiente si el backend correspondiente no está instalado; no simular datos ni recuperar permisos mediante rutas antiguas.

El motor Word/PDF conserva su funcionamiento local. Restringir el servicio SaaS no retira archivos descargados ni garantiza impedir exportaciones offline ya disponibles.
