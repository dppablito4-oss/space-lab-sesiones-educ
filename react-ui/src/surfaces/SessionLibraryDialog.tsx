
export function SessionLibraryDialog() {
    return <>
{" "}
{"\n"}
<div id="load-modal" className="load-modal hidden">
{"\n"}
<div className="load-modal-content glass-card">
{"\n"}
<div className="load-modal-header">
{"\n"}
<h3>
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-folder">

</use>
</svg>
{" Cargar Sesión Guardada"}
</h3>
{"\n"}
<button id="btn-close-load" className="btn btn-ghost btn-sm" aria-label="Cerrar">
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-close">

</use>
</svg>
</button>
{"\n"}
</div>
{"\n"}
<ul id="load-list" className="load-list">
{"\n"}
<li className="saved-empty">
{"No hay sesiones guardadas"}
</li>
{"\n"}
</ul>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
    </>;
}
