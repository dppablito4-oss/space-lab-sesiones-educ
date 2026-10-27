import {memo, useEffect} from 'react';
import {Icons} from './surfaces/Icons';
import {GlobalOverlays} from './surfaces/GlobalOverlays';
import {Landing} from './surfaces/Landing';
import {Home} from './surfaces/Home';
import {PlanningHost} from './surfaces/PlanningHost';
import {SessionEditor} from './surfaces/SessionEditor';
import {EditorOverlays} from './surfaces/EditorOverlays';

/** Stable DOM integration boundaries for the document, curriculum and export engines.
 * Uncontrolled fields preserve caret/selection and in-flight edits. These surfaces
 * stay mounted across routes; account changes are handled by the scoped services.
 */
const Surfaces = memo(function Surfaces() {
    return <><div id="react-preview-root"/><a className="skip-link" href="#session-form">Ir al formulario de sesión</a>
        <Icons/><GlobalOverlays/><Landing/><Home/><PlanningHost/><SessionEditor/><EditorOverlays/>
    </>;
});

export function FrontendShell({onReady}:{onReady?:()=>void|(()=>void)}) {
    useEffect(()=>onReady?.(),[onReady]);
    return <Surfaces/>;
}
