# Plan de beta abierta — 19 de octubre de 2026

Objetivo: beta con registro público, cuentas aisladas, guardado recuperable,
consumo de IA controlado y exportación Word/PDF comprobada.

Actualización 20/10, 16:22 (Bogotá): publicación y CI de `1e98594` aprobados.
Gateway v7 activo, con solicitudes HTTP 200 posteriores al arreglo. Se comprobaron
CORS del sitio público/localhost y respuesta HTTP en navegador sin gastar IA.
El usuario confirmó «Ya funciona» después de recargar: incidencia IA cerrada.
Detalle y límites de la evidencia en el informe de preparación.

## Restauración de la estructura de sesiones — 20/10

- [x] Comparar el Word de referencia y el historial `HEAD~100` (`8fb4de1`).
- [x] Recuperar los cuatro apartados de inicio, los procesos del método y los
  tres apartados del cierre, con desarrollo secuencial y duración coherente.
- [x] Aplicar la misma estructura a sesiones individuales y vinculadas a unidades
  y experiencias. La metodología de proyecto conserva los procesos del área.
- [x] Conservar títulos, orden, método seleccionado y currículo al guardar,
  reabrir y exportar. Corregida la normalización de criterios de lista de cotejo.
- [x] Pruebas reales de IA y Word para una sesión individual y una vinculada;
  prueba de navegador de los tres recorridos con el control de calidad activo.
- [x] Generador remoto desplegado: gateway v8, OpenAI v23, Gemini v20 y DeepSeek v27.
- [x] Web publicada en `7b23bdb`, build `9e0caddcfc755b3b`. Seis archivos
  contrastados con el despliegue y recorridos de estructura comprobados en el sitio real.
