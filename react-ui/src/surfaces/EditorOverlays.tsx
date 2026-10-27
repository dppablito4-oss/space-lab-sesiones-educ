import type {CSSProperties} from 'react';
import {LogoGallery} from './LogoGallery';
import {RefineText} from './RefineText';
import {SessionLibraryDialog} from './SessionLibraryDialog';

export function EditorOverlays() {
    return <>
{" "}
{"\n"}
<div id="chatbot-container" className="chatbot-container no-print">
{"\n"}
{"\n"}
<button id="chatbot-bubble" className="chatbot-bubble" title="Preguntar al copiloto" aria-label="Preguntar al copiloto">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-chat">

</use>
</svg>
{"\n"}
<span className="pulse-ring">

</span>
{"\n"}
</button>
{"\n"}
{"\n"}
<div id="chatbot-window" className="chatbot-window glass-card hidden">
{"\n"}
<div className="chatbot-header">
{"\n"}
<div className="chatbot-header-info">
{"\n"}
<span className="chatbot-dot">

</span>
{"\n"}
<div>
{"\n"}
<h4 className="chatbot-title">
{"Space Assistant"}
</h4>
{"\n"}
<span className="chatbot-subtitle">
{"GPT-6 Luna Copilot"}
</span>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
<button id="btn-close-chatbot" className="btn-close-chat" aria-label="Cerrar copiloto">
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-close">

</use>
</svg>
</button>
{"\n"}
</div>
{"\n"}
<div id="chatbot-messages" className="chatbot-messages">
{"\n"}
<div className="chat-message bot">
{"\n"}
<div className="message-bubble">
{"\n                        ¡Hola! Soy tu asistente pedagógico de Space Lab. ¿En qué puedo ayudarte hoy con tus sesiones o\n                        el Currículo Nacional?\n                    "}
</div>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
<div className="chatbot-input-container">
{"\n"}
<input type="text" id="chatbot-input" placeholder="Pregunta algo sobre tu sesión..." autoComplete="off"/>
{"\n"}
<button id="btn-send-chat" className="btn btn-accent btn-icon-only" aria-label="Enviar mensaje al copiloto">
{"\n"}
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
</div>
{"\n"}
<SessionLibraryDialog/>
{"\n"}
{"\n"}
<div id="logo-editor-popover" className="logo-editor-popover hidden no-print" style={{"position": "absolute", "display": "none"} as CSSProperties}>
{"\n"}
<div className="popover-header" style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "borderBottom": "1px solid rgba(255,255,255,0.06)", "paddingBottom": "8px"} as CSSProperties}>
{"\n"}
<h4 style={{"margin": "0", "fontSize": "0.9rem", "color": "#fff", "fontWeight": "600"} as CSSProperties}>
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-image">

</use>
</svg>
{" Ajustes de Logo"}
</h4>
{"\n"}
<button type="button" id="logo-editor-close" className="popover-close-btn" aria-label="Cerrar" style={{"background": "none", "border": "none", "color": "#a1a1aa", "cursor": "pointer", "padding": "0", "lineHeight": "1"} as CSSProperties}>
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-close">

</use>
</svg>
</button>
{"\n"}
</div>
{"\n"}
<div className="popover-body" style={{"padding": "12px 0 0 0", "display": "flex", "flexDirection": "column", "gap": "12px"} as CSSProperties}>
{"\n"}
{"\n"}
<div className="popover-action-row" style={{"display": "flex", "gap": "6px", "flexWrap": "wrap"} as CSSProperties}>
{"\n"}
<button type="button" id="logo-editor-gallery-trigger" className="btn btn-ghost btn-sm" style={{"flex": "1.5", "fontSize": "0.75rem", "padding": "4px 8px !important", "minWidth": "100px"} as CSSProperties}>
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-image">

</use>
</svg>
{" Galería / Subir"}
</button>
{"\n"}
<button type="button" id="logo-editor-swap" className="btn btn-ghost btn-sm" style={{"flex": "1", "fontSize": "0.75rem", "padding": "4px 8px !important"} as CSSProperties} title="Mover la posición del logo en la lista">
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-refresh">

</use>
</svg>
{" Mover"}
</button>
{"\n"}
<button type="button" id="logo-editor-delete" className="btn btn-danger-ghost btn-sm" style={{"flex": "1", "fontSize": "0.75rem", "padding": "4px 8px !important", "color": "#ef4444", "borderColor": "rgba(239, 68, 68, 0.2)"} as CSSProperties}>
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-trash">

