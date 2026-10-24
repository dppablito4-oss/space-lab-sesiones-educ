# Plan de implementación

## Incremento 0: auditoría

Documentar arquitectura, riesgos y permisos antes de editar el panel. Inventariar los dominios existentes. No aplicar cambios a producción.

## Incremento 1: base segura y operaciones de beta

1. Retirar la purga automática al consultar sesiones y sustituir la descarga general de contenido por metadatos paginados.
2. Incorporar permisos granulares, auditoría protegida, operaciones idempotentes y MFA para escrituras. Preservar los operadores existentes y proteger propietarios.
3. Crear el centro visual con dashboard verificable, usuarios, créditos, restricciones, planes/asignaciones manuales, cuotas, control general de IA y consulta de auditoría.
4. Aplicar las restricciones en servidor, conservar la contabilidad actual y negar acceso por defecto.
5. Probar SQL/RLS con una base aislada y recorridos de navegador con datos sintéticos. Ejecutar regresiones docentes.

## Incrementos posteriores

- Versiones comerciales de planes/precios; pagos y reconciliación solo cuando se identifique una pasarela real.
- Proveedores/modelos/prompts con publicación versionada, pruebas de contrato y rollback; no exponer ni editar secretos desde respuestas de lectura.
- Currículo y plantillas con procedencia y revisión, soporte, comunicaciones, segmentación, eventos de producto y operadores avanzados.
- Gestión de Auth e infraestructura mediante funciones privilegiadas expresamente configuradas. No enviar correos ni hacer cobros al validar.

Cada módulo pendiente se etiqueta como tal. La existencia del menú no acredita una fase terminada. El estado final documentará qué operaciones funcionan, sus pruebas y las integraciones que faltan.

## Entrega

Commits revisables y PR contra main. No ejecutar migraciones remotas, fusionar el PR ni publicar automáticamente este centro. La autorización previa para publicar las correcciones docentes no se interpreta como autorización para instalar una administración nueva en producción.
