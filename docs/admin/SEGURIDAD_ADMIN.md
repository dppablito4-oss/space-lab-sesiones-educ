# Seguridad administrativa

La autoridad se consulta en perfiles protegidos y delegaciones privadas, en cada operación. No se autorizan acciones mediante user_metadata ni mediante un rol enviado por el cliente. La cuenta propietaria está protegida frente a suspensión y autoascenso; los administradores ordinarios tampoco pueden restringir a sus pares.

Las escrituras administrativas requieren AAL2/MFA y un permiso específico. La confirmación del navegador añade revisión humana; no sustituye los controles del servidor. No se registra el QR, código TOTP ni credenciales. Los endpoints antiguos del mailer comprueban ahora permiso de propietario activo y exigen MFA para escrituras; su despliegue debe coordinarse con la migración.

Las tablas nuevas están en private, con RLS y sin permisos para el navegador. Las funciones SECURITY DEFINER fijan search_path y las RPC tienen ACL explícitas. Las funciones internas de crédito y roster se retiran de la API pública. Las funciones públicas de contabilidad siguen siendo exclusivas de service_role, y el hook de registro, de supabase_auth_admin.

Los eventos administrativos son inmutables para clientes. No son resistentes frente a un propietario de la base de datos que ejecute SQL privilegiado. Los registros operativos antiguos no sustituyen este registro. Las operaciones heredadas de correo quedan fuera de las acciones del centro; su migración a auditoría integral se mantiene pendiente junto con comunicaciones.

Se eliminó el panel antiguo que descargaba contenido y purgaba documentos al consultar. Las políticas restrictivas impiden a administradores leer o mutar documentos de otros docentes mediante llamadas directas a las tablas. No se consulta contenido para construir métricas.

Las restricciones de cuentas se comprueban en acceso de datos, reemplazo de roster y contabilidad del servidor. También se comprueban al iniciar solicitudes del gateway; los reembolsos y finalizaciones en curso permanecen disponibles. Esto no equivale a revocar todos los JWT de Auth, borrar usuarios, bloquear archivos offline ni anular una solicitud ya iniciada.

La suspensión también bloquea lecturas directas del historial financiero, uso, solicitudes y registros operativos. El helper heredado `is_admin` exige una cuenta activa: un administrador suspendido no conserva acceso a registros por las políticas antiguas. El test SQL verifica explícitamente ese caso.

Los cambios usan locks de fila, claves de idempotencia y versiones/saldos esperados. Las pruebas PGlite verifican semántica transaccional y repetición de solicitudes, pero no sustituyen una prueba de contención con varias conexiones a Postgres nativo.

Antes de habilitarlo en producción faltan las pruebas reales de Supabase Auth/MFA y concurrencia indicadas en PLAN_PRUEBAS. No hay autorización de cobros, emails masivos ni sanciones contra usuarios reales como parte de esta validación.
