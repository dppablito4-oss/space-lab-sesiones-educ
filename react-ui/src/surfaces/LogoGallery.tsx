import type {CSSProperties} from 'react';

export function LogoGallery() {
    return <>
{" "}
{"\n"}
<div id="logos-gallery-modal" className="load-modal hidden no-print" style={{"zIndex": "9998"} as CSSProperties}>
{"\n"}
<div className="load-modal-content glass-card" style={{"maxWidth": "520px", "padding": "2rem", "position": "relative"} as CSSProperties}>
{"\n"}
<button id="btn-close-gallery-modal" className="btn btn-ghost btn-sm" aria-label="Cerrar" style={{"position": "absolute", "top": "1rem", "right": "1rem", "color": "#71717a", "cursor": "pointer", "background": "none", "border": "none", "padding": "0"} as CSSProperties}>
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-close">

</use>
</svg>
</button>
{"\n"}
<h3 style={{"margin": "0 0 1rem 0", "fontSize": "1.2rem", "color": "#fff", "fontWeight": "700", "display": "flex", "alignItems": "center", "gap": "8px"} as CSSProperties}>
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-image">

</use>
</svg>
{" Galería de Logos del Encabezado"}
</h3>
{"\n"}
{"\n"}
<div id="modal-logo-dropzone" className="source-file-dropzone" style={{"border": "2px dashed rgba(0, 210, 255, 0.2)", "background": "rgba(0, 210, 255, 0.02)", "borderRadius": "12px", "padding": "20px", "textAlign": "center", "cursor": "pointer", "transition": "all 0.2s", "marginBottom": "1.5rem"} as CSSProperties}>
{"\n"}
<span className="icon" style={{"display": "block", "marginBottom": "8px"} as CSSProperties}>
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-upload">

</use>
</svg>
</span>
{"\n"}
<span className="text" style={{"fontSize": "0.8rem", "color": "#a1a1aa", "lineHeight": "1.4"} as CSSProperties}>
{"Sube tu logo para el encabezado (PNG, JPG)"}
<br/>
<strong style={{"color": "#00d2ff"} as CSSProperties}>
{"Se comprimirá automáticamente"}
</strong>
{" para un rendimiento ultra-rápido"}
</span>
{"\n"}
<input type="file" id="input-modal-upload-logo" accept="image/png,image/jpeg,image/webp" className="hidden"/>
{"\n"}
</div>
{"\n"}
{"\n"}
<div className="toolbar-divider" style={{"margin": "1.5rem 0", "background": "rgba(255,255,255,0.06)", "height": "1px", "width": "100%"} as CSSProperties}>

</div>
{"\n"}
{"\n"}
<h4 style={{"margin": "0 0 0.75rem 0", "fontSize": "0.9rem", "color": "#e4e4e7"} as CSSProperties}>
{"Tus logos subidos previamente:"}
</h4>
{"\n"}
<div id="modal-logos-container" style={{"display": "grid", "gridTemplateColumns": "repeat(4, 1fr)", "gap": "10px", "maxHeight": "200px", "overflowY": "auto", "padding": "8px", "background": "rgba(0,0,0,0.25)", "borderRadius": "8px", "border": "1px solid rgba(255,255,255,0.06)", "marginBottom": "1.5rem"} as CSSProperties}>
{"\n"}
{"\n"}
</div>
{"\n"}
<div style={{"display": "flex", "justifyContent": "flex-end", "gap": "8px"} as CSSProperties}>
{"\n"}
<button type="button" id="btn-modal-gallery-close" className="btn btn-ghost btn-sm" style={{"fontSize": "0.8rem", "padding": "6px 16px"} as CSSProperties}>
{"Cerrar"}
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
