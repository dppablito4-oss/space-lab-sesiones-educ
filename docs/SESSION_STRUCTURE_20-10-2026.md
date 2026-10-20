# Estructura de sesiones recuperada — 20 de octubre de 2026

Se compararon las capturas y el Word proporcionado por el propietario con la
versión `8fb4de1` (100 commits antes del HEAD inicial `1e98594`). La plantilla
ya conservaba la cuadrícula general. La migración de prompts al servidor perdió
el esquema explícito de los procesos de inicio y cierre; la proyección de datos
de la vista previa también omitía títulos desconocidos y no respetaba siempre
el orden canónico. La metodología global de proyectos podía desplazar la del área.

## Secuencia común

1. Datos informativos, título, propósito y conocimientos.
2. Propósitos de aprendizaje: competencia, estándar, desempeño, capacidades,
   criterios, evidencia e instrumento.
3. Competencias y enfoques transversales, valores, actitudes y recursos.
4. Inicio: motivación, saberes previos, problematización, propósito y organización.
5. Desarrollo: cada proceso del método con título y actividades concretas,
   preguntas mediadoras, acciones de docente/estudiantes y evidencias parciales.
   En Matemática: familiarización, búsqueda/ejecución de estrategias, socialización
   y reflexión/formalización, con ejemplos resueltos paso a paso.
6. Cierre: metacognición, evaluación formativa y extensión/refuerzo.
7. Firmas, lista de cotejo y ficha cuando corresponda al documento.

La suma de tiempos respeta la duración solicitada. La vista previa conserva los
títulos recibidos y no inventa tiempos parciales. El método seleccionado queda
guardado y se restaura al abrir la sesión. Los campos curriculares elegidos por
el docente prevalecen sobre el texto generado, incluido el desempeño si la IA
lo omite. Los borradores y documentos históricos parciales siguen siendo editables;
las comprobaciones de secuencia completa se aplican a nuevas generaciones.

## Unidades y experiencias

El mapa de planificación sigue organizando sesiones, hitos y productos; cada
sesión vinculada utiliza la misma estructura completa que una individual. Se
mantienen el snapshot revisado, la sesión elegida y el currículo correspondiente.
La metodología de proyecto organiza el trabajo sin exigir terminar todo el proyecto
en una sola sesión y conserva los procesos didácticos del área. Se corrigió además
la selección por defecto de Ciencias Sociales, que podía confundirse con Ciencias.

## Comprobaciones

- Regresiones de esquema de prompt para inicio/cierre, unidad y experiencia,
  proyectos con didáctica matemática y selección de Ciencias Sociales.
- Pruebas de títulos, orden y contenido en estándar, inicial, laboratorio y
  refuerzo; compatibilidad con documentos antiguos y exportación canónica.
- Chromium con el controlador, validador, guardado y reapertura reales para sesión
  individual, unidad y experiencia; la IA se sustituye por una respuesta conocida
  en esta regresión local. El desempeño se omite deliberadamente en esa respuesta
  para comprobar que se recupera el dato elegido por el docente.
- Dos generaciones pagadas con datos sintéticos y la clave remota ya autorizada:
  individual en 64,27 s y vinculada a una unidad revisada en 68,55 s. La primera
  omitió el desempeño; se reutilizó esa respuesta para probar la corrección del
  adaptador con el dato del docente, sin pagar otra generación. Ambas terminaron
  con cuatro procesos de inicio, cuatro de Matemática y tres de cierre.
- Word nativo generado: 75 914 bytes individual y 74 536 bytes unidad. Se
  verificaron títulos y orden en las celdas del documento; Microsoft Word abrió
  ambos y produjo PDF, revisado visualmente. No se copió la lista de estudiantes
  ni se publicó el documento privado de referencia.
- Generador remoto activo: gateway v8, OpenAI v23, Gemini v20, DeepSeek v27.
  Prompt `2026-10-v4-secuencia`. No se cambiaron claves ni créditos de usuarios
  existentes. Las cuentas y planificaciones sintéticas se eliminaron al terminar.

Ejemplos y resultados locales, excluidos de Git:

- `artifacts/beta-readiness/restored-sequence/individual.docx` y `individual.pdf`.
- `artifacts/beta-readiness/restored-sequence/unidad.docx` y `unidad.pdf`.
- `artifacts/beta-readiness/restored-sequence/report.json` y `function-versions.json`.

La prueba real de proveedor cubrió individual y unidad; la experiencia se cubre
en el constructor de prompts y en la regresión completa de navegador. Los casos
descritos comprueban estructura y exportación, no certifican todo el contenido
pedagógico de cualquier respuesta futura. El docente debe revisar cada sesión.
