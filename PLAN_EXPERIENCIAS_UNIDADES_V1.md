# Space Lab — Plan de Implementación de Experiencias y Unidades V1

**Repositorio:** `dppablito4-oss/space-lab-sesiones-educ`  
**Estado de referencia:** `main` después de `89028e79`  
**Objetivo:** habilitar el bloque de **Experiencias de Aprendizaje / Unidades / Proyectos** reutilizando el Planning Core V3 y el motor actual de sesiones, sin romper `SessionDocument v1`.

---

## Integración en el proyecto — 2026-09-27

Implementado el **primer bloque de las secciones 40–41**:

- Entrada «Planificación articulada» en Mi espacio y selector Experiencia / Unidad / Proyecto.
- Wizard manual de siete pasos, con piloto Secundaria VI, grados 1.º/2.º, Matemática.
- Creación, edición, guardado y reapertura de `PlanningContainer 2.0` mediante `PlanningRepository`.
- Guardado como `draft`, revisiones incrementales, sincronización existente con Supabase y aviso de guardado local si falla la nube.
- Currículo, productos, hitos y secuencia editables; revisión de campos pendientes y orientaciones metodológicas.
- Creación condicionada a `planning.unit` o `planning.experience`, sin cambiar SaaS Core.
- Tests del wizard y prueba de navegador móvil/escritorio incorporados al workflow.

La generación IA del mapa, las sesiones vinculadas y el piloto con docentes siguen
pendientes; **no se declara completada la Definition of Done global de V1**.
Las pruebas JS/Python y de navegador ejecutadas localmente pasan. Se ejecutaron
además las ocho pruebas de Deno y la comprobación de tipos de las cinco
funciones Edge con `npx deno`. No se ha ejecutado CI remoto ni una sincronización
contra una cuenta Supabase real.

Verificación adicional de Supabase CLI: el repositorio está vinculado al proyecto
`koptglmifwpzrfzvipnm`; la tabla remota `planning_containers` existe, acepta
`schemaVersion` 1.0/2.0 y tiene RLS y políticas por usuario activas. La tabla
tenía cero registros al verificarla. La prueba de navegador cubre el viaje
guardar/sincronizar/reabrir usando una nube simulada; queda pendiente repetirlo
con una sesión docente real, sin crear datos de prueba en una cuenta ajena.

---

# 1. Decisión principal

El Planning Core V3 se considera suficientemente estable para dejar de ampliar arquitectura base.

```text
PLANNING CORE V3 = FROZEN
```

Solo se modifica por bugs o necesidades reales detectadas durante implementación.

No seguir agregando abstracciones nuevas antes de construir el flujo de producto.

---

# 2. Mantener Sesión Individual

La opción actual permanece intacta:

```text
MI ESPACIO

[ Sesión individual ]
```

Flujo:

```text
Copiloto
→ Datos
→ Propósitos
→ Diseño
→ Alumnos
→ Fichas
```

No debe exigir:

```text
Unidad
Experiencia
Proyecto
```

para funcionar.

---

# 3. Nueva opción: Planificación articulada

Agregar una segunda entrada:

```text
MI ESPACIO

[ Sesión individual ]

[ Planificación articulada ]
```

Dentro:

```text
Experiencia de aprendizaje
Unidad
Proyecto
```

Durante la primera versión puede mostrarse como:

```text
Beta
```

---

# 4. Objetivo funcional de V1

La primera versión debe permitir completar este flujo:

```text
Crear planificación
↓
definir contexto
↓
generar o construir mapa
↓
revisar mapa
↓
guardar PlanningContainer
↓
abrir una sesión del mapa
↓
generar SessionDocument v1
↓
editar sesión
↓
volver a la planificación
```

Si este flujo funciona de punta a punta, la V1 se considera funcional.

---

# 5. Bloque 1 — Navegación y shell

Crear la entrada visual:

```text
Planificación articulada
```

No modificar la navegación de Sesión individual.

Pantalla inicial:

```text
¿Qué quieres crear?

[ Sesión individual ]

[ Experiencia de aprendizaje ]

[ Unidad ]

[ Proyecto ]
```

Los tres últimos usan el mismo motor base:

```text
PlanningContainer 2.0
```

y se diferencian mediante:

```text
identity.planningType
```

---

# 6. Bloque 2 — Wizard de planificación

Crear un wizard simple.

Orden recomendado:

```text
Paso 1 — Contexto
Paso 2 — Propósito
Paso 3 — Currículo
Paso 4 — Metodología
Paso 5 — Producto / evidencias
Paso 6 — Secuencia
Paso 7 — Revisión
```

No generar todavía diez sesiones completas.

---

# 7. Paso 1 — Contexto

Campos base:

```text
institución
docente
nivel
ciclo
grado / edad
sección
área(s)
duración
fecha de inicio
fecha de fin
```

También:

```text
contexto del grupo
necesidades
intereses
situación local
```

cuando corresponda.

Todo debe mapear a:

```text
PlanningContainer.identity
PlanningContainer.administrativeContext
PlanningContainer.learnerContext
```

---

# 8. Paso 2 — Propósito

Construir:

```text
significantSituation
drivingQuestion
purpose
```

Separarlos internamente.

No guardar toda la planificación como un solo texto largo.

---

# 9. Paso 3 — Currículo

Usar:

```text
CurriculumMap
```

Campos:

```text
área
competencia
capacidades
estándar
desempeños
criterios
evidencias esperadas
```

No copiar bloques completos en cada sesión.

Las sesiones deben referenciar IDs del mapa curricular.

---

# 10. Paso 4 — Metodología

Resolver mediante:

```text
MethodologyProfile
```

Opciones iniciales:

```text
Aprendizaje Basado en Proyectos
Aprendizaje Basado en Problemas
Aprendizaje Basado en Retos
Aprendizaje Basado en Juegos
Personalizada
```

No mostrar la sigla ambigua:

```text
ABP
```

como identificador interno.

---

# 11. Paso 5 — Producto y evidencias

Separar:

```text
FinalProduct
PartialProduct
Evidence
```

Modelo:

```text
evidencia
↓
producto parcial
↓
producto final
```

No usarlos como sinónimos.

---

# 12. Paso 6 — Secuencia

Construir:

```text
milestones[]
sequence[]
```

Ejemplo:

```text
Semana 1
├── Sesión 01
└── Sesión 02

Semana 2
├── Sesión 03
└── Sesión 04

Semana 3
└── Producto final
```

Cada `SequenceItem` debe poder contener:

```text
title
week
date
duration
milestoneId
competencyIds[]
capacityIds[]
criteriaIds[]
knowledge[]
evidence[]
partialProduct
assessmentInstrument[]
linkedDocumentId
```

---

# 13. Paso 7 — Revisión

Antes de marcar:

```text
status = reviewed
```

validar:

```text
nivel
ciclo
grado
planningType
curriculumMap
metodología
secuencia
referencias
```

Los warnings metodológicos no bloquean.

Los errores estructurales sí.

---

# 14. Bloque 3 — Persistencia

Usar la infraestructura existente:

```text
planning_containers
```

y:

```text
PlanningRepository
```

No crear otra tabla para Unidad o Experiencia.

Guardar:

```text
schemaVersion = 2.0
```

Mantener:

```text
revision
soft delete
RLS
persistencia local
persistencia Supabase
```

---

# 15. Bloque 4 — Planning Map con IA

Después de tener el wizard manual funcionando, implementar:

```text
planning.map.generate
```

en AI Gateway.

No empezar por generación IA.

Primero probar que el objeto puede:

```text
crearse
editarse
guardarse
cargarse
revisarse
```

manualmente.

---

# 16. Input de planning.map.generate

Entrada conceptual:

```json
{
  "level": "secondary",
  "cycle": "VI",
  "grade": "2",
  "planningType": "unit",
  "area": "mathematics",
  "competencies": [],
  "significantSituation": {},
  "methodology": "project_based_learning",
  "duration": {}
}
```

