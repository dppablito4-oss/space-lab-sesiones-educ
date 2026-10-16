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
- **E3 — IA en el wizard: implementado.** El docente puede generar, previsualizar,
  aceptar, editar, regenerar o descartar una propuesta sin crear otro editor.
- **E4–E6: pendientes.** No se adelantaron para respetar el gate secuencial del
  plan maestro.
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

## BLOQUE E3

**Flujo integrado:**

- `PlanningMapGenerator` se carga antes del wizard y conserva el único camino
  `PlanningMapGenerator → ai-gateway → planning.map.generate`.
- Cada tipo de planificación ofrece creación manual o asistida. La generación
  se habilita únicamente con duración, área/competencia, metodología y perfiles
  del piloto resueltos.
- El borrador actual permanece intacto mientras se genera y durante la vista
  previa. El usuario debe aceptar expresamente antes de editar la propuesta.
- La propuesta aceptada siempre conserva `status = draft`; no se persiste hasta
  pulsar `Guardar borrador` y usa `PlanningRepository`.
- Regenerar crea un `requestId` nuevo. El loading bloquea dobles solicitudes y
  los errores se traducen a mensajes pedagógicos sin exponer stacks.
- El currículo confiable continúa protegido por
  `PlanningMapGenerator.assertTrustedCurriculum()` y la validación completa del
  contenedor ocurre antes de mostrar la propuesta.

**Pruebas específicas:**

```bash
node tests/planning-wizard-ai.test.js
python tests/ui_planning_ai_smoke.py
```

La prueba UI cubre 375 px y 1280 px, input incompleto, confirmación, error,
loading, foco, propuesta válida, regeneración, descarte, aceptación y guardado
como borrador. Las pruebas previas del wizard manual y del lifecycle revisado se
mantienen como regresión.

**Supabase verificado:**

- `supabase migration list --linked` confirma que
  `202609270001_planning_map_ai_action.sql` existe tanto local como remotamente.
- `supabase functions list` confirma estado `ACTIVE` para `ai-gateway`,
  `openai-router`, `gemini-router` y `deepseek-router`.
- E3 no modifica funciones ni migraciones de Supabase; no requiere un despliegue
  adicional de backend.

**Gate E3:** se cierra únicamente después de suite completa, Validate & Build y
GitHub Pages verdes. E4 permanece fuera de alcance.

## BLOQUE E4

**Vista de planificación:**

- `PlanningView` representa directamente un `PlanningContainer 2.0` obtenido
  mediante `PlanningRepository`; no crea un modelo ni almacenamiento paralelo.
- `Abrir` desde la biblioteca muestra primero la vista de lectura. Desde allí,
  `Editar planificación` abre el wizard existente con el mismo identificador,
  estado y revisión.
- Guardar un cambio o marcarlo como revisado devuelve a la vista actualizada.
  La biblioteca conserva título, tipo, estado y revisión.
- La vista presenta metadatos, situación, pregunta retadora, propósito,
  currículo, metodología, producto, evaluación, hitos y secuencia sin exponer
  identificadores internos.
- No se incorpora generación de sesiones ni `SessionPlanningLink`; ambos
  permanecen reservados para E5.
- No se ofrece `Archivar`: el repository solo dispone de eliminación lógica y
  no existe aún un estado de archivo integrado de extremo a extremo.

**Pruebas específicas:**

```bash
node tests/planning-view.test.js
python tests/ui_planning_view_smoke.py
```

El smoke de UI cubre 375 px, 768 px y 1280 px; borrador y revisada; retorno a
biblioteca; edición y revisión con incremento correcto; teclado, foco, ausencia
de overflow y acceso independiente a `Crear nueva sesión`.

**Gate E4:** se cierra después de suite completa, Validate & Build y GitHub
Pages verdes. E5 permanece fuera de alcance.

## BLOQUE E5

**SessionPlanningLink real:**

- Solo un `PlanningContainer 2.0` con estado `reviewed` puede preparar una
  sesión vinculada. Los borradores se rechazan antes de alterar el editor.
- `PlanningLinkedSession` resuelve la planificación mediante
  `PlanningRepository`, crea el `SessionPlanningLink 2.0` y traduce el
  `SequenceItem` a los campos del editor de sesiones existente.
- El `inheritedContextSnapshot` congela la revisión, el ítem, el contexto
  global, currículo referenciado, metodología, producto, hito, evaluación y
  las sesiones anteriores y posteriores.
- El generador `generate_session` existente recibe el snapshot como contexto
  pedagógico no confiable. Sigue produciendo exactamente `SessionDocument v1`.
