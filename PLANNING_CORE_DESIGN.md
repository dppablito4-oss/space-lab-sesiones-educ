# Space Lab — Planning Core V3

Este documento convierte la Arquitectura Pedagógica V3 en decisiones técnicas implementables. `SessionDocumentV1` permanece como contrato de sesión. El Planning Core es una capa superior y no obliga a que una sesión pertenezca a una planificación.

## Principios

1. `PlanningType`, metodología, perfil pedagógico y perfil didáctico son conceptos independientes.
2. Una planificación se genera y revisa como mapa antes de producir documentos de secuencia.
3. Secundaria es el primer piloto y reutiliza `SessionDocumentV1`.
4. Los perfiles son datos versionados; la lógica de aplicación no dispersa reglas por metodología.
5. Las recomendaciones pedagógicas generan advertencias. Los errores se reservan para contratos rotos o referencias inexistentes.
6. Un borrador incompleto puede guardarse. El estado `reviewed` exige completitud estructural.
7. Una sesión vinculada conserva un snapshot de la revisión que la originó.

## Identificadores

- Planificaciones, hitos, elementos de secuencia y productos: UUID o identificador opaco estable.
- Currículo, perfiles y metodologías: slugs semánticos versionados.
- Una referencia a un perfil incluye su `id` y `profileVersion`.

## PlanningContainer 2.0

```text
PlanningContainer
├── identity
├── administrativeContext
├── learnerContext
├── significantSituation
├── drivingQuestion
├── purpose
├── methodologyConfig
├── curriculumMap[]
├── transversalElements[]
├── finalProduct
├── milestones[]
├── sequence[]
├── assessmentPlan
├── resources[]
├── bibliography[]
└── audit
```

`identity` es la fuente única para título, tipo, nivel, ciclo, grado/edad y duración. Los datos institucionales no se duplican en el contexto curricular.

## Metodología

`methodologyConfig.primary` referencia un `MethodologyProfile`. `supportingStrategies` contiene estrategias complementarias y evita usar la palabra `secondary`, reservada para el nivel educativo. Una configuración personalizada declara nombre y fases propias.

Las reglas de un perfil usan severidad:

```text
error       contrato o referencia inválida
warning     posible incoherencia pedagógica
suggestion  oportunidad de mejora
```

## Mapa curricular

Cada entrada de `curriculumMap` relaciona un área y una competencia con capacidades, estándar, desempeños, criterios y evidencias esperadas. La secuencia referencia estos identificadores en vez de copiar bloques completos.

## Hitos, secuencia y productos

Un `Milestone` agrupa uno o más elementos de secuencia y puede producir un producto parcial. No es un tipo de sesión. Un `SequenceItem` puede originar un documento y mantiene referencias explícitas a hito, currículo, criterios, evidencias e instrumentos.

```text
evidencia observable → producto parcial → producto final integrador
```

El producto final puede ser `null` cuando la metodología no lo necesita.

## Generación

```text
Teacher Input
→ PedagogicalContextResolver
→ Generate Planning Map
→ validación y revisión docente
→ Generate Sequence Item
→ SessionDocumentV1 u otro contrato según nivel
```

Acciones previstas del gateway: `planning.map.generate`, `planning.sequence.generate`, `planning.item.generate` y `planning.item.regenerate`.

## Compatibilidad

`PlanningContainer 1.0` se conserva para lectura. Los nuevos mapas usan `2.0`. La persistencia local y Supabase guardan el JSON completo y continúan utilizando revisión, soft delete y RLS por usuario.
