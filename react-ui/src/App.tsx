import {useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Check, ChevronRight, CircleHelp, FileText, FolderOpen, GraduationCap, Home, Layers3, LoaderCircle, LogIn, Menu, Moon, Orbit, Plus, SlidersHorizontal, Sparkles, Sun, X} from 'lucide-react';
import type {Bridge, Field} from './bridge';
import {DataStep} from './DataStep';
import {LearningStep} from './LearningStep';
import {ReviewStep} from './ReviewStep';
import {SessionSummary} from './SessionSummary';

const steps=[{title:'Datos',description:'El contexto de tu clase',Icon:GraduationCap},{title:'Aprendizajes',description:'Qué y cómo aprenderán',Icon:BookOpen},{title:'Revisar y generar',description:'Tu último vistazo',Icon:Sparkles}];

export function App({bridge}:{bridge:Bridge}) {
    const state=useSyncExternalStore(bridge.subscribe,bridge.getSnapshot);
    const [step,setStep]=useState(0);
    const [errors,setErrors]=useState<Partial<Record<Field,string>>>({});
    const [notice,setNotice]=useState('');
    const [menuOpen,setMenuOpen]=useState(false);
    const scroll=useRef<HTMLElement>(null);

    useEffect(()=>{
        if (["#/landing","#/home","#/sessions"].includes(window.location.hash)) return;
        bridge.prepare();
        const initial=bridge.getSnapshot();
        if (!initial.hasDocument && !initial.fields.duracion) bridge.setField('duracion','90 min');
    },[bridge]);
    useLayoutEffect(()=>{
        if (state.view !== 'wizard') return;
        scroll.current?.scrollTo({top:0,behavior:'instant'});
        document.getElementById('react-step-heading')?.focus({preventScroll:true});
    },[step,state.view]);

    function validate() {
        const failures=bridge.validate();
        setErrors(Object.fromEntries(failures.map(error=>[error.id.replace('input-',''),error.message])));
        if (!failures.length) return true;
        setStep(0);
        setNotice('Revisa los datos señalados para continuar.');
        requestAnimationFrame(()=>document.getElementById(`react-${failures[0].id.replace('input-','')}`)?.focus());
        return false;
    }
    function goTo(next:number) { if (next < step || validate()) {setStep(next);setNotice('');} }
    async function generate() {
        if (!validate()) return;
        setNotice('');
        const before=bridge.getSnapshot().generated;
        await bridge.generate();
        if (bridge.getSnapshot().generated === before) setNotice('La sesión todavía no se generó. Revisa el aviso, tu cuenta y las opciones seleccionadas.');
    }
    async function newSession() {
        setMenuOpen(false);
        // Release the mobile dialog's focus trap before opening a legacy confirmation.
        await new Promise(resolve=>requestAnimationFrame(resolve));
        if (await bridge.newSession()) {
            bridge.setField('duracion','90 min');setStep(0);setErrors({});setNotice('');
            requestAnimationFrame(()=>document.getElementById('react-step-heading')?.focus({preventScroll:true}));
        }
    }
    const planning=state.view === 'planning';
    const nav=<>
        <div className="sl-brand"><span className="sl-brand-symbol"><Orbit size={26}/></span><span>Space<span className="sl-brand-light">Lab</span><small>EL ESPACIO DE TUS IDEAS</small></span></div>
        <button type="button" className="sl-create-button" onClick={()=>void newSession()}><Plus size={19}/>Nueva sesión</button>
        <span className="sl-nav-label">TU ESPACIO DOCENTE</span>
        <nav aria-label="Navegación principal" className="sl-nav">
            <button type="button" onClick={()=>{bridge.showLegacy('home');setMenuOpen(false);}}><Home size={19}/>Mi espacio</button>
            <button type="button" className={!planning ? "active" : undefined} aria-current={!planning ? "page" : undefined} onClick={()=>{bridge.prepare();setMenuOpen(false);}}><Sparkles size={19}/>Crear sesión<span className="sl-nav-dot"/></button>
            <button type="button" className={planning ? 'active' : undefined} aria-current={planning ? 'page' : undefined} onClick={()=>{setMenuOpen(false);requestAnimationFrame(()=>bridge.openPlanning());}}><Layers3 size={19}/>Unidades y experiencias</button>
            <button type="button" onClick={()=>{bridge.showLegacy('library');setMenuOpen(false);}}><FolderOpen size={19}/>Mi biblioteca</button>
        </nav>
        <div className="sl-nav-bottom"><div className="sl-nav-tip"><span className="sl-tip-symbol"><Sparkles size={20}/></span><strong>Más tiempo para enseñar.</strong><p>Dale forma a tus ideas y crea experiencias para tu aula.</p><span className="sl-tip-line"/></div><span className="sl-sidebar-footer"><span className="sl-status-dot"/>Hecho para docentes</span></div>
    </>;
    if (state.view === 'legacy' && (['home','library'].includes(state.legacyDestination) || ['#/landing','#/home','#/sessions'].includes(window.location.hash))) return null;
    if (state.view === 'legacy') return <div className="sl-return-bar"><span><Orbit size={19}/>Space Lab</span><button type="button" onClick={()=>bridge.prepare()}><ArrowLeft size={17}/>Volver al nuevo generador</button></div>;

    return <div className="sl-app">
        <a className="sl-skip" href={planning ? '#planning-title' : '#react-step-heading'} onClick={event=>{event.preventDefault();document.getElementById(planning ? 'planning-title' : 'react-step-heading')?.focus();}}>Ir al generador</a>
        <aside className="sl-sidebar">{nav}</aside>
        <div className="sl-workspace">
            <header className="sl-topbar">
                <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}><Dialog.Trigger asChild><button className="sl-icon-button sl-mobile-menu" type="button" aria-label="Abrir navegación"><Menu size={22}/></button></Dialog.Trigger>
                    <Dialog.Portal container={document.getElementById('react-preview-root')}><Dialog.Overlay className="sl-dialog-overlay"/><Dialog.Content className="sl-mobile-drawer" onCloseAutoFocus={event=>{
                        // A completed request or another dialog may already own the focus.
                        if (document.activeElement?.closest('#planning-dialog,#confirm-dialog,#auth-modal')) event.preventDefault();
                    }}><Dialog.Title className="sl-sr-only">Navegación de Space Lab</Dialog.Title><Dialog.Description className="sl-sr-only">Accede a tus sesiones, unidades y biblioteca.</Dialog.Description><Dialog.Close className="sl-drawer-close" aria-label="Cerrar navegación"><X size={22}/></Dialog.Close>{nav}</Dialog.Content></Dialog.Portal>
                </Dialog.Root>
                <span className="sl-mobile-brand"><Orbit size={21}/>Space<span>Lab</span></span>
                <div className="sl-breadcrumb"><span>Planificador</span><ChevronRight size={14}/><strong>{planning ? 'Unidades y experiencias' : state.linked ? 'Sesión vinculada' : 'Nueva sesión'}</strong></div>
                <div className="sl-topbar-actions"><span className="sl-beta-tag">VISTA PREVIA</span><button type="button" className="sl-icon-button" aria-label={state.theme==='dark' ? 'Usar tema claro' : 'Usar tema oscuro'} onClick={()=>bridge.toggleTheme()}>{state.theme==='dark' ? <Sun size={19}/> : <Moon size={19}/>}</button>
                    <Help/>
                    <button type="button" className="sl-account" onClick={()=>state.account.signedIn ? bridge.showLegacy('home') : bridge.signIn()}>{state.account.signedIn ? <span className="sl-avatar">{state.account.name.slice(0,2).toUpperCase()}</span> : <LogIn size={18}/>}<span>{state.account.name}</span></button>
                </div>
            </header>
            {planning ? <PlanningSurface/> : <><main className="sl-main" ref={scroll}>
                <div className="sl-page-width"><div className="sl-page-heading"><div><span className="sl-page-eyebrow"><span/>MENOS PAPELEO, MÁS APRENDIZAJE</span><h1>Tu próxima gran clase empieza aquí<span>.</span></h1><p>Trae una idea. Dale propósito. Conviértela en una sesión para tu aula.</p></div><button className="sl-advanced-link" type="button" onClick={()=>bridge.showLegacy('advanced')}><SlidersHorizontal size={17}/><span>Modo avanzado</span><ArrowUpRight size={15}/></button></div>
                    <nav className="sl-stepper" aria-label="Pasos del generador">{steps.map(({title,description,Icon},index)=><button type="button" key={title} className={`sl-step ${step===index ? 'current' : index<step ? 'done' : ''}`} aria-current={step===index ? 'step' : undefined} onClick={()=>goTo(index)}><span className="sl-step-number">{index<step ? <Check size={18}/> : index+1}</span><span><strong>{title}</strong><small>{description}</small></span><Icon size={21} className="sl-step-icon"/></button>)}</nav>
                    {notice && <div className="sl-notice" role="alert">{notice}</div>}
                    <div className="sl-content-grid"><div className="sl-step-content">
                        {step===0 ? <DataStep state={state} bridge={bridge} errors={errors}/> : step===1 ? <LearningStep state={state} bridge={bridge}/> : <ReviewStep state={state} bridge={bridge}/>}
                        <div className="sl-trust-line"><FileText size={15}/><span>{state.hasDocument ? 'Tus cambios se guardan con el documento.' : 'Podrás guardar y exportar tu sesión cuando esté generada.'}</span></div>
                    </div><SessionSummary state={state}/></div>
                </div>
            </main>
            <footer className="sl-footer"><div><button type="button" className="sl-back-button" onClick={()=>goTo(step-1)} disabled={step===0 || state.busy}><ArrowLeft size={18}/>Anterior</button><span className="sl-footer-status"><span>PASO {step+1} DE 3</span><strong>{state.busy ? 'Preparando tu sesión…' : steps[step].title}</strong></span><button type="button" className="sl-primary-button" disabled={state.busy} onClick={()=>step===2 ? void generate() : goTo(step+1)}>{state.busy ? <><LoaderCircle size={19} className="sl-spin"/>Generando…</> : step===2 ? <><Sparkles size={19}/>Generar mi sesión</> : <>Continuar<ArrowRight size={19}/></>}</button></div></footer></>}
        </div>
    </div>;
}

