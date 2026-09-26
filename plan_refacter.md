# Space Lab — Plan de refactor hacia arquitectura SaaS

**Repositorio auditado:** `dppablito4-oss/space-lab-sesiones-educ`  
**Rama:** `main`  
**Commit base:** `d8e19704bbb02635dd0a52211a1e69ebc2496f1f`  
**Fecha del commit:** 2026-09-26 02:19:22 UTC  
**Objetivo del documento:** convertir el producto actual, que ya genera sesiones útiles y exportables, en una base SaaS monetizable sin reescribir ni romper el núcleo pedagógico.

---

## Estado de ejecución — 2026-09-26

```text
FASE 0  baseline y regresión                    PARCIAL
FASE 1  identidad de modelos                    AVANZADA
FASE 2  telemetría económica                    PARCIAL
FASE 3  plans + entitlements                    IMPLEMENTADA
FASE 4  enforcement                             SHADOW SEGURO
FASE 5  credit grants + ledger                  IMPLEMENTADA
FASE 6  AI Gateway                              V1 DESPLEGADA
FASE 7  panel SaaS                              INICIAL
FASE 8  billing                                 PENDIENTE
FASE 9  beta ampliada                           PENDIENTE
```

La interfaz invoca únicamente `ai-gateway` y solicita niveles de calidad. El gateway decide proveedor/modelo, respeta kill switches, conserva routers legacy para rollback y registra `requested_quality` y `route_reason` en `ai_usage`.

Pendiente para cerrar Fase 6: fallback transaccional entre proveedores, pruebas PostgreSQL de integración y retiro gradual del acceso directo a routers legacy después de 1–2 releases estables.

---

## 0. Decisión arquitectónica principal

Space Lab **no debe reescribirse**. El sistema de sesiones ya es el producto validado y debe tratarse como un núcleo estable.

El refactor debe seguir una estrategia tipo **Strangler / envoltura progresiva**:

```text
ANTES

Frontend
   ↓
Controladores de sesión
   ↓
Routers IA
   ↓
Proveedor


OBJETIVO

Frontend
   ↓
SaaS/Application Gateway
   │
   ├── identidad
   ├── workspace
   ├── plan comercial
   ├── entitlements
   ├── cuotas/créditos
   ├── rate limits
   ├── AI routing
   ├── usage metering
   ├── cost accounting
   └── auditoría
          ↓
Núcleo pedagógico existente
          ↓
SessionDocument v1
          ↓
Exportación actual
```

La regla durante todo el trabajo será:

> **Cada fase debe dejar funcionando el flujo actual de crear → revisar → exportar/imprimir una sesión.**

No se debe hacer una PR gigantesca que mezcle pagos, UX, modelos, base de datos y módulos pedagógicos.

---

# 1. Estado actual verificado del repositorio

El proyecto está bastante más avanzado de lo que sería un MVP inicial. El commit auditado ya contiene una parte de la infraestructura que necesitamos para SaaS, por lo que **no partimos de cero**.

## 1.1 Frontend

Actualmente existe:

- SPA estática alojable en GitHub Pages.
- Landing dentro de `index.html` y lógica en `js/landing.js`.
- Editor por etapas para sesiones.
- autenticación con Supabase.
- perfiles de usuario.
- panel administrativo.
- selector de modelos/proveedores IA.
- carga de archivos de referencia.
- almacenamiento/sincronización de sesiones.
- indicador de créditos IA.
- temas claro/oscuro/sistema.

Archivos relevantes:

```text
index.html
admin.html
js/app.js
js/auth-ui.js
js/supabase-client.js
js/ai-copilot.js
js/ai-credit-ui.js
js/controllers/ai-controller.js
js/controllers/session-controller.js
js/controllers/export-controller.js
```

## 1.2 Núcleo pedagógico

Existe un contrato canónico explícito:

```text
schemas/session-document.v1.schema.json
js/ai/session-validator.js
js/ai/session-adapter.js
backend/models/...
```

`SessionDocument v1` debe considerarse **estable core**. No debe mezclarse con conceptos comerciales como plan, precio, créditos o suscripción.

## 1.3 Exportación

Existe un motor local FastAPI/Python para DOCX/PDF de alta fidelidad:

```text
backend/main.py
backend/docx_builder_v1.py
backend/word_math.py
js/services/local-export-client.js
```

Esto es una ventaja del producto y no debe tocarse como parte del refactor SaaS salvo para autenticación/telemetría opcional o compatibilidad futura.

## 1.4 Backend de IA

Ya existen Edge Functions separadas por proveedor:

```text
supabase/functions/openai-router/
supabase/functions/gemini-router/
supabase/functions/deepseek-router/
supabase/functions/_shared/
```

También existen:

- autenticación server-side;
- reserva atómica de créditos;
- devolución de créditos en fallo;
- registro de tokens;
- rate limit por plan;
- límites diarios;
- acciones tipadas (`generate_session`, `generate_criteria`, etc.).

## 1.5 Sistema actual de créditos

El proyecto ya contiene:

```text
ai_plans
ai_action_costs
ai_credit_wallets
ai_usage
```

Y RPCs como:

