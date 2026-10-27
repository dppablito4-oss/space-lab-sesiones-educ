import type {CSSProperties} from 'react';

export function AuthDialog() {
    return <>
{" "}
{"\n"}
<div id="auth-modal" className="load-modal hidden" style={{"zIndex": "9999"} as CSSProperties}>
{"\n"}
<div className="load-modal-content glass-card auth-premium-card" style={{"maxWidth": "420px", "padding": "2.5rem", "textAlign": "center", "position": "relative"} as CSSProperties}>
{"\n"}
{"\n"}
<button id="btn-close-auth" className="btn btn-ghost btn-sm" aria-label="Cerrar" style={{"position": "absolute", "top": "1rem", "right": "1rem", "color": "#71717a"} as CSSProperties}>
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-close">

</use>
</svg>
</button>
{"\n"}
{"\n"}
<div style={{"marginBottom": "1.5rem", "display": "flex", "justifyContent": "center"} as CSSProperties}>
{"\n"}
<div style={{"background": "#090a0f", "border": "1px solid rgba(255,255,255,0.06)", "padding": "12px", "borderRadius": "8px", "display": "inline-flex", "alignItems": "center", "justifyContent": "center", "boxShadow": "var(--shadow-sm)"} as CSSProperties}>
{"\n"}
<svg width="42" height="42" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{"filter": "drop-shadow(0px 0px 8px rgba(0, 210, 255, 0.5))"} as CSSProperties}>
{"\n"}
<rect x="2" y="2" width="96" height="96" rx="28" fill="#0d0e12" stroke="#1f2937" strokeWidth="2">

</rect>
{"\n"}
<path d="M55 22C42.5 22 36.5 30 36.5 35C36.5 37.5 38.5 39.5 41 39.5C43.5 39.5 45 37.5 45.5 35.5C46.2 33 49 28.5 54.5 28.5C60.5 28.5 63 32.5 63 36.5C63 42.5 56.5 44.5 51 46.5L42.5 49.5C36.5 51.5 34.5 57.5 34.5 63.5C34.5 72.5 43.5 78 54 78C66.5 78 72 70 72 65C72 62.5 70 60.5 67.5 60.5C65 60.5 63.5 62.5 63 64.5C62.3 67 59.5 71.5 54 71.5C47.5 71.5 45 67.5 45 63.5C45 57.5 51.5 55.5 57 53.5L65.5 50.5C71.5 48.5 73.5 42.5 73.5 36.5C73.5 27.5 65.5 22 55 22Z" fill="#ffffff">

</path>
{"\n"}
<path d="M56 25L38 52H48L44 75L62 48H52L56 25Z" fill="#ffffff">

</path>
{"\n"}
</svg>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
{"\n"}
<div className="auth-tabs">
{"\n"}
<button type="button" id="auth-tab-login" className="auth-tab active">
{"Ingresar"}
</button>
{"\n"}
<button type="button" id="auth-tab-register" className="auth-tab">
{"Crear cuenta"}
</button>
{"\n"}
</div>
{"\n"}
{"\n"}
<div className="load-modal-header" style={{"display": "none"} as CSSProperties}>
{"\n"}
<h3 id="auth-title">
{"Iniciar Sesión"}
</h3>
{"\n"}
</div>
{"\n"}
<p id="auth-subtitle" style={{"display": "none"} as CSSProperties}>

</p>
{"\n"}
<form id="auth-form" autoComplete="off">
{"\n"}
<p id="auth-recovery-description" className="hidden" role="status">

</p>
{"\n"}
{"\n"}
<div id="auth-group-username" className="form-group hidden" style={{"textAlign": "left", "marginBottom": "1rem"} as CSSProperties}>
{"\n"}
<input type="text" id="auth-username" className="auth-field" placeholder="Apodo único (sin espacios)"/>
{"\n"}
</div>
{"\n"}
{"\n"}
<div className="form-group" style={{"textAlign": "left", "marginBottom": "1rem"} as CSSProperties}>
{"\n"}
<input type="email" id="auth-email" className="auth-field" placeholder="Correo electrónico" required={true}/>
{"\n"}
</div>
{"\n"}
{"\n"}
<div className="form-group" style={{"textAlign": "left", "marginBottom": "1rem"} as CSSProperties}>
{"\n"}
<input type="password" id="auth-password" className="auth-field" placeholder="Contraseña" required={true}/>
{"\n"}
</div>
{"\n"}
{"\n"}
<div id="auth-group-confirm-password" className="form-group hidden" style={{"textAlign": "left", "marginBottom": "1rem"} as CSSProperties}>
{"\n"}
<input type="password" id="auth-confirm-password" className="auth-field" placeholder="Confirmar contraseña"/>
{"\n"}
</div>
{"\n"}
{"\n"}
<div id="auth-group-terms" className="form-group hidden" style={{"textAlign": "left", "marginBottom": "1.5rem", "display": "flex", "alignItems": "center", "gap": "8px"} as CSSProperties}>
{"\n"}
<input type="checkbox" id="auth-terms" style={{"width": "16px", "height": "16px", "cursor": "pointer", "accentColor": "#00d2ff", "margin": "0"} as CSSProperties}/>
{"\n"}
<label htmlFor="auth-terms" style={{"fontSize": "0.8rem", "color": "#71717a", "lineHeight": "1.3", "cursor": "pointer", "userSelect": "none"} as CSSProperties}>
{"\n                        Acepto los "}
<a href="#" style={{"color": "#00d2ff", "textDecoration": "none", "fontWeight": "600", "borderBottom": "1px dotted #00d2ff"} as CSSProperties}>
{"Términos\n                            y Privacidad"}
</a>
{"\n"}
</label>
{"\n"}
</div>
{"\n"}
{"\n"}
<button type="submit" id="btn-submit-auth" className="auth-submit-btn">
{"\n                    Iniciar Sesión\n                "}
</button>
{"\n"}
<button type="button" id="btn-forgot-password" className="btn btn-ghost">
{"Olvidé mi contraseña"}
</button>
{"\n"}
</form>
{"\n"}
{"\n"}
<div style={{"display": "none"} as CSSProperties}>
{"\n"}
<span id="auth-toggle-text">
{"¿No tienes una cuenta?"}
</span>
{"\n"}
<a href="#" id="auth-toggle-mode">
{"Créala aquí"}
</a>
{"\n"}
</div>
{"\n"}
{"\n"}
<div style={{"marginTop": "0.5rem"} as CSSProperties}>
{"\n"}
<button type="button" id="btn-cancel-auth" className="auth-cancel-btn" style={{"background": "none", "border": "none", "color": "#71717a", "fontSize": "0.9rem", "cursor": "pointer", "transition": "color 0.2s"} as CSSProperties}>
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
