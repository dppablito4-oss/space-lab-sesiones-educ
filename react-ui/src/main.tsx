import {createRoot} from 'react-dom/client';
import {App} from './App';
import './styles.css';

const host=document.getElementById('react-preview-root');
if (!host) throw new Error('Preview host not found');
host.innerHTML='<div class="sl-starting" role="status"><span>Space Lab</span>Preparando tu espacio de trabajo…</div>';
const started=performance.now();
function mount() {
    const bridge=window.SpaceLabReactBridge;
    if (bridge) {createRoot(host!).render(<App bridge={bridge}/>); return;}
    if (performance.now()-started>15000) {
        host!.innerHTML='<div class="sl-starting"><span>No pudimos iniciar el generador.</span><a href="/legacy.html#/app">Abrir el editor actual</a></div>';
        return;
    }
    window.setTimeout(mount,50);
}
mount();