- AI Gateway verifica por RLS la planificación del usuario, exige que la copia
  actual continúe `reviewed` con la misma revisión e ítem y reconstruye el
  snapshot desde `planning_containers`; no confía en el JSON enviado por el
  navegador.
- La relación se guarda fuera del documento canónico, en `session.planning`.
  La exportación DOCX/PDF/JSON canónica no incorpora ese metadato.
- Al guardar la sesión, el `SequenceItem` registra `linkedDocumentRef` y estado
  `generated` sin cambiar el estado `reviewed` ni incrementar la revisión
  pedagógica. Si la planificación cambió desde el snapshot, la sesión se guarda
  pero la referencia operativa no se sobrescribe.
- Una copia creada con `Guardar como` se vuelve standalone para evitar dos
  sesiones reclamando el mismo `SequenceItem`.

**Pruebas específicas:**

```bash
node tests/linked-session.test.js
deno test tests/ai-prompt-builder.test.ts
python tests/ui_linked_session_smoke.py
```

La navegación visual, los botones `Generar` / `Abrir` y el regreso desde la
sesión a su planificación no forman parte de E5; quedan reservados para E6.

**Gate E5:** se cierra después de desplegar los routers que comparten el prompt,
ejecutar la suite completa y confirmar Validate & Build y GitHub Pages verdes.
E6 permanece fuera de alcance.

## BLOQUE E5.1

**Hardening final de SessionPlanningLink:**

- `linkedDocumentRef` coincide con el schema: se persiste como objeto con `id`,
  `schemaVersion`, `revision` y `status`; el validador rechaza strings, campos
  vacíos, revisiones inválidas y estados no permitidos.
- Solo un `SequenceItem` de tipo `session`, estado `planned` y sin referencia
  previa puede preparar una sesión linked. El bridge y AI Gateway aplican la
  misma regla para impedir duplicados o clientes manipulados.
- Registrar la referencia sigue siendo metadata operacional: la planificación
  permanece `reviewed` y su revisión pedagógica no cambia.
- El enlace pendiente se limpia al iniciar una sesión standalone, cargar otra,
  cerrar el editor o cancelar el reemplazo de una sesión activa.
- `startLinkedSession()` reutiliza la confirmación existente de nueva sesión.
  Cancelar conserva íntegramente la sesión activa y no establece un link.
- El snapshot guardado en `session.planning` no se reescribe al registrar la
  referencia. `Guardar como` continúa creando una copia standalone y el payload
  canónico de exportación continúa excluyendo `planning`.

**Gate E5.1:** exige suite completa, routers/backend activos, Validate & Build
y GitHub Pages verdes. La navegación y los botones de E6 siguen fuera de alcance.

## BLOQUE E6

**Navegación final Unidad / Experiencia ↔ Sesión:**

- `PlanningView` muestra `Generar sesión` exclusivamente para items `session`
  planeados, sin referencia y dentro de una planificación revisada. Los
  borradores explican que primero deben revisarse y los demás tipos no ofrecen
  acciones de sesión.
- Una referencia generada y disponible muestra `Abrir sesión`; se carga el ID
  existente sin invocar IA ni consumir créditos. Una referencia cuyo documento
  local ya no existe se presenta como `Sesión no disponible` y genera un warning.
- Las sesiones linked muestran una barra discreta con la unidad de origen,
  posición en la secuencia y `Volver a planificación`. Las standalone mantienen
  la interfaz anterior sin elementos vacíos.
- El regreso reutiliza `ConfirmDialog` para guardar y volver, volver sin guardar
  o cancelar. `PlanningView.open()` relee siempre `PlanningRepository` y enfoca
  el `SequenceItem` de origen.
- Abrir, volver y generar no incrementan `PlanningContainer.revision` ni cambian
  su estado `reviewed`. Cada sesión conserva su propio snapshot y
  `SessionDocument v1` permanece sin cambios.
- Deuda deliberada: al eliminar una sesión linked no se borra ni modifica la
  planificación. La reconciliación de referencias eliminadas queda para un bloque
  posterior; E6 nunca limpia `linkedDocumentRef` silenciosamente.

**Gate E6:** roundtrip de dos sesiones en 375 px y 1280 px, regresión completa,
Validate & Build y GitHub Pages verdes. Después corresponde piloto docente, no
expansión de niveles ni nuevos perfiles CNEB.

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
## RESTAURACIÓN DE METODOLOGÍAS DIDÁCTICAS, ALINEAMIENTO DE UNIDADES Y CORRECCIÓN DE AUTENTICACIÓN MULTIPESTAÑA

