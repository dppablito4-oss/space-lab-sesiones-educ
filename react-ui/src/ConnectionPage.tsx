import {useEffect,useRef,useState} from 'react';

export function StandaloneTheme() {
    const [value,setValue]=useState('system');
    const theme=()=> (window as unknown as {SpaceLabTheme?:{getPreference:()=>string;setPreference:(value:string)=>void}}).SpaceLabTheme;
    useEffect(()=>{setValue(theme()?.getPreference()||'system');},[]);
    return <label className="theme-picker standalone-theme-picker" title="Tema de la aplicación"><span className="sr-only">Tema de la aplicación</span>
        <select id="theme-preference" aria-label="Tema de la aplicación" value={value} onChange={event=>{setValue(event.target.value);theme()?.setPreference(event.target.value);}}>
            <option value="system">Sistema</option><option value="light">Claro</option><option value="dark">Oscuro</option></select></label>;
}

export function ConnectionPage() {
    const [phase,setPhase]=useState<'ready'|'checking'|'connected'|'error'>('ready');
    const [message,setMessage]=useState('');
    const token=useRef('');
    const abort=useRef<AbortController|null>(null);
    useEffect(()=>{
        token.current=new URLSearchParams(window.location.search).get('token')||'';
        if(!token.current){setPhase('error');setMessage('Falta el token de enlace seguro. Asegúrate de abrir la URL enviada por el ejecutable.');}
        return ()=>abort.current?.abort();
    },[]);
    useEffect(()=>{
        if(phase!=='connected')return;
        const timer=setTimeout(()=>{window.location.href='./#/app';},2200);
        return()=>clearTimeout(timer);
    },[phase]);
    async function connect() {
        if(!token.current||phase==='checking')return;
        setPhase('checking');setMessage('');
        abort.current?.abort();abort.current=new AbortController();
        const signal=abort.current.signal;
        try {
            let response:Response;
            const query=encodeURIComponent(token.current);
            try {response=await fetch(`http://127.0.0.1:8000/verificar-token?token=${query}`,{signal});}
            catch(error) {if(signal.aborted)throw error;response=await fetch(`http://localhost:8000/verificar-token?token=${query}`,{signal});}
            if(response.status===401)throw new Error('TOKEN_EXPIRED');
            if(!response.ok)throw new Error('CONNECTION_FAILED');
            const result=await response.json();
            if(result.status!=='Connected')throw new Error('CONNECTION_FAILED');
            localStorage.setItem('backend_connected','true');
            localStorage.setItem('connection_token',token.current);
            setPhase('connected');
        } catch(error) {
            if(signal.aborted)return;
            setPhase('error');
            setMessage(error instanceof Error&&error.message==='TOKEN_EXPIRED'
                ? 'El token de enlace está vencido. Abre de nuevo el enlace de vinculación en pablitopyhost.exe.'
                : 'No se pudo establecer la conexión segura. Mantén abierto pablitopyhost.exe y permite a este sitio conectarse al motor local antes de reintentar.');
        }
    }
    return <><StandaloneTheme/><div className="grid-bg"/><div className="container"><div id="card" className="glass-card">
        <div id="link-box" className={`link-animation-box${phase==='connected'?' connected':''}`}>
            <div className="node node-left" title="Navegador web"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14 0 18M12 3c-3 3.5-3 14 0 18"/></svg></div>
            <div className="connection-beam"><div className="connection-pulse"/></div>
            <div className="node node-right" title="Motor local"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 9h8M8 13h5M8 17h3"/></svg></div>
        </div><h1 id="title">{phase==='connected'?'Motor Enlazado':'Enlazar Motor Local'}</h1>
        <p id="description">{phase==='connected'?'El motor de exportación local en Python ha sido vinculado correctamente. Redirigiéndote al editor...':'Detectamos una solicitud de conexión segura para activar la exportación premium (PDF impecable y Word nativo).'}</p>
        <button id="btn-connect" className={`btn-connect${phase==='connected'?' btn-success':''}`} onClick={()=>void connect()} disabled={phase==='checking'||phase==='connected'||(phase==='error'&&!token.current)}>
            <span id="btn-text">{phase==='checking'?'Comprobando conexión...':phase==='connected'?'¡Enlace Exitoso!':'Vincular con Motor Local'}</span></button>
        <div id="status-message" className={message?'status-alert alert-error':'status-alert'} role="status" style={message?{display:'block'}:undefined}>{message}</div>
        <div className="footer-info">Desarrollado por Samuel Pablo | <a href="./">Ir al Panel de Control</a></div>
    </div></div></>;
}
