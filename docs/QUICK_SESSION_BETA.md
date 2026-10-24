# Generador rápido de sesiones para beta

## Alcance y entrada

En el planificador, **Modo rápido · 3 pasos** abre Datos, Aprendizajes y Revisar y generar. **Modo avanzado** conserva las seis secciones. El modo avanzado sigue siendo la entrada inicial de esta beta para conservar los recorridos existentes; el modo rápido se activa explícitamente y permanece activo mientras se usa el editor. **Editar sesión**, en el menú lateral, permite reabrir el asistente después de cargar o generar un documento.

No hay framework nuevo, migraciones de base de datos ni cambios en los constructores Word/PDF. Este cambio no despliega servicios ni publica producción.

## Dependencias inspeccionadas antes de implementar

- `ui/index.shell.html`, `ui/fragments/session-editor.html` y `scripts/build_index.py`: el HTML de distribución se compone en build time, sin cargar fragmentos desde el navegador.
- `js/app.js`: referencias a controles, `getFormData`, `populateForm`, perfil y autoguardado.
- `workflow-controller.js`: navegación de las seis secciones; sus referencias DOM se conservan.
- `ai-controller.js` y `ai-copilot.js`: autenticación, preparación de archivos, gateway, normalización y validación v1, planificación vinculada y guardado.
- `curriculum-picker.js`, `data/competencias.json` y el registro `data/pedagogy/catalog.json`: catálogo general y perfiles curriculares con alcance y procedencia. Los perfiles registrados actualmente solo cubren Secundaria y tienen estado piloto.
- `session-adapter.js`, `SessionExport`, almacenamiento y controladores de exportación: contrato canónico y compatibilidad con documentos guardados.
- `app-theme.css` y `mobile-app-theme.css`: tokens visuales y distribución adaptable existentes.
- `get_user_entitlements`, enrutamiento y variables del gateway: la interfaz anterior ofrecía calidades fijas sin verificar cuenta o configuración del backend.

## Estado compartido y ciclo de vida

`quick-session-wizard.js` mueve **los mismos nodos vivos** del formulario a los paneles rápidos. Cada nodo tiene un marcador de su ubicación original. Al volver a avanzado se restauran primero los padres y después los hijos. No se clonan campos, no se reinicia el formulario y se conservan referencias, eventos, archivos, selección de plantilla, metodología, configuración y diseño. `AppState.sourceFileData` sigue siendo la única referencia del adjunto.

`quick-session-model.js` contiene reglas puras de edad/grado, duración y coherencia. La interfaz admite Inicial de 3, 4 y 5 años, Primaria de 1.º a 6.º y Secundaria de 1.º a 5.º. Si un valor previo es incompatible, lo conserva visible y bloquea el avance hasta que el docente lo corrija; no lo elimina silenciosamente. Los campos institucionales son opcionales. Los valores del perfil completan espacios vacíos y no reemplazan datos ya introducidos o cargados.

Las propuestas se guardan en `authoringPreferences` del **envoltorio de la aplicación**, junto a los datos de edición. No se añade ningún campo al contrato `SessionDocument v1`: `SessionExport.buildCanonicalPayload` excluye esas preferencias. Los documentos anteriores siguen siendo legibles; los campos nuevos recuperan criterios y evidencia del propósito canónico cuando no hay preferencias guardadas. Las propuestas editadas se utilizan en la siguiente generación; editar una propuesta no reescribe por sí solo el cuerpo ya generado.

El asistente no crea otra ruta de IA: el botón original llama a `SpaceLabAiController.handleGenerateAI`. El controlador conserva autenticación, `AiCopilot`, gateway, validaciones, créditos, generación vinculada y guardado. Se añade validación del asistente y un bloqueo de solicitudes simultáneas para evitar dobles clics.

## Currículo y propuestas

En rápido, el selector existente recibe únicamente perfiles compatibles con nivel, grado y área. El catálogo general continúa disponible en avanzado. Los perfiles piloto, sus notas de transcripción condensada, referencias y desempeños se presentan con advertencias de revisión; no se anuncian como textos oficiales certificados.

**Inicial y Primaria no tienen cobertura por edad/grado en los perfiles actuales.** Se muestra esta ausencia, se permite la aportación manual del docente y no se rellenan competencias, capacidades ni desempeños oficiales inventados. Se advierte también sobre selecciones incompatibles después de cambiar de alcance. No se borran aprendizajes aportados manualmente.

Actividades, criterios y evidencia tienen campos separados, editables y rotulados como propuestas. Se recuperan del resultado generado cuando estaban vacíos. Los desempeños del catálogo son información de consulta; el docente decide qué desempeño aportar al generador. La revisión de coherencia es una comprobación de coincidencias y cobertura, no una certificación de calidad pedagógica.

