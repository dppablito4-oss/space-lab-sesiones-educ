# Continuidad — 26 de octubre de 2026

Trabajo detenido a petición del usuario: «mañana continuamos dejalo ahi no mas».
Retomar el 27/10/2026, America/Bogota. No continuar pruebas ni despliegues
hasta que el usuario lo solicite.

## Estado del repositorio

- Carpeta: `E:\sesiones_educ_ia`.
- Commit encontrado al comenzar: `65123cb`,
  `fix(security): harden exports, storage and request controls`.
- El árbol estaba limpio. Las correcciones del informe anterior ya están
  incluidas en ese commit; su indicación de cambios sin commit quedó histórica.
- Esta sesión deja modificaciones locales **sin commit ni push**:
  `js/ficha-external-prompt.js`, `tests/ficha-external-prompt.test.js`,
  `.github/workflows/validate.yml` y el nuevo
  `tests/ui_ficha_prompt_security.py`, además de este informe.
- No se aplicaron migraciones remotas, no se modificaron secretos ni se
  desplegó la web, funciones o motor. No se hicieron llamadas de IA de pago
  ni se enviaron correos.

## Fichas: parche y regresión terminados localmente

`cleanText()` asignaba contenido de sesión no confiable a `div.innerHTML`.
Ahora utiliza `SpaceLabSanitizer.sanitizeFragment()` antes de extraer texto
desde un template inerte. Sin sanitizador utiliza la ruta de texto sin
insertar el contenido en el DOM. El HTML fijo del modal sigue siendo estático.

Pasaron:

```powershell
node tests/ficha-external-prompt.test.js
.venv/Scripts/python.exe tests/ui_ficha_prompt_security.py
```

La prueba Chromium recorre el apartado, el modal y las actividades tomadas de
los momentos; inserta imágenes con eventos, SVG, iframe y script en campos
de sesión. Comprueba que no se ejecutan eventos ni se solicitan recursos
y que se conserva el texto esperado, con y sin sanitizador. Se añadió al CI.

Pendiente al retomar: revisar diff, comprobaciones de higiene y assets,
actualizar versiones de caché/build conforme al flujo del repositorio y
comprobar la integración completa antes de publicar. No se reconstruyeron
assets en esta sesión.

## Supabase real consultado

La CLI conserva acceso al proyecto vinculado `koptglmifwpzrfzvipnm`.
`projects list` lo muestra `ACTIVE_HEALTHY`. El otro proyecto visible pertenece
a otro uso y **no se eligió como staging**.

- Historial remoto: **22 migraciones**; la última es
  `20261024020332_beta_backup_reader`.
- Faltan realmente `20261024224011_admin_control_center.sql` y
  `20261026024247_account_storage_boundary.sql`.
- `supabase db advisors --linked --type security` terminó: seis avisos WARN,
  sin errores. Cinco corresponden a funciones SECURITY DEFINER ejecutables
  por autenticados y uno a protección de contraseñas filtradas deshabilitada.
  No se cambiaron permisos para ocultar avisos.
- La lista de nombres de secretos no incluye `BILLING_ENFORCEMENT`.
  El código de `supabase/functions/_shared/entitlements.ts` activa enforcement
  solamente si su valor es exactamente `true`; por tanto, con la configuración
  observada se espera modo de observación. Falta comprobar comportamiento
  comercial completo en las funciones desplegadas.

El usuario no indicó un proyecto de pruebas; pidió detenerse. Sigue pendiente
elegir ese entorno para aplicar las migraciones y probar MFA, suspensión,
Storage y administración nuevos. No aplicar estas migraciones al proyecto
público como sustituto de esa validación.

## Pruebas remotas terminadas

```powershell
.venv/Scripts/python.exe scripts/beta_health_check.py --output artifacts/apertura-controlada/health.json
.venv/Scripts/python.exe scripts/beta_remote_smoke.py
```

- Sitio, manifiesto y Auth: HTTP 200. Gateway sin sesión: HTTP 401.
- Cinco Edge Functions rechazan POST sin sesión; mailer rechaza GET.
- Dos cuentas temporales: creación sin correo, ingreso, recuperación sin
  enviar mensajes y cambio de contraseña.
- Guardado real de sesión y planificación; la segunda cuenta no lee esos datos.
- Reasignación del propietario y escalamiento de rol bloqueados.
- Usuario normal sin acceso a configuración SMTP ni RPC de contabilidad.
- **Las dos cuentas temporales se eliminaron correctamente** al terminar.
- Evidencia: `artifacts/beta-readiness/remote-smoke.json` y
  `artifacts/apertura-controlada/health.json`, ignorados por Git.

No se ejecutó `--with-ai`. No atribuir a este smoke cobertura de planes
gratuito/prémium, reservas concurrentes, límites, reembolsos, suspensión o MFA.

## Motor, respaldo y monitor: consultas preliminares

- La release pública más reciente sigue siendo **v1.4.5**.
  Asset publicado: 106.536.121 bytes; SHA-256 declarado por GitHub:
  `46f3cabde6a5b58c8f59d5e15e811e33c7d66917da84d9ba5a53bcd34620bdab`.
  No se descargó ni ejecutó de nuevo en esta sesión.
- El motor local **1.4.6** conserva la validación histórica documentada en
  `CORRECCIONES_AUDITORIA_25-10-2026.md`; no se publicó ni se repitió su prueba.
- El conector GitHub permitió consultar la release, pero rechazó los endpoints
  de runs por nombre de workflow. Se consultó la API pública como alternativa.
- Backup programado del 26/10: ejecución `40357019727`, `success`.
  El anterior, `40199239821`, falló el 25/10. Falta inspeccionar la causa,
  descargar una copia reciente y comprobar recuperación de forma independiente.
- Se observan ejecuciones programadas del monitor aprobadas. No se comprobó
  recepción de notificaciones por el responsable.
- GitHub CLI no tiene sesión; el conector GitHub sí está disponible.
- Docker Desktop no está iniciado. No se levantaron contenedores.

## Preferencia confirmada y pendientes

El usuario confirmó mantener como soporte el correo y WhatsApp que ya aparecen
en la web: `pabloclsa87@gmail.com` y `+51 918 165 428`. No se contactó a nadie
ni se modificaron todavía los accesos de soporte dentro del editor.

Quedan por completar los puntos originales:

1. Integración/build y revisión final del parche de fichas.
2. Supabase de pruebas: migraciones, RLS, suspensión, administración y MFA reales.
3. Gratuito/prémium, duplicados, cuotas, reembolsos y decisión explícita sobre
   `BILLING_ENFORCEMENT`; no activarlo automáticamente.
4. Dos pestañas, dispositivos, conexión interrumpida y recuperación de generación
   y documentos. Las pruebas históricas no sustituyen estos nuevos recorridos.
5. Descargar y validar el ejecutable público; Word/PDF con fórmulas, tablas y
   documentos extensos. La publicación de 1.4.6 sigue pendiente.
6. Soporte visible en el producto, entrega de alertas, copia recuperable reciente
   y preparación del grupo inicial de 10–20 docentes. No se enviaron invitaciones.

Al retomar, leer este informe junto con `CONTINUIDAD_25-10-2026.md`, conservar
los archivos nuevos y modificados y revisar `git status --short` antes de editar.