```text
reserve_ai_credits(...)
complete_ai_usage(...)
refund_ai_usage(...)
```

Esto es una **muy buena base operacional**, pero todavía no debe confundirse con un sistema completo de monetización.

Actualmente el plan sembrado es básicamente:

```text
free
├── monthly_credits
├── daily_credit_limit
└── requests_per_minute
```

El sistema actual sirve para controlar consumo de IA, pero todavía no modela correctamente:

- suscripciones comerciales;
- prepago;
- créditos promocionales;
- rollover;
- instituciones;
- permisos por funcionalidad;
- pagos;
- facturas/eventos de cobro;
- recomendaciones de plan;
- costos monetarios reales de cada request.

---

# 2. Hallazgos críticos antes de monetizar

## P0-01 — El modelo mostrado y el modelo realmente llamado no coinciden

En el commit auditado, `openai-router` acepta etiquetas como:

```text
gpt-6-luna
gpt-6-sol
gpt-6-astra
gpt-5.6-luna
gpt-5.4-mini
```

pero internamente las mapea a:

```text
gpt-6-luna    -> gpt-4o-mini
gpt-6-astra   -> gpt-4o
gpt-6-sol     -> gpt-4o
gpt-5.6-luna  -> gpt-4o
gpt-5.4-mini  -> gpt-4o-mini
```

Asimismo, la UI identifica `gemini-2.5-flash`, mientras el Edge Function usa actualmente:

```text
gemini-2.0-flash
```

Esto debe corregirse **antes de cobrar por diferencias entre modelos**.

No se debe vender una modalidad como “Astra”, “Sol” o “2.5 Flash” si la llamada real está siendo procesada por otro identificador.

### Solución

Separar tres conceptos:

```text
user_mode      = fast | balanced | max_quality | automatic
provider       = openai | google | deepseek
provider_model = identificador REAL de la API
```

La interfaz comercial debería mostrar principalmente el **modo**, no nombres técnicos.

Los nombres de modelo reales deben permanecer en configuración/admin/telemetría.

---

## P0-02 — La selección de modelo todavía está demasiado controlada por el cliente

Hoy el frontend resuelve el modelo y envía algo parecido a:

```json
{
  "action": "generate_session",
  "model": "gpt-6-sol"
}
```

El servidor valida una allowlist, pero no existe todavía una política completa de:

```text
plan -> feature -> calidad máxima -> modelo permitido
```

Con monetización, el navegador nunca debe decidir por sí solo usar el modelo más caro.

### Objetivo

El cliente debería mandar:

```json
{
  "action": "generate_session",
  "quality": "automatic",
  "input": { ... }
}
```

Y el servidor decidir:

```text
plan + entitlement + action + complejidad + disponibilidad + coste
                           ↓
                    provider/model real
```

---

## P0-03 — El wallet actual no soporta correctamente el modelo híbrido suscripción + prepago

El sistema actual trata `balance` como un único saldo y reinicia el ciclo según `monthly_credits`.

Eso es suficiente para una beta gratuita, pero crea un problema grave si introducimos créditos comprados.

Ejemplo:

```text
Plan mensual: 50 créditos
Compra adicional: 30 créditos
Saldo total: 65

llega nuevo ciclo
```

No podemos simplemente hacer:

```text
balance = 50
```

porque destruiríamos créditos prepago ya pagados.

Tampoco debemos limitar devoluciones con `LEAST(monthly_credits, ...)` una vez existan saldos de distinto origen.

### Solución

Migrar gradualmente de un único balance a **grants/ledger de créditos**.

Cada crédito debe tener origen:

```text
subscription
prepaid
promotion
referral
birthday
admin
beta
refund
```

Y opcionalmente expiración distinta.

---

## P0-04 — `ai_usage` mide tokens, pero aún no mide economía real

Hoy se guarda:

```text
provider
model
credits
input_tokens
output_tokens
status
```

Falta almacenar un **snapshot de costo real**.

No queremos reconstruir el costo histórico dentro de seis meses usando precios actuales.

Cada request finalizada debería registrar:

```text
input_tokens
output_tokens
cached_input_tokens (si existe)
provider_cost_usd
provider_price_version
latency_ms
error_code
retry_count
route_reason
```

Así podremos responder:

> ¿Cuánto me cuesta realmente un docente activo al mes?

---

## P0-05 — `ai_plans` no debe convertirse directamente en la tabla de planes comerciales

`ai_plans` hoy representa una política operacional de créditos/rate limit.

Un plan comercial necesita además:

- precio;
- moneda;
- periodicidad;
- disponibilidad;
- features;
- exportación;
- unidades/proyectos;
- almacenamiento;
- límites de miembros;
- créditos incluidos;
- soporte;
- etc.

Por eso **no conviene inflar `ai_plans` con 30 columnas**.

Mantener separado:

```text
subscription_plans   = lo que compra el usuario
plan_entitlements    = lo que puede hacer
ai_quota_policies    = límites técnicos IA
```

Durante la migración, `ai_plans` puede actuar como `ai_quota_policies` legacy.

---

# 3. Arquitectura SaaS objetivo

