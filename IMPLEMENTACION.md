# Implementación del plan maestro de Experiencias y Unidades

Fuente revisada: `PLAN_MAESTRO_EXPERIENCIAS_UNIDADES_SEGURAS.md`, baseline descrito
en ese documento `main @ 6f86a6f8`. La implementación se aplica sobre el estado
actual del repositorio y conserva `SessionDocument v1` y `PlanningContainer 2.0`.

## Estado por bloque

- **E1 — Draft → Reviewed: implementado y validado.** El Paso 7 muestra
  `Guardar borrador` y `Marcar como revisada`. La segunda acción se habilita solo
  cuando `PlanningContainerV2.validate(..., { forReview: true })` acepta el
  documento con sus perfiles pedagógico y metodológico resueltos.
- **E2 — `planning.map.generate`: implementado y validado.** La acción usa AI
  Gateway, prompt versionado, crédito propio, entitlement, validación JSON y
  validación completa de `PlanningContainer 2.0` antes de aceptar el borrador.
- **E3–E6: pendientes y dependientes de E2.** No se adelantaron para respetar el
  gate secuencial del plan maestro.
- **V1, C1–C3, P1–P5, I1–I5, IC1–IC2 y R1–R4: pendientes.** V1 requiere un piloto
  con al menos dos docentes; la matriz CNEB y los niveles Primaria/Inicial no se
  deben completar con contenido generado sin fuentes y revisión humana.

## BLOQUE E1

**Archivos modificados:**

- `js/planning/planning-wizard.js`
- `css/planning.css`
- `tests/planning-wizard.test.js`
- `tests/ui_planning_smoke.py`
- archivos HTML y `app-version.json` actualizados por versionado de assets

**Comportamiento:**

- Un borrador incompleto sigue pudiendo guardarse.
- Un borrador inválido no puede pasar a `reviewed`.
- Una planificación completa pasa a `reviewed` mediante una revisión nueva.
- El estado se persiste localmente, se sincroniza y vuelve a abrirse desde
  `Mis planificaciones`.
- Al editar y guardar una planificación revisada, vuelve a `draft` y requiere
  revisión nuevamente.
- El botón deshabilitado comunica por qué aún no puede revisarse y tiene un
  estado visual distinguible.

**Pruebas del bloque:**

```bash
node --check js/planning/planning-wizard.js
node tests/planning-container-v2.test.js
node tests/planning-repository.test.js
node tests/planning-wizard.test.js
node tests/pedagogical-context-resolver.test.js
node tests/pedagogy-catalog.test.js
node tests/methodology-catalog.test.js
python tests/ui_planning_smoke.py
```

Resultado: todas verdes. La suite local completa de JavaScript, Python,
Playwright y Deno también está verde.

**Riesgos y gate:**

- La validación revisada depende de que los perfiles del piloto carguen.
- El estado de nube usa el repositorio y la tabla existentes; no hizo falta una
  migración.
- `SessionDocument v1`, exportación, AI Gateway, créditos y billing no cambiaron.
- Gate E1: cumplido localmente; queda pendiente la confirmación del workflow
  remoto de CI.

## BLOQUE E2

**Archivos principales:**

- `supabase/functions/_shared/prompt-builder.ts`
- `supabase/functions/_shared/entitlements.ts`
- `supabase/functions/gemini-router/index.ts`
- `supabase/functions/deepseek-router/index.ts`
- `js/planning/planning-map-generator.js`
- `supabase/migrations/202609270001_planning_map_ai_action.sql`
- `tests/planning-map-prompt.test.ts`
- `tests/planning-map-generation.test.js`
- `tests/planning-map-ai-action.test.js`

**Contrato y seguridad:**

- La acción pública es `planning.map.generate` y siempre entra por
  `ai-gateway`; el servicio del navegador no permite indicar un router directo.
- El prompt exige JSON puro y un `PlanningContainer 2.0` completo con estado
  inicial `draft`; no solicita sesiones completas.
- Los tres perfiles resueltos y las referencias curriculares oficiales viajan
  como contexto. La respuesta se rechaza si cambia ids, nombres oficiales o
  capacidades.
- Antes de entregar el borrador se ejecuta
  `PlanningContainerV2.validate(..., { forReview: true })`. Ninguna respuesta
  inválida se persiste.
- Gemini, DeepSeek y OpenAI validan la sintaxis JSON antes de confirmar el
  consumo. Un JSON inválido genera reembolso y puede activar el fallback
  limitado del AI Gateway.
- `requestId` se conserva como clave idempotente. Los errores de cuota y
  entitlement mantienen códigos estructurados en el servicio.

**Metering y despliegue:**

- Costo inicial: 8 créditos por mapa, configurado en base de datos y no en el
  frontend.
