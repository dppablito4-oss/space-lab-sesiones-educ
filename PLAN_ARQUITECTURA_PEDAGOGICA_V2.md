# Space Lab — Plan de Arquitectura Pedagógica V2

**Objetivo:** evolucionar Space Lab desde un generador de sesiones independientes hacia una plataforma de planificación pedagógica articulada, sin romper el flujo actual y respetando las diferencias entre Inicial, Primaria y Secundaria.

---

# 1. Principio general

El sistema actual se conserva.

```text
MI ESPACIO
│
├── Sesión individual
│   └── flujo actual
│
└── Planificación articulada
    └── Experiencia / Unidad / Proyecto
```

La opción **Sesión individual** seguirá funcionando como ahora:

```text
Copiloto
→ Datos
→ Propósitos
→ Diseño
→ Alumnos
→ Fichas
```

No se elimina.
No se reescribe.
No se convierte obligatoriamente en parte de una unidad.

La nueva arquitectura se construirá por encima.

---

# 2. Nueva entrada: Planificación articulada

La nueva opción comenzará preguntando:

```text
PLANIFICACIÓN ARTICULADA
        ↓
Nivel educativo
        ↓
Ciclo
        ↓
Edad / grado
        ↓
Tipo de planificación
        ↓
Área(s)
        ↓
Competencias
```

Niveles:

```text
Inicial
Primaria
Secundaria
```

Tipos de planificación:

```text
Unidad
Proyecto
Experiencia de aprendizaje
Planificación de contexto
```

---

# 3. Crear un objeto superior: PlanningContainer

No crear `UnidadDocument` y `ExperienceDocument` completamente separados desde el inicio.

Crear un contenedor común:

```text
PlanningContainer
```

Estructura conceptual:

```text
PlanningContainer
│
├── identity
│   ├── id
│   ├── title
│   ├── planningType
│   ├── level
│   ├── cycle
│   ├── grade
│   ├── age
│   └── duration
│
├── context
│   ├── institution
│   ├── teacher
│   ├── classroom
│   ├── students
│   ├── diagnosis
│   ├── interests
│   └── localContext
│
├── significantSituation
│
├── learningPurpose
│   ├── competencies
│   ├── capacities
│   ├── performances
│   ├── standards
│   └── transversalApproaches
│
├── assessment
│   ├── criteria
│   ├── evidence
│   ├── products
│   └── instruments
│
└── sequence[]
```

Tipos:

```text
planningType:
- learning_experience
- unit
- project
- context
```

---

# 4. No todo debe convertirse en SessionDocument

La secuencia interna depende del nivel.

## Secundaria

```text
Unidad / Experiencia
│
├── Sesión 01
├── Sesión 02
├── Sesión 03
├── Sesión 04
└── Sesión 05
```

Cada sesión puede reutilizar:

```text
SessionDocument v1
```

---

## Primaria

Puede usar también sesiones:

```text
Unidad
│
├── Sesión 01
├── Sesión 02
├── Sesión 03
└── Sesión 04
```

Pero debe permitir planificación integrada entre áreas.

Ejemplo:

```text
Situación significativa
      │
      ├── Comunicación
      ├── Matemática
      ├── Ciencia y Tecnología
      └── Personal Social
```

Las sesiones pueden pertenecer a distintas áreas pero compartir el mismo propósito global.

---

## Inicial

No forzar `SessionDocument`.

Especialmente en Ciclo II:

```text
Proyecto / Unidad
│
├── Actividad 01
├── Actividad 02
├── Actividad 03
├── Taller
├── Juego
├── Exploración
└── Actividad de cierre
```

Crear:

```text
InitialActivityDocument
```

en lugar de convertir toda actividad en una sesión de Secundaria simplificada.

---

# 5. Diferenciar Ciclo I y Ciclo II en Inicial

No tratar “Inicial” como una sola estructura.

```text
INITIAL
│
├── Ciclo I
│   └── ContextPlanningDocument
│
└── Ciclo II
    ├── Project
    ├── Unit
    └── InitialActivityDocument
```