```text
                         ┌────────────────────────┐
                         │      FRONTEND WEB      │
                         │ docente / practicante  │
                         └───────────┬────────────┘
                                     │ JWT
                                     ▼
                         ┌────────────────────────┐
                         │  APPLICATION GATEWAY   │
                         │ / Edge Functions       │
                         └───────────┬────────────┘
                                     │
          ┌──────────────────────────┼───────────────────────────┐
          │                          │                           │
          ▼                          ▼                           ▼
 ┌────────────────┐       ┌──────────────────┐       ┌─────────────────┐
 │ ENTITLEMENTS   │       │ USAGE / CREDITS  │       │ BILLING STATE   │
 │ qué puede usar │       │ cuánto consume   │       │ qué compró      │
 └───────┬────────┘       └─────────┬────────┘       └────────┬────────┘
         │                          │                         │
         └───────────────┬──────────┴─────────────┬──────────┘
                         ▼                        ▼
                ┌────────────────┐       ┌────────────────┐
                │   AI GATEWAY   │       │ PRODUCT CORE   │
                │ server-side    │       │ SessionDocument│
                └───────┬────────┘       └────────────────┘
                        │
             ┌──────────┼───────────┐
             ▼          ▼           ▼
          OpenAI      Gemini     DeepSeek
```

---

# 4. Principios obligatorios del refactor

## 4.1 El núcleo pedagógico no conoce el negocio

Incorrecto:

```js
if (user.plan === 'pro') {
   generateSession();
}
```

Correcto:

```text
request
  ↓
authorizeFeature("session.generate")
  ↓
consumeCredits(...)
  ↓
generateSessionCore(...)
```

## 4.2 El frontend nunca es fuente de verdad para cuotas

La UI puede mostrar créditos, pero:

```text
PostgreSQL + Edge Functions = autoridad
```

No `localStorage`.

## 4.3 Los precios de IA no se hardcodean en el navegador

Todo costo y routing debe quedar server-side.

## 4.4 Créditos comerciales != tokens del proveedor

El usuario ve:

```text
1 sesión = X créditos Space Lab
```

Space Lab internamente ve:

```text
18,340 input tokens
4,220 output tokens
$0.00xx provider cost
```

## 4.5 El proveedor es reemplazable

Una sesión no debe depender conceptualmente de OpenAI, Gemini o DeepSeek.

El producto vende una capacidad pedagógica, no una llamada a una marca de modelo.

## 4.6 Todo cambio debe ser migrable y reversible

Usar:

- migrations incrementales;
- feature flags;
- modo shadow;
- rollouts por porcentajes o usuarios beta;
- nunca cambios destructivos tempranos.

---

# 5. Modelo de dominio comercial propuesto

## 5.1 `subscription_plans`

Representa el producto que se vende.

```sql
subscription_plans
- id uuid/text pk
- code text unique           -- free, teacher, pro, institution
- name text
- description text
- billing_period text        -- none, monthly, yearly
- price_minor int            -- céntimos
- currency text              -- PEN, USD
- active boolean
- public boolean
- version int
- created_at
- updated_at
```

No guardar lógica de features directamente aquí.

---

## 5.2 `plan_entitlements`

Feature flags comerciales por plan.

```sql
plan_entitlements
- plan_id
- feature_key
- enabled boolean
- limit_value numeric nullable
- metadata jsonb
```

Feature keys iniciales:

```text
session.generate
session.save
session.export_docx
session.export_pdf
ai.chat
ai.attach_file
ai.quality_balanced
ai.quality_max
planning.unit
planning.experience
planning.project
resource.worksheet
resource.assessment
resource.presentation
portfolio.practice
workspace.members
custom.templates
```

No usar lógica dispersa como:

```js
if (plan === "pro")
```

Siempre consultar entitlement.

---

## 5.3 `subscriptions`

Estado comercial del usuario/workspace.

```sql
subscriptions
- id uuid pk
- owner_type       -- user | organization
- owner_id uuid
- plan_id
- status           -- trialing | active | past_due | canceled | expired
- provider         -- manual | mercadopago | stripe | ...
- provider_customer_id nullable
- provider_subscription_id nullable
- current_period_start
- current_period_end
- cancel_at_period_end boolean
- created_at
- updated_at
```

Durante beta puede existir:

```text
provider = manual
plan = beta_teacher
```

sin integrar pagos todavía.

---

# 6. Sistema de créditos preparado para suscripción + prepago

## 6.1 Mantener temporalmente `ai_credit_wallets`

No eliminarlo ahora.

Se mantiene como **snapshot rápido de saldo** mientras introducimos ledger/grants.

## 6.2 Añadir `credit_grants`

```sql
credit_grants
- id uuid pk
- owner_id uuid
- source_type      -- subscription | prepaid | promo | referral | birthday | admin | beta | refund
- source_id text nullable
- granted_credits int
- remaining_credits int
- starts_at
- expires_at nullable
- priority int
- metadata jsonb
- created_at
```

Ejemplos:

```text
50 créditos mensuales
source_type = subscription
expires_at = fin del ciclo o política definida

30 créditos comprados
source_type = prepaid
expires_at = null o 12 meses

10 créditos cumpleaños
source_type = birthday
expires_at = +30 días
```

