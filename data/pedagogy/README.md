# Catálogo pedagógico de Space Lab

Este directorio es la fuente de verdad versionada para las decisiones pedagógicas que usa la aplicación. No reemplaza el Currículo Nacional ni convierte una orientación didáctica en una secuencia obligatoria.

## Capas de información

1. `normative_curriculum`: nombres oficiales de competencias, capacidades, ciclos y grados.
2. `official_guidance`: orientaciones metodológicas publicadas por el Ministerio de Educación.
3. `space_lab_recommendation`: decisiones editoriales adaptables para generar mejores propuestas.

Toda recomendación interna debe declarar las fuentes oficiales de las que se deriva. Los procesos didácticos se modelan como recomendaciones y nunca como pasos universales obligatorios.

## Estructura

```text
data/pedagogy/
├── catalog.json
├── sources.json
├── schemas/
│   ├── pedagogical-profile.schema.json
│   ├── planning-container.schema.json
│   ├── planning-container-v2.schema.json
│   ├── session-planning-link.schema.json
│   ├── session-planning-link-v2.schema.json
│   └── methodology-profile.schema.json
├── methodologies/
│   ├── catalog.json
│   ├── sources.json
│   └── *.json
├── fixtures/
│   └── secondary_math_project_unit.v2.json
├── pedagogical/
│   └── secondary-cycle-vi.json
├── didactics/
│   └── secondary/cycle-vi/mathematics/quantity.json
└── secondary/
    └── cycle-vi/
        └── mathematics/
            └── quantity.json
```

Los perfiles publicados deben estar registrados en `catalog.json` y pasar `node tests/pedagogy-catalog.test.js`.

`PlanningContainer v1` modela una unidad, proyecto, experiencia o planificación de contexto con revisiones explícitas. Una sesión mantiene su independencia: el vínculo se guarda en el sobre de persistencia como `session.planning`, fuera de `SessionDocumentV1`. Las sesiones vinculadas reciben un snapshot del contexto heredado para que una revisión posterior del plan no cambie documentos ya generados.

`PlanningContainer 2.0` implementa Planning Core V3: separa tipo de planificación y metodología, incorpora mapa curricular, hitos, productos parciales/finales y evaluación global. Los perfiles metodológicos son recomendaciones versionadas y nunca pasos obligatorios.