## Adaptaciones indispensables del backend

1. **Consulta autenticada `action: capabilities` en `ai-gateway`:** usa `get_user_entitlements` y las rutas configuradas/habilitadas, incluyendo fallback. Devuelve solo las calidades disponibles, sin claves ni nombres de proveedores. En el gateway actualizado, esta rama retorna antes de cualquier llamada a la contabilidad o a proveedores. No consume créditos. La disponibilidad sigue pudiendo cambiar entre la consulta y la generación; el backend conserva la autoridad final.
2. **Prompt protegido:** incorpora `actividades_sugeridas`; criterios y evidencia reutilizan campos ya soportados. El modo rápido añade una directiva para no atribuir propuestas no verificadas al currículo oficial. Se actualiza la versión del prompt para trazabilidad. No cambia la forma de `SessionDocument v1` ni sus presupuestos, reservas, reintentos o tarifas.

Si el backend aún no soporta la consulta o hay un error de red, la interfaz deja Automático como selección delegada al gateway y oculta las demás opciones no verificadas. Una calidad previamente seleccionada se conserva, pero se bloquea la generación si no puede comprobarse su disponibilidad. No se sustituye la configuración guardada silenciosamente.

La revisión del PR debe considerar ambos cambios del gateway antes de habilitar todas las opciones en un entorno. Este PR no ejecuta ese despliegue.

## Accesibilidad y presentación

Botones nativos, paneles inactivos ocultos, orden DOM compartido, foco en el título de cada paso, errores anunciados y opciones desplegables nativas. Los estilos usan los tokens de Space Lab y están aislados en `css/quick-session.css`. Se comprobaron anchos de 390 y 768 px y escritorio. Se corrigió la retirada de avisos cuando movimiento reducido desactiva el evento `animationend`.

## Validación ejecutada

- 49 suites JavaScript: contratos, adaptadores, catálogo, selección curricular, almacenamiento, planificación, rutas de IA, permisos y créditos, incluida `quick-session.test.js`.
- 27 pruebas Deno: prompt protegido, propuestas del asistente, disponibilidad por cuenta/configuración/fallback, créditos, identidad contable, límites/tiempos y planificación vinculada.
- Contrato y adaptador Python, constructores y fidelidad DOCX, matemáticas Word, geometría, unidades, composición de bundles, backend DOCX, emparejamiento del motor, higiene, seguridad de perfil, créditos y cuotas.
- Navegador: `ui_quick_session_smoke.py`, recorridos individual y vinculado, guardado/recuperación, estructura, presentación, recuperación de cuenta, planificación/IA, Matemática de Secundaria, ida y vuelta de fórmulas, temas, overlays, arranque y accesibilidad.
- PDF: `pdf_fallback_math_smoke.py`, con paginación de contenido extenso y delimitadores matemáticos.
- Composición, hashes de assets, sintaxis JavaScript y `git diff --check`.

El test del asistente comprueba Inicial de 5 años/Matemática, Primaria de 2.º, grados incompatibles, navegación atrás, alternancia repetida sin perder identidad DOM, adjunto/configuración, generación sin alumnos, rechazo de autenticación y créditos, propuestas enviadas al controlador, guardado/recuperación, exportación canónica sin preferencias, doble clic, catálogo de Secundaria, móvil y teclado.

**Límites de la verificación:** las respuestas de IA y de cuenta del test UI son simuladas: no se gastaron créditos reales ni se consultaron cuentas de producción. Se generaron DOCX y PDF mediante la alternativa Chromium; la conversión nativa de Microsoft Word en Windows requiere validación en ese entorno. El chequeo completo del entrypoint remoto del gateway quedó bloqueado por acceso a `deno.land`/`esm.sh` en este entorno; los módulos locales modificados se comprobaron mediante las pruebas Deno. CI conserva el chequeo completo.

## Reproducir las pruebas nuevas

```bash
node tests/quick-session.test.js
deno test tests/ai-capabilities.test.ts tests/ai-prompt-builder.test.ts
python tests/ui_quick_session_smoke.py
python scripts/build_index.py --check
python scripts/version_assets.py --check
```

Se usan las dependencias de validación existentes y Chromium de Playwright. Localmente se usó Chromium 153 alternativo porque falló la descarga estándar de Playwright; no se añadieron esas herramientas al repositorio. Los scripts nuevos están incluidos en `.github/workflows/validate.yml`.

Si se modifican fragmentos o assets:

```bash
python scripts/build_index.py --write
python scripts/version_assets.py --write
```

Los cambios de build id en las otras páginas HTML son generados por esa herramienta, no cambios funcionales de dichas páginas.
