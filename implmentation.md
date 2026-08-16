# Plan de implementación

## Estado

Implementación local completada el 2026-08-15. Las fases 1 a 6 y sus pruebas quedaron aplicadas. Permanecen como operaciones externas: ejecutar `database_setup.sql` en Supabase, publicar un nuevo binario y, opcionalmente, limpiar el historial Git antiguo.

## Objetivo

Corregir los hallazgos técnicos sin alterar el diseño pedagógico ni romper la compatibilidad de las sesiones existentes.

## Fase 1 — Sanitización centralizada

1. Crear una utilidad de sanitización reutilizable en el frontend.
2. Definir listas de etiquetas y atributos permitidos para:
   - contenido completo de una sesión;
   - fragmentos de formato generados por IA;
   - listas de criterios.
3. Eliminar etiquetas peligrosas, atributos `on*`, URLs no seguras y estilos no previstos.
4. Aplicar la utilidad al guardar, cargar, sincronizar y renderizar sesiones.

Criterios de aceptación:

- `<script>`, `iframe`, `object`, `embed` y manejadores como `onerror` no sobreviven.
- Se conservan tablas, listas, encabezados y formato pedagógico necesario.
- Las sesiones antiguas se limpian al cargarse sin quedar inutilizables.

## Fase 2 — Panel administrativo

1. Escapar `action`, identificadores y valores de atributos en las tablas.
2. Añadir `sandbox` al iframe de previsualización.
3. Construir el documento mediante `srcdoc` usando HTML saneado.
4. Validar los tokens visuales de diseño antes de usarlos en CSS.

Criterios de aceptación:

- Una sesión con HTML malicioso no ejecuta código en el panel.
- Los registros maliciosos se muestran como texto.
- La previsualización y la impresión continúan funcionando.

## Fase 3 — Respuestas de IA

1. Convertir los criterios generados a texto y reconstruir los elementos `li` localmente.
2. Sanear los fragmentos de texto refinado.
3. Evitar que una respuesta del proveedor introduzca atributos o nodos ejecutables.

Criterios de aceptación:

- Los criterios válidos mantienen su presentación.
- Cualquier HTML no permitido se elimina o se presenta como texto.

## Fase 4 — Motor local

1. Restringir CORS a los orígenes utilizados por el proyecto.
2. Limitar solicitudes a un tamaño razonable.
3. Escuchar en `127.0.0.1`.
4. Garantizar la limpieza de temporales mediante `finally`.

Criterios de aceptación:

- El sitio de producción puede exportar mediante el motor local.
- Orígenes desconocidos no reciben autorización CORS.
- El motor no queda accesible desde otros equipos de la red.
- Una conversión fallida no deja archivos `temp_*.docx` o `temp_*.pdf`.

## Fase 5 — Logos y Storage

1. Validar MIME y tamaño en las dos rutas de subida.
2. Convertir las imágenes aceptadas a un formato raster seguro cuando corresponda.
3. Guardar objetos bajo `{user_id}/`.
4. Listar únicamente la carpeta del usuario actual.
5. Actualizar las políticas RLS de Storage y las restricciones del bucket.

Criterios de aceptación:

- SVG y formatos no autorizados son rechazados.
- Un usuario no puede modificar ni enumerar logos privados de otro usuario.
- Los logos permitidos siguen cargando en los documentos.

## Fase 6 — Mantenimiento y documentación

1. Cambiar los enlaces locales del README por rutas relativas.
2. Añadir pruebas unitarias de sanitización y seguridad.
3. Ampliar el workflow de CI con las nuevas pruebas.
4. Documentar la retirada de artefactos compilados y el despliegue pendiente de SQL/Edge Functions.

## Verificación final

Se ejecutarán:

- comprobación de sintaxis de todos los JavaScript;
- compilación de Python;
- validación de JSON;
- pruebas de almacenamiento;
- pruebas de sanitización;
- prueba de autorización y límite de solicitudes del backend;
- exportación DOCX real;
- exportación PDF real;
- revisión final de `git diff` para evitar cambios ajenos.

## Operaciones que requieren autorización adicional

- Reescritura del historial Git para reducir su tamaño.
- Despliegue de `database_setup.sql` en Supabase.
- Redespliegue de Edge Functions.
- Publicación de un nuevo ejecutable o GitHub Release.
