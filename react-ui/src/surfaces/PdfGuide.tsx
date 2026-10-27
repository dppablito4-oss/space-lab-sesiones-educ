import type {CSSProperties} from 'react';

export function PdfGuide() {
    return <>
{" "}
{"\n"}
<div id="pdf-guide-modal" className="pdf-guide-overlay hidden">
{"\n"}
<div className="pdf-guide-card glass-card">
{"\n"}
<button id="pdf-guide-close" className="pdf-guide-close" title="Cerrar" aria-label="Cerrar">
{"×"}
</button>
{"\n"}
<div className="pdf-guide-icon">
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-file">

</use>
</svg>
</div>
{"\n"}
<h3 className="pdf-guide-title">
{"Exportar Sesión como PDF"}
</h3>
{"\n"}
{"\n"}
<div className="pdf-guide-warning-badge" style={{"background": "rgba(245, 158, 11, 0.1)", "border": "1px solid rgba(245, 158, 11, 0.25)", "color": "#eab308", "padding": "8px 12px", "borderRadius": "8px", "fontSize": "0.82rem", "fontWeight": "600", "marginBottom": "12px", "textAlign": "center", "display": "flex", "alignItems": "center", "justifyContent": "center", "gap": "6px"} as CSSProperties}>
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-alert">

</use>
</svg>
{" Motor Local Desconectado: Se usará la impresión de Windows\n            "}
</div>
{"\n"}
<p className="pdf-guide-subtitle">
{"Para obtener un PDF de calidad con el navegador, sigue estos pasos:"}
</p>
{"\n"}
<div className="pdf-guide-steps">
{"\n"}
<div className="pdf-guide-step">
{"\n"}
<span className="step-number">
{"1"}
</span>
{"\n"}
<div className="step-content">
{"\n"}
<strong>
{"Destino"}
</strong>
{"\n"}
<span>
{"Selecciona "}
<em>
{"\"Guardar como PDF\""}
</em>
</span>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
<div className="pdf-guide-step">
{"\n"}
<span className="step-number">
{"2"}
</span>
{"\n"}
<div className="step-content">
{"\n"}
<strong>
{"Más opciones"}
</strong>
{"\n"}
<span>
{"Activa "}
<em>
{"\"Gráficos de fondo\""}
</em>
{" (para conservar colores)"}
</span>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
<div className="pdf-guide-step">
{"\n"}
<span className="step-number">
{"3"}
</span>
{"\n"}
<div className="step-content">
{"\n"}
<strong>
{"Cabeceras"}
</strong>
{"\n"}
<span>
{"Desactiva "}
<em>
{"\"Cabeceras y pies de página\""}
</em>
{" (para limpiar URLs)"}
</span>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
{"\n"}
<div className="pdf-premium-ad-box" style={{"background": "var(--color-card-surface)", "border": "1px dashed rgba(6, 182, 212, 0.3)", "borderRadius": "8px", "padding": "15px", "margin": "15px 0", "textAlign": "left"} as CSSProperties}>
{"\n"}
<div style={{"display": "flex", "alignItems": "center", "gap": "8px", "color": "#06b6d4", "fontWeight": "600", "fontSize": "0.9rem", "marginBottom": "6px"} as CSSProperties}>
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-sparkles">

</use>
</svg>
{" ¡Recomendado: Exportación Premium Directa!\n                "}
</div>
{"\n"}
<p style={{"fontSize": "0.8rem", "color": "#94a3b8", "lineHeight": "1.4", "marginBottom": "10px"} as CSSProperties}>
{"\n                    Para descargas automáticas inmediatas con paginado físico A4 perfecto y archivos Word (.docx) nativos editables de Office, descarga e inicia el motor.\n                "}
</p>
{"\n"}
<a href="https://descargas.sypablitodp.site" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{"display": "inline-flex", "alignItems": "center", "justifyContent": "center", "width": "100%", "fontSize": "0.85rem", "fontWeight": "600", "textDecoration": "none", "padding": "8px 14px"} as CSSProperties}>
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-download">

</use>
</svg>
{" Descargar Motor Local (.exe)\n                "}
</a>
{"\n"}
</div>
{"\n"}
<div className="pdf-guide-actions">
{"\n"}
<button id="pdf-guide-cancel" className="btn btn-ghost">
{"Cancelar"}
</button>
{"\n"}
<button id="pdf-guide-proceed" className="btn btn-primary pdf-guide-proceed-btn">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-file">

</use>
</svg>
{" Abrir Impresora\n                "}
</button>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
    </>;
}
