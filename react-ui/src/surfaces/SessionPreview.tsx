import type {CSSProperties} from 'react';

export function SessionPreview() {
    return <>
{" "}
{"\n"}
<section id="preview-area" className="preview-area">
{"\n"}
{"\n"}
<div id="empty-state" className="empty-state">
{"\n"}
<div className="empty-state-copy">
{"\n"}
<div className="hero-badge">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-sparkles">

</use>
</svg>
{"\n"}
<span>
{"MINEDU 2026 · CNEB Perú · Planificación con IA"}
</span>
{"\n"}
</div>
{"\n"}
<div className="empty-brand-row">
{"\n"}
<div className="empty-brand-mark" style={{"background": "linear-gradient(135deg, rgba(0,212,255,0.2) 0%, rgba(123,97,255,0.2) 100%)", "borderRadius": "12px", "padding": "10px", "display": "inline-flex", "boxShadow": "0 0 20px rgba(0,212,255,0.25)"} as CSSProperties}>
{"\n"}
<img src="assets/favicon.svg" alt="Space Lab Icon" aria-hidden="true"/>
{"\n"}
</div>
{"\n"}
<span className="empty-eyebrow">
{"Workspace Curricular Inteligente"}
</span>
{"\n"}
</div>
{"\n"}
<h2 className="empty-title">
{"Diseña Sesiones de Aprendizaje Oficiales MINEDU con IA"}
</h2>
{"\n"}
<p className="empty-text">
{"Genera tu planificación curricular por competencias para "}
<strong>
{"Inicial, Primaria y Secundaria"}
</strong>
{" alineada al CNEB 2026. Con situaciones significativas, secuencia didáctica (Inicio, Desarrollo, Cierre), criterios e instrumentos de evaluación listos para editar y exportar a "}
<strong>
{"Word (.docx)"}
</strong>
{" y "}
<strong>
{"PDF"}
</strong>
{"."}
</p>
{"\n"}
<div className="hero-features-list">
{"\n"}
<div className="hero-feature-pill">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-check">

</use>
</svg>
{"\n"}
<span>
{"Alineado al CNEB 2026"}
</span>
{"\n"}
</div>
{"\n"}
<div className="hero-feature-pill">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-sparkles">

</use>
</svg>
{"\n"}
<span>
{"GPT-6 Luna, Claude & Gemini"}
</span>
{"\n"}
</div>
{"\n"}
<div className="hero-feature-pill">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-file">

</use>
</svg>
{"\n"}
<span>
{"Word (.docx) & PDF A4"}
</span>
{"\n"}
</div>
{"\n"}
<div className="hero-feature-pill">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-shield">

</use>
</svg>
{"\n"}
<span>
{"Privado y en tu navegador"}
</span>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
<div className="hero-actions-row">
{"\n"}
<button type="button" id="btn-empty-start" className="btn btn-primary empty-primary-action" aria-label="Comenzar a planificar sesión de aprendizaje">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-sparkles">

</use>
</svg>
{"\n                                Comenzar a planificar\n                                "}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-arrow-right">

</use>
</svg>
{"\n"}
</button>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
<div className="empty-steps">
{"\n"}
<div className="step-item">
{"\n"}
<span className="step-num">
{"1"}
</span>
{"\n"}
<div className="step-content">
{"\n"}
<strong className="step-title">
{"1. Configura el Contexto"}
</strong>
{"\n"}
<span className="step-desc">
{"Selecciona nivel (Inicial, Primaria, Secundaria), área, competencias y el modelo de IA (GPT-6 Luna, Claude o Gemini)."}
</span>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
<div className="step-item">
{"\n"}
<span className="step-num">
{"2"}
</span>
{"\n"}
<div className="step-content">
{"\n"}
<strong className="step-title">
{"2. Genera con IA"}
</strong>
{"\n"}
<span className="step-desc">
{"Space AI estructura la situación significativa, los momentos didácticos (Inicio, Desarrollo, Cierre), criterios y evidencias."}
</span>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
<div className="step-item">
{"\n"}
<span className="step-num">
{"3"}
</span>
{"\n"}
<div className="step-content">
{"\n"}
<strong className="step-title">
{"3. Edita en Hoja A4"}
</strong>
{"\n"}
<span className="step-desc">
{"Ajusta los contenidos en tiempo real sobre la vista previa editable con fórmulas matemáticas KaTeX y tablas interactivas."}
</span>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
<div className="step-item">
{"\n"}
<span className="step-num">
{"4"}
</span>
{"\n"}
<div className="step-content">
{"\n"}
<strong className="step-title">
{"4. Exporta y Presenta"}
</strong>
{"\n"}
<span className="step-desc">
{"Descarga en Microsoft Word (.docx) nativo con membretes de UGEL/MINEDU o exporta en PDF físico listo para presentar."}
</span>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
{"\n"}
<div id="print-preview" className="print-preview hidden">
{"\n"}
<nav id="linked-planning-context" className="linked-planning-context no-print hidden" aria-label="Origen de la sesión">
{"\n"}
<button type="button" id="btn-return-planning" className="btn btn-ghost btn-sm">
{"← Volver a planificación"}
</button>
{"\n"}
<div className="linked-planning-copy">
{"\n"}
<span id="linked-planning-title" className="linked-planning-title">

</span>
{"\n"}
<span id="linked-planning-position" className="linked-planning-position">

</span>
{"\n"}
</div>
{"\n"}
</nav>
{"\n"}
{"\n"}
<div className="preview-toolbar no-print">
{"\n"}
{"\n"}
<div className="toolbar-group">
{"\n"}
<button type="button" id="btn-format-undo" className="btn btn-ghost btn-xs toolbar-btn" title="Deshacer (Ctrl+Z)" aria-label="Deshacer">
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-undo">

</use>
</svg>
</button>
{"\n"}
<button type="button" id="btn-format-redo" className="btn btn-ghost btn-xs toolbar-btn" title="Rehacer (Ctrl+Y)" aria-label="Rehacer">
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-redo">

</use>
</svg>
</button>
{"\n"}
<div className="toolbar-divider" style={{"margin": "0 2px", "height": "18px", "alignSelf": "center"} as CSSProperties}>

</div>
{"\n"}
<button type="button" id="btn-format-bold" className="btn btn-ghost btn-xs toolbar-btn" style={{"fontWeight": "800"} as CSSProperties} title="Negrita (Ctrl+B)">
{"B"}
</button>
{"\n"}
<button type="button" id="btn-format-italic" className="btn btn-ghost btn-xs toolbar-btn" style={{"fontStyle": "italic"} as CSSProperties} title="Cursiva (Ctrl+I)">
{"I"}
</button>
{"\n"}
<button type="button" id="btn-format-underline" className="btn btn-ghost btn-xs toolbar-btn" style={{"textDecoration": "underline"} as CSSProperties} title="Subrayado (Ctrl+U)">
{"U"}
</button>
{"\n"}
<div className="toolbar-divider" style={{"margin": "0 2px", "height": "18px", "alignSelf": "center"} as CSSProperties}>

</div>
{"\n"}
<button type="button" id="btn-format-list-bullet" className="btn btn-ghost btn-xs toolbar-btn" title="Lista de viñetas" aria-label="Lista de viñetas">
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-list">

</use>
</svg>
</button>
{"\n"}
<button type="button" id="btn-format-list-number" className="btn btn-ghost btn-xs toolbar-btn" title="Lista numerada" aria-label="Lista numerada">
{"1."}
</button>
{"\n"}
<div className="toolbar-divider" style={{"margin": "0 2px", "height": "18px", "alignSelf": "center"} as CSSProperties}>

</div>
{"\n"}
{"\n"}
<button type="button" id="btn-format-align-left" className="btn btn-ghost btn-xs toolbar-btn" style={{"fontSize": "0.72rem", "padding": "2px 4px !important"} as CSSProperties} title="Alinear a la izquierda">
{"Izq"}
</button>
{"\n"}
<button type="button" id="btn-format-align-center" className="btn btn-ghost btn-xs toolbar-btn" style={{"fontSize": "0.72rem", "padding": "2px 4px !important"} as CSSProperties} title="Centrar">
{"Cen"}
</button>
{"\n"}
<button type="button" id="btn-format-align-right" className="btn btn-ghost btn-xs toolbar-btn" style={{"fontSize": "0.72rem", "padding": "2px 4px !important"} as CSSProperties} title="Alinear a la derecha">
{"Der"}
</button>
{"\n"}
<button type="button" id="btn-format-align-justify" className="btn btn-ghost btn-xs toolbar-btn" style={{"fontSize": "0.72rem", "padding": "2px 4px !important"} as CSSProperties} title="Justificar">
{"Just"}
</button>
{"\n"}
<div className="toolbar-divider" style={{"margin": "0 2px", "height": "18px", "alignSelf": "center"} as CSSProperties}>

</div>
{"\n"}
{"\n"}
<div style={{"display": "flex", "alignItems": "center", "gap": "3px"} as CSSProperties} title="Color de letra">
{"\n"}
<span style={{"fontSize": "0.85rem", "fontWeight": "bold", "borderBottom": "2.5px solid #ff4444", "lineHeight": "1", "padding": "0 2px", "color": "var(--text)"} as CSSProperties}>
{"A"}
</span>
{"\n"}
<input type="color" id="btn-format-forecolor" className="toolbar-color" defaultValue="#000000" style={{"width": "20px", "height": "20px", "border": "1px solid var(--border)", "borderRadius": "4px", "padding": "0", "background": "transparent", "cursor": "pointer"} as CSSProperties}/>
{"\n"}
</div>
{"\n"}
{"\n"}
<div style={{"display": "flex", "alignItems": "center", "gap": "3px"} as CSSProperties} title="Color de resaltado">
{"\n"}
<span style={{"fontSize": "0.72rem", "fontWeight": "bold", "background": "#ffff00", "color": "#000000", "padding": "0 3px", "borderRadius": "3px", "lineHeight": "1.2"} as CSSProperties}>
{"ab"}
</span>
{"\n"}
<input type="color" id="btn-format-backcolor" className="toolbar-color" defaultValue="#ffff00" style={{"width": "20px", "height": "20px", "border": "1px solid var(--border)", "borderRadius": "4px", "padding": "0", "background": "transparent", "cursor": "pointer"} as CSSProperties}/>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
{"\n"}
<div className="toolbar-divider">

</div>
{"\n"}
{"\n"}
<div className="toolbar-group">
{"\n"}
<div className="toolbar-item">
{"\n"}
<label htmlFor="ribbon-font-family" className="toolbar-sublabel">
{"Fuente"}
</label>
{"\n"}
<select id="ribbon-font-family" className="form-select select-sm toolbar-select" style={{"width": "105px"} as CSSProperties}>
{"\n"}
<option value="Arial, sans-serif">
{"Arial"}
</option>
{"\n"}
<option value="Calibri, Arial, sans-serif">
{"Calibri"}
</option>
{"\n"}
<option value="'Times New Roman', serif">
{"Times New Roman"}
</option>
{"\n"}
<option value="Georgia, serif">
{"Georgia"}
</option>
{"\n"}
<option value="'Courier New', monospace">
{"Courier New"}
</option>
{"\n"}
<option value="'Space Grotesk', sans-serif">
{"Space Grotesk"}
</option>
{"\n"}
</select>
{"\n"}
</div>
{"\n"}
<div className="toolbar-item">
{"\n"}
<label htmlFor="ribbon-font-size" className="toolbar-sublabel">
{"Tamaño"}
</label>
{"\n"}
<select id="ribbon-font-size" className="form-select select-sm toolbar-select" style={{"width": "65px"} as CSSProperties}>
{"\n"}
<option value="8pt">
{"8pt"}
</option>
{"\n"}
<option value="9pt">
{"9pt"}
</option>
{"\n"}
<option value="10pt">
{"10pt"}
</option>
{"\n"}
<option value="11pt">
{"11pt"}
</option>
{"\n"}
<option value="12pt">
{"12pt"}
</option>
{"\n"}
</select>
{"\n"}
</div>
{"\n"}
<div className="toolbar-item">
{"\n"}
<label htmlFor="ribbon-padding" className="toolbar-sublabel">
{"Padding"}
</label>
{"\n"}
<select id="ribbon-padding" className="form-select select-sm toolbar-select" style={{"width": "85px"} as CSSProperties}>
{"\n"}
<option value="2px 4px">
{"Compacto"}
</option>
{"\n"}
<option value="4px 6px">
{"Estándar"}
</option>
{"\n"}
<option value="6px 8px">
{"Amplio"}
</option>
{"\n"}
<option value="8px 10px">
{"Espacioso"}
</option>
{"\n"}
</select>
{"\n"}
</div>
{"\n"}
<div className="toolbar-item">
{"\n"}
<label htmlFor="ribbon-line-height" className="toolbar-sublabel">
{"Interl."}
</label>
{"\n"}
<select id="ribbon-line-height" className="form-select select-sm toolbar-select" style={{"width": "55px"} as CSSProperties}>
{"\n"}
<option value="1.2">
{"1.2"}
</option>
{"\n"}
<option value="1.3">
{"1.3"}
</option>
{"\n"}
<option value="1.4">
{"1.4"}
</option>
{"\n"}
<option value="1.5">
{"1.5"}
</option>
{"\n"}
</select>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
{"\n"}
<div className="toolbar-divider">

</div>
{"\n"}
{"\n"}
<div className="toolbar-group">
{"\n"}
<div className="toolbar-item" style={{"flexDirection": "row", "gap": "4px", "alignItems": "center", "height": "100%"} as CSSProperties}>
{"\n"}
<label htmlFor="ribbon-theme-color" className="toolbar-sublabel">
{"Borde"}
</label>
{"\n"}
<input type="color" id="ribbon-theme-color" className="toolbar-color" defaultValue="#000000" title="Color de borde"/>
{"\n"}
</div>
{"\n"}
<div className="toolbar-item" style={{"marginLeft": "6px"} as CSSProperties}>
{"\n"}
<label htmlFor="ribbon-header-bg" className="toolbar-sublabel">
{"Fondo Momentos"}
</label>
{"\n"}
<select id="ribbon-header-bg" className="form-select select-sm toolbar-select" style={{"width": "105px"} as CSSProperties}>
{"\n"}
<option value="#BDD6EE">
{"MINEDU"}
</option>
{"\n"}
<option value="#DBEAFE">
{"Institucional"}
</option>
{"\n"}
<option value="#CCFBF1">
{"Moderno"}
</option>
{"\n"}
<option value="#F3F4F6">
{"Clásico"}
</option>
{"\n"}
<option value="#CFFAFE">
{"Accesible"}
</option>
{"\n"}
<option value="#F1F5F9">
{"Gris"}
</option>
{"\n"}
<option value="#E0F2FE">
{"Azul"}
</option>
{"\n"}
<option value="#DCFCE7">
{"Verde"}
</option>
{"\n"}
<option value="#FEE2E2">
{"Rojo"}
</option>
{"\n"}
<option value="#FEF3C7">
{"Amarillo"}
</option>
{"\n"}
</select>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
{"\n"}
<div className="toolbar-divider">

</div>
{"\n"}
{"\n"}
<div className="toolbar-group">
{"\n"}
<div className="toolbar-item">
{"\n"}
<label className="toolbar-sublabel">
{"Insertar Logos"}
</label>
{"\n"}
<button type="button" id="btn-ribbon-add-logo" className="btn btn-ghost btn-sm toolbar-btn" style={{"height": "28px", "minHeight": "28px", "padding": "2px 8px !important", "display": "flex", "alignItems": "center", "gap": "4px"} as CSSProperties} title="Añadir un nuevo logo al encabezado oficial">
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-plus">

</use>
</svg>
{"Añadir logo"}
</button>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
{"\n"}
<div className="toolbar-divider">

</div>
{"\n"}
{"\n"}
<div className="toolbar-group">
{"\n"}
<div className="toolbar-item">
{"\n"}
<label className="toolbar-sublabel">
{"Filas de Tabla"}
</label>
{"\n"}
<div className="btn-group" style={{"display": "flex", "gap": "4px"} as CSSProperties}>
{"\n"}
<button type="button" id="btn-table-row-insert" className="btn btn-ghost btn-sm toolbar-btn" style={{"height": "28px", "minHeight": "28px", "padding": "2px 8px !important"} as CSSProperties} title="Insertar fila debajo">
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-plus">

</use>
</svg>
{"Fila"}
</button>
{"\n"}
<button type="button" id="btn-table-row-delete" className="btn btn-ghost btn-sm toolbar-btn" style={{"height": "28px", "minHeight": "28px", "padding": "2px 8px !important"} as CSSProperties} title="Eliminar fila">
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-minus">

</use>
</svg>
{"Fila"}
</button>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
{"\n"}
<div className="toolbar-divider">

</div>
{"\n"}
{"\n"}
<div className="toolbar-group">
{"\n"}
<div className="toolbar-item">
{"\n"}
<label className="toolbar-sublabel">
{"Copiloto IA"}
</label>
{"\n"}
<div className="btn-group" style={{"display": "flex", "gap": "4px"} as CSSProperties}>
{"\n"}
<button type="button" id="btn-ai-rubrica" className="btn btn-ghost btn-sm toolbar-btn" style={{"height": "28px", "minHeight": "28px", "padding": "2px 8px !important", "fontWeight": "600"} as CSSProperties} title="Autogenerar criterios o rúbrica de evaluación">
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-target">

</use>
</svg>
{"Rúbrica"}
</button>
{"\n"}
<button type="button" id="btn-ai-improve-text" className="btn btn-ghost btn-sm toolbar-btn" style={{"height": "28px", "minHeight": "28px", "padding": "2px 8px !important", "fontWeight": "600"} as CSSProperties} title="Mejorar redacción técnica del texto seleccionado">
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-sparkles">

</use>
</svg>
{"Redactar"}
</button>
{"\n"}
<button type="button" id="btn-toolbar-ficha-prompt" className="btn btn-ghost btn-sm toolbar-btn" style={{"height": "28px", "minHeight": "28px", "padding": "2px 8px !important", "fontWeight": "600"} as CSSProperties} title="Ver prompt para Ficha en IA externa">
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-sparkles">

</use>
</svg>
{"Ficha IA"}
</button>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
{"\n"}
<div className="toolbar-divider">

</div>
{"\n"}
{"\n"}
<div className="toolbar-group toolbar-group-actions" style={{"marginLeft": "auto", "display": "flex", "gap": "8px", "alignItems": "center"} as CSSProperties}>
{"\n"}
<span className="preview-badge" id="edit-mode-badge">
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-edit">

</use>
</svg>
{"Modo edición"}
</span>
{"\n"}
<button id="btn-export-word-preview" className="btn btn-ghost btn-sm toolbar-btn" style={{"width": "32px", "height": "32px", "padding": "0 !important"} as CSSProperties} title="Exportar sesión a Word" aria-label="Exportar sesión a Word">
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-file">

</use>
</svg>
</button>
{"\n"}
<button id="btn-clean-format" className="btn btn-ghost btn-sm toolbar-btn" style={{"width": "32px", "height": "32px", "padding": "0 !important"} as CSSProperties} title="Limpiar formato pegado" aria-label="Limpiar formato pegado">
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-clean">

</use>
</svg>
</button>
{"\n"}
<button id="btn-close-session" className="btn btn-ghost btn-sm toolbar-btn" style={{"width": "32px", "height": "32px", "padding": "0 !important", "color": "#ef4444", "fontWeight": "bold", "fontSize": "1.1rem"} as CSSProperties} title="Cerrar sesión actual e iniciar una nueva" aria-label="Cerrar sesión actual e iniciar una nueva">
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-close">

</use>
</svg>
</button>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
{"\n"}
<div id="time-balance-warning" className="time-balance-banner no-print" style={{"background": "rgba(245, 158, 11, 0.12)", "border": "1px solid rgba(245, 158, 11, 0.3)", "color": "#eab308", "padding": "10px 16px", "borderRadius": "8px", "margin": "10px auto", "maxWidth": "820px", "fontSize": "0.85rem", "fontWeight": "600", "display": "none", "alignItems": "center", "gap": "8px"} as CSSProperties}>
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-alert">

</use>
</svg>
{"\n"}
<span id="time-balance-warning-text">

</span>
{"\n"}
</div>
{"\n"}
{"\n"}
<div id="session-sheet" className="session-sheet a4-page">
{"\n"}
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
</section>
{"\n"}
    </>;
}