## 6.3 Añadir `credit_ledger`

Append-only.

```sql
credit_ledger
- id uuid pk
- owner_id
- request_id nullable
- grant_id nullable
- event_type       -- grant | spend | refund | expire | adjustment
- credits_delta    -- +10 / -5
- balance_after
- reason
- created_at
```

No editar registros históricos.

Correcciones administrativas = nuevos movimientos.

## 6.4 Orden de consumo

Propuesta inicial:

```text
1. créditos promocionales próximos a expirar
2. créditos de suscripción del ciclo
3. créditos prepago
```

El algoritmo debe ser server-side y transaccional.

## 6.5 Compatibilidad con el wallet actual

Durante transición:

```text
credit_grants + ledger = fuente contable
ai_credit_wallets.balance = cache/snapshot
```

Cuando el ledger esté probado, el RPC existente puede delegar a la nueva lógica sin cambiar el frontend.

---

# 7. Usage metering y costo real

No mezclar “créditos cobrados” con “costo del proveedor”.

## 7.1 Evolucionar `ai_usage`

Añadir columnas o una tabla nueva `ai_requests`.

Recomendación: mantener `ai_usage` por compatibilidad y extender progresivamente.

Campos objetivo:

```text
id
request_id
user_id
workspace_id nullable
action
feature_key
quality_mode
provider
provider_model
route_policy_version
route_reason
credits_charged
input_tokens
cached_input_tokens
output_tokens
provider_cost_usd
cost_version
latency_ms
retry_count
status
error_code
created_at
completed_at
```

## 7.2 Cost snapshot

Registrar el costo calculado **en el momento del request**.

No recalcular histórico con precios futuros.

```text
provider_cost_usd = costo resultante del request
cost_version = "openai-2026-09-25"
```

## 7.3 Métricas que habilita

```text
costo por sesión
costo por docente activo
costo por plan
costo por modelo
margen bruto estimado
créditos consumidos vs costo real
p95 de latencia
porcentaje de errores
porcentaje de fallback
```

---

# 8. AI Gateway único

Actualmente hay tres routers de proveedor. Pueden seguir existiendo internamente, pero el frontend debería dejar de conocerlos.

## 8.1 Nuevo endpoint conceptual

```text
ai-gateway
```

Entrada:

```json
{
  "requestId": "uuid",
  "action": "generate_session",
  "quality": "automatic",
  "input": { }
}
```

No debería ser necesario enviar proveedor.

## 8.2 Pipeline

```text
1. validar JWT
2. resolver user/workspace
3. resolver suscripción activa
4. consultar entitlement de la feature
5. validar cuota/rate limit
6. calcular créditos requeridos
7. reservar créditos
8. clasificar complejidad
9. resolver modelo server-side
10. llamar al provider adapter
11. validar resultado
12. registrar tokens/costo/latencia
13. completar consumo
14. devolver respuesta

si falla proveedor:
15. aplicar política de fallback
16. si todo falla -> refund
```

## 8.3 Adapters de proveedor

```text
supabase/functions/_shared/providers/
    openai.ts
    gemini.ts
    deepseek.ts
```

Contrato común:

```ts
interface AiProviderAdapter {
  execute(request: CanonicalAiRequest): Promise<CanonicalAiResponse>;
}
```

Respuesta canónica:

```ts
{
  content,
  provider,
  model,
  usage: {
    inputTokens,
    cachedInputTokens,
    outputTokens
  },
  latencyMs,
  finishReason
}
```

## 8.4 `model_catalog`

Configuración server-side:

```text
model_catalog
- id
- provider
- api_model
- display_name
- active
- supports_files
- supports_images
- supports_json
- quality_tier
- input_cost
- cached_input_cost
- output_cost
- price_version
```

No necesita UI pública inicialmente.

## 8.5 `routing_rules`

```text
routing_rules
- action
- quality_mode
- preferred_model_id
- fallback_model_id
- min_plan
- enabled
- priority
```

Ejemplo conceptual:

```text
refine_text + automatic
→ modelo económico

generate_session + automatic
→ modelo equilibrado

generate_experience + automatic
→ modelo equilibrado/potente

max_quality
→ permitido solo si entitlement correspondiente
```

---

# 9. Separar plan comercial, cuota IA y créditos

No son lo mismo.

```text
PLAN COMERCIAL
¿Qué compró?

ENTITLEMENT
¿Qué funcionalidad puede usar?

CUOTA OPERACIONAL
¿Cuánto puede usar por tiempo?

CRÉDITOS
¿Cuánta capacidad consumible tiene?

USAGE
¿Qué consumió realmente?

PROVIDER COST
¿Cuánto costó servirlo?
```

Esto permite cambiar precios o modelos sin romper el producto.

---

# 10. Modelo de negocio soportado por la arquitectura

El backend debe soportar simultáneamente:

```text
FREE
↓
prueba/acceso básico

PREPAGO
↓
usuario ocasional

DOCENTE / PRO
↓
suscripción mensual o anual

RECARGAS
↓
créditos adicionales

INSTITUCIÓN
↓
licencias/múltiples docentes
```

No es necesario mostrar todos al lanzamiento.

