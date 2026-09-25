# Estrategia de Layout Responsivo — Estilo Pablito Leans

El sistema de diseño de Pablito Leans utiliza una arquitectura dual estricta:
1. **Móvil primero (< 1024px)**: Flujo secuencial vertical con barra de acciones y pasos fija en el pulgar.
2. **Escritorio (>= 1024px)**: Distribución en 2 columnas (Lienzo principal a la izquierda + Panel de herramientas a la derecha).

---

## 1. El Contenedor Base (`.app-main`)

```css
.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
  padding-bottom: 168px; /* Espacio para no tapar contenido con las barras fijas móviles */
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}
```

---

## 2. Comportamiento en Móvil (< 1024px)

- **Una columna centrada**: La imagen, canvas o formulario ocupa el ancho disponible.
- **Panel de acciones flotante abajo (`.controls-panel`)**:
  ```css
  .controls-panel {
    position: fixed;
    bottom: calc(62px + env(safe-area-inset-bottom));
    left: 0;
    right: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    padding: var(--space-md) var(--space-lg);
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border-top: 1px solid var(--glass-border);
  }
  ```
- **Navegación de pasos (`.flow-nav`)**: Ubicada en `bottom: 0` para cambiar entre pasos fácilmente con el pulgar.

---

## 3. Comportamiento en Escritorio (>= 1024px)

En pantallas grandes, el diseño se transforma radicalmente para aprovechar el espacio horizontal sin scroll innecesario:

```css
@media (min-width: 1024px) {
  .app-main {
    padding: var(--space-xl) var(--space-2xl);
    padding-bottom: var(--space-xl);
    min-height: calc(100vh - 72px);
  }

  /* Ocultar barra móvil de pasos */
  .flow-nav {
    display: none;
  }

  /* Grid de 2 columnas: 1fr para el visor y 350px para el panel */
  .result-zone,
  .editor-zone {
    display: grid;
    grid-template-columns: 1fr 350px;
    gap: var(--space-xl);
    align-items: start;
    height: calc(100vh - 140px);
  }

  /* El visor principal se ajusta al alto de pantalla */
  .result-main,
  .editor-main {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  /* Los controles pasan de fijos en el fondo a integrados dentro del sidebar */
  .controls-panel {
    position: static;
    background: transparent;
    backdrop-filter: none;
    border-top: none;
    padding: 0;
    margin-top: auto;
  }

  .controls-panel .btn {
    flex: 1 1 calc(50% - var(--space-sm));
  }
}
```

---

## 4. Fondo Ambiental Animado

El fondo general de la aplicación no es negro plano, sino que cuenta con un degradado radial sutil que da profundidad cibernética sin saturar la vista:

```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0, 212, 255, 0.08), transparent),
    radial-gradient(ellipse 60% 40% at 80% 100%, rgba(123, 97, 255, 0.06), transparent);
  pointer-events: none;
  z-index: 0;
}
```
