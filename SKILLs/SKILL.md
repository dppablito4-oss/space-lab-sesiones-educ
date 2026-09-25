---
name: pablito-frontend-design
description: >-
  Use this skill whenever the user asks to "rediseña la interfaz", redesign a screen,
  or build web user interfaces matching the Pablito Leans visual style and architecture.
  Provides complete design tokens, color palette, component patterns, vanilla web stack,
  mobile-first bottom navigation, and desktop two-column split layout.
---

# Sistema de Diseño y Frontend — Pablito Leans

Esta skill enseña al agente a generar, rediseñar y extender interfaces web con la estética visual, arquitectura técnica y componentes exactos del proyecto **Pablito Leans**.

---

## 1. Filosofía y Estilo Visual

- **Estética Cyber-Dark con Glassmorphism & Modo Claro Nítido**: 
  - *Modo Oscuro*: Fondo negro/azulado profundo (`#07070d`), paneles translúcidos con desenfoque de fondo (`backdrop-filter: blur(20px)`), bordes sutiles de cristal (`rgba(255, 255, 255, 0.08)`), y un degradado radial ambiental animado.
  - *Modo Claro*: Fondo blanco/grisáceo suave (`#f5f6f8`), paneles blancos translúcidos (`rgba(255, 255, 255, 0.9)`), bordes nítidos (`#d0d4d9`), tipografía de alto contraste (`#1b1a19`) y acentos en azul OneDrive (`#0f6cbd`).
- **Color de Acento Eléctrico**: Neón cian (`#00D4FF`) combinado en degradado con violeta profundo (`#7B61FF`), con resplandores luminosos (`box-shadow` con efecto glow).
- **Arquitectura de Vista Dual**:
  - *Vista Pública / Landing Page (`#landing-view`)*: Flujo de bienvenida, pasos pedagógicos CNEB, arquitectura del motor local Word, catálogo de modelos IA (GPT-6 Luna, DeepSeek R1, Gemini), FAQs docentes y selector de tema.
  - *Espacio de Trabajo / Editor (`#app-view`)*: Rail de navegación lateral de 6 pasos, formulario contextual curricular y renderizado interactivo en hoja A4.
- **Arquitectura Híbrida Web + Motor Local**:
  - Planificación y generación con IA en el cliente web estático (GitHub Pages).
  - Compilación de máxima fidelidad a Word (.docx nativo con tablas CNEB y ecuaciones OMML) a través de `pablitopyhost.exe` en `localhost:8000`.
- **Mobile-First con Adaptación Ergonómica**:
  - En móviles: botones e interacciones principales al alcance del pulgar (barra inferior fija `flow-nav` y `controls-panel` flotante).
  - En escritorio (>= 1024px): layout dividido en 2 columnas (área de trabajo/canvas a la izquierda y barra lateral de herramientas a la derecha).
- **Stack Técnico Vanilla Puro**: HTML5 semántico, CSS3 con Custom Properties (sin Tailwind ni librerías pesadas), y JavaScript ES Modules nativo. Cero dependencias innecesarias.

---

## 2. Paleta de Colores y Tokens CSS

Usa siempre las variables de diseño definidas en `:root` ([tokens.css](./references/tokens.css)):

```css
:root {
  /* Fondos */
  --bg-primary: #07070d;               /* Fondo base ultra oscuro */
  --bg-secondary: #0e0e18;             /* Fondo de tarjetas y paneles */
  --bg-surface: rgba(255, 255, 255, 0.04);       /* Superficie vítrea */
  --bg-surface-hover: rgba(255, 255, 255, 0.08); /* Hover en superficie */
  --bg-surface-active: rgba(255, 255, 255, 0.12);

  /* Acento y Resplandor */
  --accent: #00D4FF;                   /* Cian neón principal */
  --accent-dark: #009ec2;
  --accent-glow: rgba(0, 212, 255, 0.25);
  --accent-glow-strong: rgba(0, 212, 255, 0.5);
  --accent-gradient: linear-gradient(135deg, #00D4FF 0%, #7B61FF 100%);

  /* Texto */
  --text-primary: #F0F0F5;             /* Texto principal nítido */
  --text-secondary: #8888A0;           /* Texto secundario y etiquetas */
  --text-muted: #55556A;               /* Texto deshabilitado o pistas */

  /* Estados Semánticos */
  --success: #00E676;
  --success-bg: rgba(0, 230, 118, 0.1);
  --warning: #FFAB40;
  --warning-bg: rgba(255, 171, 64, 0.1);
  --danger: #FF5252;
  --danger-bg: rgba(255, 82, 82, 0.1);

  /* Radios de Borde */
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-full: 9999px;              /* Para píldoras y botones redondeados */

  /* Sombras y Luces */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 24px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 48px rgba(0, 0, 0, 0.5);
  --shadow-glow: 0 0 20px var(--accent-glow);

  /* Vidrio (Glassmorphism) */
  --glass-bg: rgba(14, 14, 24, 0.75);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-blur: blur(20px);
}
```

