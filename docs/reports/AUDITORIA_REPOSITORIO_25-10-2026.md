# Auditoría del repositorio — 25 de octubre de 2026

**Estado posterior:** los seis hallazgos se corrigieron y probaron en el árbol
local. Este documento conserva el diagnóstico original; consulta las
[correcciones y evidencias](CORRECCIONES_AUDITORIA_25-10-2026.md) para el estado
actual. La aplicación remota de migraciones y publicación siguen pendientes.

Revisión de `71066a3310188ab62a5154c19153b774be413662`, rama
`feature/admin-control-center`. Hora y fecha de referencia: America/Bogota.

Se identificaron **seis pendientes de parcheo**. Las comprobaciones existentes
ejecutadas pasan, pero no cubren los escenarios de seguridad y concurrencia
descritos abajo. No se modificó código de aplicación, no se desplegó y no se
accedió a datos de producción ni se hicieron llamadas de IA de pago.

## 1. P1 — HTML de la IA ejecuta JavaScript en el minichat

**Ubicación:** `js/pedagogy-brief.js:145–151`, llamadas en líneas 201–204,
240–243 y 260. El módulo se incluye en `ui/index.shell.html:65`.

`_appendMessage()` inserta la respuesta del modelo mediante `innerHTML`, sin
usar `SpaceLabSanitizer`. Una respuesta con un `img` y un manejador `onerror`
ejecutó JavaScript en Chromium. La prueba sustituyó únicamente la respuesta
de IA y utilizó el módulo real; no se invocó ningún proveedor.

**Impacto:** si el modelo devuelve HTML malicioso, este ejecuta código en el
origen de la aplicación. Podría acceder a la sesión y documentos accesibles
desde JavaScript. No se extrajeron credenciales en la prueba.

**Parche:** usar texto plano o `sanitizeFragment()` antes de insertar contenido
externo; añadir una regresión que recorra el minichat real con HTML adversario.
La prueba actual `frontend_security.py` valida el sanitizador, pero no este uso.

## 2. P2 — El renderizador PDF ejecuta scripts y permite acceso a la red local

**Ubicación:** `backend/main.py:998`, 1049–1052, 1152–1156 y 1983–1986.

`/exportar-pdf` coloca `html_content` directamente en un contexto Chromium con
JavaScript y red habilitados. Una exportación autenticada con el token del
proceso ejecutó un script que hizo una petición a un servidor HTTP de prueba
en `127.0.0.1`; el endpoint devolvió un PDF con estado 200.

Además, el constructor HTML del PDF JSON interpola las URLs de logos sin
escapado de atributos ni validación de destinos. Este segundo vector se
identificó por inspección; la reproducción ejecutada usó `/exportar-pdf`.

**Impacto y condición:** contenido de exportación no confiable puede ejecutar
scripts en el navegador del motor y hacer peticiones desde el equipo del
docente. La prueba requiere token válido: no demuestra un bypass de autenticación,
lectura de archivos locales ni ejecución de comandos del sistema operativo.

**Parche:** deshabilitar JavaScript donde no se necesite, sanitizar el HTML en
servidor, escapar atributos y controlar solicitudes del navegador. Rechazar
loopback, redes privadas y destinos no autorizados; resolver y empaquetar los
recursos necesarios de MathJax y fuentes sin abrir acceso arbitrario a la red.

También debe reemplazarse el fallback de Chromium fijo en
`backend/main.py:2195`: descarga el snapshot `1182249`, sin comprobación de
digest ni mecanismo de actualización. No se asigna un CVE específico a ese
binario porque no se descargó ni analizó.

## 3. P2 — Bloquear una cuenta no bloquea las escrituras en Storage

**Ubicación:** `supabase/migrations/20261024224011_admin_control_center.sql:89–93`
y políticas de `storage.objects` en `database_setup.sql:293–322`.

La nueva política restrictiva comprueba `account_is_active()` en once tablas
de `public`, pero omite `storage.objects`. Las políticas de logos comprueban
propiedad y carpeta, sin comprobar el estado de la cuenta.

