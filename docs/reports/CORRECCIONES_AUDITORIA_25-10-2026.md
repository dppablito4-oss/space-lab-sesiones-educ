# Correcciones de la auditoría — 25 de octubre de 2026

Los seis hallazgos de la [auditoría](AUDITORIA_REPOSITORIO_25-10-2026.md) están
corregidos en el árbol de trabajo de `feature/admin-control-center`, sobre
`71066a3`. Cada corrección tiene comprobaciones por CLI y por navegador.
El motor local se actualizó a **1.4.6**. No se publicaron estos cambios ni se
aplicaron migraciones remotas.

## Cambios y pruebas por hallazgo

| Hallazgo | Corrección | CLI | GUI |
| --- | --- | --- | --- |
| XSS del minichat | Sanitizar todo HTML recibido; usar texto plano si falta el sanitizador. | `node tests/pedagogy-brief.test.js` | `python tests/ui_pedagogy_brief_security.py`: bloquea scripts, SVG e imágenes con eventos; conserva formato seguro y comprueba el fallback de texto. |
| Scripts y red del PDF | Sanitizar HTML en servidor, deshabilitar scripts del documento, bloquear solicitudes del navegador y usar MathJax local con digest verificado. Escapar atributos de logos. | `python tests/test_pdf_security.py`, siete pruebas; prueba offline de paginación y fórmulas. | `python tests/ui_engine_security_smoke.py`: exporta PDF y Word desde controles reales y comprueba que HTML adversario no alcanza un servidor trampa local. |
| Cuenta bloqueada con acceso a Storage | Política restrictiva para operaciones autenticadas de logos, manteniendo propiedad y carpeta. | `node tests/storage-account-controls.test.mjs`: activo, bloqueado, suspendido, vencimiento y acceso cruzado. | `python tests/ui_storage_account_controls.py`: bloquear, suspender y reactivar desde el panel real; intentar subir/listar logos desde el formulario real. |
| Límite evadible sin Content-Length | Contar los bytes ASGI antes del parseo JSON y devolver 413 al exceder el límite. Mantener CORS en la respuesta de error. | `python tests/test_request_limits.py`, siete pruebas; HTTP real con cuerpo normal y chunked. | `python tests/ui_engine_security_smoke.py`: muestra el error 413 al exportar contenido excesivo y permite exportar después de reducirlo. |
| Dependencias vulnerables | Actualizar versiones compatibles; locks universales con hashes para ejecución, desarrollo y operaciones; auditorías en CI e inventario del motor. | Instalación limpia del lock, `pip check` y `pip_audit --strict`; pruebas de documentos y fórmulas. | Toda la suite de navegador sobre el entorno actualizado, incluidas exportaciones reales con las nuevas dependencias. |
| Resumen vencido que afecta otro diálogo/cuenta | Identidad y versión de diálogo verificadas en continuaciones de éxito y error; invalidación al cerrar, reabrir o cambiar de cuenta. | `node tests/pedagogy-brief.test.js`: respuestas y resúmenes vencidos, éxito/error y resumen vigente. | `python tests/ui_pedagogy_brief_security.py`: cliente real que rechaza la respuesta anterior, sin cerrar el diálogo nuevo ni emitir una orden de generación. |

Auth, MFA y proveedores IA se simulan únicamente en las fronteras externas de
las pruebas GUI. El DOM del producto, su cliente, el motor HTTP y las políticas
SQL probadas son reales. Los tests de Storage usan PostgreSQL aislado de
PGlite mediante un adaptador HTTP de prueba; no un proyecto Supabase remoto.

## Dependencias e instalación reproducible

Versiones verificadas en Windows/Python 3.11:

- FastAPI `0.162.0`, Starlette `1.10.0`, Pydantic `2.14.1`.
- Certifi `2026.10.23`, Pillow `13.0.0`, setuptools `84.2.1`.
- Locks: `backend/requirements.lock.txt`,
  `scripts/requirements-dev.lock.txt`, `scripts/requirements-ops.lock.txt`.
- Entorno existente y entorno limpio: **cero vulnerabilidades conocidas** en
  `pip-audit`; `pip check` aprobado.
