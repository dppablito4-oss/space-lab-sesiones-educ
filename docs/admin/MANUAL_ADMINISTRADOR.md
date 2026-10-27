# Manual del administrador

## Instalación y primer propietario

Este incremento todavía no está instalado en Supabase. Primero debe revisarse y aplicarse la migración en un proyecto de pruebas, con respaldo y comprobación de dependencias. No se promueve al primer registro ni se confía en los metadatos editables del usuario.

Incluye también la migración posterior `20261026024247_account_storage_boundary.sql`:
las cuentas suspendidas o bloqueadas no pueden listar, subir, reemplazar ni
borrar logos mediante acceso autenticado. Una restricción vencida permite
operar de nuevo. Los archivos ya publicados en el bucket público conservan
sus URLs públicas; suspender una cuenta no cambia la privacidad del bucket.

Para una instalación nueva, un operador autorizado verifica el UUID y correo de una cuenta Auth existente. En SQL Editor, con contexto privilegiado, puede promover **esa cuenta concreta** a `superadmin`. Sustituye el UUID y correo antes de ejecutar:

```sql
BEGIN;
-- Inspeccionar el resultado y comprobar identidad antes de promover.
SELECT id, email FROM auth.users WHERE id = 'UUID_VERIFICADO'::uuid;
UPDATE public.profiles SET role = 'superadmin'
WHERE id = 'UUID_VERIFICADO'::uuid AND email = 'CORREO_VERIFICADO';
-- Comprobar que cambió exactamente la cuenta esperada antes de COMMIT.
COMMIT;
```

El trigger conserva la sincronización de app_metadata. No habilitar un RPC público de promoción. Los propietarios existentes se conservan. Esta operación no se ejecutó durante la validación.

## Uso

Accede primero por el ingreso normal de Space Lab y después a `admin.html`. El servidor decide los permisos. Si falta la migración, el panel lo indica y no inventa datos ni usa el panel antiguo como alternativa.

Las consultas se permiten según el rol. Para modificar datos, verifica el segundo factor con una aplicación TOTP. Si ya existe un factor verificado se utiliza ese; si no existe, el panel permite enrolarlo. El QR solo se mantiene en memoria mientras verificas el código. No lo compartas.

- **Usuarios:** busca por correo, nombre o UUID y abre la ficha. Elige activo, suspendido o bloqueado. Puedes restringir solo la IA o congelar el uso de créditos; la caducidad es opcional. La suspensión afecta operaciones SaaS, no borra cuentas Auth ni archivos descargados.
- **Créditos:** introduce una variación positiva o negativa, con motivo. Revisa el saldo esperado y confirma escribiendo el correo de destino. Ante una respuesta perdida, reintenta la misma confirmación. Ante un saldo obsoleto, cancela, actualiza y prepara otro ajuste.
- **Planes:** asigna un plan activo de forma manual desde la ficha. Respeta los triggers de grants existentes. Las suscripciones de pasarela no se sobrescriben. No se hacen cobros desde este incremento.
- **Cuotas:** configura solicitudes por minuto, créditos diarios y concurrencia del plan. Los límites globales también siguen vigentes.
- **Beta:** pausa nuevas generaciones o registros y cambia los límites globales de presupuesto, concurrencia y altas. La nota operativa es interna; no es un banner docente. La pausa no cancela solicitudes ya iniciadas ni deshabilita la edición y exportación locales.
- **Auditoría:** consulta fecha, operador, destino, motivo y resultado. Las cuotas y configuración registran valores anteriores y posteriores. El navegador no puede borrar eventos.
- **Equipo:** el propietario puede delegar o retirar roles de consulta, con vencimiento opcional. No permite promover nuevos propietarios ni administradores desde el perfil.

## Configuraciones pendientes y recuperación

Modelos/proveedores, prompts, precios versionados, cobros, comunicaciones y mantenimiento completo de la aplicación siguen pendientes. Se configuran mediante los mecanismos existentes del despliegue, no desde botones ficticios.

Para recuperar límites anteriores, consulta el evento de auditoría y prepara un cambio nuevo con los valores anteriores y la versión actual. Esto conserva la trazabilidad. No restaures el panel antiguo sobre esta migración: sus permisos y RPCs absolutos se han retirado. Un rollback de esquema requiere una migración revisada que preserve el ledger y la auditoría.

## Validación y despliegue

`npm ci --ignore-scripts`, `npm run build:public`, `npm run test:admin:db` y `.venv\Scripts\python.exe tests/ui_admin_smoke.py`. En Linux usa el Python del entorno. El test de navegador necesita Chromium de Playwright.

Antes de producción: ejecutar en Supabase de pruebas con cuentas desechables, enrolar MFA real, verificar el hook Auth configurado, límites, reservas/reembolsos y concurrencia de varias conexiones. Revisar el PR, hacer respaldo y coordinar migración, Edge Functions y frontend. No fusionar automáticamente: main publica mediante Pages. Esta entrega no aplicó migraciones remotas ni hizo un despliegue.
