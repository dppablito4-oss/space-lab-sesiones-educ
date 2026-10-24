# Plan de pruebas

## Automatización aislada

- `tests/admin_database.test.mjs`: aplica el baseline y todas las migraciones incrementales de aplicación a PostgreSQL/PGlite, con roles Auth de prueba. Omite únicamente el rol de respaldo de infraestructura. Verifica permisos, RLS, bloqueo de autoascenso, claims falsificados, acceso directo denegado, MFA, créditos/ledger, idempotencia, versiones obsoletas, límites, planes manuales, delegaciones, hook Auth y auditoría protegida. Se usa UTC, como el entorno Supabase esperado.
- `tests/ui_admin_smoke.py`: sirve el bundle compilado y conecta las RPC del navegador con ese mismo PostgreSQL aislado. Prueba consulta real, ajuste de créditos, pérdida de respuesta y reintento sin doble crédito, auditoría, pausa de IA, móvil, temas, cierre de sesión, cuenta sin permisos y backend sin migración. Solo Auth/MFA son fixtures; no acredita enrolamiento real de Supabase.
- Regresiones existentes Node/Python/Deno: contratos, unidades, sesiones, persistencia, límites, gateway y exportaciones Word/OMML/PDF. CI también comprueba que el HTML y ambos bundles coinciden con sus fuentes.
- Capturas locales: `artifacts/admin-validation/desktop-dark.png`, `desktop-light.png`, `mobile-light.png` (ignoradas por Git).

## Verificaciones antes de instalar públicamente

1. Aplicar la migración a un Supabase de pruebas con respaldo y cuentas desechables. No probar restricciones con clientes reales.
2. Confirmar Auth, sesión compartida, expiración, segundo factor real, rechazo AAL1 y acceso tras cerrar/cambiar de cuenta.
3. Hacer dos ajustes simultáneos y una reserva compitiendo contra un ajuste, usando varias conexiones nativas. Verificar ausencia de saldo negativo o duplicado y correspondencia con grants/ledger.
4. Confirmar asignación de planes con los códigos usados por la cuenta, expiración y reversión. Verificar que una suscripción de pasarela se rechaza.
5. Verificar Edge Functions desplegadas junto con la migración: cuenta restringida, IA pausada, presupuestos, registro cerrado y reembolsos de solicitudes en curso.
6. Comprobar que el hook Before User Created apunta a la función configurada y que su pausa cierra registros nuevos.
7. Repetir un flujo docente de generación, guardado, recuperación y exportación desde ese entorno de pruebas.
8. Revisar lectores de pantalla, contraste, teclado y tabla desplazable en dispositivos adicionales. El smoke no sustituye una auditoría de accesibilidad completa.

Ninguna prueba local afirma haber realizado cobros, envíos o cambios administrativos en producción.
