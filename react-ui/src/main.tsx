import {createRoot} from 'react-dom/client';
import {hydrateRoot} from 'react-dom/client';
import {App} from './App';
import {FrontendShell} from './FrontendShell';
import {installReactUI} from './live';
import {Downloads} from './surfaces/Downloads';
import {ConnectionPage} from './ConnectionPage';
import {observeRegionCleanup} from './regions';
import {installMotion,startControllers} from './runtime';
import './styles.css';

function start() {
    const host=document.getElementById('react-preview-root');
    if (!host) return;
    if (new URLSearchParams(location.search).get('ui') === 'legacy') return;
    if (['#/app','#/editor','#/sessions/new'].includes(location.hash)) {
        host.innerHTML='<div class="sl-starting" role="status"><span>Space Lab</span>Preparando tu espacio de trabajo…</div>';
    }
    const started=performance.now();
    function mount() {
        const bridge=window.SpaceLabReactBridge;
        if (bridge) {host!.dataset.ready='true';createRoot(host!).render(<App bridge={bridge}/>); return;}
        if (performance.now()-started>15000) {
            // The original page stays usable if the new entry cannot start.
            host!.replaceChildren();
            delete document.body.dataset.reactPreview;
            return;
        }
        window.setTimeout(mount,50);
    }
    mount();
}
const surface=document.getElementById('frontend-root');
const standalone=document.getElementById('standalone-root');
if(window.SpaceLabFrontend?.mode==='recovery') {
    // A late bundle must never replace edits made in recovery mode.
} else if(standalone) {
    hydrateRoot(standalone,standalone.dataset.page==='Downloads'?<Downloads/>:<ConnectionPage/>);
} else if(surface) {
    window.SpaceLabFrontend={hydrated:false,ready:false,failures:[]};
    const onReady=()=>{
        window.SpaceLabFrontend!.hydrated=true;
        installReactUI();
        const disposeMotion=installMotion();
        const disposeRegions=observeRegionCleanup();
        void startControllers().then(start);
        return ()=>{disposeMotion();disposeRegions();};
    };
    hydrateRoot(surface,<FrontendShell onReady={onReady}/>,{
        onRecoverableError(error){
            window.SpaceLabFrontend!.failures.push('hydration');
            console.error('Frontend hydration failed',error);
        }
    });
} else start();
