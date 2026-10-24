# Modelo de datos

La migración `20261024224011_admin_control_center.sql` es incremental sobre el baseline y las migraciones existentes. No se aplicó al proyecto público durante el desarrollo.

| Tabla privada nueva | Finalidad |
|---|---|
| admin_permissions / admin_role_permissions | Catálogo de permisos y asignaciones a roles |
| admin_operator_roles | Delegaciones de consulta con expiración opcional |
| admin_account_controls | Estado de cuenta, restricción de IA, congelamiento del uso de créditos y versión |
| admin_operations | Idempotencia: identificador, operador, parámetros y resultado transaccional |
| admin_audit_events | Registro de operaciones administrativas, motivo y cambios |
| admin_runtime | Interruptor global de nuevas generaciones, nota interna y versión |

Se añade `signups_enabled` a `private.beta_limits`. Los demás límites y el salt existente se conservan; el salt no se devuelve a los clientes.

Los saldos permanecen en `credit_grants`, con movimientos en `credit_ledger` y proyección en `ai_credit_wallets`. Los ajustes reutilizan el setter transaccional existente después de tomar el mismo lock de billetera que las reservas. No se crea otro saldo.

Los planes se asignan en `subscriptions`; sus triggers mantienen el ciclo de créditos existente. No se modifican suscripciones gestionadas por una pasarela. Las cuotas permanecen en `ai_quota_policies`.

La migración mueve funciones internas al esquema privado y mantiene las firmas públicas de contabilidad, hook de registros y roster. Sus envoltorios comprueban las restricciones. Las respuestas y reembolsos de generaciones en curso continúan disponibles para el servidor.

RLS restrictiva limita documentos, planificaciones, alumnos y perfiles a su titular, incluso para administradores. Las consultas administrativas autorizadas acceden a campos acotados mediante RPC; nunca a `session_data` o al contenido de planificaciones. Los perfiles tampoco permiten autoascensos desde una cuenta admin.