---

## 3. Tipografía

- **Fuente**: Google Font `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`.
- **Títulos con Degradado de Acento**:
  ```css
  .app-title {
    font-size: 1.25rem;
    font-weight: 700;
    background: var(--accent-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.02em;
  }
  ```

---

## 4. Componentes Clave y Jerarquía

Para el detalle completo de marcado, consulta [components.md](./references/components.md).

### 4.1. Botones (`.btn`)
- **Primario (`.btn-primary`)**: Fondo `var(--accent-gradient)`, texto negro `#000`, peso 600, sombra con glow, bordes redondeados completos (`border-radius: var(--radius-full)`). Al pasar el cursor (`hover`): `transform: translateY(-2px); box-shadow: 0 4px 20px var(--accent-glow-strong);`.
- **Secundario (`.btn-secondary`)**: Fondo `var(--bg-surface)`, borde `1px solid var(--glass-border)`, texto `var(--text-primary)`.
- **Peligro (`.btn-danger`)**: Fondo rojo traslúcido `var(--danger-bg)`, texto `var(--danger)`.
- **Iconos circulares (`.btn-icon-only`, `.btn-icon`)**: 36px o 44px de diámetro con iconos SVG limpios (viewBox `0 0 24 24`, stroke-width `2`).

### 4.2. Pestañas de Documentos (`.tabs-bar`, `.tab`)
- Pestañas con puntos de estado (verde para documento con páginas, gris para vacío), botón de cerrar en hover (`×`), e indicador inferior cian en la pestaña activa.

### 4.3. Selector de Píldoras / Filtros (`.filter-selector`)
- Píldoras redondeadas con scroll horizontal táctil. La opción seleccionada (`.active`) tiene fondo cian neón y texto negro.

### 4.4. Panel de Controles Flotante / Lateral (`.controls-panel`)
- En móvil: barra inferior fija con fondo de cristal difuminado.
- En PC: integrado limpiamente al final de la columna lateral derecha (`position: static; margin-top: auto;`).

### 4.5. Diálogos y Modales (`.modal-overlay`, `.modal-dialog`)
- Fondo negro semitransparente con desenfoque (`backdrop-filter: blur(4px)`).
- Tarjeta de diálogo centrada con bordes redondeados (`--radius-md`), cabecera con botón de cerrar redondo, cuerpo con scroll y pie de página alineado a la derecha.

### 4.6. Toasts de Notificación (`.toast`)
- Contenedor flotante en la esquina superior derecha (`top: 24px; right: 24px; z-index: 10000`).
- Borde izquierdo distintivo de 3px según el tipo (`--success`, `--warning`, `--danger`, `--accent`).

---

## 5. Procedimiento para: "Rediseña la interfaz"

Cuando el usuario pida **"rediseña la interfaz"** o solicite una pantalla similar a este repositorio, sigue estos pasos:

1. **Estructura del Documento**:
   - Cabecera fija (`.app-header`) con título en degradado y subtítulo a la derecha.
   - Pestañas superiores (`.tabs-bar`) si aplica a gestión de múltiples elementos.
   - Contenedor principal (`.app-main`) centrado con `max-width: 1440px`.
   - Navegación inferior móvil de pasos (`.flow-nav`) si el flujo es secuencial.
2. **Aplicar la Arquitectura Responsiva Dual**:
   - Consulta [layout-guide.md](./references/layout-guide.md).
   - En pantallas móviles: disposición vertical en una columna con controles anclados al fondo.
   - En pantallas `>= 1024px`: cuadrícula dividida en 2 columnas:
     ```css
     display: grid;
     grid-template-columns: 1fr 350px;
     gap: var(--space-xl);
     height: calc(100vh - 140px);
     ```
3. **Inyectar los Tokens de Estilo**:
   - Asegurar el fondo ambiental radial en `body::before`.
   - Emplear variables CSS (`var(--bg-primary)`, `var(--accent-gradient)`, etc.).
4. **Diseño de Botones y Controles**:
   - Una única acción principal destacada (`.btn-primary`) por vista.
   - Acciones complementarias con `.btn-secondary` o `.btn-icon-only`.
5. **Comprobación de Calidad**:
   - ¿Tiene contraste accesible sobre fondo oscuro?
   - ¿Los botones tienen iconos SVG alineados y texto claro?
   - ¿En móvil los botones se alcanzan cómodamente sin tapar contenido importante?

---

## 6. Recursos y Enlaces Rápidos

- [Tokens CSS](./references/tokens.css) — Variables de colores, sombras, radios y vidrios.
- [Guía de Componentes](./references/components.md) — HTML y CSS listos para copiar.
- [Guía de Layout Responsivo](./references/layout-guide.md) — Grid de 2 columnas vs barra móvil.
- [Plantilla de Ejemplo](./examples/template-page.html) — Página completa de demostración.