La arquitectura simplemente debe evitar bloquearlos.

---

# 11. Recomendador de plan — construir después de tener datos

No implementar recomendaciones comerciales fuertes hasta tener suficiente historial.

Primero registrar.

Luego un job puede calcular:

```text
usage_30d
usage_90d
prepaid_spend_90d
subscription_capacity_used
average_monthly_credits
```

Reglas iniciales futuras:

```text
< 20 % del plan por 3 ciclos
→ sugerir prepago

prepago > precio de suscripción durante 2 ciclos
→ sugerir suscripción

> 80 % de créditos durante 2 ciclos
→ avisar límite / comparar plan superior
```

Nunca cambiar el plan automáticamente.

---

# 12. Perfil docente y personalización

El perfil debe evolucionar sin convertirse en una colección de datos innecesarios.

Campos útiles:

```text
nivel
área/especialidad
grados
institución
región/UGEL (si aporta valor)
duración habitual de sesión
preferencias pedagógicas
plantilla preferida
```

Cumpleaños opcional:

```text
birth_day
birth_month
```

No pedir año si no es necesario.

Añadir consentimiento/preferencias de marketing separado:

```text
notification_preferences
- product_updates
- promotions
- plan_recommendations
- birthday_rewards
- email_enabled
```

Las notificaciones de seguridad/facturación no deben depender del consentimiento de marketing.

---

# 13. Privacidad — especial cuidado por datos de estudiantes

Space Lab ya maneja padrón de alumnos.

Antes de una apertura pública:

1. Evitar enviar nombres de alumnos a proveedores IA salvo que una feature lo necesite explícitamente.
2. Para prompts pedagógicos, preferir:

```text
"estudiante 1"
"estudiante con necesidad de refuerzo"
```

sobre nombres reales.

3. Definir retención y eliminación de padrones.
4. Permitir borrado claro del roster.
5. Evitar registrar información sensible en `security_logs`.
6. No escribir emails completos, tokens o payloads pedagógicos en logs técnicos si no es necesario.
7. Revisar términos y privacidad al activar analítica comercial, marketing y facturación.

---

# 14. Organizaciones / instituciones

No hace falta habilitarlas en UI ahora, pero conviene no encerrar todos los datos eternamente bajo `user_id`.

## 14.1 Futuro modelo

```text
organizations
organization_members
workspaces
```

```sql
organizations
- id
- name
- type
- created_at

organization_members
- organization_id
- user_id
- role
- status

workspaces
- id
- owner_type
- owner_id
- name
```

Roles futuros:

```text
owner
admin
teacher
viewer
```

## 14.2 No migrar sesiones a organizaciones todavía

Primera fase:

```text
sesiones.user_id
```

sigue intacto.

Cuando llegue el módulo institucional, añadir `workspace_id` nullable y migrar gradualmente.

---

# 15. Plantillas inteligentes — dejar un punto de extensión

No implementar ahora, pero diseñar futuros artefactos para que tengan propietario.

```text
templates
- id
- owner_type
- owner_id
- name
- document_type
- template_version
- metadata
```

Esto permitirá:

```text
plantilla personal
plantilla de colegio
plantilla institucional
plantilla por nivel
```

sin acoplarla a una sola sesión.

---

# 16. Fases de implementación

## FASE 0 — Congelar baseline

**Objetivo:** saber exactamente qué no podemos romper.

### Trabajo

- Etiquetar el commit estable actual.
- Ejecutar CI completo.
- Crear fixtures reales de Inicial, Primaria y Secundaria.
- Añadir una prueba E2E mínima:

```text
login
→ crear sesión
→ generar IA
→ guardar
→ recargar
→ exportar
```

- Registrar tiempos actuales y errores.

### Done

```text
[ ] CI verde
[ ] snapshot de BD
[ ] fixture de sesión por nivel
[ ] flujo principal reproducible
```

---

## FASE 1 — Corregir identidad real de modelos

**P0 antes de monetización.**

### Trabajo

- Eliminar alias engañosos modelo-visible != API-real.
- Introducir `model_catalog` o configuración server-side equivalente.
- UI pasa a mostrar:

```text
Automático
Rápido
Equilibrado
Máxima calidad
```

- Administración puede ver el proveedor/modelo real.
- Registrar modelo solicitado vs modelo ejecutado.

### Done

```text
[ ] ningún nombre comercial promete un modelo que no se invoca
[ ] provider_model real queda registrado
[ ] test de routing server-side
```

---

## FASE 2 — Telemetría económica en modo SHADOW

**No bloquear a ningún beta tester.**

### Trabajo

Extender usage:

```text
latency_ms
provider_cost_usd
cost_version
route_reason
error_code
retry_count
```

Añadir utilidades para calcular costo por proveedor.

Config:

```text
BILLING_ENFORCEMENT=false
USAGE_METERING=true
```

Todo se mide, nada nuevo se cobra.

### Done

Podemos consultar:

```text
costo últimas 24h
costo por usuario
costo por acción
costo por modelo
```

---

## FASE 3 — Capa comercial `plans + entitlements`

### Crear

```text
subscription_plans
plan_entitlements
subscriptions
```

### Seed inicial

