import {useLayoutEffect, useState} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {Home, Sparkles, Layers3, FolderOpen, Plus, PanelLeftClose, PanelLeftOpen, Menu, X} from 'lucide-react';
import type {Bridge, Snapshot} from './bridge';

/** A single navigation instance survives transitions between the domain surfaces. */
export function WorkspaceNavigation({bridge,state}:{bridge:Bridge;state:Snapshot}) {
    const [open,setOpen]=useState(false);
    const [collapsed,setCollapsed]=useState(false);
    const visible=!(state.view==='legacy' && state.legacyDestination==='landing');
    const active=state.view==='planning' ? 'planning' : state.view==='wizard' ? 'create'
        : state.legacyDestination==='library' || location.hash==='#/sessions' ? 'library'
        : state.legacyDestination==='home' ? 'home' : 'document';
    useLayoutEffect(()=>{
        if(visible) document.body.dataset.workspaceNav=collapsed ? 'collapsed' : 'expanded';
        else delete document.body.dataset.workspaceNav;
        return ()=>{delete document.body.dataset.workspaceNav;};
    },[visible,collapsed]);
    async function navigate(action:()=>unknown) {
        setOpen(false);
        // Release the drawer focus trap before domain dialogs claim focus.
        await new Promise(resolve=>requestAnimationFrame(resolve));
        action();
    }
    const items=[
        {id:'home',label:'Mi espacio',Icon:Home,action:()=>bridge.showLegacy('home')},
        {id:'create',label:'Crear sesión',Icon:Sparkles,action:()=>bridge.prepare()},
        {id:'planning',label:'Unidades y experiencias',Icon:Layers3,action:()=>bridge.openPlanning()},
        {id:'library',label:'Mi biblioteca',Icon:FolderOpen,action:()=>bridge.showLegacy('library')}
    ];
    const contents=<>
        <div className="sl-brand"><span className="sl-brand-symbol"><img className="sl-brand-logo" src="assets/favicon.svg" alt="" width="40" height="40"/></span><span className="workspace-nav-copy">Space<span className="sl-brand-light">Lab</span><small>EL ESPACIO DE TUS IDEAS</small></span></div>
        <button type="button" className="sl-create-button" title="Nueva sesión" onClick={()=>void navigate(async()=>{
            if(await bridge.newSession()) bridge.setField('duracion','90 min');
        })}><Plus size={19}/><span className="workspace-nav-copy">Nueva sesión</span></button>
        <span className="sl-nav-label workspace-nav-copy">TU ESPACIO DOCENTE</span>
        <nav aria-label="Navegación principal" className="sl-nav">{items.map(({id,label,Icon,action})=><button key={id} type="button" title={label} aria-label={label} className={active===id?'active':undefined} aria-current={active===id?'page':undefined} onClick={()=>void navigate(action)}><Icon size={19}/><span className="workspace-nav-copy">{label}</span>{active===id&&<span className="sl-nav-dot"/>}</button>)}</nav>
        <div className="sl-nav-bottom workspace-nav-copy"><div className="sl-nav-tip"><span className="sl-tip-symbol"><Sparkles size={20}/></span><strong>Más tiempo para enseñar.</strong><p>Dale forma a tus ideas y crea experiencias para tu aula.</p><span className="sl-tip-line"/></div><span className="sl-sidebar-footer"><span className="sl-status-dot"/>Hecho para docentes</span></div>
    </>;
    return <div className="workspace-navigation" hidden={!visible}>
        <aside className={`sl-sidebar workspace-sidebar${collapsed?' is-collapsed':''}`} aria-label="Tu espacio docente">
            {contents}
            <button type="button" className="workspace-collapse" aria-label={collapsed?'Expandir barra lateral':'Contraer barra lateral'} aria-expanded={!collapsed} onClick={()=>setCollapsed(value=>!value)}>{collapsed?<PanelLeftOpen size={18}/>:<PanelLeftClose size={18}/>}<span className="workspace-nav-copy">Contraer menú</span></button>
        </aside>
        <Dialog.Root open={open&&visible} onOpenChange={setOpen}>
            <Dialog.Trigger asChild><button className="workspace-mobile-trigger sl-icon-button" type="button" aria-label="Abrir navegación"><Menu size={22}/></button></Dialog.Trigger>
            <Dialog.Portal container={document.getElementById('react-preview-root')}><Dialog.Overlay className="sl-dialog-overlay"/><Dialog.Content className="sl-mobile-drawer" onCloseAutoFocus={event=>{if(document.activeElement?.closest('#planning-dialog,#confirm-dialog,#auth-modal'))event.preventDefault();}}><Dialog.Title className="sl-sr-only">Navegación de Space Lab</Dialog.Title><Dialog.Description className="sl-sr-only">Accede a tus sesiones, unidades y biblioteca.</Dialog.Description><Dialog.Close className="sl-drawer-close" aria-label="Cerrar navegación"><X size={22}/></Dialog.Close>{contents}</Dialog.Content></Dialog.Portal>
        </Dialog.Root>
    </div>;
}