Prioridad inicial de implementación:

```text
Ciclo II
3 años
4 años
5 años
```

Ciclo I puede quedar diseñado pero implementarse posteriormente.

---

# 6. Crear PedagogicalProfile

Será una de las piezas centrales.

```text
PedagogicalProfile
│
├── level
├── cycle
├── grade / age
├── area
├── competency
│
├── recommendedStructure
├── didacticStrategies
├── representationProgression
├── activityCharacteristics
├── assessmentCharacteristics
└── promptRules
```

Ejemplo:

```text
INITIAL
Cycle II
5 años
Matemática
Resuelve problemas de cantidad
```

Reglas sugeridas:

```text
Priorizar:
✓ juego
✓ experiencia corporal
✓ manipulación
✓ agrupación
✓ comparación
✓ conteo
✓ representación
✓ comunicación de hallazgos

Evitar:
✗ explicación abstracta extensa
✗ algoritmos formales prematuros
✗ ficha como actividad central
✗ secuencia excesivamente expositiva
```

---

# 7. Separar procesos pedagógicos de estrategias didácticas

Crear dos conceptos distintos.

## PedagogicalProcessProfile

Procesos generales:

```text
propósito
reto
saberes previos
mediación
retroalimentación
evaluación formativa
metacognición
```

## DidacticProfile

Depende de:

```text
nivel
área
competencia
```

Ejemplo Matemática:

```text
situación problemática
↓
familiarización
↓
búsqueda de estrategias
↓
representaciones
↓
reflexión / formalización
↓
transferencia
```

No convertir estos procesos en pasos universales obligatorios.

Deben funcionar como estrategias recomendadas.

---

# 8. Flujo UX para crear una planificación

No generar inmediatamente todas las sesiones.

Flujo:

```text
Nueva planificación
        ↓
Nivel / ciclo / grado
        ↓
Unidad / Proyecto / EdA
        ↓
Contexto y diagnóstico
        ↓
Situación significativa
        ↓
Competencias
        ↓
Producto / evidencia
        ↓
Criterios
        ↓
Duración
        ↓
Mapa de planificación
```

Primero se genera únicamente la estructura.

Ejemplo:

```text
UNIDAD: Cuidamos nuestro ambiente

Semana 1
├── Sesión 01
│   Reconocemos problemas ambientales
│
├── Sesión 02
│   Analizamos residuos
│
└── Sesión 03
    Representamos cantidades

Semana 2
├── Sesión 04
├── Sesión 05
└── Producto parcial

Semana 3
└── Producto final
```

El docente revisa esta estructura antes de generar cada documento.

---

# 9. Reutilización del sistema actual

Una sesión vinculada hereda automáticamente el contexto.

```text
PlanningContainer
│
├── contexto
├── competencias
├── producto
├── criterios
├── duración
├── secuencia
│
└── Session 03
```

Cuando el usuario selecciona:

```text
Generar Sesión 03
```

Space Lab reutiliza:

```text
SessionDocument v1
```

pero precarga:

```text
institución
grado
área
competencias
situación significativa
producto
criterios
unidad
sesiones previas
```

El docente no vuelve a introducir esos datos.

---

# 10. Sesiones standalone y linked

No crear dos generadores.

Crear dos estados:

```text
Session
│
├── standalone
└── linked
```

Standalone:

```text
planningContainerId = null
```

Linked:

```text
planningContainerId = uuid
sequenceIndex = 3
```

Ambas siguen usando:

```text
SessionDocument v1
```

cuando corresponda.

---

# 11. Snapshot de contexto

Una sesión ya generada no debe cambiar automáticamente si después se modifica la unidad.

Guardar:

```text
Session
├── planningContainerId
├── planningRevision
└── inheritedContextSnapshot
```

Ejemplo:

```text
Unidad revision 4
↓
genera Sesión 03
↓
Session 03 guarda snapshot revision 4
```

Si posteriormente cambia la unidad:

```text
revision 5
```

la sesión anterior mantiene el contexto con el que fue creada.

---

# 12. Primaria: soporte multiárea