```text
beta_teacher
free
teacher
pro
```

Solo `beta_teacher` se usa en producción inicialmente.

Todos los testers existentes se asignan a:

```text
beta_teacher
```

con acceso suficiente para que nada cambie.

### Done

Un RPC server-side puede responder:

```json
{
  "plan": "beta_teacher",
  "features": {
    "session.generate": true,
    "session.export_docx": true,
    "ai.attach_file": true
  }
}
```

---

## FASE 4 — Enforcement de entitlements

Primero shadow:

```text
si feature no permitida
→ loggear WOULD_BLOCK
→ permitir temporalmente
```

Después enforcement real solo para cuentas de prueba internas.

Finalmente beta completa.

### Nunca

No poner checks del plan dentro de `SessionDocument` o templates pedagógicos.

---

## FASE 5 — Credit ledger híbrido

### Añadir

```text
credit_grants
credit_ledger
```

### Adaptar

```text
reserve_ai_credits
complete_ai_usage
refund_ai_usage
```

sin cambiar inicialmente el contrato frontend.

### Migración beta

Cada balance existente se convierte en:

```text
source_type = beta
remaining = balance actual
```

### Done

Tests para:

```text
suscripción + prepago
refund
expiración
nuevo ciclo
promo
concurrencia
idempotencia
```

---

## FASE 6 — AI Gateway

Crear endpoint único y hacer que los routers actuales sean adapters internos.

Migración:

```text
Frontend
→ ai-gateway
→ provider adapter
```

Mantener routers legacy durante 1-2 releases por rollback.

Después retirar llamadas directas desde frontend.

---

## FASE 7 — Panel SaaS interno

No necesita ser bonito todavía.

Debe mostrar:

```text
Usuarios activos
Plan
Créditos
Uso 30d
Costo IA 30d
Errores
Última actividad
```

Y por usuario:

```text
usage timeline
credit ledger
plan/subscription
admin adjustments
```

Toda mutación administrativa auditada.

---

## FASE 8 — Billing abstraction

No conectar un proveedor de pagos antes de estabilizar las tablas comerciales.

Crear interfaz conceptual:

```ts
BillingProvider
- createCheckout()
- getSubscription()
- cancelSubscription()
- handleWebhook()
```

Estados internos no deben depender del vocabulario exacto de Stripe/Mercado Pago.

El webhook actualiza `subscriptions` idempotentemente.

### Seguridad

Nunca confiar en el redirect del navegador para activar un plan.

Solo:

```text
webhook firmado
→ billing event idempotente
→ activar subscription
```

---

## FASE 9 — Apertura beta ampliada

Antes de indexar/promocionar:

```text
[ ] rate limits efectivos
[ ] costos visibles en admin
[ ] entitlements probados
[ ] borrado de cuenta/datos definido
[ ] errores amigables
[ ] soporte
[ ] términos/privacidad actualizados
[ ] backup/recovery básico
[ ] alertas de costos
```

---

# 17. Orden recomendado de migraciones SQL

Crear migraciones pequeñas, nunca editar una antigua ya aplicada.

Propuesta:

```text
20260926_001_model_catalog.sql
20260926_002_usage_cost_fields.sql
20260926_003_subscription_plans.sql
20260926_004_plan_entitlements.sql
20260926_005_subscriptions.sql
20260926_006_beta_plan_backfill.sql
20260926_007_credit_grants.sql
20260926_008_credit_ledger.sql
20260926_009_credit_rpc_v2.sql
20260926_010_notification_preferences.sql
```

Más adelante:

```text
*_organizations.sql
*_organization_members.sql
*_workspaces.sql
```

No meter todo en una migración de 2,000 líneas.

---

# 18. `database_setup.sql`

Actualmente existe un script maestro grande además de migraciones incrementales.

A mediano plazo definir una sola estrategia.

Recomendación:

```text
supabase/migrations/ = fuente de verdad
```

Y generar/documentar el setup completo desde las migraciones si hace falta.

Riesgo actual:

```text
migración cambia
pero database_setup.sql queda desfasado
```

No continuar duplicando manualmente cada nueva feature SaaS en dos lugares sin automatización.

---

# 19. Refactor del frontend

`js/app.js` ronda un tamaño considerable y el sistema ya tiene controladores separados.

No es necesario migrar a React/Vue para hacer SaaS.

Primero continuar modularización existente.

Objetivo:

```text
js/
  domain/
    sessions/
    profiles/
  services/
    api-client.js
    ai-client.js
    billing-client.js
    entitlement-client.js
  state/
    auth-store.js
    entitlement-store.js
    usage-store.js
  controllers/
  components/
```

## Regla

La UI pregunta:

```js
Entitlements.can('planning.experience')
```

No:

```js
profile.plan === 'pro'
```

---

# 20. API/Edge contract versionado

Crear contratos explícitos:

```text
AiRequest v1
AiResponse v1
EntitlementsResponse v1
UsageSummary v1
```

Ejemplo:

```json
{
  "version": 1,
  "requestId": "uuid",
  "action": "generate_session",
  "quality": "automatic",
  "input": {}
}
```

Esto evitará que nuevos módulos (experiencias, talleres, presentaciones) inventen cada uno su propia forma de llamar a IA.