Además debe recibir:

```text
PedagogicalProfile
DidacticProfile
MethodologyProfile
```

resueltos por:

```text
PedagogicalContextResolver
```

---

# 17. Output de planning.map.generate

Debe devolver:

```text
PlanningContainer 2.0
```

válido.

No texto libre.

Flujo:

```text
AI
↓
JSON
↓
PlanningContainerV2.validate()
↓
si válido → mostrar borrador
si inválido → reparar/reintentar/controlar error
```

---

# 18. No generar sesiones completas todavía

La primera llamada IA solo genera:

```text
situación
pregunta retadora
propósito
curriculumMap
metodología
producto
milestones
sequence
criterios
evidencias
```

No:

```text
SessionDocument completo × 8
```

---

# 19. Bloque 5 — Pantalla de planificación

Crear una vista tipo:

```text
UNIDAD 03
Cuidamos responsablemente nuestro ambiente

Duración: 3 semanas
Nivel: Secundaria
Grado: 2.º

Situación significativa
...

Producto final
...

Semana 1
├── Sesión 01   [Generar]
├── Sesión 02   [Generar]

Semana 2
├── Sesión 03   [Generar]
└── Sesión 04   [Generar]

Semana 3
└── Sesión 05   [Generar]
```

El docente debe poder:

```text
editar título
editar criterios
reordenar secuencia
editar producto
editar fechas
regenerar una parte
```

sin regenerar todo.

---

# 20. Bloque 6 — Generar sesión vinculada

Cuando el usuario pulse:

```text
Generar Sesión 03
```

obtener:

```text
PlanningContainer
+
SequenceItem 03
+
CurriculumMap
+
PedagogicalProfile
+
DidacticProfile
+
MethodologyProfile
```

Crear:

```text
inheritedContextSnapshot
```

y generar:

```text
SessionDocument v1
```

---

# 21. No crear un segundo motor de sesiones

Reutilizar:

```text
generador actual
```

La diferencia es que recibe contexto heredado.

No crear:

```text
unit-session-generator.js
```

si solo duplica lógica del generador actual.

---

# 22. Session linked

La relación debe contener:

```text
planningContainerId
sequenceItemId
planningRevision
inheritedContextSnapshot
```

La sesión sigue guardando:

```text
SessionDocument v1
```

sin contaminar el schema.

---

# 23. Snapshot obligatorio

Ejemplo:

```text
Unidad revision 4
↓
Genera Sesión 03
↓
Session 03 guarda snapshot revision 4
```

Si la unidad cambia después:

```text
revision 5
```

la sesión anterior no debe modificarse automáticamente.

---

# 24. Volver a la planificación

Desde una sesión linked debe existir:

```text
← Volver a Unidad
```

La unidad debe indicar:

```text
Sesión 01   Generada
Sesión 02   Pendiente
Sesión 03   Generada
Sesión 04   Pendiente
```

---

# 25. Primer piloto

No habilitar todo el CNEB de inmediato.

Primera vertical:

```text
Secundaria
Ciclo VI
Matemática
Resuelve problemas de cantidad
```

porque ya existen:

```text
PedagogicalProfile
DidacticProfile
MethodologyProfiles
fixture
tests
```

---

# 26. Flujo que debe validarse con docentes

```text
Nueva Unidad
↓
rellenar wizard
↓
generar mapa
↓
editar mapa
↓
guardar
↓
cerrar
↓
abrir de nuevo
↓
generar Sesión 1
↓
editar sesión
↓
guardar
↓
volver a Unidad
↓
generar Sesión 2
```

Si eso funciona:

```text
EXPERIENCIAS / UNIDADES V1 = FUNCIONAL
```

---

# 27. Entitlements

Ya existen conceptos como:

```text
planning.unit
planning.experience
```

Revisar su uso antes de habilitar producción.

Durante beta puede existir:

```text
beta_teacher → enabled
pro → enabled
teacher → según decisión comercial
free → disabled o limitado
```

No meter lógica:

```text
if plan === "pro"
```