// Keep the existing editor node and its event handlers: one draft, one save/AI flow.
function PlanningSurface() {
    const host=useRef<HTMLDivElement>(null);
    useLayoutEffect(()=>{
        const dialog=document.getElementById('planning-dialog');
        if (!dialog || !host.current) return;
        const parent=dialog.parentNode!;
        const next=dialog.nextSibling;
        host.current.appendChild(dialog);
        const title=dialog.querySelector<HTMLElement>('#planning-title');
        title?.setAttribute('tabindex','-1');
        title?.focus({preventScroll:true});
        return ()=>{parent.insertBefore(dialog,next?.parentNode===parent ? next : null);};
    },[]);
    return <div className="sl-planning-surface" ref={host}/>;
}

function Help() {
    return <Dialog.Root><Dialog.Trigger asChild><button className="sl-icon-button" type="button" aria-label="Ayuda del generador"><CircleHelp size={20}/></button></Dialog.Trigger>
        <Dialog.Portal container={document.getElementById('react-preview-root')}><Dialog.Overlay className="sl-dialog-overlay"/><Dialog.Content className="sl-help-dialog"><Dialog.Close className="sl-drawer-close" aria-label="Cerrar ayuda"><X size={21}/></Dialog.Close><span className="sl-help-symbol"><Sparkles size={29}/></span><Dialog.Title>De tu idea a tu próxima clase.</Dialog.Title><Dialog.Description>El generador te acompaña en tres pasos. Tú mantienes las decisiones pedagógicas.</Dialog.Description><ol><li><strong>Datos.</strong> Define grupo, tema y tiempo.</li><li><strong>Aprendizajes.</strong> Revisa las referencias y aporta tus propuestas.</li><li><strong>Revisar y generar.</strong> Ajusta las opciones y crea la sesión con tu cuenta.</li></ol><p>La disponibilidad curricular varía por nivel. La generación requiere una cuenta y créditos; revisa siempre el resultado antes de compartirlo.</p><Dialog.Close asChild><button className="sl-primary-button" type="button">Vamos a crear<ArrowRight size={18}/></button></Dialog.Close></Dialog.Content></Dialog.Portal>
    </Dialog.Root>;
}