### 1. Diagnóstico y Causa Raíz

#### A. Generación de sesiones genéricas sin metodologías
1. En la migración hacia prompts server-side protegidos (`supabase/functions/_shared/prompt-builder.ts`), las directivas didácticas detalladas de MINEDU que existían anteriormente en el generador cliente (`js/ai-copilot.js` de versiones previas) habían sido reducidas a resúmenes breves.
2. Si el docente dejaba el selector de metodología en su valor por defecto (`""`), el generador de prompts del servidor omitía completamente el bloque `ORIENTACIÓN METODOLÓGICA`, produciendo sesiones genéricas sin los procesos didácticos del área.
3. En las sesiones vinculadas a unidades o experiencias de aprendizaje (`inheritedContextSnapshot`), el contexto de la unidad se volcaba como un bloque JSON crudo sin extraer explícitamente la problemática, la situación significativa, el reto y el propósito de la unidad para guiar a la IA.

#### B. Fallo de autenticación en refresco ("Docente" hardcodeado) y apertura en nueva pestaña
1. **Multi-pestaña**: Al abrir la aplicación en una pestaña nueva o refrescar la página, el cliente de Supabase deserializa el token de autenticación de forma asíncrona. La función `LandingRouter.checkRoute()` evaluaba `readUser()` de forma casi inmediata: si la deserialización tardaba una fracción de segundo, la ruta privada `#/home` o `#/sessions` asumía que no había usuario, cambiaba a la portada y ejecutaba `window.AuthUi?.openModal?.()`. Además, cuando Supabase emitía el evento `INITIAL_SESSION` milisegundos después, `landing.js` no cerraba el modal, dejando el formulario de login sobre la pantalla.
2. **"Docente" en cabecera**: `AuthUi.checkSessionState()` invocaba `SupabaseClient.getCurrentUser()`, el cual ejecutaba `supabase.auth.getUser()` (petición de red HTTP). Ante latencia de red o respuesta pendiente, la interfaz ocultaba el badge de usuario o lo dejaba en el texto estático inicial (`Docente`). Asimismo, si el perfil no tenía explícitamente rellenado el campo `docente`, se recurría de forma tardía o incompleta a los metadatos del usuario (`user_metadata.full_name`, `user_metadata.username`, email).

---

### 2. Cambios Implementados

#### A. Prompts Didácticos Enriquecidos y Alineamiento con Unidades (`supabase/functions/_shared/prompt-builder.ts`)
- **Metodologías oficiales restauradas y enriquecidas**:
  - `polya`: Método de George Polya con los 4 procesos oficiales MINEDU para Matemática (Familiarización con el problema, Búsqueda y ejecución de estrategias, Socialización de representaciones, Reflexión y formalización).
  - `indagacion` / `steam`: Enfoque de Indagación Científica y STEAM con los 4 procesos de Ciencia y Tecnología (Problematización de situaciones, Diseño de estrategias, Generación y análisis de datos, Estructuración del saber y comunicación).
  - `erca`: Ciclo ERCA completo (Experiencia, Reflexión, Conceptualización y Aplicación).
  - `project_based_learning` / `abp`: Aprendizaje Basado en Proyectos con fases distribuidas y adaptables a la sesión.
  - `problem_based_learning` / `pbl`: Aprendizaje Basado en Problemas con sus 5 momentos.
  - `challenge_based_learning`: Aprendizaje Basado en Retos (Involucrarse, Investigar, Actuar).
  - `game_based_learning`: Aprendizaje Basado en Juegos (Narrativa, Inmersión en misiones, Debriefing).
  - `design_thinking`: Fases de Empatizar, Definir, Idear, Prototipar y Evaluar (EPT y proyectos).
  - `comunicacion`: Procesos didácticos según la competencia de Comunicación (Comprensión de lectura: Antes, Durante y Después; Producción escrita: Planificación, Textualización y Revisión; Oralidad: Antes, Durante y Después).
  - `ciencias_sociales`: Procesos para CC.SS., Historia, Geografía y DPCC (Problematización, Análisis de información y fuentes, Acuerdos/deliberación ciudadana).
- **Inferencia inteligente de metodología por área (`resolveSessionMethodology`)**:
  - Si el docente no seleccionó una metodología específica, el sistema deduce la metodología oficial correspondiente al área curricular indicada (p. ej. Matemática -> Polya, Ciencia y Tecnología -> Indagación/STEAM, Comunicación -> Comunicación, CC.SS./DPCC -> Ciencias Sociales, EPT -> Design Thinking).
  - Si la sesión pertenece a una Unidad o Experiencia de Aprendizaje, hereda prioritariamente la metodología configurada en la unidad (`snapshot.methodologyConfig.primary`).
