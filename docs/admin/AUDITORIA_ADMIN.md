# Auditoría administrativa

Fecha: 24 de octubre de 2026. Rama `feature/admin-control-center`.

## Base comprobada

- Frontend estático en GitHub Pages. Creación docente en React 19/TypeScript/Vite; formularios, documentos, Auth y biblioteca mantienen controladores JavaScript. `admin.html` y `js/admin.js` constituyen el Panel Maestro actual.
- Supabase Auth; perfil y rol en `profiles`, protegidos por migraciones. El navegador usa una clave pública; los secretos de proveedores permanecen en Edge Functions.
- Créditos: `ai_credit_wallets`, `credit_grants`, `credit_ledger`, `ai_usage`; reserva, finalización y compensación atómicas. La contabilidad expuesta al gateway ya se restringe al servidor.
- Comercial: `subscription_plans`, `plan_entitlements`, `subscriptions`, `subscription_credit_policies`; cuotas técnicas separadas en `ai_quota_policies`. No se ha verificado una pasarela de cobros activa.
- IA: gateway y routers OpenAI/Gemini/DeepSeek; catálogo y prompts en funciones compartidas, controles por variables del despliegue y límites operativos de beta.
- Sesiones y planificaciones guardadas en Supabase; contratos SessionDocument v1 y PlanningContainer v2. Word/PDF funcionan mediante un motor Python local autenticado con un token de vinculación.
- CI: regresiones Node, Python/Playwright, Deno, composición de HTML y hashes; Pages publica desde main. No se modifica main ni se despliega en esta entrega.

## Hallazgos prioritarios

1. `fetchServerSessions` intenta borrar documentos eliminados hace siete días al consultar la pestaña. Una consulta administrativa no debe producir borrados.
2. Esa consulta descarga todas las sesiones y su contenido privado; tampoco pagina perfiles. Debe sustituirse por metadatos paginados en el servidor.
3. Roles admin/superadmin y RPCs ya protegen operaciones, pero no hay una matriz operativa granular ni una auditoría administrativa independiente e inmutable para los clientes.
4. El ajuste visible fija un saldo absoluto: hace falta un flujo por delta, motivo, saldo esperado y clave de idempotencia, conservando el cálculo transaccional existente.
5. El navegador no puede configurar directamente Supabase Auth, ejecutar comandos o leer secretos de infraestructura. Esas funciones no deben presentarse como operativas sin una integración autorizada.
6. No hay evidencia suficiente para inventar DAU/MAU, ingresos, retención o estado global del motor instalado en cada computadora. Deben declararse no disponibles.
7. El trigger de perfil exime a los administradores de proteger campos: pueden promover su propio perfil a superadmin. La migración nueva retira esa excepción y añade límites restrictivos para impedir acceso directo a contenido ajeno.

## Límites de esta auditoría

La inspección es de código y migraciones versionadas, más las validaciones existentes de la sesión. No se ha aplicado ninguna migración administrativa nueva al proyecto público ni se han consultado documentos privados de docentes. La integración SQL y la interfaz se validarán con datos sintéticos aislados.