- `npm audit`: cero vulnerabilidades. El servicio de avisos de npm tampoco
  devolvió avisos para el MathJax `3.2.2` incorporado.

La actualización de Starlette exige `allow_private_network=True` para conservar
el preflight del motor; se verificó junto con el rechazo de orígenes externos.
No se fuerza una versión nueva de Starlette sobre el antiguo FastAPI.

## PDF y navegador

MathJax está en `assets/vendor/mathjax/`, con licencia Apache-2.0 y digest
comprobado antes de usarlo. Los scripts y eventos del documento permanecen
deshabilitados; solo se evalúa el bundle local verificado mediante DevTools.
El contexto está offline y bloquea todas las solicitudes. Las extensiones TeX
de carga dinámica y HTML no se habilitan.

Los logos remotos aceptados pertenecen al bucket público de logos del proyecto;
se descargan antes del renderizado con límite de 5 MiB y sin redirecciones.
También se admiten imágenes PNG, JPEG y WebP embebidas. Se descartan destinos
remotos arbitrarios, URLs locales e imágenes SVG.

El snapshot portable `1182249` dejó de usarse. Se utiliza Chrome/Edge instalado
o el instalador oficial de la revisión fijada por Playwright. No se extraen ZIP
remotos mediante código propio.

## Validación completa

- **80 scripts CLI aprobados**, sin fallos, extraídos del workflow actualizado.
- **34 scripts de navegador aprobados**: 33 en la matriz general más la prueba
  nueva del motor. Incluyen editor clásico/React, cuentas, guardado, currículo,
  planificación, administración, temas, accesibilidad y seguridad.
- `npm run test:admin:db` aprobado.
- Compilaciones pública, administrativa y React preview aprobadas.
- Ruff, tipos TypeScript, las cinco Edge Functions, composición HTML, versiones
  de assets, higiene del repositorio y revisión de whitespace aprobados.
- Instalación desde cero mediante `uv pip sync --require-hashes` aprobada;
  pasaron las pruebas del backend y todas las pruebas de fórmulas en ese entorno.
- Se revisaron visualmente las capturas del minichat y del PDF exportado.

Los JSON y capturas están en `artifacts/security-fixes/`, ignorado por Git:
`cli-results.json`, `gui-results.json`, `python-final-audit.json`,
`mathjax-audit.json`, subdirectorios `minichat/`, `storage/` y `engine/`.

## Ejecutable Windows verificado

| Dato | Resultado |
| --- | --- |
| Versión | `1.4.6` |
| Binario local | `backend/dist/pablitopyhost.exe` |
| Tamaño | 104 557 584 bytes |
| SHA-256 | `e42dfb89da94e4922e1478f9ccb5166f8074c1e4b4f558b0752b5d2cc4c0b329` |
| Inventario | `backend/build/engine-dependencies.json`; también incluido dentro del EXE |
| Dependencias declaradas de ejecución | 40 paquetes instalados coincidentes con el lock |

`python tests/verify_compiled_exe.py` comprobó arranque, versión, DOCX horizontal
de ocho tablas, PDF canónico con fórmulas y Word conjunto de unidad/sesiones.
También verificó el inventario y el MathJax empaquetados, ausencia de peticiones
a una trampa de red local al exportar HTML adversario y rechazo 413 de un
cuerpo chunked que supera 25 MiB. El motor continuó disponible después del
rechazo. El log está en `artifacts/security-fixes/compiled-engine-validation.log`.

## Publicación y límites pendientes

La migración nueva es `20261026024247_account_storage_boundary.sql`, generada
por Supabase CLI. Debe aplicarse después de la migración administrativa
`20261024224011_admin_control_center.sql`. Los logos ya publicados conservan
sus URLs públicas: las políticas restringen operaciones autenticadas, no cambian
la privacidad del bucket.

No se completó `supabase db advisors --local`: se intentó y no había Postgres
local en el puerto 54322; Docker Desktop no estaba iniciado. Las políticas sí
se ejecutaron y probaron en PGlite. No se atribuye una validación de advisors a
esas pruebas.

Siguen pendientes la validación de MFA/Auth reales y concurrencia en Supabase
de pruebas, la aplicación remota coordinada de migraciones/funciones y la
publicación de web y motor. La release pública anterior no se sustituyó.