en la UI.

Usar:

```text
entitlements
```

---

# 28. Después del piloto — Matriz CNEB

Cuando la vertical de Secundaria funcione, dejar de construir infraestructura.

Pasar a:

```text
MATRIZ PEDAGÓGICA
```

Orden:

```text
Secundaria Ciclo VII
↓
completar Secundaria
↓
Primaria
↓
Inicial Ciclo II
↓
Inicial Ciclo I
```

---

# 29. Primaria

No necesita otro PlanningContainer.

Usar:

```text
PlanningContainer 2.0
+
Primary PedagogicalProfile
+
Primary DidacticProfile
```

---

# 30. Ciclos de Primaria

```text
Ciclo III
1.º / 2.º

Ciclo IV
3.º / 4.º

Ciclo V
5.º / 6.º
```

Empezar con:

```text
Matemática
Comunicación
```

antes de agregar todas las áreas.

---

# 31. Primaria multiárea

Debe soportar:

```text
Unidad integrada
│
├── Comunicación
├── Matemática
├── Ciencia y Tecnología
└── Personal Social
```

Cada sesión puede movilizar áreas distintas dentro de una misma situación significativa.

---

# 32. Inicial no debe reutilizar SessionDocument a la fuerza

Para Inicial crear posteriormente:

```text
InitialActivityDocument v1
```

No representar automáticamente todo como:

```text
Inicio
Desarrollo
Cierre
```

---

# 33. Inicial Ciclo II

Prioridad:

```text
3 años
4 años
5 años
```

Tipos posibles:

```text
learning_activity
psychomotor_workshop
graphic_plastic_workshop
music_workshop
game
exploration
story_activity
sensory_activity
```

---

# 34. Arquitectura Inicial II

```text
PlanningContainer
↓
Initial PedagogicalProfile
↓
SequenceItem
↓
InitialActivityDocument v1
```

El PlanningContainer sí se reutiliza.

El documento hijo cambia.

---

# 35. Inicial Ciclo I

Después diseñar:

```text
ContextPlanningDocument
```

centrado en:

```text
contexto
rutinas
espacio
materiales
interacción
observación
desarrollo
```

No copiar Ciclo II.

---

# 36. Recursos derivados

Solo después de estabilizar planificación:

```text
PlanningContainer
└── SequenceItem
    ├── Presentación
    ├── Ficha
    ├── Evaluación
    ├── Rúbrica
    ├── Lista de cotejo
    └── Material
```

Todos heredan contexto.

---

# 37. Orden exacto de desarrollo

## FASE E1 — UI base

```text
Mi espacio
→ Planificación articulada
→ selector Experiencia / Unidad / Proyecto
```

## FASE E2 — Wizard manual

```text
Contexto
Propósito
Currículo
Metodología
Producto
Secuencia
Revisión
```

Crear y guardar `PlanningContainer 2.0`.

## FASE E3 — Pantalla de mapa

Mostrar:

```text
milestones
sequence
criterios
evidencias
producto
```

Editable.

## FASE E4 — AI planning.map.generate

Agregar acción al AI Gateway.

Validar salida contra PlanningContainer.

## FASE E5 — Linked Session

Generar `SessionDocument v1` desde un `SequenceItem`.

Guardar snapshot y relación.

## FASE E6 — Piloto docente

Probar Secundaria Ciclo VI Matemática.

Corregir UX y flujo.

## FASE E7 — Secundaria ampliada

Agregar:

```text
Ciclo VII
más competencias
más áreas
```

basándose en investigación CNEB.

## FASE E8 — Primaria

Crear perfiles:

```text
III
IV
V
```

Empezar Matemática + Comunicación.

## FASE E9 — Inicial II

Crear:

```text
InitialActivityDocument v1
```

más perfiles pedagógicos y didácticos.

## FASE E10 — Inicial I

Crear:

```text
ContextPlanningDocument
```

---

# 38. Lo que NO debe hacerse ahora

