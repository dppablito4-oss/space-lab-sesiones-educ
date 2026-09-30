# Catálogo pedagógico de Space Lab

`data/pedagogy/catalog.json` es la única fuente de registro de perfiles activos. No reemplaza el Currículo Nacional ni convierte una orientación didáctica en una secuencia obligatoria.

## Perfiles V3

- `PedagogicalProfile`: características pedagógicas y alcance por nivel, ciclo, grado o edad.
- `CurriculumProfile`: competencia, capacidades y estándar compartidos por ciclo, con desempeños separados por grado y trazabilidad oficial.
- `DidacticProfile`: orientación propia del área y la competencia.
- `MethodologyProfile`: metodología opcional y reglas blandas; declara `suitableScopes` como pares de `level + cycles`.

La ausencia de un alcance metodológico indica que aún no ha sido validado o recomendado; produce una advertencia, no un bloqueo.

## Estructura

```text
data/pedagogy/
├── catalog.json                         registro único
├── sources.json                         fuentes curriculares/guías
├── schemas/
├── pedagogical/
├── curriculum/
├── didactics/
├── methodologies/
│   ├── sources.json
│   └── *.json
├── fixtures/
└── secondary/                           perfiles combinados legacy
```

El catálogo raíz registra por separado `pedagogicalProfiles`, `curriculumProfiles`, `didacticProfiles` y `methodologyProfiles`. `legacyProfiles` existe solo para compatibilidad de lectura, tiene estado `archived` y apunta a sus reemplazos V3. No se deben crear ni mantener nuevos perfiles combinados.

Las recomendaciones internas deben declarar su procedencia. Las metodologías permanecen como `warning` o `suggestion`; no son pasos universales obligatorios.

`PlanningContainer 1.0` se conserva para lectura. `PlanningContainer 2.0` separa tipo de planificación y metodología, incorpora mapa curricular, hitos, productos y evaluación global. `SessionDocumentV1` permanece intacto y el vínculo de una sesión se guarda fuera del documento.

Los cambios deben pasar, como mínimo:

```bash
node tests/pedagogy-catalog.test.js
node tests/methodology-catalog.test.js
node tests/pedagogical-context-resolver.test.js
node tests/secondary-cycle-vii.test.js
```
