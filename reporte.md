# Reporte técnico de revisión

Fecha: 2026-08-15  
Rama revisada: `main`

## Resumen ejecutivo

La aplicación es funcional y las pruebas existentes de almacenamiento y exportación pasan. Sin embargo, la revisión encontró riesgos de seguridad en el tratamiento de HTML, una exposición innecesaria del motor local, controles insuficientes para logos y problemas de mantenimiento del repositorio.

Las correcciones deben priorizar la eliminación de XSS almacenado y de HTML no confiable antes de ampliar funcionalidades.

## Estado posterior a la implementación

Los hallazgos 1 a 6 y 8 quedaron corregidos y cubiertos por pruebas locales. Para el hallazgo 7, los artefactos fueron retirados del índice de Git sin borrarlos del equipo; el tamaño histórico solo disminuirá si posteriormente se autoriza una reescritura del historial.

## Hallazgos

### 1. XSS almacenado en la previsualización administrativa — Crítico

Las sesiones conservan `htmlContent` y el panel administrativo lo introduce mediante `document.write()` en un iframe del mismo origen. Una sesión manipulada puede ejecutar JavaScript cuando un administrador la previsualiza y acceder al contexto de autenticación del panel.

Archivos afectados:

- `js/app.js`
- `js/admin.js`

Corrección requerida:

- Sanitizar el HTML antes de persistirlo y antes de renderizarlo.
- Aislar la previsualización con un iframe `sandbox` sin permisos de scripts ni acceso al origen padre.
- Validar los valores usados en estilos CSS.

### 2. HTML procedente de IA insertado directamente — Alto

Los criterios generados y los textos refinados por IA se insertan con `innerHTML`. Una respuesta inesperada puede incluir elementos o atributos ejecutables.

Archivos afectados:

- `js/ai-copilot.js`
- `js/app.js`

Corrección requerida:

- Interpretar los criterios como texto o como una lista limitada de elementos `li`.
- Sanear el texto refinado usando una lista estricta de etiquetas de formato.

### 3. XSS almacenado en registros de seguridad — Alto

Los usuarios autenticados pueden crear registros propios y el campo `action` se presenta sin escape en el panel administrador.

Archivos afectados:

- `js/admin.js`
- `database_setup.sql`

Corrección requerida:

- Escapar todos los campos al renderizarlos.
- Restringir longitud y formato de `action` y `details` en la base de datos.

### 4. Motor local expuesto en la red — Medio

FastAPI escucha en `0.0.0.0`, acepta cualquier origen y aprueba solicitudes de red privada. La aplicación solo necesita comunicación desde el navegador local.

Archivos afectados:

- `backend/main.py`

Corrección requerida:

- Escuchar exclusivamente en `127.0.0.1`.
- Limitar CORS al dominio de producción y a orígenes locales de desarrollo.
- Aplicar un límite al tamaño de las solicitudes antes de procesarlas.

### 5. Controles insuficientes en logos — Medio

Se acepta cualquier MIME `image/*`, no hay un límite coherente de tamaño y la galería usa una raíz compartida entre usuarios.

Archivos afectados:

- `js/app.js`
- `js/supabase-client.js`
- `database_setup.sql`

Corrección requerida:

- Aceptar únicamente PNG, JPEG y WebP.
- Aplicar límite de tamaño en cliente y bucket.
- Guardar y listar logos dentro de una carpeta cuyo nombre sea el ID del usuario.
- Endurecer las políticas RLS de Storage para exigir esa carpeta.

### 6. Archivos temporales de PDF sin limpieza garantizada — Medio

Si falla la conversión Word a PDF, los archivos temporales pueden permanecer en disco.

Archivo afectado:

- `backend/main.py`

Corrección requerida:

- Eliminar los archivos temporales en un bloque `finally`.

### 7. Artefactos compilados dentro del historial — Mantenimiento

El repositorio contiene ejecutables, builds de PyInstaller y bytecode ya versionados. El `.gitignore` evita nuevos archivos, pero no elimina los existentes del historial.

Corrección requerida:

- Dejar de versionar `backend/build`, `backend/dist` y `backend/__pycache__`.
- Publicar binarios mediante GitHub Releases.
- Limpiar el historial únicamente con autorización expresa, porque reescribe commits y exige coordinación con los clones existentes.

### 8. Enlaces locales inválidos en README — Bajo

La estructura del proyecto utiliza enlaces `file:///` pertenecientes a otra máquina.

Archivo afectado:

- `README.md`

Corrección requerida:

- Sustituirlos por enlaces relativos compatibles con GitHub.

## Estado de validación previo

- Sintaxis Python: correcta.
- Sintaxis JavaScript: correcta.
- JSON curricular: válido.
- Prueba de almacenamiento: correcta.
- Exportación DOCX: correcta.
- Exportación PDF: correcta.
- Dependencias Python instaladas: sin conflictos.

## Exclusiones de seguridad

No se reescribirá el historial Git ni se volverán a desplegar funciones de Supabase desde esta revisión. Esas operaciones afectan infraestructura compartida y requieren una decisión explícita del propietario.