```text
✗ No completar todo el CNEB antes de probar la UX.
✗ No generar 10 sesiones completas de una sola llamada.
✗ No crear un motor paralelo de sesiones.
✗ No forzar Inicial dentro de SessionDocument.
✗ No crear 50 perfiles sin revisión pedagógica.
✗ No rehacer PlanningContainer.
✗ No tocar SaaS Core salvo bugs.
```

---

# 39. Definition of Done — Experiencias V1

La V1 se considera lista cuando:

```text
[ ] existe entrada Planificación articulada
[ ] se puede crear Unidad/Experiencia/Proyecto
[ ] wizard produce PlanningContainer 2.0
[ ] planning container se guarda y carga
[ ] existe pantalla de mapa
[ ] mapa puede editarse
[ ] planning.map.generate funciona
[ ] respuesta IA se valida
[ ] una SequenceItem puede generar SessionDocument v1
[ ] sesión linked guarda snapshot
[ ] se puede volver de sesión a planificación
[ ] sesión individual sigue funcionando
[ ] CI verde
```

---

# 40. Próximo PR recomendado

No implementar todo en una sola PR.

Primer bloque:

```text
feat(planning-ui): add articulated planning wizard
```

Alcance:

```text
1. Añadir Planificación articulada a Mi espacio.
2. Añadir selector:
   - Experiencia
   - Unidad
   - Proyecto
3. Crear wizard V1.
4. Construir PlanningContainer 2.0 manualmente.
5. Guardar mediante PlanningRepository.
6. Cargar y editar.
7. No integrar IA todavía.
8. No generar sesiones todavía.
```

Cuando este bloque quede verde, pasar a:

```text
planning.map.generate
```

---

# 41. Prompt para Codex — Primer bloque

```text
Trabaja sobre el repositorio:

dppablito4-oss/space-lab-sesiones-educ

Usa el Planning Core V3 ya existente como arquitectura estable.

Implementa únicamente el primer bloque de Experiencias/Unidades V1:

OBJETIVO
Crear la entrada visual "Planificación articulada" y un wizard manual
capaz de crear, editar, guardar y cargar PlanningContainer 2.0.

REQUISITOS

1. Mantén "Sesión individual" exactamente como funciona hoy.
2. Agrega en Mi espacio una segunda opción:
   "Planificación articulada".
3. Permite seleccionar:
   - Experiencia de aprendizaje
   - Unidad
   - Proyecto
4. Implementa un wizard con:
   - Contexto
   - Propósito
   - Currículo
   - Metodología
   - Producto/evidencias
   - Secuencia
   - Revisión
5. El resultado debe ser PlanningContainer schemaVersion 2.0.
6. Usa PlanningContainerV2 para validación.
7. Usa PlanningRepository para persistencia.
8. Debe poder cerrar y volver a abrir una planificación.
9. Permite editar un borrador.
10. Mantén status=draft mientras esté incompleto.
11. No integres planning.map.generate todavía.
12. No generes SessionDocument todavía.
13. No modifiques SessionDocument v1.
14. No agregues nuevos perfiles de Primaria o Inicial.
15. No modifiques SaaS Core, billing, créditos o AI Gateway.
16. Mantén la UI coherente con el diseño actual.
17. Añade tests para:
    - crear PlanningContainer 2.0 desde wizard;
    - guardar;
    - cargar;
    - editar;
    - validar draft;
    - mantener Sesión individual sin regresiones.
18. Ejecuta toda la suite.
19. Actualiza hashes de assets si corresponde.
20. Detente al terminar.

Definition of Done:
- Planificación articulada visible.
- Wizard funcional.
- PlanningContainer 2.0 manual editable.
- persistencia local/Supabase reutilizada.
- Sesión individual intacta.
- CI verde.
```

---

# 42. Regla final

**No seguir diseñando arquitectura en abstracto.**

La arquitectura base ya existe.

Ahora hay que demostrar una vertical completa:

```text
Planificación
→ mapa
→ sesión vinculada
```

Primero en Secundaria.

Después ampliar conocimiento pedagógico a Primaria e Inicial.
