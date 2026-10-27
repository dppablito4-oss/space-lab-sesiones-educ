# Documentación del repositorio

El [README principal](../README.md) describe la instalación y la arquitectura.
El [plan de beta](../PLAN_BETA.md) conserva el seguimiento operativo en la raíz.

## Guías actuales

- [Avance guardado y pasos para continuar el 26 de octubre](reports/CONTINUIDAD_25-10-2026.md).
- [Correcciones de seguridad y pruebas del 25 de octubre](reports/CORRECCIONES_AUDITORIA_25-10-2026.md).
- [Operación de la beta](BETA_OPERATIONS.md).
- [Composición del frontend](FRONTEND_COMPOSITION.md).
- [Estructura de sesiones](SESSION_STRUCTURE_20-10-2026.md).
- [Interfaz](UI_20-10-2026.md).

## Planes y diseño

- [Arquitectura pedagógica](plans/PLAN_ARQUITECTURA_PEDAGOGICA_V2.md).
- [Planning Core](plans/PLANNING_CORE_DESIGN.md).
- [Experiencias y unidades](plans/PLAN_EXPERIENCIAS_UNIDADES_V1.md).
- [Refactorización SaaS](plans/PLAN_REFACTORIZACION_SAAS.md), antes `plan_refacter.md`.
- [Exportación híbrida futura](plans/PLAN_EXPORTACION_HIBRIDA_RENDER_FUTURO.md).

## Informes y evidencia

Estos documentos conservan el estado y las fechas de sus revisiones originales.

- [Experiencia real de siete sesiones, Word y guardado](reports/REVISION_EXPERIENCIA_7_SESIONES_22-10-2026.md).
- [Ajuste de unidad Word según referencia Monte Alegre](reports/AJUSTE_UNIDAD_WORD_22-10-2026.md).
- [Fórmulas OMML y conservación de contenido en PDF](reports/REVISION_OMML_23-10-2026.md).
- [Revisión y correcciones reales de Supabase para la beta](reports/SUPABASE_BETA_23-10-2026.md).
- [Verificación completa y correo recibido](reports/VERIFICACION_FINAL_BETA_23-10-2026.md).

- [Preparación de beta](reports/BETA_READINESS_19-10-2026.md).
- [Verificación del motor local](reports/AUDITORIA_SEGURIDAD_MOTOR_LOCAL.md).
- [Auditoría técnica inicial](reports/AUDIT_REPORT.md).
- [Implementación de experiencias y unidades](reports/IMPLEMENTACION.md).
- [Auditoría curricular](reports/REPORTE.md).
- [Informe técnico](reports/REPORTE_TECNICO_SPACE_LAB.md).

## Archivos de apoyo

Los ejemplos Word y PDF se conservan en `assets/references/`. La plantilla de
producción de sesiones está en `assets/templates/session_template_v1.docx`; las
unidades usan `assets/templates/planning_template_v1.docx`. El motor también
conserva su plantilla de respaldo `assets/sesion plantilla.docx`.

`index.html` y `app-version.json` son salidas generadas que deben versionarse.
Las fuentes HTML están en `ui/`. Los resultados locales, respaldos y capturas
permanecen en carpetas ignoradas por Git. El entorno `.venv/`, los ejecutables y
los respaldos locales se conservan durante la limpieza.