- **Alineamiento explícito con la Unidad o Experiencia de Aprendizaje**:
  - Se extrae del snapshot pedagógico: Situación Significativa / Problemática central, Pregunta Retadora / Desafío, Propósito general de la unidad y el hito/sesión exacto en la secuencia.
  - Se instruye a la IA a abordar directamente la situación real del contexto escolar en las actividades de la sesión.

#### B. Motor de Autenticación Rápido y Sincrónico (`js/supabase-client.js`, `js/landing.js`, `js/auth-ui.js`, `js/home.js`, `js/app.js`)
- **`js/supabase-client.js`**:
  - Implementado `getSessionUserSync()`: lee de inmediato y de forma síncrona el token de sesión almacenado en `localStorage` (`sb-koptglmifwpzrfzvipnm-auth-token`).
  - Implementada caché interna de usuario y sesión (`_cachedUser`, `_cachedSession`) alimentada en el arranque y en `onAuthStateChange`.
  - Optimizadas `getCurrentUser()` y `getSessionUser()` para devolver de forma instantánea el usuario de la caché o de `localStorage`, evitando bloqueos por peticiones de red remotas.
- **`js/landing.js`**:
  - En `checkRoute()`: usa `getSessionUserSync()` para validar al usuario inmediatamente sin latencia, evitando falsos positivos de no-autenticación al abrir pestañas nuevas.
  - Si por alguna razón el modal de login se hubiese abierto en una verificación temprana, el listener `onAuthStateChange` ejecuta `window.AuthUi?.closeModal?.()` al confirmar la sesión activa.
- **`js/auth-ui.js`**:
  - `checkSessionState()` acepta usuario existente o lo obtiene con `getSessionUserSync()`, renderizando de forma inmediata el avatar, iniciales, nombre y correo en la cabecera antes de disparar la consulta asíncrona de rol y perfil.
  - Enriquecida la cadena de nombres de usuario (`formatDisplayName`): `profile.docente` -> `user_metadata.docente` -> `user_metadata.full_name` -> `user_metadata.username` -> `profile.username` -> prefijo de email.
- **`js/home.js`**:
  - En `refresh()`, la identidad del docente (`home-account-name`, `home-account-avatar`, `home-welcome-title`) se dibuja de inmediato con `getSessionUserSync()`, eliminando el destello del texto predeterminado "Docente".
- **`js/app.js`**:
  - En `loadProfileDefaults()`: si el campo `docente` en la tabla `profiles` está vacío, se rellena automáticamente `DOM.inputDocente` a partir de los metadatos del usuario autenticado (`full_name`, `username` o correo), garantizando que las sesiones generadas siempre incluyan el nombre del docente.
- **`conexion.html`**:
  - Corregida la redirección tras el enlace exitoso con el motor Python local (`pablitopyhost.exe`) para enviar al usuario directamente a `./#/app` (el editor de sesiones).

---

### 3. Validación y Pruebas Ejecutadas

- **Deno Test Suite (`tests/ai-prompt-builder.test.ts`, `tests/ai-credits.test.ts`, `tests/linked-session-context.test.ts`, `tests/planning-map-prompt.test.ts`)**:
  - 15 pruebas pasadas (100% OK), incluyendo pruebas específicas de deducción automática de metodologías (Polya, STEAM) y preservación de situación significativa en unidades.
- **Node Test Suite (`tests/home-workspace.test.js`, `tests/profile-fields.test.js`, `tests/methodology-catalog.test.js`, `tests/methodology-codes.test.js`, etc.)**:
  - 13 suites pasadas (100% OK).
- **Scripts de Composición y Versionado**:
  - `python scripts/build_index.py --check` y `python scripts/version_assets.py --check` validados y sincronizados.
- **Pruebas End-to-End en Navegador**:
  - Servidor local activo en http://localhost:8080/.
  - Se ejecutó el flujo completo de usuario real: registro de docente temporal, autenticación automática, persistencia en refresco (F5) en #/home y navegación multi-pestaña (#/app).
  - Se validó que el nombre del docente aparece inmediatamente en el encabezado y en el perfil sin mostrar el fallback 'Docente'.
  - Se verificó que el selector de metodologías didácticas incluye Polya, STEAM / Indagación, ERCA, ABP, Aula Invertida y Aprendizaje Cooperativo.
  - Se inició el navegador Comet (C:\Program Files\Perplexity\Comet\Application\comet.exe) apuntando a http://localhost:8080/#/home.
