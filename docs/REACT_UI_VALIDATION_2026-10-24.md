# Validación de la interfaz — 24 de octubre de 2026

Rama: `feature/beta-quick-session-ux`. Sin despliegue a producción.

## Resultados locales

- Compilación de React y comprobación TypeScript: correctas.
- 50 suites JavaScript: correctas.
- 46 scripts Python del flujo de CI: correctos, con la repetición del caso PDF indicada abajo.
- 27 pruebas Deno de prompts, contexto vinculado, autorización y créditos: correctas.
- Comprobación de tipos de las cinco Edge Functions: correcta.
- Recorrido adicional de planificación con IA en el host React, en móvil y escritorio: correcto.
- Revisión visual de sesiones y unidades en claro/oscuro, a 390 y 1440 px: sin desbordamiento horizontal. Barra lateral conservada en escritorio; menú desplegable en móvil.

Las regresiones comprueban niveles y grados, currículo, adjuntos, navegación por
teclado, cambio entre modo rápido y avanzado, sesiones guardadas y recarga,
planificaciones con siete sesiones, reordenación, guardado y recuperación,
sesiones vinculadas, rechazo por permisos/créditos, temas y accesibilidad.
Se generan Word y PDF reales; se comprueban OMML, estructura de tablas,
geometría del documento y conservación del contenido largo en el PDF.

## Hallazgos corregidos

1. Al terminar una propuesta IA mientras se cerraba el menú móvil, Radix podía
   devolver el foco al botón del menú. Ahora conserva el foco si el resultado
   de planificación o un diálogo ya lo recibió. La prueba adicional recorre
   cambio de tema e intento de navegación con una petición pendiente, error,
   reintento, regeneración, descarte, aceptación y guardado sin duplicar llamadas.
2. La prueba de paginación PDF intentaba sobrescribir un artefacto bloqueado
   por Windows. Las verificaciones del contenido ya habían pasado; el error
   estaba en la escritura del archivo de QA. Ahora crea un PDF con nombre único
   y conserva el anterior. La repetición completa pasó.

## Alcance de la evidencia

Las pruebas de interfaz simulan cuenta, proveedor IA y sincronización. No consumen
créditos ni acreditan la disponibilidad de servicios de producción. La revisión
Word comprueba el archivo y su XML; no sustituye abrirlo en Microsoft Word.

Se comprueba que cancelar la salida conserva cambios y que los documentos
guardados se recuperan. Esto no garantiza recuperar cambios que no se guardaron
después de cerrar forzosamente el navegador. La generación sigue requiriendo
mantener la pestaña abierta; no se añadió una cola persistente en segundo plano.

Los registros locales están en `artifacts/quick-ux-validation`; las capturas de
los temas están en `artifacts/react-palette`. Ambos directorios se excluyen de Git.