Crear soporte real para unidades integradas.

```text
PlanningContainer
│
└── curriculumAreas[]
    │
    ├── Comunicación
    │   └── competencies[]
    │
    ├── Matemática
    │   └── competencies[]
    │
    ├── Ciencia y Tecnología
    │   └── competencies[]
    │
    └── Personal Social
        └── competencies[]
```

La secuencia puede distribuir las áreas.

Ejemplo:

```text
Sesión 01 — Comunicación
Sesión 02 — Ciencia
Sesión 03 — Matemática
Sesión 04 — Comunicación
Sesión 05 — Producto integrado
```

Todas pertenecen al mismo contexto global.

---

# 13. Inicial: actividades propias

Crear tipos específicos de actividad.

Ejemplos:

```text
learning_activity
psychomotor_workshop
graphic_plastic_workshop
music_workshop
free_play
story_activity
sensory_activity
exploration_activity
```

Ejemplo:

```text
Taller de psicomotricidad
│
├── Asamblea
├── Expresividad motriz
├── Relajación
├── Representación
└── Cierre
```

No obligar esta estructura a usar:

```text
Inicio
Desarrollo
Cierre
```

si pedagógicamente requiere otra secuencia.

---

# 14. Matriz CNEB antes de programar

Antes de construir el nuevo motor, crear una matriz pedagógica formal.

Campos:

```text
Nivel
Ciclo
Edad / grado
Área
Competencia
Capacidades
Estándar
Desempeños
Formas de planificación
Procesos pedagógicos
Estrategias didácticas
Tipos de evidencia
Tipos de actividad
Estructura documental
```

Cobertura:

```text
Inicial
Primaria
Secundaria
```

---

# 15. Convertir la matriz en datos versionados

No esconder toda la lógica dentro de prompts.

Crear:

```text
data/pedagogy/
│
├── initial/
│   ├── cycle-i/
│   └── cycle-ii/
│
├── primary/
│   ├── cycle-iii/
│   ├── cycle-iv/
│   └── cycle-v/
│
└── secondary/
    ├── cycle-vi/
    └── cycle-vii/
```

Ejemplo:

```text
data/pedagogy/initial/cycle-ii/mathematics.json
data/pedagogy/primary/cycle-iv/communication.json
data/pedagogy/secondary/cycle-vii/mathematics.json
```

---

# 16. El AI Gateway debe recibir contexto pedagógico

Ejemplo:

```json
{
  "task": "generate_learning_activity",
  "context": {
    "level": "initial",
    "cycle": "II",
    "age": 5,
    "area": "mathematics",
    "competency": "quantity",
    "planningType": "project"
  }
}
```

El motor pedagógico determina reglas.

Ejemplo:

```text
No generar clase expositiva.
Priorizar juego y manipulación.
Usar contexto cotidiano.
Trabajar comparación y agrupación.
Permitir representación corporal, concreta y gráfica.
Evitar formalización abstracta prematura.
```

---

# 17. Primera implementación: Secundaria

Usar Secundaria como piloto porque reutiliza mejor el sistema actual.

Objetivo:

```text
PlanningContainer
      ↓
Unidad / Experiencia
      ↓
5 sesiones relacionadas
      ↓
SessionDocument v1
```

Validar:

```text
herencia de contexto
progresión entre sesiones
competencias compartidas
criterios
producto final
snapshots
```

---

# 18. Segunda implementación: Primaria

Después implementar:

```text
PrimaryPlanningProfile
```

Agregar:

```text
multiárea
integración curricular
progresión por ciclo
diferencias por grado
```

Validar primero:

```text
3.º / 4.º / 5.º
```

y después ampliar.

---

# 19. Tercera implementación: Inicial Ciclo II

Crear:

```text
InitialPlanningProfile
InitialActivityDocument
```

Priorizar:

```text
3 años
4 años
5 años
```

Tipos:

```text
Proyecto
Unidad
Actividad
Taller
Juego
Exploración
```

El motor debe considerar:

```text
juego
movimiento
manipulación
materiales
experiencia directa
representación
comunicación
```

---

