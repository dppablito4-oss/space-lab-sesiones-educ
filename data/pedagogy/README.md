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
│   └── pedagogical-profile.schema.json
└── secondary/
    └── cycle-vi/
        └── mathematics/
            └── quantity.json
```

Los perfiles publicados deben estar registrados en `catalog.json` y pasar `node tests/pedagogy-catalog.test.js`.
