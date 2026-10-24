# API administrativa v1

Todas las llamadas se realizan con el JWT del usuario, mediante el cliente Supabase ya existente. El navegador no recibe claves privilegiadas.

| RPC | Argumentos | Resultado |
|---|---|---|
| admin_cc_context | Ninguno | userId, permissions, mfa, version |
| admin_cc_read | p_resource, p_query JSON | Página acotada o detalle según recurso |
| admin_cc_write | p_request_id UUID, p_action, p_target UUID/null, p_payload JSON | Resultado del cambio; `replayed: true` si se reintenta |

Recursos: `overview`, `users`, `user`, `credits`, `creditAccount`, `plans`, `quotas`, `generations`, `runtime`, `audit`, `operators`. Las listas de usuarios/créditos/actividad/auditoría tienen limit de 1 a 100, offset de 0 a 100000 y búsqueda acotada. El período de actividad es de 1 a 366 días. Los catálogos y operadores son listas completas de configuración, no documentos de usuarios.

Acciones:

| Acción | Payload además de reason |
|---|---|
| credits.adjust | delta, expectedBalance |
| users.restrict | state, restrictAi, freezeCredits, expiresAt, version |
| plans.assign | planCode, expiresAt, expectedUpdatedAt |
| quotas.update | planCode, requestsPerMinute, dailyCredits, maxConcurrent, expectedUpdatedAt |
| runtime.update | version, aiEnabled, message, dailyCredits, dailyEstimatedUsd, maxConcurrent, signupsEnabled, signupsPerHour, signupsPerDay, signupsPerIpHour |
| operators.assign | role, expiresAt, remove |

`reason` es obligatorio, de 8 a 300 caracteres. Se rechazan campos desconocidos. Los cambios requieren permiso y AAL2, incluso si se llama directamente al RPC. Fechas opcionales vacías equivalen a sin caducidad; la interfaz convierte fechas locales a ISO con zona horaria.

Un UUID de operación pertenece a un operador, acción, destino y payload exactos. Debe conservarse al reintentar tras una respuesta perdida. Cambiar parámetros requiere un UUID nuevo. El cambio, resultado y auditoría se confirman juntos.

Errores relevantes: `ADMIN_PERMISSION_DENIED`, `MFA_REQUIRED`, `STALE_BALANCE`, `STALE_CONTROL`, `STALE_CONFIG`, `STALE_QUOTA`, `STALE_SUBSCRIPTION`, `IDEMPOTENCY_CONFLICT`, `PROTECTED_OWNER`, `PROTECTED_OPERATOR`, `PAYMENT_PROVIDER_MANAGED`. Ante datos obsoletos se debe actualizar y preparar una propuesta nueva; no repetir a ciegas.

Los clientes docentes reciben `ACCOUNT_RESTRICTED` (403) o `AI_DISABLED` (503) desde la contabilidad del servidor. Las firmas anteriores de contabilidad y del hook Auth se preservan. Las credenciales SMTP y el salt de registro nunca forman parte de estos contratos.
