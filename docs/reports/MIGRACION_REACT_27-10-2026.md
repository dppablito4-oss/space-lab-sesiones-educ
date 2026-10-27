# Migración del frontend a React — 27/10/2026

Se amplió React a la interfaz completa y se verificó en Chromium y **Comet
externo con ventana visible**, usando un perfil aislado y cuentas desechables
de la aplicación. Los cambios permanecen locales, sin commit, push o publicación.
Se conservaron los parches previos y los archivos nuevos del árbol de trabajo.

## Qué se migró

- Portada pública, Mi espacio, biblioteca, formulario avanzado, vista del
  documento y ventanas de autenticación, términos, guardado, logos y exportación.
- Árbol principal con HTML inicial generado por React y posterior hidratación.
- Tarjetas de sesiones, acciones de cuenta y avisos mediante componentes con
  estado React; los textos dinámicos se escapan automáticamente.
- Vistas dinámicas de planificación, chats y galerías mediante regiones que
  construyen nodos React, manteniendo los constructores y controladores de dominio.
- Descargas y conexión del motor como páginas React. La vinculación gestiona
  falta de token, 401, comprobación, éxito y cancelación al salir.
- Animaciones de vistas, pasos, ventanas y tarjetas; respeto de movimiento reducido.
- Administración continúa con su frontend React y bundle separado.

La [guía del frontend](../FRONTEND_REACT.md) identifica las fuentes mantenidas y
los límites del editor. Los HTML de vistas bajo `ui/fragments/` pasan a ser
salidas generadas. No se mantienen dos juegos editables de páginas.

No se reescribieron los algoritmos de documentos, currículo, IA, permisos o
contabilidad. Los controladores JS se reutilizan. El motor `contenteditable`
conserva sus operaciones DOM; los constructores de vistas dinámicas conservan
sus adaptadores, aunque el renderizado de esas regiones lo realiza React.

## Fallos encontrados y corregidos durante la migración

1. La hidratación introdujo un arranque asíncrono. Pruebas que invocaban
   `SupabaseClient` inmediatamente después de DOMContentLoaded encontraron el
   servicio todavía sin inicializar. Se incorporaron una señal de disponibilidad
   y esperas explícitas, conservando sus aserciones funcionales. Se cubrió además
   la recarga de la biblioteca de planificación.
2. Se conservan clics hechos durante la carga y se repiten cuando los módulos
   están preparados. Una prueba retiene la descarga del SDK, pulsa Ingresar y
   comprueba que la ventana se abre al terminar la descarga.
3. La vista de desarrollo insertaba un segundo host React. Se corrigió para
   hidratar el mismo árbol del sitio estático. La comparación público/local pasa.
4. El fallo del bundle ya no debe inutilizar el HTML inicial. Se añadió un
   arranque de recuperación que usa el mismo markup y controladores. Un bundle
   tardío no puede reemplazar ediciones hechas durante la recuperación.
5. El verificador de páginas generadas necesitó normalizar CRLF/LF para comparar
   el resultado de Windows y Linux sin falsos positivos.

No se eliminaron comprobaciones funcionales para ocultar esos fallos. Se
actualizaron contratos que dependían de nombres de interfaz o del arranque
anterior, y se añadieron regresiones para los nuevos límites.

## Verificación final

| Comprobación | Resultado |
| --- | --- |
| Lógica y contratos del workflow | **86 comandos aprobados**, cero fallos finales. Incluyen JS, Python, Deno y tipos de las cinco Edge Functions. |
| Navegador | **35 comandos GUI distintos aprobados** tras corregir las esperas de arranque/recarga. El recorrido completo nuevo también se ejecutó por separado. |
| Comet externo | Ventana visible, perfil temporal, 390 y 1440 px; ingreso real por formulario, lectura de créditos, guardado y reapertura contra Supabase. |
| Compilación | Bundles público y administrativo y distribución de desarrollo aprobados; TypeScript sin errores. |
| Integridad del frontend | Snapshots React, composición HTML, versiones de caché, IDs sin duplicados e higiene aprobados. |
| Sintaxis | Todos los JS comprobados con `node --check`; Ruff del workflow y compilación de las pruebas modificadas aprobados. |
| Base administrativa | SQL, RLS, permisos, contabilidad, controles de cuenta y pruebas de almacenamiento aprobados. |

Las pruebas GUI incluyen editor en cinco anchos, generador React en cuatro,
unidades y experiencias, referencias curriculares, sesiones vinculadas,
generación y errores simulados, guardado/reapertura, cambio de cuenta,
recuperación, temas, modales, administración, logos, seguridad y accesibilidad.
Word/PDF y fórmulas se exportaron con el backend real en las pruebas de motor.
No se revalidó una release nueva del EXE: el backend no cambió en esta migración.

## Comet y límites de las pruebas reales

Se utilizó `C:\Program Files\Perplexity\Comet\Application\comet.exe` con
Playwright en modo visible. No se usó el perfil habitual ni se creó una cuenta
del proveedor de Comet. Se crearon cuentas temporales **de Space Lab** mediante
Supabase Auth, sin mensajes de confirmación, y se introdujeron sus credenciales
en el formulario real del producto.

Se comprobaron créditos reales del plan gratuito, persistencia en la base y
reapertura desde la biblioteca. Todos los usuarios de prueba fueron eliminados
al terminar. Los secretos permanecieron en memoria; las capturas no contienen
contraseñas. No se enviaron correos ni se hicieron llamadas de IA de pago durante
esta migración. Las generaciones de la matriz general usan fixtures externos
para controlar errores y resultados de forma reproducible.

La página de enlace del motor se comprobó con una frontera HTTP aislada para
token ausente, vencido y correcto. Las exportaciones reales pertenecen a sus
pruebas específicas; no atribuir a ese mock una vinculación de un EXE publicado.

Se inspeccionaron visualmente capturas de Comet del espacio docente, documento
y portada móvil. Los textos de prueba con etiquetas maliciosas permanecen
literales; no se crean imágenes ni se ejecutan sus eventos.

## Evidencia

En `artifacts/react-migration/`, ignorado por Git:

- `cli-results.json`: 86 comandos y sus códigos de salida.
- `gui-results.json`: 35 comandos distintos; registra la corrección y nueva
  ejecución de la prueba de recarga que falló inicialmente.
- `comet-report.json` y `comet-live-account.json`: recorridos reales y limpieza.
- `surfaces-report.json`: hidratación, texto seguro, clic durante carga,
  animación y vinculación con tokens sintéticos.
- `Comet-landing-390.png`, `Comet-home-1440.png`,
  `Comet-editor-1440.png` y otras capturas de los dos tamaños.
- Logs de cada comando y scripts de orquestación para esta revisión.

## Estado de entrega

El frontend está preparado para revisión local. **No está publicado**. Antes de
promover hay que coordinar los pendientes de Supabase/motor documentados en
[la validación de apertura](VALIDACION_APERTURA_27-10-2026.md).

El conflicto previo entre dispositivos se corrigió en un parche posterior:
ver [revisiones y copias recuperadas](CONFLICTOS_SESIONES_27-10-2026.md). La
continuación de una generación al cerrar su pestaña aún requiere una cola
persistente y sigue pendiente.
