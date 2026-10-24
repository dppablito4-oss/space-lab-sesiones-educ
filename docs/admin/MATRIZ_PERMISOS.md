# Matriz de permisos

La validación definitiva pertenece al servidor. El superadmin existente actúa como propietario; no se modifica su identidad. Las asignaciones nuevas tienen expiración opcional y no permiten autoescalamiento.

| Operación | Propietario | Admin | Soporte | Finanzas | Analista | Auditor |
|---|---|---|---|---|---|---|
| Métricas agregadas | Sí | Sí | No | Sí | Sí | Sí |
| Usuarios y estado | Sí | Sí | Sí | No | No | Lectura |
| Saldo e historial de créditos | Sí | Sí | Sí | Sí | No | Lectura |
| Ajustar créditos con motivo | Sí | Sí | No | No | No | No |
| Restringir cuentas ordinarias | Sí | Sí | No | No | No | No |
| Consultar planes y cuotas | Sí | Sí | Sí | Sí | Sí | Sí |
| Asignar plan manual | Sí | Sí | No | No | No | No |
| Modificar cuotas/control IA | Sí | Sí | No | No | No | No |
| Consultar auditoría | Sí | Sí | No | No | No | Sí |
| Administrar operadores | Sí | No | No | No | No | No |
| Leer contenido docente privado | No por defecto | No por defecto | No | No | No | No |

Las escrituras requieren AAL2/MFA y confirmación del cambio, además del permiso. No se pueden suspender propietarios ni el propio operador. Gestión avanzada de operadores y acceso extraordinario a contenido requieren un incremento específico; no se habilitan solamente por aparecer aquí.
