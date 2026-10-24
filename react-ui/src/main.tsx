import {createRoot} from 'react-dom/client';
import {App} from './App';
import './styles.css';

function start() {
    const host=document.getElementById('react-preview-root');
    if (!host) return;
    if (new URLSearchParams(location.search).get('ui') === 'legacy') {
        host.remove();
        delete document.body.dataset.reactPreview;
        return;
    }
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
start();
