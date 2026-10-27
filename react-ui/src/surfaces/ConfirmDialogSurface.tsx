
export function ConfirmDialogSurface() {
    return <>
{" "}
{"\n"}
<div id="confirm-dialog" className="confirm-overlay hidden">
{"\n"}
<div className="confirm-card glass-card">
{"\n"}
<div className="confirm-icon">
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-alert">

</use>
</svg>
</div>
{"\n"}
<h3 id="confirm-title">
{"¿Estás seguro?"}
</h3>
{"\n"}
<p id="confirm-message">
{"Esta acción no se puede deshacer."}
</p>
{"\n"}
<div className="confirm-actions">
{"\n"}
<button id="confirm-cancel" className="btn btn-ghost">
{"Cancelar"}
</button>
{"\n"}
<button id="confirm-deny" className="btn btn-warning hidden">
{"No Guardar"}
</button>
{"\n"}
<button id="confirm-accept" className="btn btn-danger">
{"Confirmar"}
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
