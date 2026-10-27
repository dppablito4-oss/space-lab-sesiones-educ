import type {CSSProperties} from 'react';

export function EngineRequired() {
    return <>
{" "}
{"\n"}
<div id="engine-required-modal" className="pdf-guide-overlay hidden">
{"\n"}
<div className="pdf-guide-card glass-card" style={{"maxWidth": "420px"} as CSSProperties}>
{"\n"}
<button id="engine-modal-close" className="pdf-guide-close" title="Cerrar" aria-label="Cerrar">
{"×"}
</button>
{"\n"}
<div className="pdf-guide-icon" style={{"color": "#f59e0b", "marginBottom": "10px"} as CSSProperties}>
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-alert">

</use>
</svg>
</div>
{"\n"}
<h3 className="pdf-guide-title">
{"Motor Local Requerido"}
</h3>
{"\n"}
<p className="pdf-guide-subtitle" style={{"marginBottom": "15px", "fontSize": "0.9rem"} as CSSProperties}>
{"\n                La exportación nativa a **Microsoft Word (.docx)** con formato premium no está disponible sin vincular el motor local.\n            "}
</p>
{"\n"}
<div style={{"background": "rgba(245, 158, 11, 0.06)", "border": "1px solid rgba(245, 158, 11, 0.2)", "borderRadius": "8px", "padding": "12px", "textAlign": "left", "marginBottom": "18px", "fontSize": "0.82rem", "lineHeight": "1.4", "color": "#fef08a"} as CSSProperties}>
{"\n                Para compilar y descargar un documento de Word limpio y editable con membretes de UGEL/MINEDU integrados, debes descargar e iniciar la aplicación "}
<strong>
{"pablitopyhost.exe"}
</strong>
{" en tu PC.\n            "}
</div>
{"\n"}
<div style={{"display": "flex", "flexDirection": "column", "gap": "8px"} as CSSProperties}>
{"\n"}
<a href="https://descargas.sypablitodp.site" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{"textDecoration": "none", "padding": "10px", "textAlign": "center"} as CSSProperties}>
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-download">

</use>
</svg>
{" Descargar Motor Local (.exe)\n                "}
</a>
{"\n"}
<button id="engine-modal-cancel" className="btn btn-ghost" style={{"padding": "8px"} as CSSProperties}>
{"Cancelar"}
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