# 20. Cuarta implementación: Inicial Ciclo I

Después:

```text
ContextPlanningDocument
```

No copiar la lógica de Ciclo II.

Diseñarlo alrededor de:

```text
contexto
rutinas
espacio
materiales
interacción
observación
desarrollo
```

---

# 21. Recursos derivados

Cuando Planning Core esté estable:

```text
PlanningContainer
      │
      ├── Presentación
      ├── Ficha
      ├── Evaluación
      ├── Lista de cotejo
      ├── Rúbrica
      ├── Material
      └── Actividad complementaria
```

Estos recursos heredan el contexto.

No crear generadores aislados.

---

# 22. Modelo conceptual final

```text
User
│
└── Workspace
     │
     ├── Standalone Session
     │       └── SessionDocument v1
     │
     └── PlanningContainer
          │
          ├── type
          │   ├── learning_experience
          │   ├── unit
          │   ├── project
          │   └── context
          │
          ├── curriculumContext
          ├── significantSituation
          ├── learningPurposes
          ├── assessment
          │
          └── sequence
               │
               ├── Secondary
               │   └── SessionDocument v1
               │
               ├── Primary
               │   └── SessionDocument v1
               │
               └── Initial
                   └── InitialActivityDocument
```

---

# 23. Orden de implementación

## FASE P0 — Cerrar SaaS Core

```text
M4 subscription → grants
M5 pricing / costos
M6 PostgreSQL / RLS real
M9 migrations source of truth
```

Después:

```text
CORE SaaS V1 = CONGELADO
```

---

## FASE P1 — Investigación pedagógica

Construir:

```text
Matriz CNEB
Inicial
Primaria
Secundaria
```

No programar todavía.

---

## FASE P2 — PedagogicalProfile

Crear:

```text
PedagogicalProfile
PedagogicalProcessProfile
DidacticProfile
```

---

## FASE P3 — PlanningContainer v1

Crear esquema y persistencia.

No generar todavía cientos de documentos.

---

## FASE P4 — Secundaria integrada

Objetivo:

```text
Unidad
→ mapa
→ sesiones vinculadas
→ SessionDocument v1
```

---

## FASE P5 — Primaria integrada

Añadir:

```text
multiárea
unidades integradas
progresión por ciclo
```

---

## FASE P6 — Inicial Ciclo II

Añadir:

```text
InitialActivityDocument
proyectos
unidades
talleres
juego
actividades
```

---

## FASE P7 — Inicial Ciclo I

Añadir:

```text
ContextPlanningDocument
```

---

## FASE P8 — Recursos derivados

Añadir:

```text
presentaciones
fichas
evaluaciones
rúbricas
materiales
```

---

## FASE P9 — Ecosistema

Posteriormente:

```text
Practicantes
Portafolios
Instituciones
Workspaces
Colaboración
Supervisión
```

---

# 24. Regla de arquitectura

No convertir el proyecto en:

```text
if nivel == ...
if grado == ...
if area == ...
if competencia == ...
```

dispersos por todo el frontend.

Las diferencias pedagógicas deben estar encapsuladas en:

```text
PedagogicalProfile
DidacticProfile
PlanningContainer
```

---

# 25. Regla de producto

La opción sencilla siempre permanece.

```text
Necesito una sesión para mañana
↓
Sesión individual
```

Mientras que:

```text
Quiero planificar tres semanas
↓
Planificación articulada
↓
Unidad / Proyecto / Experiencia
```

No obligar al docente a utilizar el sistema complejo.

---

# 26. Resultado esperado

Space Lab evoluciona desde:

```text
Docente
↓
genera una sesión
```

hacia:

```text
Docente
↓
crea planificación
↓
Space Lab entiende nivel/ciclo/contexto
↓
organiza progresión
↓
genera sesiones o actividades
↓
cada documento hereda contexto
↓
genera materiales y evaluación
```

sin perder:

```text
Sesión individual
```

---

# Regla final

**Construir el sistema grande alrededor de lo que ya funciona, no reemplazar lo que ya funciona para construir el sistema grande.**