- Entitlement: `planning.ai`, habilitado para `beta_teacher` y `pro`.
- La migración incremental fue aplicada al proyecto Supabase enlazado.
- Los routers OpenAI, Gemini y DeepSeek fueron desplegados nuevamente con el
  prompt, entitlement y validación JSON de esta acción.

**Pruebas del bloque:**

```bash
npx --yes deno test tests/planning-map-prompt.test.ts
node tests/planning-map-generation.test.js
node tests/planning-map-ai-action.test.js
node tests/test_entitlements.js
node tests/test_ai_gateway_routing.js
npx --yes deno check supabase/functions/openai-router/index.ts
npx --yes deno check supabase/functions/gemini-router/index.ts
npx --yes deno check supabase/functions/deepseek-router/index.ts
npx --yes deno check supabase/functions/ai-gateway/index.ts
```

Casos cubiertos: entrada válida, perfil inexistente, metodología inexistente,
JSON inválido, referencias curriculares alteradas, respuesta válida,
idempotencia, cuota excedida y entitlement denegado.

Resultado: suite completa JavaScript, Python, Playwright y Deno en verde.

**Gate E2:** cumplido localmente. El siguiente bloque es E3, que incorporará la
acción al wizard con vista previa, aceptar, editar, regenerar y volver al flujo
manual.

---

# Implementación de fórmulas matemáticas en Word

## Objetivo

La exportación DOCX conserva el HTML de la sesión y transforma únicamente las
expresiones delimitadas por `$...$`, `$$...$$`, `\(...\)` o `\[...\]`.

La estrategia es híbrida y no cambia el contrato `SessionDocument v1`:

1. **OMML nativo:** fracciones, raíces, potencias, subíndices, operadores,
   flechas y símbolos frecuentes se insertan como ecuaciones editables de Word.
2. **Imagen PNG:** si el conversor OMML no reconoce una expresión, Matplotlib
   MathText la renderiza sobre fondo transparente y se inserta dentro del mismo
   párrafo o centrada si es una fórmula de bloque.
3. **Texto original:** si tampoco puede crearse la imagen, se conserva el LaTeX
   con sus delimitadores. Nunca se elimina silenciosamente una fórmula.

## Flujo

```text
RichContent HTML
  → BeautifulSoup separa párrafos, listas y estilos
  → word_math separa texto y segmentos LaTeX
  → LaTeX compatible → OMML editable
  → LaTeX no compatible → PNG transparente
  → fallo total → texto LaTeX original
```

## Archivos

- `backend/word_math.py`: detección, parser OMML, render PNG y fallback.
- `backend/docx_builder.py`: integra el escritor matemático con el procesador
  común de HTML usado por las exportaciones Word.
- `backend/docx_builder_v1.py`: mantiene el LaTeX hasta la escritura final y
  usa el mismo escritor en campos directos del documento canónico.
- `backend/requirements.txt`: incluye Matplotlib para el fallback gráfico.
- `backend/pablitopyhost.spec`: incluye los módulos requeridos en el `.exe`.
- `tests/test_word_math.py`: valida las tres rutas y un DOCX v1 completo.

## Subconjunto OMML editable

Se convierten de forma nativa:

- `\frac{a}{b}`
- `\sqrt{x}`
- `x^2`, `x^{n+1}`
- `x_1`, `x_{i}`, `x_i^2`
- letras griegas y símbolos como `\pi`, `\theta`, `\Delta`, `\infty`
- relaciones y operadores como `\le`, `\ge`, `\neq`, `\times`, `\cdot`
- flechas como `\Rightarrow`, `\rightarrow`
- sumatoria, producto e integral simples con subíndices y superíndices

Comandos o entornos fuera de este subconjunto pasan automáticamente al render
PNG. No se ejecutan comandos de shell ni compiladores LaTeX.

## Fórmulas inline y de bloque

```html
<p>Calculamos el valor de $x = 8$ dentro del texto.</p>
<p>$$x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$$</p>
```

- La primera ecuación queda en el mismo párrafo.
- La segunda se centra cuando ocupa por sí sola el párrafo.
- Negritas, cursivas, listas, tablas y colores existentes se conservan.

## Seguridad y estabilidad

- Longitud máxima OMML: 4000 caracteres por fórmula.
- No se admiten `\begin`, `\end` ni ejecución de comandos externos en OMML.
- El render de imágenes usa MathText local, sin enviar contenido a internet.
- Las imágenes repetidas se almacenan en una caché limitada de 128 entradas.
- Una falla del render matemático nunca cancela la exportación completa.

## Validación

Ejecutar:

```bash
python tests/test_word_math.py
python tests/test_docx_builder_v1.py
python tests/backend_smoke.py
```

Para entregar el cambio en Windows también debe recompilarse el motor local,
porque tanto `word_math.py` como Matplotlib deben quedar incluidos en el `.exe`.
