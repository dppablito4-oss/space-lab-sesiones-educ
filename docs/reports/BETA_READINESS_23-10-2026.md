# Decisión de apertura de beta — 23 de octubre de 2026

La base funcional está preparada para continuar las pruebas con docentes. Todavía no se considera cerrada la preparación operativa para abrir el registro público sin cupos.

## Evidencia actual

- Motor local 1.4.5 compilado y probado con DOCX, PDF con proceso matemático presente y documento conjunto. Correcciones recientes de OMML y conservación de contenido descritas en `REVISION_OMML_23-10-2026.md`.
- Última release pública consultada mediante la API de GitHub: **v1.4.1**, publicada el 19/10 a las 22:31:42 UTC. La página local de descargas todavía enlaza esa versión. El binario local nuevo no está publicado.
- Manifiesto del sitio consultado por HTTPS: build **c7c74779cfc2e61a**. Manifiesto local: **a7d054b097db5290**. Son distintos; no se afirma que las últimas correcciones estén en producción.
- Hay cambios locales pendientes de commit. Esta revisión no publicó código, releases ni configuración.
- Revisión posterior con acceso real: se corrigió el acceso directo a contabilidad de IA, se subió el mínimo de contraseña y se repitieron pruebas de cuentas, guardado y consumo. La nueva credencial SMTP autorizada quedó configurada y autenticó con código 235; falta entrega al buzón. Detalle y corrección del diagnóstico anterior en [revisión de Supabase](SUPABASE_BETA_23-10-2026.md).

## Requisitos antes de abrir

1. Publicar los cambios revisados y el motor nuevo, actualizar enlace y hash de descarga y comprobar el ejecutable descargado desde una instalación limpia. Repetir el recorrido desde el sitio publicado, sin usar el servidor local de desarrollo.
2. **Correo cerrado:** el 23/10 la credencial SMTP nueva autenticó (235), el formulario público aceptó una recuperación (200) y el usuario confirmó llegada a Recibidos. La recuperación por token y contraseña nueva pasó con cuentas temporales.
3. Activar respaldo automático y copia externa protegida con cobertura definida de base de datos y archivos. Ya existe un ensayo histórico de restauración manual, pero no acredita automatización activa.
4. Activar alertas de errores y gasto, establecer un presupuesto de beta y asignar un contacto de soporte.
5. Definir cupos y créditos iniciales; verificar controles ante creación abusiva de cuentas, solicitudes concurrentes y límites agotados. Si se va a cobrar, comprobar y activar la matriz comercial antes de aceptar pagos.

Los puntos 1, 3, 4 y 5 siguen pendientes de cierre. El correo ya tiene entrega confirmada; no hay respaldos disponibles listados. El monitor público quedó preparado y los controles de contabilidad corregidos. Se conserva la distinción entre cambios desplegados en Supabase y cambios locales sin publicar. Véase la [verificación final](VERIFICACION_FINAL_BETA_23-10-2026.md).

## Mejoras que pueden seguir a la apertura limitada

- Cola persistente para generar una experiencia completa, ver avance, reintentar sesiones fallidas y recuperar el trabajo tras cerrar el navegador. Hoy la generación depende de mantener la pestaña y la petición; los documentos ya recibidos sí tienen guardado y recuperación comprobados.
- Botón de reporte de problemas con identificador de solicitud y versión, sin enviar el contenido del docente por defecto.
- Aviso previo de formato/exportación para fórmulas fuera del subconjunto OMML; ampliación de matrices y sistemas por casos y renderizador PDF alternativo sin CDN.
- Selección de anexos y exportación compacta como opción, manteniendo el formato detallado.

Recomendación: cerrar los requisitos operativos y abrir por cupos, observar uso y fallos reales y ampliar después. No hace falta completar todos los tipos de ecuación para esa primera beta si sus límites están visibles.
