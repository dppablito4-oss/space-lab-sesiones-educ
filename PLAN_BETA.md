# Plan de beta abierta — 19 de octubre de 2026

Objetivo: beta con registro público, cuentas aisladas, guardado recuperable,
consumo de IA controlado y exportación Word/PDF comprobada.

## Pasos y estado

1. **Aislamiento y guardado — terminado.** Sesiones, borradores y planificaciones
   separados por cuenta. Los documentos antiguos quedan en invitado; no se suben
   automáticamente al ingresar. Cambiar de cuenta limpia el contexto e invalida
   respuestas pendientes. El guardado informa errores y conserva las ediciones
   hechas mientras espera una sincronización.
2. **Acceso e IA — terminado, salvo entrega de correo.** Recuperación, límites de
   tiempo e interruptores de IA implementados. El protocolo real de recuperación
   y el ingreso con nueva contraseña pasaron sin enviar mensajes.
3. **Supabase — desplegado y verificado.** CLI con acceso al proyecto correcto
   `koptglmifwpzrfzvipnm`. Aplicada `20261019221350_beta_privilege_hardening.sql`:
   81 permisos sobrantes y cuatro funciones privilegiadas accesibles a anónimos
   quedaron en cero. RLS, perfiles y créditos probados con SQL real y ROLLBACK.
   Gateway v5, OpenAI v19, Gemini v16, DeepSeek v23 y mailer v8 publicados.
4. **Recorrido real — aprobado.** Registro público, ingreso, recuperación sin
   correo, sesión/planificación guardadas y acceso cruzado bloqueado probados
   por HTTP con dos cuentas temporales; ambas eliminadas. Generación OpenAI
   `gpt-6-luna`: HTTP 200, un crédito, cero fallbacks; duplicado 409 sin otro cargo.
   Se reutilizó la clave remota existente autorizada.
5. **Motor 1.4.1 — publicado y probado.** Corregido el PDF canónico que fallaba en
   1.4.0. CI probó el EXE; además se descargó la release y se comprobaron hash,
   versión y exportaciones reales. Página e informe de integridad actualizados.
6. **Respaldo — restauración manual verificada.** Esquema, datos y roles copiados
   con ACL local restringida. En Docker aislado coincidieron 44 tablas y 734 filas;
   también pasaron las pruebas de seguridad. Contenedor eliminado al terminar.
7. **Frontend — publicación en curso.** Publicar el commit validado en Pages y
   contrastar el sitio con `app-version.json`. Resultado en el informe de entrega.

## Comprobaciones

46 archivos JavaScript, 17 pruebas Deno y 38 comprobaciones Python aprobados
localmente, incluidos 20 recorridos de navegador. Suite completa Linux y prueba
del EXE Windows aprobadas también en GitHub Actions para `v1.4.1`. Composición,
versiones de assets, Ruff y tipos comprobados. El guardado diferencia persistencia
local y error; la privacidad describe proveedores y archivos temporales.

Evidencia: `BETA_READINESS_19-10-2026.md`. Procedimiento: `docs/BETA_OPERATIONS.md`.
Los respaldos y resultados en `artifacts/beta-readiness/` no se versionan.

## Decisiones y trabajo operativo pendiente

- **Beta abierta con registro público**, según decisión del usuario. Auth mantiene
  confirmación automática; no se añadió lista de invitados.
- Comprobar llegada de recuperación y capacidad SMTP para una beta pública.
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