**Reproducción:** se aplicaron baseline y migraciones en PGlite; se bloqueó
una cuenta y, bajo su rol e identidad, `account_is_active()` devolvió `false`,
pero pudo insertar y listar un objeto propio en `logos`. El fixture concede
explícitamente DML sobre `storage.objects` a `authenticated` para modelar el
acceso que utiliza la API de Storage; no se probó el servicio Storage remoto.

**Parche:** migración incremental que añada el control de cuenta activa a
INSERT, UPDATE y DELETE de logos, con las condiciones de propiedad existentes.
Definir también el comportamiento de lectura. Los logos pertenecen actualmente
a un bucket público: bloquear una cuenta no vuelve privadas sus URLs públicas.
Supabase aplica estos permisos de operación mediante las políticas de
[`storage.objects`](https://supabase.com/docs/guides/storage/security/access-control).

## 4. P2 — Se puede evadir el límite de tamaño del motor

**Ubicación:** `backend/main.py:83`, 95–105.

El middleware limita únicamente el valor declarado en `Content-Length`.
Si se omite esa cabecera y se transmite el cuerpo por streaming, el límite
no se aplica y FastAPI procesa el JSON antes de validar el token del endpoint.

**Reproducción sin consumir memoria excesiva:** con el umbral reducido solo
en memoria a 100 bytes, el mismo JSON de 265 bytes recibió 413 con
`Content-Length` y 401 mediante cuerpo iterable sin esa cabecera. El segundo
estado confirma que alcanzó la validación de token tras procesar el cuerpo.
No se envió un cuerpo de 25 MB ni se intentó agotar memoria.

**Parche:** contabilizar los bytes realmente recibidos en la capa ASGI y cortar
el flujo al superar el límite. Conservar el rechazo temprano por cabecera como
optimización y probar también solicitudes sin `Content-Length`.

## 5. P2 — Dependencias Python con avisos de seguridad y sin lock transitivo

**Ubicación:** `backend/requirements.txt`, entorno `.venv` y
`.github/workflows/validate.yml:39–41`. La auditoría es del entorno instalado;
no se extrajo el inventario del EXE publicado.

`pip-audit --path .venv/Lib/site-packages` devolvió **61 entradas en cuatro
paquetes**; al unir identificadores y alias repetidos corresponden a 50 avisos.
Son coincidencias de versiones y no 50 exploits comprobados en esta aplicación.

| Paquete instalado | Entradas | Avisos sin duplicados | Acción |
| --- | ---: | ---: | --- |
| `certifi 2026.7.22` | 1 | 1 | Actualizar el almacén de confianza. El auditor indica `2026.10.19` como versión corregida. |
| `Pillow 12.3.0` | 37 | 37 | Evaluar actualización a `13.0.0`, indicada por los avisos, y comprobar renderizado matemático. |
| `setuptools 65.5.0` | 9 | 5 | Actualizar las herramientas de construcción; el auditor incluye correcciones hasta `84.1.0`. |
| `Starlette 0.37.2` | 14 | 7 | Actualizar junto con FastAPI a una combinación compatible y volver a auditar. |

El aviso de [Certifi](https://github.com/certifi/python-certifi/security/advisories/GHSA-6q48-6c7w-9gw2)
describe raíces con intermediarios comprometidos. Es prioritario actualizar el
entorno, aunque aquí no se demostró interceptación de TLS.
Un aviso de [Pillow](https://github.com/python-pillow/Pillow/security/advisories/GHSA-q45j-58j2-45rg)
afecta a TIFF manipulados; el código revisado usa Pillow con imágenes de
fórmulas generadas internamente, por lo que no se acredita esa ruta de ataque.
El aviso [multipart de Starlette](https://github.com/Kludex/starlette/security/advisories/GHSA-f96h-pmfr-66vw)
requiere procesar formularios; las rutas de exportación revisadas usan JSON.

`fastapi==0.111.0` mantiene la antigua rama de Starlette. No basta con forzar
Starlette a una versión mayor conservando ese pin. Faltan un lock de Python
con dependencias transitivas y un control de vulnerabilidades en CI. Añadir
también inventario de dependencias del binario distribuido. `npm audit --json`
no reportó vulnerabilidades en el lockfile de npm; ese resultado no cubre los
scripts CDN ni las importaciones remotas de Deno.

## 6. P2 — Un resumen pendiente actúa sobre una cuenta o diálogo posterior

**Ubicación:** `js/pedagogy-brief.js:45–54`, 270–294;
consumidor del evento en `js/app.js:419–434`.

`clear()` borra estado, pero no invalida las continuaciones asíncronas.
`_handleFinish()` captura el fallo de un resumen pendiente, cierra el modal y
emite `pedagogy-brief-ready` aunque haya cambiado la cuenta o el diálogo.
El consumidor inicia `handleGenerateAI()` al recibir ese evento.

**Reproducción con el cliente real:** se inició un resumen como A, se emitió
un cambio a B y se abrió su diálogo antes de resolver el resumen de A.
`SupabaseClient.invokeFunction()` **sí rechazó el contenido privado de A**.
Sin embargo, la continuación antigua emitió el evento con `summary: null` y
cerró el diálogo nuevo de B. La prueba verificó el evento y el cierre; no
ejecutó la generación posterior ni consumió créditos.

**Parche:** asociar cada operación a una identidad y a una versión del diálogo;
invalidarla al cerrar, reabrir o cambiar de cuenta. Comprobar esa vigencia tanto
en éxito como en `catch` antes de cambiar UI o emitir eventos. Extender las
regresiones a resumen pendiente, A → B y reapertura bajo la misma cuenta.

## Despliegue pendiente documentado

`supabase/migrations/README.md:29` y
`docs/admin/MANUAL_ADMINISTRADOR.md:5` indican que la migración del centro
administrativo **no está aplicada al proyecto público**. Es una declaración
del repositorio; no se consultó el historial remoto para confirmar su estado
actual. El manual deja pendientes MFA real, hook Auth y concurrencia con
varias conexiones en un Supabase de pruebas.

El mailer nuevo invoca `admin_cc_authorize`; por ello la migración, Edge
Functions y frontend requieren un despliegue coordinado. Antes de promover
esta rama deben resolverse los hallazgos aplicables y ejecutar esas validaciones.

## Validación realizada

- Pasaron los 76 scripts de contratos, lógica JS, backend Python y pruebas Deno
  extraídos del workflow; resultados en `artifacts/repo-audit/test-results.json`.
- Pasaron `npm run test:admin:db`, `frontend_security.py` y `ui_admin_smoke.py`.
- Pasaron cuatro recorridos adicionales: recuperación, navegación tras login,
  ciclo de vida de sesión y resiliencia de inicio.
- Pasaron Ruff, `pip check`, tipos TypeScript, composición de HTML y versiones
  de assets; también las comprobaciones de las cinco Edge Functions.
- Compilaron React preview, frontend público y administración. Los cuatro
  archivos JS/CSS públicos y administrativos reconstruidos coinciden byte a
  byte con los versionados.
- La búsqueda de patrones de alta confianza en archivos versionados no detectó
  claves privadas, tokens GitHub ni claves secretas de proveedores. No cubre
  el historial Git completo y no sustituye un escáner de secretos exhaustivo.
- Las reproducciones están en `artifacts/repo-audit/reproduce_browser.py`,
  `reproduce_engine.py` y `reproduce_storage.mjs`, con sus JSON de resultados.
  El directorio está ignorado por Git. No contiene secretos de producción.

No se ejecutó toda la suite visual, no se recompiló el EXE y no se validaron
servicios remotos ni carreras con múltiples conexiones de PostgreSQL.

Orden propuesto: XSS del minichat; aislamiento del PDF y límites reales del
motor; controles de Storage y vigencia del resumen; actualización y lock de
dependencias; regresiones y validación del despliegue administrativo.
