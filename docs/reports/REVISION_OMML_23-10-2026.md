# Revisión de fórmulas y exportación — 23 de octubre de 2026

## Fallos corregidos

- Los delimitadores `\(...\)` no reconocían correctamente expresiones con comandos LaTeX.
- `\sqrt[3]{8}` podía producir una raíz incorrecta. Ahora el índice y el radicando ocupan sus respectivos elementos OMML.
- Los argumentos separados por espacios y los exponentes con espacios no se procesaban correctamente. Las entradas con scripts duplicados se rechazan para evitar resultados silenciosamente incorrectos.
- Trigonometría, logaritmos, variantes de fracción, unidades, vectores, sumatorias, integrales y delimitadores ajustables tienen salida nativa editable. El tamaño y el color de las ecuaciones se ajustan al contexto.
- Las fórmulas de títulos, instrucciones de ficha y criterios de listas de cotejo podían quedar como LaTeX plano; convertir títulos a mayúsculas también alteraba sus comandos.
- Las actividades de ficha escritas como texto plano podían desaparecer.
- Se protegieron los signos de comparación dentro de fórmulas HTML y las fórmulas de varias líneas para que los analizadores no eliminen contenido.
- La sanitización de la interfaz ahora recupera una sola copia del LaTeX desde las anotaciones KaTeX, conservando las fórmulas al guardar/reabrir y limpiar formato.
- La exportación PDF nativa se ejecuta con inicialización COM en su hilo y una instancia oculta de Word independiente de las ventanas del usuario. La ruta anterior fallaba en el servidor y caía al PDF alternativo.
- El PDF alternativo usaba páginas de altura fija con contenido oculto; podía omitir desarrollo y cierre. Ahora permite paginación del contenido largo. También se corrigieron los escapes de los delimitadores de MathJax.

## Evidencia

Microsoft Word abrió los tres ejemplos con 15, 20 y 8 ecuaciones, respectivamente. Después de guardarlos, conservaron las mismas 43 ecuaciones OMML. Los PDF resultantes tienen 2, 5 y 3 páginas. Se revisaron vistas de fórmulas, unidad y sesión.

Ejemplos y resultados: `artifacts/math-review/Formulas_OMML.docx`, `Sesion_con_formulas.docx`, `Unidad_con_formulas.docx`, sus PDF y `audit.json`. El script reproducible es `scripts/audit_word_math_exports.py --word`.

Pasaron las pruebas de OMML, planificación, exportación conjunta, sesiones, contrato y emparejamiento; las 48 pruebas de JavaScript; la prueba de interfaz de Matemática; la conservación de fórmulas en Chromium; la paginación larga del PDF alternativo; composición/versionado del frontend e higiene del repositorio. La verificación del ejecutable incluye ahora un marcador en el proceso con fórmulas: comprobar solamente la cabecera `%PDF` no detectaba la pérdida de contenido.

## Límites que quedan

- Matrices, sistemas por casos y otros entornos LaTeX complejos no tienen conversión OMML nativa. Se intenta imagen y, si no está soportada, se conserva el LaTeX original. No se garantiza que todas las expresiones sean editables.
- Los delimitadores de fórmula son necesarios para distinguir matemáticas de texto normal.
- La alternativa PDF de Chromium sigue cargando MathJax desde una CDN; sin Word y sin acceso a esa CDN, la composición de fórmulas puede quedar como LaTeX. La prueba alternativa de paginación se ejecutó sin red y valida conservación del contenido, no composición matemática.
- Esta revisión no repitió llamadas reales de IA, tiempos de generación ni persistencia remota. Se usaron documentos y fixtures locales.

El motor local se actualizó a 1.4.5. La estructura de referencia de las unidades y las orientaciones de los documentos conjuntos se conservan.

El ejecutable final pasó la verificación completa: unidad Word de ocho tablas, PDF con el marcador del proceso matemático presente y Word conjunto con raíces e integrales OMML. El PDF corregido tiene 226.584 bytes; la salida anterior de 118.456 bytes omitía el proceso comprobado.

Referencia técnica consultada: [OfficeMath de Microsoft](https://devblogs.microsoft.com/math-in-office/officemath/) y [estructura de radicales OMML](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.math.radical?view=openxml-3.0.1).
