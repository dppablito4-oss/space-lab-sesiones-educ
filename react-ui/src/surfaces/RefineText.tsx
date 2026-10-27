import type {CSSProperties} from 'react';

export function RefineText() {
    return <>
{" "}
{"\n"}
<div id="refine-text-modal" className="load-modal hidden no-print" style={{"zIndex": "9999"} as CSSProperties}>
{"\n"}
<div className="load-modal-content glass-card" style={{"maxWidth": "485px", "padding": "2rem", "position": "relative"} as CSSProperties}>
{"\n"}
<button id="btn-close-refine-modal" className="btn btn-ghost btn-sm" aria-label="Cerrar" style={{"position": "absolute", "top": "1rem", "right": "1rem", "color": "#71717a", "cursor": "pointer", "background": "none", "border": "none", "padding": "0"} as CSSProperties}>
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-close">

</use>
</svg>
</button>
{"\n"}
<h3 style={{"margin": "0 0 1rem 0", "fontSize": "1.2rem", "color": "#fff", "fontWeight": "700", "display": "flex", "alignItems": "center", "gap": "8px"} as CSSProperties}>
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-sparkles">

</use>
</svg>
{" Refinar Texto con IA"}
</h3>
{"\n"}
{"\n"}
<div style={{"background": "rgba(0,0,0,0.25)", "border": "1px solid rgba(255,255,255,0.06)", "padding": "12px", "borderRadius": "8px", "marginBottom": "1.25rem", "maxHeight": "100px", "overflowY": "auto"} as CSSProperties}>
{"\n"}
<label style={{"display": "block", "fontSize": "0.75rem", "color": "var(--text-muted)", "marginBottom": "4px", "fontWeight": "600"} as CSSProperties}>
{"Texto seleccionado:"}
</label>
{"\n"}
<p id="refine-text-preview" style={{"fontSize": "0.8rem", "color": "#e4e4e7", "margin": "0", "fontStyle": "italic", "whiteSpace": "pre-wrap"} as CSSProperties}>

</p>
{"\n"}
</div>
{"\n"}
{"\n"}
<div className="form-group" style={{"marginBottom": "1.25rem"} as CSSProperties}>
{"\n"}
<label className="form-label" style={{"fontSize": "0.85rem", "fontWeight": "600", "marginBottom": "8px", "display": "block"} as CSSProperties}>
{"¿Cómo deseas refinarlo?"}
</label>
{"\n"}
<div style={{"display": "grid", "gridTemplateColumns": "repeat(2, 1fr)", "gap": "8px", "marginBottom": "12px"} as CSSProperties}>
{"\n"}
<button type="button" className="btn btn-ghost btn-sm refine-opt-btn active" data-instruction="Hazlo más formal, claro y profesional. Mantén un tono pedagógico adecuado.">
{"Más Formal"}
</button>
{"\n"}
<button type="button" className="btn btn-ghost btn-sm refine-opt-btn" data-instruction="Hazlo mucho más sencillo, explicativo y fácil de entender para niños.">
{"Más Sencillo"}
</button>
{"\n"}
<button type="button" className="btn btn-ghost btn-sm refine-opt-btn" data-instruction="Reescríbelo con un tono lúdico, divertido, entusiasta y chistoso para enganchar a los estudiantes.">
{"Más Divertido"}
</button>
{"\n"}
<button type="button" className="btn btn-ghost btn-sm refine-opt-btn" data-instruction="Corrige estrictamente cualquier error de ortografía, puntuación o gramática sin alterar su sentido.">
{"Corregir Ortografía"}
</button>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
{"\n"}
<div className="form-group" style={{"marginBottom": "1.5rem"} as CSSProperties}>
{"\n"}
<label htmlFor="input-refine-custom" className="form-label" style={{"fontSize": "0.8rem", "fontWeight": "600", "marginBottom": "6px"} as CSSProperties}>
{"O escribe una orden personalizada:"}
</label>
{"\n"}
<textarea id="input-refine-custom" className="form-textarea" rows={2} style={{"fontSize": "0.8rem", "background": "rgba(0,0,0,0.25)", "border": "1px solid rgba(255,255,255,0.08)", "width": "100%", "borderRadius": "6px", "padding": "8px", "color": "#fff"} as CSSProperties} placeholder="Ej. Escríbelo en forma de rima, tradúcelo a quechua, agrega preguntas...">

</textarea>
{"\n"}
</div>
{"\n"}
{"\n"}
<div style={{"display": "flex", "justifyContent": "flex-end", "gap": "8px"} as CSSProperties}>
{"\n"}
<button type="button" id="btn-refine-cancel" className="btn btn-ghost btn-sm" style={{"fontSize": "0.8rem", "padding": "6px 16px"} as CSSProperties}>
{"Cancelar"}
</button>
{"\n"}
<button type="button" id="btn-refine-submit" className="btn btn-primary btn-sm" style={{"fontSize": "0.8rem", "padding": "6px 16px", "fontWeight": "600"} as CSSProperties}>
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-sparkles">

</use>
</svg>
{" Refinar"}
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