</use>
</svg>
{" Quitar"}
</button>
{"\n"}
</div>
{"\n"}
{"\n"}
<div className="popover-control-group" style={{"display": "flex", "flexDirection": "column", "gap": "4px"} as CSSProperties}>
{"\n"}
<div style={{"display": "flex", "justifyContent": "space-between", "fontSize": "0.75rem", "color": "#a1a1aa"} as CSSProperties}>
{"\n"}
<span>
{"Ancho:"}
</span>
{"\n"}
<span id="logo-editor-width-val" style={{"fontWeight": "600", "color": "#00d2ff"} as CSSProperties}>
{"65px"}
</span>
{"\n"}
</div>
{"\n"}
<input type="range" id="logo-editor-width-slider" min="30" max="200" defaultValue="65" style={{"width": "100%", "height": "4px", "borderRadius": "2px", "accentColor": "#00d2ff", "cursor": "pointer"} as CSSProperties}/>
{"\n"}
</div>
{"\n"}
{"\n"}
<div style={{"display": "flex", "alignItems": "center", "gap": "6px", "cursor": "pointer"} as CSSProperties}>
{"\n"}
<input type="checkbox" id="logo-editor-aspect-ratio" defaultChecked={true} style={{"width": "14px", "height": "14px", "cursor": "pointer", "accentColor": "#00d2ff"} as CSSProperties}/>
{"\n"}
<label htmlFor="logo-editor-aspect-ratio" style={{"fontSize": "0.75rem", "color": "#a1a1aa", "cursor": "pointer", "userSelect": "none"} as CSSProperties}>
{"Mantener proporción (alto auto)"}
</label>
{"\n"}
</div>
{"\n"}
{"\n"}
<div id="logo-editor-height-container" className="popover-control-group hidden" style={{"display": "none", "flexDirection": "column", "gap": "4px"} as CSSProperties}>
{"\n"}
<div style={{"display": "flex", "justifyContent": "space-between", "fontSize": "0.75rem", "color": "#a1a1aa"} as CSSProperties}>
{"\n"}
<span>
{"Alto:"}
</span>
{"\n"}
<span id="logo-editor-height-val" style={{"fontWeight": "600", "color": "#00d2ff"} as CSSProperties}>
{"65px"}
</span>
{"\n"}
</div>
{"\n"}
<input type="range" id="logo-editor-height-slider" min="30" max="200" defaultValue="65" style={{"width": "100%", "height": "4px", "borderRadius": "2px", "accentColor": "#00d2ff", "cursor": "pointer"} as CSSProperties}/>
{"\n"}
</div>
{"\n"}
{"\n"}
<div id="logo-editor-fit-container" className="popover-control-group hidden" style={{"display": "none", "flexDirection": "column", "gap": "4px"} as CSSProperties}>
{"\n"}
<span style={{"fontSize": "0.75rem", "color": "#a1a1aa"} as CSSProperties}>
{"Ajuste de imagen:"}
</span>
{"\n"}
<div className="fit-btn-group" style={{"display": "flex", "gap": "4px"} as CSSProperties}>
{"\n"}
<button type="button" className="btn btn-ghost btn-xs btn-fit active" data-fit="contain" style={{"flex": "1", "fontSize": "0.65rem", "padding": "2px 4px !important"} as CSSProperties}>
{"Ajustar"}
</button>
{"\n"}
<button type="button" className="btn btn-ghost btn-xs btn-fit" data-fit="cover" style={{"flex": "1", "fontSize": "0.65rem", "padding": "2px 4px !important"} as CSSProperties}>
{"Recortar"}
</button>
{"\n"}
<button type="button" className="btn btn-ghost btn-xs btn-fit" data-fit="fill" style={{"flex": "1", "fontSize": "0.65rem", "padding": "2px 4px !important"} as CSSProperties}>
{"Estirar"}
</button>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
{"\n"}
<div style={{"borderTop": "1px solid rgba(255,255,255,0.06)", "paddingTop": "10px", "marginTop": "2px"} as CSSProperties}>
{"\n"}
<button type="button" id="logo-editor-reset" className="btn btn-accent btn-full" style={{"fontSize": "0.75rem", "padding": "6px 12px", "height": "auto"} as CSSProperties}>
{"Restablecer valores"}
</button>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
<RefineText/>
{"\n"}
<LogoGallery/>
{"\n"}
{"\n"}
<div id="editor-context-menu" className="editor-context-menu hidden no-print" style={{"position": "absolute", "display": "none", "zIndex": "10000"} as CSSProperties}>
{"\n"}
<ul className="context-menu-list">
{"\n"}
<li id="menu-item-bold" className="context-menu-item">
<strong>
{"Negrita"}
</strong>
{" "}
<span className="shortcut">
{"Ctrl+B"}
</span>
</li>
{"\n"}
<li id="menu-item-italic" className="context-menu-item">
<em>
{"Cursiva"}
</em>
{" "}
<span className="shortcut">
{"Ctrl+I"}
</span>
</li>
{"\n"}
<li id="menu-item-underline" className="context-menu-item">
<span style={{"textDecoration": "underline"} as CSSProperties}>
{"Subrayado"}
</span>
{" "}
<span className="shortcut">
{"Ctrl+U"}
</span>
</li>
{"\n"}
<li className="context-menu-divider">

</li>
{"\n"}
<li id="menu-item-cut" className="context-menu-item">
{"Cortar "}
<span className="shortcut">
{"Ctrl+X"}
</span>
</li>
{"\n"}
<li id="menu-item-copy" className="context-menu-item">
{"Copiar "}
<span className="shortcut">
{"Ctrl+C"}
</span>
</li>
{"\n"}
<li id="menu-item-paste" className="context-menu-item">
{"Pegar "}
<span className="shortcut">
{"Ctrl+V"}
</span>
</li>
{"\n"}
<li className="context-menu-divider">

</li>
{"\n"}
<li id="menu-item-ai-improve" className="context-menu-item">
{"Refinar con IA"}
</li>
{"\n"}
<li id="menu-item-ai-rubrica" className="context-menu-item">
{"Rúbrica con IA"}
</li>
{"\n"}
<li id="menu-item-edit-logo" className="context-menu-item hidden">
{"Ajustes de Logo"}
</li>
{"\n"}
<li id="menu-item-swap-logos" className="context-menu-item hidden">
{"Intercambiar Lado"}
</li>
{"\n"}
</ul>
{"\n"}
</div>
{"\n"}
    </>;
}
