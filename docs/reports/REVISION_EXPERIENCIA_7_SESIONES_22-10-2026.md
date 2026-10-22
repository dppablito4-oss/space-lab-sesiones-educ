# Revisión real: experiencia por proyectos y siete sesiones

Fecha: 22 de octubre de 2026, Bogotá.

## Alcance y evidencia

Se creó una cuenta temporal confirmada, sin enviar correo, y se inició sesión
mediante el formulario del navegador en localhost. Solo esa cuenta recibió acceso
beta manual para probar planificación. La generación se inició con los controles
de la interfaz y usó las Edge Functions reales; no se sustituyeron respuestas de IA
por fixtures. Los fixtures se utilizaron únicamente en las pruebas de regresión.
La cuenta temporal se eliminó al terminar, después de comprobar la recuperación
remota. Se conservaron los ejemplos locales; sus registros remotos de prueba no
quedan como documentos de una cuenta de producción.

Ejemplo: **Proyecto: cuidamos el agua con decisiones matemáticas**, experiencia
de aprendizaje con metodología de proyectos, Matemática de segundo de Secundaria,
ciclo VI, siete sesiones de 90 minutos distribuidas en siete semanas.

La respuesta real del mapa necesitó reparar vínculos inversos de hitos omitidos.
Se reutilizó esa respuesta para comprobar la reparación, sin inventar contenido:
los ids se obtienen de los vínculos explícitos de cada sesión. Las referencias
curriculares inválidas siguen rechazándose. Los prompts remotos ya incorporan
el contrato estructural y el número de sesiones solicitado.

## Tiempos observados

Los tiempos incluyen la espera de la generación y la comprobación del guardado
local. No incluyen el tiempo dedicado a depurar ni constituyen una garantía de
latencia para futuras solicitudes.

| Paso | Tiempo |
| --- | ---: |
| Mapa de la experiencia | 68,25 s |
| 1. ¿Qué sabemos del consumo de agua en la escuela? | 56,64 s |
| 2. Diseñamos cómo medir y registrar el consumo | 57,69 s |
| 3. Medimos y organizamos los datos del agua | 50,25 s |
| 4. Calculamos cantidades y posibles ahorros | 58,12 s |
| 5. Expresamos el ahorro con porcentajes | 50,08 s |
| 6. Construimos y revisamos un plan viable | 63,30 s |
| 7. Presentamos el plan y reflexionamos sobre nuestras decisiones | 59,81 s |
| Total de siete sesiones | 395,89 s — 6 min 36 s |
| Mapa y siete sesiones | 464,14 s — 7 min 44 s |

La depuración consumió 67 créditos internos: cuatro mapas de 8 créditos y siete
sesiones de 5 créditos. Un recorrido con un solo mapa y siete sesiones, según
esas tarifas observadas, suma 43 créditos. No se contrató una suscripción ni se
realizó ningún pago externo.

## Correcciones realizadas

- Contrato explícito del mapa y envío del título y cantidad de sesiones.
- Comparación de currículo independiente del orden de las claves JSON.
- Reconstrucción de vínculos inversos omitidos, sin sustituir referencias inválidas.
- Guardado automático al completar una generación y actualización de la secuencia.
- Confirmación accesible al pasar de planificación a otra sesión; una sesión
  guardada sin cambios ya no exige descartar cambios inexistentes.
- La sugerencia de imágenes externas para fichas deja de interrumpir las sesiones
  vinculadas; continúa disponible desde sus controles.
- Normalización de instrucciones, secciones, tablas y preguntas de las fichas.
- Normalización de valores, actitudes y descripciones transversales para evitar
  perder texto o imprimir representaciones de arrays.
- Compactación de párrafos vacíos de tablas y de las listas de cotejo.
- Exportación adicional de la planificación con todas sus sesiones en orden.
  Una sesión faltante o un vínculo incorrecto bloquean el documento completo.
- Empaquetado de recursos de composición y actualización del motor a **1.4.3**.

## Guardado y segundo plano

Las siete sesiones quedaron en el almacenamiento local y en Supabase. Se abrió
un contexto de navegador nuevo, trasladando únicamente la autenticación, sin
copiar las cachés de documentos. La sincronización descargó la experiencia y
recuperó las siete sesiones generadas. También se comprobó la reapertura tras
recargar la interfaz.

La generación actual depende de mantener abierto el navegador y la petición.
Puede continuar mientras se trabaja en otra aplicación, pero no hay una cola
durable que garantice terminar y recuperar una generación interrumpida al cerrar
la pestaña, cerrar el navegador o suspender el equipo. El guardado automático
protege los resultados ya recibidos; no sustituye esa cola.

## Word y fórmulas

El documento completo se descargó con el botón de la interfaz y se abrió con
Microsoft Word instalado. Incluye los encabezados de las sesiones 1 a 7 en ese
orden, 105 objetos OMML, 14 fracciones nativas y 93 tablas. Se generó también PDF
desde Word para inspeccionar la paginación. El primer ejemplo pasó de 11 a 9
páginas: se eliminó la página aislada de firmas y se recuperó la ficha.
El conjunto completo tiene 80 páginas. El análisis del PDF no detectó páginas
con menos de 180 caracteres de cuerpo, excluyendo encabezados y pies. Se
inspeccionaron también páginas representativas renderizadas. Esto comprueba
este ejemplo; no garantiza la paginación de cualquier contenido futuro.

Los detalles de paginación final y las imágenes están en `word-audit.json` dentro
de los artefactos locales. Las ecuaciones soportadas se conservan editables;
notación fuera del subconjunto del conversor todavía puede recurrir a imagen o
texto LaTeX. No se afirma compatibilidad OMML universal.

Artefactos locales conservados en `artifacts/project-review/`:

- `Experiencia_y_7_sesiones.docx` y su PDF generado por Word.
- `Ejemplo_Experiencia_y_7_sesiones.zip`, con la experiencia y siete Word separados.
- `session-01.json` a `session-07.json`, mapa y tiempos.
- `cloud-recovery.json`, `word-audit.json`, capturas y verificaciones del EXE.

El ejecutable actualizado está en `backend/dist/pablitopyhost.exe`. La compilación
local no publica automáticamente una nueva release ni actualiza el sitio web.
Los prompts de las Edge Functions sí se desplegaron para validar el recorrido.
La validación final pasó 62 scripts de JavaScript, Deno y Python, cinco recorridos
de navegador y la verificación del ejecutable Windows con DOCX, PDF y documento
con sesiones adjuntas. Ruff, composición, hashes de assets y enlaces también pasan.

## Mejoras siguientes propuestas

1. Cola persistente de generación con estados por sesión, reanudación e idempotencia.
2. Acción «Generar las siete» con progreso, cancelación y reintento solo de fallidas.
3. Exportación compacta y selección de anexos, conservando la versión detallada.
4. Validación de calidad específica para fichas y fórmulas antes de consumir una
   generación como terminada, con reparación estructural antes de pedir otro texto.
