# Guía de Componentes de Interfaz — Estilo Pablito Leans

Esta referencia detalla el marcado HTML y clases CSS estándar del sistema de diseño para replicar cualquier interfaz con fidelidad exacta.

---

## 1. Cabecera (`.app-header`)

Efecto de cristal translúcido pegajoso en la parte superior con título en degradado cian-violeta y logo SVG con resplandor.

```html
<header class="app-header" id="app-header">
  <img src="assets/favicon.svg" alt="Logo" class="app-logo">
  <h1 class="app-title">Nombre de la App</h1>
  <span class="app-subtitle">Descripción corta o estado</span>
</header>
```

```css
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-bottom: 1px solid var(--glass-border);
}

.app-title {
  font-size: 1.25rem;
  font-weight: 700;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

.app-subtitle {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-left: auto;
}
```

---

## 2. Barra de Pestañas Multidocumento (`.tabs-bar`)

Pestañas deslizables horizontalmente con indicadores de estado de punto (`--success` / `--text-muted`) y botón de añadir.

```html
<nav class="tabs-bar" id="tabs-bar" aria-label="Pestañas abiertas">
  <div class="tabs-list" id="tabs-list" role="tablist">
    <div class="tab active" role="tab" aria-selected="true">
      <button class="tab__select" type="button">
        <span class="tab__status tab__status--has-pages"></span>
        <span class="tab__name">Documento 1</span>
      </button>
      <button class="tab__close" type="button" aria-label="Cerrar">×</button>
    </div>
  </div>
  <button class="tab-add" id="btn-add-tab" type="button">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    <span>Nuevo</span>
  </button>
</nav>
```

---

## 3. Botones y Jerarquía de Acciones (`.btn`)

Todos los botones usan esquinas redondeadas tipo píldora (`--radius-full`), fuente Inter con peso 600, y microinteracciones de elevación (`translateY(-2px)`).

### Botón Primario (Llamada a la acción / CTA)
Fondo degradado cian a violeta, texto oscuro `#000`, y resplandor cian reactivo.
```html
<button class="btn btn-primary" type="button">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
  <span>Acción Principal</span>
</button>
```

### Botón Secundario (Superficie traslúcida)
```html
<button class="btn btn-secondary" type="button">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
  <span>Secundario</span>
</button>
```

### Botón de Peligro / Eliminar
```html
<button class="btn btn-danger" type="button">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
  </svg>
  <span>Eliminar</span>
</button>
```

### Botón Circular de Ícono (`.btn-icon-only` o `.btn-icon`)
```html
<button class="btn btn-secondary btn-icon-only" type="button" title="Rotar">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.92-10.26l5.67-3.25"/>
  </svg>
</button>
```

---

## 4. Barra de Flujo Inferior Móvil (`.flow-nav`)

Se muestra en pantallas móviles fija abajo (`bottom: 0`) con efecto de cristal y `env(safe-area-inset-bottom)`. En escritorio (`min-width: 1024px`) se oculta automáticamente.

```html
<nav class="flow-nav" id="flow-nav">
  <button class="flow-step active" type="button"><span>1</span>Capturar</button>
  <button class="flow-step" type="button"><span>2</span>Ajustar</button>
  <button class="flow-step" type="button"><span>3</span>Mejorar</button>
  <button class="flow-step" type="button"><span>4</span>Ordenar</button>
  <button class="flow-step" type="button"><span>5</span>Exportar</button>
</nav>
```

---

## 5. Selectores de Píldoras / Filtros (`.filter-selector`)

Píldoras redondeadas que se deslizan horizontalmente con `scroll-snap`. La activa adquiere fondo cian sólido y sombra brillante.

```html
<div class="filter-selector filter-selector--primary">
  <button class="filter-option active" type="button">Original</button>
  <button class="filter-option" type="button">Auto</button>
  <button class="filter-option" type="button">Documento</button>
  <button class="filter-option" type="button">Pizarra</button>
  <button class="filter-option" type="button">Color</button>
</div>
```

---

## 6. Deslizadores Personalizados (`.styled-slider`)

```html
<div class="slider-group">
  <label for="slider-id">Intensidad <output id="slider-val">50%</output></label>
  <input type="range" id="slider-id" class="styled-slider" min="0" max="100" value="50">
</div>
```

---

## 7. Modales y Diálogos Flotantes (`.modal-overlay` y `.modal-dialog`)

Fondo oscuro con desenfoque (`backdrop-filter: blur(4px)`) y tarjeta central con bordes de cristal:

```html
<div class="modal-overlay hidden" id="modal-example" aria-hidden="true">
  <div class="modal-dialog" role="dialog" aria-modal="true">
    <div class="modal-header">
      <h3>Configurar Opciones</h3>
      <button class="btn-close" type="button" aria-label="Cerrar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label for="input-demo">Nombre</label>
        <input type="text" id="input-demo" class="form-input" placeholder="Escribe aquí...">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" type="button">Cancelar</button>
      <button class="btn btn-primary" type="button">Guardar Cambios</button>
    </div>
  </div>
</div>
```

---

## 8. Notificaciones Toast Flotantes (`.toast`)

Aparecen en la esquina superior derecha con borde indicador de color:
- Éxito: `--success` (`#00E676`)
- Advertencia: `--warning` (`#FFAB40`)
- Error: `--danger` (`#FF5252`)
- Info: `--accent` (`#00D4FF`)

```html
<div class="toast-container" id="toast-container">
  <div class="toast toast--success">
    <svg class="toast__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
    <span>Operación completada con éxito</span>
  </div>
</div>
```
