# Prototipo React del generador

El generador tiene una vista alternativa con React, TypeScript, Vite, Radix UI
y Lucide. Está en `feature/beta-quick-session-ux`, junto al modo rápido existente.
La incorporación de React es una evolución del alcance inicial de esa rama;
el prototipo no sustituye todavía toda la aplicación ni se despliega a producción.

## Abrir y comparar

Requiere Node `^20.19.0` o `>=22.12.0` y las dependencias Python existentes para
las pruebas. Versiones fijadas en `package.json` y `package-lock.json`.

```powershell
npm ci --ignore-scripts
python scripts/build_index.py --write
python scripts/version_assets.py --write
npm run dev:react
```

- Prototipo: http://localhost:5173/
- Interfaz anterior en el mismo origen: http://localhost:5173/legacy.html#/app
- «Modo avanzado» y «Volver al nuevo generador» permiten comparar en la misma
  pestaña, conservando estado y adjuntos. Es el recorrido recomendado.

El servidor escucha solo en loopback. Sirve una lista explícita de recursos
públicos; no utiliza la raíz completa del repositorio como carpeta pública.
Los accesos a backend, Supabase, artefactos y archivos ocultos están excluidos.
Una sesión iniciada en otro puerto no se copia automáticamente: el navegador
mantiene su almacenamiento por origen. Puedes iniciar sesión con el formulario
actual desde el prototipo.

## Alcance visual

Navegación lateral, cabecera, progresión de tres pasos, tarjetas de nivel,
campos amplios, resumen en vivo, propuestas editables y opciones desplegables.
La navegación móvil y la ayuda usan diálogos Radix con manejo de foco y teclado.
Se respeta el tema claro/oscuro y la preferencia de movimiento reducido.

El resto de vistas —biblioteca, planificación, edición del documento y
exportación— siguen usando la interfaz existente. Los accesos del menú abren
esas vistas y ofrecen volver al prototipo.

## Estado e integración

`react-ui/src/` contiene los componentes TypeScript y los estilos del prototipo.
`react-ui/vite.config.mts` compone su host desde el `index.html` generado por los
fragmentos existentes; no mantiene una segunda copia del formulario ni requiere
un iframe. React solo administra su presentación y el paso visible.

`js/components/react-session-bridge.js` ofrece un almacén externo consumido con
`useSyncExternalStore`. Lee los campos canónicos del formulario existente y
escribe a través de eventos `input`/`change`. Observa cargas, generación, cambios
de cuenta, predeterminados, adjuntos y disponibilidad. El puente solo se crea
cuando existe el host React; el editor tradicional no incorpora React a su carga.

Los checkboxes curriculares reutilizan las acciones del selector existente.
Los adjuntos pasan por el procesador actual. Generar llama a
`SpaceLabAiController.handleGenerateAI`, con su autenticación, validación,
disponibilidad, créditos, prevención de doble solicitud y guardado. No existe
una ruta nueva a proveedores ni credenciales incluidas en el prototipo.

Las propuestas viven en `authoringPreferences`; el payload de exportación sigue
siendo `SessionDocument v1`, sin preferencias de interfaz. Editar una propuesta
no reescribe un documento ya generado: se aplica al volver a generar. El editor
avanzado permite editar directamente el documento.

El puente DOM es una transición para evaluar el diseño sin reescribir el motor
actual. Una migración más amplia debería extraer el estado y las acciones a
servicios compartidos y retirar progresivamente la dependencia de controles
ocultos. No deben coexistir dos implementaciones de contabilidad o persistencia.

## Construcción y validación

```powershell
npm run build:react
python tests/ui_react_session_smoke.py
python tests/ui_quick_session_smoke.py
python tests/ui_quick_session_layout_smoke.py
python scripts/build_index.py --check
python scripts/version_assets.py --check
```

El build queda en `artifacts/react-preview-dist`, fuera de Git, y copia únicamente
`js`, `css`, `assets`, `data` y los hosts/manifiesto públicos. `npm run preview:react`
permite revisar ese build en http://localhost:5174/. No lo publica.

La prueba nueva sirve el build compilado y recorre 360, 390, 768 y 1440 px:
edades/grados incompatibles, atrás, teclado, adjuntos, cambio a avanzado y vuelta,
rechazo de invitado, error de créditos, generación mediante el controlador,
guardado, recarga real, ayuda, navegación móvil y tema oscuro. Las cuentas y la
IA son simuladas; no se consumen créditos ni se escriben datos de producción.
También comprueba cancelar una nueva sesión con cambios pendientes desde la
navegación móvil: se libera el foco del menú antes de abrir la confirmación
existente, que permanece por encima del prototipo y conserva los datos al cancelar.

Además toma el payload v1 producido por el flujo React y genera DOCX y PDF reales.
Comprueba la fórmula como OMML en el Word y la presencia del contenido en el PDF.
La prueba PDF usa Chromium sin red; no acredita la conversión nativa de Word.

Los artefactos de QA quedan en `artifacts/react-preview-qa` y las capturas en
`tests/screenshots`, ambos ignorados por Git. CI compila el prototipo con el
lockfile y ejecuta estas pruebas junto a las regresiones existentes.

## Límites conservados

Inicial y Primaria aún no tienen perfiles locales verificados por edad/grado.
Se muestra la ausencia y se permite aporte manual. Los perfiles de Secundaria
siguen siendo piloto. No se inventa cobertura ni se presentan propuestas como
currículo oficial. Las opciones de IA dependen del gateway disponible; si no
soporta descubrimiento, se conserva Automático y la autorización final del servidor.

La generación sigue dependiendo de mantener la pestaña abierta. Este prototipo
no añade una cola persistente ni cambia el motor Word/PDF, Auth o Supabase.