- [x] Validación Linux y compilación/pruebas del EXE Windows aprobadas en
  [GitHub Actions](https://github.com/dppablito4-oss/space-lab-sesiones-educ/actions/runs/39507295482).

Evidencia, alcance y ejemplos locales en `docs/SESSION_STRUCTURE_20-10-2026.md`.

## Pasos y estado

Interfaz revisada y aprobada: landing actualizado, editor redondeado y formulario
continuo con menú lateral, casillas de aprendizajes y resumen. Se retiraron los
archivos de referencia y el prototipo; detalles en `docs/UI_20-10-2026.md`.
Esta actualización está validada localmente; su publicación se gestiona por separado.

1. **Aislamiento y guardado — terminado.** Sesiones, borradores y planificaciones
   separados por cuenta. Los documentos antiguos quedan en invitado; no se suben
   automáticamente al ingresar. Cambiar de cuenta limpia el contexto e invalida
   respuestas pendientes. El guardado informa errores y conserva las ediciones
   hechas mientras espera una sincronización.
2. **Acceso e IA — terminado, salvo entrega de correo.** Recuperación, límites de
   tiempo e interruptores de IA implementados. El protocolo real de recuperación
   y el ingreso con nueva contraseña pasaron sin enviar mensajes.
   La URL remota de Auth y sus redirecciones, antes en localhost, ya apuntan al
   sitio público y el enlace generado se comprobó después de aplicar el cambio.
3. **Supabase — desplegado y verificado.** CLI con acceso al proyecto correcto
   `koptglmifwpzrfzvipnm`. Aplicada `20261019221350_beta_privilege_hardening.sql`:
   81 permisos sobrantes y cuatro funciones privilegiadas accesibles a anónimos
   quedaron en cero. RLS, perfiles y créditos probados con SQL real y ROLLBACK.
   Gateway v8, OpenAI v23, Gemini v20, DeepSeek v27 y mailer v8 publicados.
4. **Recorrido real — aprobado.** Registro público, ingreso, recuperación sin
   correo, sesión/planificación guardadas y acceso cruzado bloqueado probados
   por HTTP con dos cuentas temporales; ambas eliminadas. Generación OpenAI
   `gpt-6-luna`: HTTP 200, un crédito, cero fallbacks; duplicado 409 sin otro cargo.
   Se reutilizó la clave remota existente autorizada.
   Revisión posterior del fallo de IA: una sesión completa agotaba 45 s por
   proveedor. Con plazo de documento de 90 s, respaldo con presupuesto compartido
   y esfuerzo bajo para Luna, se obtuvo SessionDocument válido en 75,06 s desde
   el sitio publicado. El 20/10 el usuario confirmó que ya funciona tras recargar;
   se cierra la incidencia sin atribuir una causa única a la captura inicial.
5. **Motor 1.4.1 — publicado y probado.** Corregido el PDF canónico que fallaba en
   1.4.0. CI probó el EXE; además se descargó la release y se comprobaron hash,
   versión y exportaciones reales. Página e informe de integridad actualizados.
6. **Respaldo — restauración manual verificada.** Esquema, datos y roles copiados
   con ACL local restringida. En Docker aislado coincidieron 44 tablas y 734 filas;
   también pasaron las pruebas de seguridad. Contenedor eliminado al terminar.
7. **Frontend — publicado y comprobado.** GitHub Pages despliega ahora `7b23bdb`,
   build `9e0caddcfc755b3b`. El recorrido completo previo se
   verificó en `defe39c`; el 20/10 se cotejaron cuatro archivos del despliegue
   actual y se comprobó el transporte de IA en Chromium. En el recorrido previo
   de navegador real pasan guardado/sincronización/recarga, A → B → invitado y fallo de cuota,
   sin errores no capturados. Se corrigió además el bloqueo del cierre de sesión
   al consultar créditos desde el callback de Auth; la regresión protege ese caso
   y descarta saldos atrasados de otra cuenta.

## Comprobaciones

46 archivos JavaScript, 17 pruebas Deno y 38 comprobaciones Python aprobados
localmente, incluidos 20 recorridos de navegador. Suite completa Linux y prueba
del EXE Windows aprobadas también en GitHub Actions para `v1.4.1`. Composición,
versiones de assets, Ruff y tipos comprobados. El guardado diferencia persistencia
local y error; la privacidad describe proveedores y archivos temporales.

Evidencia: [informe de preparación](docs/reports/BETA_READINESS_19-10-2026.md). Procedimiento: `docs/BETA_OPERATIONS.md`.
Los respaldos y resultados en `artifacts/beta-readiness/` no se versionan.

## Decisiones y trabajo operativo pendiente

- **Beta abierta con registro público**, según decisión del usuario. Auth mantiene
  confirmación automática; no se añadió lista de invitados.
- **Correo: envío bloqueado por credenciales SMTP.** Prueba autorizada del 19/10
  a las 18:01 (Bogotá): el formulario publicado devolvió 500 y Auth registró
  respuesta Gmail `535 5.7.8 Username and Password not accepted`. Host, puerto,
  usuario y remitente coinciden con lo esperado. Actualizar la contraseña de
  aplicación de Gmail en Auth SMTP y repetir el envío antes de comprobar buzón.
- Automatizar respaldo y copia externa protegida. La copia manual cubre `public`
  y `auth`; excluye objetos de Storage, secretos y ajustes del proyecto. No hay
  respaldos físicos disponibles informados y PITR está desactivado.
- Activar alertas de caída/gasto y asignar responsable de soporte.
- Revisar once avisos de RPCs privilegiados usados por autenticados y protección
  de contraseñas filtradas. Los casos cubiertos pasan; no se acredita ausencia
  de cualquier vulnerabilidad.
- Permisos comerciales en observación (`BILLING_ENFORCEMENT` ausente); créditos
  aplicados en servidor. Antes de cobrar, comprobar y activar la matriz comercial.
  No se contrataron servicios ni se modificó facturación.

## CLI

```powershell
npx --yes supabase login
npx --yes supabase projects list --output-format json
```

La sesión ya tiene acceso al proyecto. No compartir secretos. En CLI 2.121.0 no
usar `--profile spacelab-beta`: intenta cargar un archivo y provoca
`Unsupported Config Type ""`. Los comandos `db query` requieren `--linked`.
