import {useEffect,useSyncExternalStore} from 'react';
import {renderRegion} from './regions';

function channel<T>(initial:T) {
    let value=initial;
    const listeners=new Set<()=>void>();
    return {get:()=>value,server:()=>initial,subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>listeners.delete(listener);},
        set(next:T){value=next;listeners.forEach(listener=>listener());}};
}
type SessionCard={id:string;title:string;description:string;lastSaved:string;date:string};
type Account={signedIn:boolean;isAdmin:boolean;onLogin?:()=>void;onLogout?:()=>void};
type Notice={id:number;message:string;type:string};
const sessions=channel<SessionCard[]>([]);
const account=channel<Account>({signedIn:false,isAdmin:false});
const notices=channel<Notice[]>([]);
const timers=new Map<number,ReturnType<typeof setTimeout>>();
let noticeId=0;
const dismiss=(id:number)=>{clearTimeout(timers.get(id));timers.delete(id);notices.set(notices.get().filter(item=>item.id!==id));};
function Icon({name}:{name:string}) {return <svg className="ui-icon" aria-hidden="true"><use href={`#icon-${name}`}/></svg>;}

export function SessionCards() {
    const items=useSyncExternalStore(sessions.subscribe,sessions.get,sessions.server);
    if(!items.length)return <div className="home-empty-sessions"><span><Icon name="folder"/></span>
        <h3>Aún no tienes sesiones guardadas</h3><p>Crea tu primera planificación y aparecerá aquí automáticamente.</p>
        <button type="button" className="btn btn-primary btn-sm" data-home-action="new-session">Crear mi primera sesión</button></div>;
    return <>{items.map(item=><article className="home-session-item" key={item.id}>
        <div className="home-session-main"><span className="home-session-symbol"><Icon name="file"/></span>
            <div className="home-session-copy"><strong>{item.title}</strong><span>{item.description}</span></div></div>
        <div className="home-session-actions"><time className="home-session-date" dateTime={item.lastSaved}>{item.date}</time>
            <button type="button" className="btn btn-ghost btn-sm home-open-session" data-session-id={item.id}>Abrir <Icon name="arrow-right"/></button></div>
    </article>)}</>;
}

export function AccountActions() {
    const state=useSyncExternalStore(account.subscribe,account.get,account.server);
    if(!state.signedIn)return <button id="btn-login-trigger" className="btn btn-ghost btn-sm" aria-label="Iniciar sesión" onClick={state.onLogin}><Icon name="user"/><span className="auth-label">Iniciar sesión</span></button>;
    return <div className="user-menu-container">{state.isAdmin&&<a href="admin.html" className="btn btn-accent btn-sm"><Icon name="shield"/><span className="auth-label">Admin</span></a>}
        <button id="btn-logout" className="btn btn-ghost btn-sm" title="Cerrar sesión" onClick={state.onLogout}><Icon name="logout"/><span className="auth-label">Salir</span></button></div>;
}

export function Toasts() {
    const items=useSyncExternalStore(notices.subscribe,notices.get,notices.server);
    useEffect(()=>()=>{timers.forEach(clearTimeout);timers.clear();},[]);
    const icons:Record<string,string>={success:'check',error:'close',info:'sparkles',warning:'alert'};
    return <>{items.map(item=><div key={item.id} className={`toast toast-${item.type}`} role={item.type==='error'?'alert':'status'} onClick={()=>dismiss(item.id)}>
        <span className="toast-icon"><Icon name={icons[item.type]||'sparkles'}/></span><span className="toast-msg">{item.message}</span>
        <button type="button" className="btn btn-ghost btn-sm" aria-label="Cerrar aviso" onClick={()=>dismiss(item.id)}>×</button>
    </div>)}</>;
}

export function installReactUI() {
    window.SpaceLabReactUI={
        region:renderRegion,
        sessions:(items)=>sessions.set(items),auth:(value)=>account.set(value),
        toast(message,type='info',duration=3500){
            const id=++noticeId;
            if(notices.get().length>=5)dismiss(notices.get()[0].id);
            notices.set([...notices.get(),{id,message:String(message??''),type}]);
            timers.set(id,setTimeout(()=>dismiss(id),Math.max(0,duration)));
        }
    };
}
declare global {interface Window {SpaceLabReactUI?:{
    region:(target:Element,markup:string)=>string;
    sessions:(items:SessionCard[])=>void;auth:(value:Account)=>void;
    toast:(message:unknown,type?:string,duration?:number)=>void;
}}}
