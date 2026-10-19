# Preparación de beta — evidencia al 19 de octubre de 2026

## Estado

Backend de Supabase actualizado y comprobado en el proyecto
`koptglmifwpzrfzvipnm`. Frontend corregido y probado localmente; su publicación
se registra por separado. No se declara abierta la beta hasta resolver los
pendientes operativos indicados abajo.

## Cambios remotos realizados

- Las 17 migraciones previas coincidían con el repositorio.
- Aplicada `20261019221350_beta_privilege_hardening.sql`: eliminación de permisos
  de tabla completos innecesarios para los roles de navegador y cierre de RPCs
  internos/anónimos. No se eliminaron datos de docentes.
- Los permisos sobrantes bajaron de 81 a 0. La ejecución anónima de funciones
  SECURITY DEFINER pasó de cuatro funciones a cero.
- Edge Functions activas después de actualizar: gateway 5, OpenAI 19, Gemini 16,
  DeepSeek 23 y mailer 8. JWT se conserva desactivado en routers/gateway y
  activado en mailer; cada endpoint verifica permisos en su implementación.
- Se conservó el código previo a la actualización en un artefacto local ignorado.

## Comprobaciones reales aprobadas

- Pruebas SQL con roles de dos docentes y un administrador: aislamiento de
  sesiones, cambios de propietario rechazados, perfil protegido y acceso
  administrativo válido. Incluyen consumo, duplicados y reembolsos de créditos.
  Todo dato creado por esas pruebas se revierte al terminar la transacción.
- Pruebas HTTP con dos cuentas temporales: creación administrativa, ingreso,
  guardado de sesión y planificación 2.0, lectura cruzada denegada y bloqueo de
  escalada de rol y acceso a SMTP. Las cuentas temporales se cerraron y borraron.
- Las cinco funciones rechazan POST sin autenticación. El mailer ya no responde
  con error 500 ante un método GET.
- Generación real corta: HTTP 200, OpenAI `gpt-6-luna`, un crédito, cero fallbacks.
  La repetición del identificador recibe 409 y no descuenta créditos adicionales.
- No se enviaron correos. Las credenciales se manejaron en memoria sin imprimirlas
  ni guardarlas en el repositorio. No se cambiaron claves de proveedor.

## Comprobaciones locales

- 46 archivos de pruebas JavaScript y 17 pruebas Deno aprobadas.
- 38 comprobaciones Python aprobadas, incluidas 20 de navegador.
- Composición del HTML, versiones de assets, Ruff y tipos de Edge Functions
  comprobados. El frontend distingue guardado local de sincronización.
- Regresiones nuevas para espacios por cuenta, sincronizaciones en vuelo,
  almacenamiento lleno y recuperación de contraseña.

## Pendientes para abrir la beta

1. Publicar y verificar el frontend actualizado. El código local tiene las
   correcciones de aislamiento, guardado y recuperación; no basta con desplegar
   las Edge Functions para que los navegadores las reciban.
2. Decisión confirmada: beta abierta con registro público. Auth conserva las
   altas abiertas y la confirmación automática; revisar medidas contra abuso
   y entrega de correo antes de cambiar ese comportamiento.
3. Verificar entrega y uso de un enlace real de recuperación. La interfaz y el
   protocolo se probaron; no se enviaron mensajes de prueba al usuario.
4. Preparar respaldo y ensayar restauración. El proyecto no informa respaldos
   físicos disponibles ni PITR. Una copia de código no sustituye un respaldo de
   datos. Docker está instalado pero su daemon no estaba iniciado.
5. Publicar motor 1.4.1. La descarga oficial 1.4.0 pasó integridad y Word, pero
   falló PDF canónico con 422. El adaptador ya está corregido y la exportación
   real desde el código devuelve PDF válido; falta comprobar el nuevo binario.
6. Configurar observación/alertas, responsable de soporte y alcance de la beta.

## Avisos de seguridad y configuración restantes

El asesor de Supabase conserva once avisos de funciones SECURITY DEFINER
ejecutables por usuarios autenticados. Son RPCs usados por la aplicación con
controles internos; las pruebas cubrieron aislamiento, perfil, créditos y acceso
administrativo. Esto no equivale a una demostración de ausencia de cualquier
vulnerabilidad en todas las rutas. La protección de contraseñas filtradas está
desactivada y requiere revisión según el plan del proyecto.

Los permisos comerciales operan en observación mientras
`BILLING_ENFORCEMENT` no esté configurado. Los créditos y sus límites sí se
validan en base de datos. Antes de cobrar planes, comprobar toda la matriz y
activar su aplicación en servidor.

## Repetición de comprobaciones

```powershell
npx --yes supabase db query --linked --project-ref koptglmifwpzrfzvipnm --file tests/beta_database_security.sql
npx --yes supabase db query --linked --project-ref koptglmifwpzrfzvipnm --file scripts/beta_readiness_audit.sql
python scripts/beta_remote_smoke.py
```

La opción manual `--with-ai` hace una generación real y consume créditos del
proveedor. Los informes locales de esta ejecución están en
`artifacts/beta-readiness/` y no se versionan.
