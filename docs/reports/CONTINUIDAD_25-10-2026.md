# Avance guardado para continuar el 26 de octubre de 2026

**Continuación disponible:** [estado del 27/10](CONTINUIDAD_27-10-2026.md) y
[migración React con pruebas en Comet](MIGRACION_REACT_27-10-2026.md).
La [sobrescritura entre dispositivos](CONFLICTOS_SESIONES_27-10-2026.md) también
está corregida y probada localmente, pendiente de publicación.
El contenido siguiente conserva el estado histórico del 25/10.

Trabajo detenido a petición del usuario. Fecha de referencia: 25/10/2026,
America/Bogota. Este informe permite retomar sin repetir la auditoría.

## Punto exacto de entrega

- Repositorio: `E:\sesiones_educ_ia`.
- Rama: `feature/admin-control-center`.
- Commit base actual: `71066a3`.
- Los parches están guardados en el árbol de trabajo, **sin commit ni push**.
  Hay archivos modificados y archivos nuevos sin seguimiento; conservar ambos.
- Los seis hallazgos están corregidos y probados localmente.
- Motor Windows **1.4.6** compilado y verificado, todavía sin publicar.
- No se aplicaron migraciones remotas ni se publicaron estos cambios.

## Trabajo terminado

| Corrección | Archivos principales |
| --- | --- |
| XSS del minichat: HTML sanitizado y fallback de texto seguro | `js/pedagogy-brief.js` |
| Respuestas/resúmenes vencidos: invalidación al cerrar, reabrir o cambiar de cuenta | `js/pedagogy-brief.js` |
| PDF aislado: scripts del documento deshabilitados, red bloqueada y MathJax local con integridad verificada | `backend/pdf_security.py`, `backend/main.py`, `assets/vendor/mathjax/` |
| Límite real del cuerpo, incluso solicitudes chunked | `backend/request_limits.py`, `backend/main.py` |
| Bloqueo de operaciones autenticadas de logos para cuentas suspendidas/bloqueadas | `supabase/migrations/20261026024247_account_storage_boundary.sql` |
| Dependencias actualizadas, locks con hashes, auditorías CI e inventario del motor | `backend/requirements*`, `scripts/requirements*`, `scripts/build_engine_inventory.py`, `.github/workflows/` |

Se incorporaron regresiones CLI y GUI, se reconstruyeron los assets públicos
y se actualizaron sus versiones de caché. También se reemplazó la descarga
propia del antiguo Chromium portable por el instalador oficial de Playwright.

## Pruebas terminadas

- **80 scripts CLI aprobados**, sin fallos.
- **34 scripts de navegador aprobados**: 33 en la matriz general y la nueva
  prueba de seguridad del motor ejecutada por separado.
- Base PostgreSQL aislada: RLS, propiedad, suspensión, bloqueo, vencimiento,
  reactivación, permisos administrativos, MFA simulado y contabilidad.
- GUI real: minichat, cambio de cuenta, administración, subida de logos,
  exportación Word/PDF, error 413 y recuperación posterior.
- Dependencias del entorno existente y de una instalación limpia: `pip check`
  aprobado y `pip-audit` sin vulnerabilidades conocidas. `npm audit`: cero.
- Builds público, administrativo y React preview aprobados; Ruff, tipos,
  cinco Edge Functions, composición HTML e higiene aprobados.
- EXE probado: arranque 1.4.6, Word/PDF con fórmulas, unidad horizontal,
  documento conjunto, inventario empaquetado, bloqueo de scripts/red local y
  rechazo 413 de un cuerpo chunked superior a 25 MiB.

Las pruebas no sustituyen una validación remota: Auth, MFA y proveedores IA
usan fixtures en sus fronteras externas; Storage se prueba sobre PGlite con
políticas SQL reales. No se gastó IA de pago.

## Archivos que hay que conservar

- Informe de diagnóstico: [auditoría](AUDITORIA_REPOSITORIO_25-10-2026.md).
- Detalle de parches y pruebas: [correcciones](CORRECCIONES_AUDITORIA_25-10-2026.md).
- Binario: `backend/dist/pablitopyhost.exe`, 104 557 584 bytes.
- SHA-256 registrado del EXE:
  `e42dfb89da94e4922e1478f9ccb5166f8074c1e4b4f558b0752b5d2cc4c0b329`.
- Inventario: `backend/build/engine-dependencies.json`, también dentro del EXE.
- Evidencias: `artifacts/security-fixes/cli-results.json`, `gui-results.json`,
  `python-final-audit.json`, `compiled-engine-validation.log` y capturas en
  `minichat/`, `storage/` y `engine/` dentro de esa carpeta.
- Entorno actualizado: `.venv/`; instalación limpia de comprobación:
  `artifacts/security-fixes/clean-env/`.

Los ejecutables, entornos y evidencias están ignorados por Git. Guardar un
commit de código no los incluye. No ejecutar limpieza ni descartar archivos
nuevos antes de revisar este estado.

## Qué falta para mañana

1. Revisar `git status --short` y el diff conservando los parches actuales.
   Preparar su commit y revisión; no hay un commit de estas correcciones.
2. Consultar el estado remoto antes de decidir qué migraciones faltan. La
   documentación indica que el centro administrativo sigue pendiente, pero
   ese estado remoto no se comprobó en esta sesión.
3. Validar en un Supabase de pruebas existente: MFA/Auth reales, permisos,
   Storage y reservas/reembolsos con varias conexiones concurrentes.
4. Completar los advisors. `supabase db advisors --local` se intentó y falló
   porque no había Postgres local en 54322; Docker Desktop no estaba iniciado.
   Esto no impidió las pruebas SQL aisladas, pero el advisor queda pendiente.
5. Coordinar la aplicación remota: primero
   `20261024224011_admin_control_center.sql` y después
   `20261026024247_account_storage_boundary.sql`, comprobando las migraciones
   previas y compatibilidad de las Edge Functions antes de publicar el panel.
6. Publicar web y motor 1.4.6 cuando corresponda y validar la descarga real,
   el hash y los recorridos del sitio publicado. No anunciar un despliegue
   completo basándose únicamente en las pruebas locales.

Los logos existentes continúan en un bucket público: el parche restringe
operaciones autenticadas, sin volver privadas sus URLs públicas.

## Cómo retomar

Desde PowerShell:

```powershell
Set-Location 'E:\sesiones_educ_ia'
git branch --show-current
git status --short
git diff --stat
```

Leer este informe y el de correcciones antes de modificar o desplegar. Si el
código no cambió, las pruebas completas anteriores ya están realizadas;
repetir las que correspondan a cambios nuevos y las comprobaciones remotas
pendientes.

Mensaje sugerido para continuar: «Retoma desde
docs/reports/CONTINUIDAD_25-10-2026.md, conserva los cambios locales y continúa
con la revisión y validación remota pendientes». Este informe no autoriza por
sí mismo nuevas publicaciones ni operaciones sobre producción.
