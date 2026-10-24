# Estado de implementación

Fecha: 24 de octubre de 2026. Primer incremento en `feature/admin-control-center`.

**Implementado en código y probado en un entorno aislado:** entrada y bundle administrativos independientes; identidad original; temas claro/oscuro; móvil; permisos por rol; consultas reales paginadas; ledger de créditos; confirmación y MFA; operaciones idempotentes; restricciones; asignaciones manuales de planes; cuotas; pausa de nuevas generaciones y registros; presupuestos; auditoría; operadores delegados de consulta. La aplicación docente conserva su bundle y sus contratos.

La fase 0 está documentada. La base de la fase 1 y las operaciones principales de la fase 2 están implementadas, pero su aceptación para beta queda condicionada a las pruebas de Supabase real y concurrencia nativa. No se considera terminada la totalidad del prompt maestro.

**Pendiente:** enrolamiento real MFA en staging; despliegue coordinado y prueba real de las funciones; concurrencia de varias conexiones; revocación global de sesiones Auth; mantenimiento integral y banner docente; edición/versionado de planes y precios; pagos; proveedores/modelos/prompts administrables; currículo y plantillas; soporte; comunicaciones con auditoría integral; analítica instrumentada; infraestructura y operadores avanzados. Sus módulos se presentan como pendientes.

El presupuesto es estimado a partir de telemetría disponible. Ingresos y usuarios activos se muestran sin datos. No se ofrecen métricas inventadas ni gestión de secretos en el navegador.

**Pruebas:** suite PostgreSQL/RLS y recorrido GUI integrado aprobados; 50 suites Node y 27 pruebas Deno aprobadas. La regresión Python/Playwright aprobó 47 de 48 suites en la primera ejecución; la restante pasó al repetirla, en los cuatro anchos del creador. La nueva suite GUI administrativa también pasó. Ese primer timeout de carga se registra como intermitencia y no como cambio funcional corregido. Ruff, TypeScript, compilaciones y composición/versionado del HTML aprobados.

No se aplicó la migración a Supabase público, no se modificaron clientes reales y no se publicó el panel. La autorización previa para actualizar la interfaz docente no se usa para desplegar este centro.
