import {Toasts} from '../live';
import {AuthDialog} from './AuthDialog';
import {ConfirmDialogSurface} from './ConfirmDialogSurface';
import {EngineRequired} from './EngineRequired';
import {PdfGuide} from './PdfGuide';
import {TermsDialog} from './TermsDialog';

export function GlobalOverlays() {
    return <>
{" "}
{"\n"}
<div id="toast-container" className="toast-container"><Toasts/></div>
{"\n"}
<ConfirmDialogSurface/>
{"\n"}
<AuthDialog/>
{"\n"}
<TermsDialog/>
{"\n"}
{"\n"}
<div id="loader-overlay" className="loader-overlay hidden">
{"\n"}
<div className="loader-content">
{"\n"}
<div className="loader-spinner">
{"\n"}
<div className="orbit">

</div>
{"\n"}
<div className="orbit orbit-2">

</div>
{"\n"}
<div className="orbit orbit-3">

</div>
{"\n"}
<div className="core">

</div>
{"\n"}
</div>
{"\n"}
<p id="loader-text" className="loader-text">
{"Generando sesión con IA..."}
</p>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
<PdfGuide/>
{"\n"}
<EngineRequired/>
{"\n"}
{"\n"}
<canvas id="space-bg" className="space-background" hidden={true} aria-hidden="true">

</canvas>
{"\n"}
    </>;
}