---

# 21. Experiencias de aprendizaje después del refactor

La arquitectura SaaS debe terminar antes de conectar el siguiente gran módulo.

Después:

```text
AcademicPlan
  └── Experience
       ├── Session
       ├── Session
       └── Session
```

Y posteriormente:

```text
Session
  ├── Worksheet
  ├── Assessment
  ├── Presentation
  ├── Rubric
  └── Evidence
```

El sistema comercial solo necesita nuevos entitlements/actions:

```text
planning.experience
planning.unit
planning.project
resource.presentation
```

No una nueva arquitectura de pagos.

Ese es uno de los objetivos principales del refactor actual.

---

# 22. Modelo para practicantes — compatibilidad futura

No implementar ahora.

Pero los artefactos futuros deberían poder relacionarse:

```text
Session
  ↓
Execution
  ↓
Evidence
  ↓
Reflection
  ↓
PracticeReport
  ↓
Portfolio
```

La SaaS layer se reutiliza:

```text
plan = student/practicante
entitlements específicos
```

---

# 23. Observabilidad mínima

Crear dashboards/consultas para:

## Producto

```text
DAU / WAU / MAU
usuarios que generan sesión
sesiones por usuario
porcentaje de sesiones exportadas
retención 7/30 días
```

## IA

```text
requests por acción
input/output tokens
fallback rate
error rate
latency p50/p95
provider cost
```

## Negocio

cuando exista pago:

```text
MRR
ARPU
conversion free -> paid
churn
gross margin
prepaid vs subscription usage
```

No almacenar eventos porque “quizá algún día sirvan”.

Cada evento debe responder una pregunta concreta.

---

# 24. Alertas de seguridad y costo

Antes de abrir el registro masivo:

```text
alerta de gasto IA diario
alerta de errores > umbral
alerta de requests anómalos
alerta de rate-limit abuse
```

Kill switches:

```text
AI_GLOBAL_ENABLED
PROVIDER_OPENAI_ENABLED
PROVIDER_GEMINI_ENABLED
PROVIDER_DEEPSEEK_ENABLED
MAX_DAILY_PLATFORM_COST_USD
```

Si ocurre un bug de frontend, no queremos una factura infinita.

---

# 25. Tests nuevos obligatorios

## Créditos

```text
concurrent spend
no negative balance
idempotent request
refund once only
subscription renewal
prepaid survives renewal
promotion expires
```

## Entitlements

```text
free cannot feature X
pro can feature X
admin cannot accidentally bypass usage accounting
```

## Routing

```text
client cannot force forbidden model
fallback records actual model
actual provider model matches telemetry
```

## Billing futuro

```text
duplicate webhook
out-of-order webhook
cancel at period end
failed payment
manual beta subscription
```

## Privacy

```text
student roster not sent to AI by default
users cannot read another user's usage
users cannot read another user's subscription
```

---

# 26. Estrategia para no romper a los testers actuales

Crear plan especial:

```text
beta_teacher
```

Características:

```text
acceso a todo lo actualmente disponible
cuota generosa
sin cobro
sin expiración inicial
```

Así las migraciones pueden entrar sin cambiar su experiencia.

Usarlos como canary:

```text
owner/desarrollador
→ tester 1
→ tester 2
→ nuevos beta
→ público
```

---

# 27. Feature flags

Añadir tabla/configuración:

```text
feature_flags
- key
- enabled
- rollout_percentage
- metadata
```

Flags iniciales:

```text
saas_entitlements_shadow
saas_entitlements_enforce
credit_ledger_v2
ai_gateway_v2
plan_recommendations
billing_checkout
experience_module
```

Esto permite desplegar código sin activar todo.

---

# 28. Qué NO hacer

1. **No reescribir Space Lab en otro framework solo por hacer el SaaS.**
2. **No meter Stripe/Mercado Pago antes de tener modelo comercial interno estable.**
3. **No convertir `ai_plans` en una mega tabla con todas las reglas del negocio.**
4. **No confiar en el modelo seleccionado por el navegador.**
5. **No resetear créditos prepago al renovar una suscripción.**
6. **No mostrar tokens de proveedor como unidad comercial principal.**
7. **No codificar `if plan === pro` por toda la UI.**
8. **No agregar experiencias/proyectos en medio de este refactor.**
9. **No borrar routers/credit wallet legacy hasta que v2 esté probado.**
10. **No indexar/promocionar masivamente antes de tener límites y alertas de costo.**

---

# 29. Estructura de PRs recomendada

```text
PR-01 baseline + tests de regresión
PR-02 model identity + server routing skeleton
PR-03 usage cost telemetry
PR-04 subscription_plans + entitlements schema
PR-05 beta plan + entitlement shadow mode
PR-06 entitlement enforcement interno
PR-07 credit grants + ledger
PR-08 credit RPC v2 + compatibilidad wallet
PR-09 ai-gateway v2
PR-10 admin SaaS observability
PR-11 profile/preferences + marketing consent
PR-12 billing abstraction (sin proveedor)
PR-13 proveedor de pago
PR-14 public beta hardening
```

Cada PR debe tener:

```text
migration
unit tests
rollback/compatibility note
manual QA checklist
```

---

# 30. Definition of Done del refactor SaaS

La arquitectura base se considera terminada cuando:

```text
[ ] el flujo actual de sesión sigue funcionando
[ ] modelo real ejecutado = modelo registrado
[ ] routing se decide server-side
[ ] cada request IA registra tokens y costo
[ ] planes comerciales existen separados de cuotas técnicas
[ ] features usan entitlements
[ ] suscripciones pueden existir aun sin proveedor de pago
[ ] créditos soportan subscription + prepaid + promo
[ ] prepago sobrevive a la renovación mensual
[ ] refunds son idempotentes
[ ] rate limits siguen server-side
[ ] beta users no sufren cambios
[ ] admin ve consumo y costo por usuario
[ ] RLS cubre nuevas tablas
[ ] logs no filtran contenido sensible innecesario
[ ] existe feature flag para desactivar enforcement
[ ] CI cubre los flujos comerciales críticos
```

En ese punto Space Lab habrá dejado de ser solo una aplicación con IA y pasará a tener un **núcleo SaaS reutilizable** sobre el que podrán añadirse experiencias, unidades, proyectos, presentaciones, talleres, practicantes e instituciones sin volver a rediseñar el negocio desde cero.

---

# 31. Orden exacto sugerido para Codex

## Instrucción general

> Trabaja sobre el commit `d8e19704bbb02635dd0a52211a1e69ebc2496f1f` de `main`. No reescribas el sistema actual ni cambies el contrato `SessionDocument v1`. Implementa el refactor SaaS de manera incremental y compatible hacia atrás. Cada fase debe mantener verde la suite actual de tests. No mezcles módulos pedagógicos nuevos con la infraestructura comercial.

## Primera ejecución

Codex debe comenzar solo por:

```text
1. Crear una rama `refactor/saas-core`.
2. Ejecutar y documentar toda la suite existente.
3. Crear un inventario de tablas/RPC/Edge Functions actuales.
4. Añadir tests de regresión para créditos y routing actuales.
5. Detectar/confirmar el mismatch entre modelos de UI y modelos reales.
6. Proponer la migración `model_catalog` sin activar todavía billing.
7. No tocar experiencias/unidades/proyectos.
8. No integrar pagos.
9. No cambiar la UI visual salvo lo indispensable para corregir identidad de modelos.
10. Entregar PR pequeño y revisable.
```

## Segunda ejecución

Después de validar PR-01/02:

```text
1. Añadir metering económico en shadow mode.
2. Registrar provider_model real, tokens, latencia y cost snapshot.
3. Crear consultas/admin de observabilidad.
4. No bloquear requests existentes.
5. Mantener ai_credit_wallets actual operativo.
```

## Tercera ejecución

Después:

```text
1. Crear subscription_plans.
2. Crear plan_entitlements.
3. Crear subscriptions.
4. Crear plan beta_teacher.
5. Asignar usuarios existentes sin pérdida de acceso.
6. Implementar entitlement shadow mode.
```

## Cuarta ejecución

Solo cuando lo anterior esté probado:

```text
1. credit_grants
2. credit_ledger
3. adaptación de RPCs
4. migración de balances beta
5. pruebas de concurrencia/idempotencia/renewal
```

## Quinta ejecución

Finalmente:

```text
1. ai-gateway único
2. server-side routing
3. adapters de proveedor
4. eliminar dependencia del provider elegido por frontend
5. mantener endpoints legacy durante transición
```

---

# 32. Prioridad resumida

```text
P0
├── baseline y tests
├── corregir identidad real de modelos
├── server-authoritative routing
└── telemetría de costo

P1
├── subscription plans
├── entitlements
├── subscriptions
├── beta plan
└── shadow enforcement

P1.5
├── credit grants
├── ledger
└── hybrid subscription/prepaid

P2
├── AI gateway único
├── admin SaaS analytics
├── plan recommender
└── notification preferences

P3
├── pagos
├── instituciones/workspaces
└── campañas/referidos

DESPUÉS DEL CORE SaaS
├── experiencias
├── unidades
├── proyectos
├── presentaciones
├── talleres
├── practicantes
└── portafolios
```

---

# 33. Conclusión técnica

Space Lab no carece totalmente de arquitectura de negocio. El repositorio actual ya contiene tres piezas que normalmente se construyen mucho más tarde:

1. **autenticación y RLS**;
2. **contabilidad atómica básica de créditos IA**;
3. **usage tracking con tokens y request IDs**.

Por eso el trabajo correcto no es “construir el sótano desde cero”.

Es más parecido a:

> **reforzar y ampliar los cimientos existentes sin desmontar el piso que ya funciona.**

La mayor corrección conceptual es separar definitivamente:

```text
PRODUCTO PEDAGÓGICO
        ≠
PLAN COMERCIAL
        ≠
CRÉDITOS
        ≠
TOKENS
        ≠
PROVEEDOR IA
```

Si esa separación se hace ahora, el futuro módulo de experiencias de aprendizaje y el ecosistema posterior podrán crecer sobre una base estable en lugar de obligar a otro refactor estructural.

