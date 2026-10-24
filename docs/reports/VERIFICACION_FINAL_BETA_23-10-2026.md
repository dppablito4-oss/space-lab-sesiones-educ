# Verificación completa de beta — 23 de octubre de 2026

## Resultado

Pasaron las comprobaciones funcionales ejecutadas. El correo de recuperación llegó a Recibidos, confirmado por el usuario. Persisten pendientes operativos y de publicación; no se declara terminada la preparación de una beta pública sin cupos.

| Área | Evidencia de esta ejecución |
| --- | --- |
| Correo | Una solicitud desde el formulario del sitio publicado, HTTP 200 a las 20:52 de Bogotá; el usuario confirmó recepción en Recibidos. No se cambió su contraseña. |
| Registro y recuperación | Se rechazó la contraseña corta; cuentas temporales pudieron ingresar, recuperar por token, cambiar contraseña e ingresar con ella. |
| Guardado y aislamiento | Sesiones y planificaciones guardadas; lectura cruzada, reasignación de propietario, escalada de rol y lectura SMTP bloqueadas. |
| IA y créditos | Una generación breve real, cobro único; duplicado rechazado sin otro cargo. Acceso directo del navegador a reembolsos y contabilidad privilegiada denegado. |
| Base de datos | Las dos pruebas SQL con roles reales pasaron y revirtieron sus datos sintéticos. Las cuentas HTTP temporales se cerraron y eliminaron. |
| Word y PDF | Ejecutable 1.4.5 verificado: unidad horizontal de ocho tablas, PDF con proceso matemático presente y documento conjunto ordenado. |
| OMML | Word abrió y volvió a guardar los tres ejemplos conservando 15, 20 y 8 ecuaciones: 43 en total. Se generaron sus PDF. |
| Navegador | Pasaron 23 comprobaciones Python que incluyen seguridad del frontend y recorridos de sesión, planificación, materias, recuperación, accesibilidad y fórmulas. |
| Otras comprobaciones | Pasaron 19 comprobaciones Python de núcleo, el ejecutable, 48 archivos JavaScript, 24 pruebas Deno, tipos de las cinco Edge Functions y Ruff. |

Se detectó una prueba de sesiones vinculadas desactualizada: esperaba confirmación al salir de una sesión ya guardada. Se corrigió para introducir una edición real y comprobar que cancelar conserva esa edición y no filtra el vínculo pendiente. Pasó nuevamente en pantallas de 375 y 1280 píxeles. No fue necesario cambiar el comportamiento del producto para resolver esa prueba.

## Estado remoto y límites

- Supabase: gateway v10, OpenAI v28, Gemini v25, DeepSeek v32 y mailer v8 activos. Contraseña mínima de ocho caracteres y redirecciones al sitio público.
- Asesor de seguridad: cero errores, seis advertencias y cinco informativos. Las cinco funciones privilegiadas restantes requieren sus controles de rol/propiedad; la protección de contraseñas filtradas sigue desactivada porque el plan actual no permite activarla. El resultado no acredita ausencia de toda vulnerabilidad.
- Sitio público: build `c7c74779cfc2e61a`; local: `86682fd6f38c02bf`. La [última release pública](https://github.com/dppablito4-oss/space-lab-sesiones-educ/releases/tag/v1.4.1) sigue en 1.4.1. Las correcciones locales no están automáticamente publicadas.
- La API de respaldos sigue mostrando cero copias disponibles y PITR desactivado. Faltan respaldo automático externo, cobertura de archivos y vigilancia de presupuesto. El monitor público está preparado localmente, sin activarse todavía en GitHub.
- CAPTCHA continúa sin configurar. La generación no tiene cola durable que garantice terminar después de cerrar el navegador. Matrices y sistemas por casos no tienen OMML nativo universal.

Las pruebas sintéticas y los documentos de ejemplo no garantizan todas las combinaciones de contenido o carga. No se realizó prueba de carga masiva ni se modificaron planes de pago.

Los resultados locales están en `artifacts/final-verification-2026-10-23/`, incluidos `summary.json`, registros, estado remoto y confirmación de correo. No contienen la contraseña SMTP ni tokens de acceso. Los ejemplos Word/PDF están en `artifacts/math-review/`.
