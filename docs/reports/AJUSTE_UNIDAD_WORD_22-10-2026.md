# Unidad Word según referencia Monte Alegre

Se comparó la exportación con el archivo `UNIDAD DIDACTICA VI  2° AÑO JEC MONTE ALEGRE.docx` proporcionado por el usuario. Se conservó intacto el documento original.

## Cambios

- Unidad en A4 horizontal con ocho tablas: datos administrativos, situación significativa, propósito/producto, estándares, competencias transversales, enfoques/valores, secuencia de sesiones y recursos/evaluación/bibliografía.
- Cuadrícula administrativa de tres filas, títulos, colores, celdas combinadas y encabezados repetidos siguiendo la referencia. El número de páginas depende del contenido generado.
- Plantilla específica `assets/templates/planning_template_v1.docx`, con membrete en línea para evitar interferencias con las tablas. No incluye el cuerpo ni los nombres personales del documento de referencia.
- En las sesiones solamente se ajustaron márgenes y distancia del encabezado. La comparación del XML del cuerpo, excluyendo propiedades de sección, resultó idéntica para la sesión de ejemplo antes y después del cambio.
- La exportación conjunta conserva la unidad horizontal y las sesiones verticales, con sus encabezados y su orden curricular.
- Motor local compilado en versión 1.4.4.

## Validación

Se exportaron los ejemplos guardados del proyecto sobre consumo de agua y sus siete sesiones. Microsoft Word produjo los PDF finales: unidad de 5 páginas, primera sesión de 10 páginas y documento completo de 79 páginas. No se detectaron páginas con menos de 100 caracteres de texto; esta comprobación no sustituye la revisión visual de los espacios. Se revisaron también las vistas de páginas de la unidad y la posición del membrete en páginas sucesivas.

Pasaron las pruebas de estructura y geometría de planificación, contenido y orden de sesiones, exportación conjunta, constructor de sesiones, fidelidad y ecuaciones OMML. También pasó la verificación del ejecutable real: versión, exportación de unidad, PDF de sesión y Word conjunto.

Los ejemplos locales están en `artifacts/unit-reference/`: `Unidad_formato_Monte_Alegre.docx`, `Sesion_encabezado_corregido.docx` y `Unidad_y_7_sesiones.docx`, junto con sus PDF. Son resultados de validación ignorados por Git.

Esta revisión valida el formato de documentos ya guardados; no realizó nuevas llamadas de IA ni otra prueba de persistencia en la nube.
