import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {LayoutDashboard,Users,Coins,Layers,Sparkles,ScrollText,ShieldCheck,Settings,Menu,ArrowLeft,SunMoon,RefreshCw,LogOut,Search,Clock3} from 'lucide-react';
import {context,friendly,getClient,read,write,type AdminClient,type Context,type Page,type Row} from './api';
import './style.css';

const sections=[
 {id:'overview',label:'Vista general',icon:LayoutDashboard,permission:'overview.read'},
 {id:'users',label:'Usuarios y créditos',icon:Users,permission:'users.read'},
 {id:'credits',label:'Libro de cr?ditos',icon:Coins,permission:'credits.read'},
 {id:'plans',label:'Planes y cuotas',icon:Layers,permission:'plans.read'},
 {id:'generations',label:'Generaciones de IA',icon:Sparkles,permission:'ai.read'},
 {id:'runtime',label:'Operación de la beta',icon:Settings,permission:'ai.read'},
 {id:'audit',label:'Auditoría',icon:ScrollText,permission:'audit.read'},
 {id:'operators',label:'Equipo y permisos',icon:ShieldCheck,permission:'operators.manage'},
];
const pending=['Pagos y facturación','Proveedores y modelos','Prompts versionados','Currículo','Plantillas y exportación','Soporte','Comunicaciones','Analítica de producto','Infraestructura'];
const text=(v:unknown)=>v==null?'Sin datos':String(v);
const date=(v:unknown)=>v?new Date(String(v)).toLocaleString('es-PE'):'—';
const num=(v:unknown)=>v==null?'Sin datos':Number(v).toLocaleString('es-PE');
function localDateInput(value:unknown){if(!value)return '';const d=new Date(String(value));return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);}
const themePreference=()=>(window as unknown as {SpaceLabTheme?:{getPreference:()=>string}}).SpaceLabTheme?.getPreference()||'system';
function routeLabel(route:string){try{return decodeURIComponent(route);}catch{return route;}}
function Table({rows,columns}:{rows:Row[]; columns:[string,string,((v:unknown,row:Row)=>React.ReactNode)?][]}) {
 return <div className="ac-table" tabIndex={0} aria-label="Tabla de registros; desplaza para ver todas las columnas"><table><thead><tr>{columns.map(([key,label])=><th key={key}>{label}</th>)}</tr></thead><tbody>
  {rows.map((row,i)=><tr key={text(row.id||row.request_id||row.code||row.plan_code||i)}>{columns.map(([key,,render])=><td key={key}>{render?render(row[key],row):text(row[key])}</td>)}</tr>)}
  {!rows.length&&<tr><td colSpan={columns.length}>No hay registros para este filtro.</td></tr>}
 </tbody></table></div>;
}
function Field({name,label,value,type='text',min,max,required=true}:{name:string;label:string;value:unknown;type?:string;min?:number;max?:number;required?:boolean}) {
 return <label>{label}<input name={name} type={type} defaultValue={value==null?'':String(value)} min={min} max={max} required={required} minLength={name==='reason'?8:undefined} maxLength={name==='reason'?300:undefined} step={type==='number'&&name!=='dailyEstimatedUsd'?'1':type==='number'?'0.01':undefined}/></label>;
}
function Toggle({name,label,value}:{name:string;label:string;value:unknown}) {
 return <label className="ac-check"><input name={name} type="checkbox" defaultChecked={value===true}/>{label}</label>;
}
type Proposal={action:string;target:string|null;payload:Row;label:string;confirmation:string};
function App() {
 const client=getClient();
 const [access,setAccess]=useState<Context|null>(null),[gate,setGate]=useState('Comprobando acceso…');
 const [route,setRoute]=useState(location.hash.slice(1)||'overview'),[open,setOpen]=useState(false);
 const [data,setData]=useState<Row|Page|null>(null),[detail,setDetail]=useState<Row|null>(null),[plans,setPlans]=useState<Row[]>([]);
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[loading,setLoading]=useState(false),[refresh,setRefresh]=useState(0);
 const [search,setSearch]=useState(''),[offset,setOffset]=useState(0),[days,setDays]=useState('30');
 const [proposal,setProposal]=useState<Proposal|null>(null),[busy,setBusy]=useState(false),[modalError,setModalError]=useState('');
 const requestId=useRef(''),epoch=useRef(0),detailEpoch=useRef(0),account=useRef<string|null>(null);
 const can=(p:string)=>access?.permissions.includes(p)===true;
 const invalidate=()=>{epoch.current++;detailEpoch.current++;};
 useEffect(()=>{
  if(!client) {setGate('No se pudo cargar el servicio de autenticación. Recarga la página.');return;}
  let alive=true;
  async function loadAccess() {
   const ticket=++epoch.current;
   try {
    const {data:session,error:authError}=await client!.auth.getSession();
    if(!alive||ticket!==epoch.current)return;
    if(authError)throw authError;
    if(!session.session){account.current=null;setAccess(null);setGate('Inicia sesión con tu cuenta administradora para continuar.');return;}
    account.current=session.session.user.id;
    const ctx=await context(client!);
    if(!alive||ticket!==epoch.current)return;
    setAccess(ctx);setGate('');
    if(!location.hash)location.hash=sections.find(s=>ctx.permissions.includes(s.permission))?.id||'overview';
   } catch(e){if(alive&&ticket===epoch.current){setAccess(null);setGate(friendly(e));}}
  }
  void loadAccess();
  const {data:subscription}=client.auth.onAuthStateChange((_event,session)=>{
   // Never await Supabase work from inside its Auth lock.
   if(account.current!==session?.user.id){invalidate();setAccess(null);setData(null);setDetail(null);setProposal(null);account.current=session?.user.id||null;}
   setTimeout(()=>{if(alive)void loadAccess();},0);
  });
  return ()=>{alive=false;invalidate();subscription.subscription.unsubscribe();};
 },[client]);
 useEffect(()=>{const handler=()=>{invalidate();setRoute(location.hash.slice(1)||'overview');setData(null);setDetail(null);setOffset(0);setSearch('');setError('');setOpen(false);};window.addEventListener('hashchange',handler);return()=>window.removeEventListener('hashchange',handler);},[]);
 useEffect(()=>{
  if(!access||!client)return;
  const section=sections.find(s=>s.id===route);
  if(!section||!access.permissions.includes(section.permission))return;
  const ticket=++epoch.current;let alive=true;
  setLoading(true);setData(null);setError('');
  read<Row|Page>(client,route,{limit:25,offset,search,days:Number(days)}).then(result=>{
   if(alive&&ticket===epoch.current)setData(result);
  }).catch(e=>{if(alive&&ticket===epoch.current)setError(friendly(e));}).finally(()=>{if(alive&&ticket===epoch.current)setLoading(false);});
  return ()=>{alive=false;};
 },[access,client,route,offset,search,days,refresh]);
 async function showUser(id:string) {
  if(!client)return;
  const ticket=++detailEpoch.current,owner=account.current;
  setDetail(null);setError('');
  try {
   const [user,catalog]=await Promise.all([read<Row>(client,route==='credits'?'creditAccount':'user',{id}),can('plans.read')?read<Page>(client,'plans'):Promise.resolve({items:[]})]);
   if(ticket!==detailEpoch.current||owner!==account.current)return;
   setDetail(user);setPlans(catalog.items);
  } catch(e){if(ticket===detailEpoch.current&&owner===account.current)setError(friendly(e));}
 }
 function propose(event:React.FormEvent<HTMLFormElement>,action:string,target:string|null,label:string,base:Row={},confirmation='CONFIRMAR') {
  event.preventDefault();const form=new FormData(event.currentTarget),payload:Row={...base};
  for(const [key,value] of form.entries())payload[key]=String(value);
  if(payload.expiresAt)payload.expiresAt=new Date(String(payload.expiresAt)).toISOString();
  for(const input of Array.from(event.currentTarget.querySelectorAll<HTMLInputElement>('input[type=number]')))payload[input.name]=Number(input.value);
  for(const input of Array.from(event.currentTarget.querySelectorAll<HTMLInputElement>('input[type=checkbox]')))payload[input.name]=input.checked;
  requestId.current=crypto.randomUUID();setProposal({action,target,payload,label,confirmation});setModalError('');
 }
 async function commit(event:React.FormEvent<HTMLFormElement>) {
  event.preventDefault();if(!client||!proposal||busy)return;
  const owner=account.current;setBusy(true);setModalError('');
  try {
   await write(client,requestId.current,proposal.action,proposal.target,proposal.payload);
   if(owner!==account.current)return;
   setProposal(null);setNotice('Cambio guardado y registrado en auditoría.');setRefresh(v=>v+1);
   if(proposal.target&&detail?.id===proposal.target)void showUser(proposal.target);
  } catch(e){if(owner===account.current)setModalError(friendly(e));}
  finally{setBusy(false);}
 }
 const page=data as Page|null,rows=page?.items||[];
 const title=sections.find(s=>s.id===route)?.label||route;
 const protectedWrites=!access?.mfa;
 const save=(label='Revisar cambio')=><button className="ac-primary" disabled={protectedWrites} title={protectedWrites?'Verifica MFA antes de cambiar datos':undefined}>{label}</button>;
 const reason=<Field name="reason" label="Motivo del cambio (8 a 300 caracteres)" value=""/>;
 const controls=(detail?.controls||{}) as Row,subscription=(detail?.subscription||{}) as Row;
 const expired=!!controls.expires_at&&new Date(String(controls.expires_at)).getTime()<=Date.now();
 return <div className="ac-layout">
  <aside className={open?'ac-sidebar is-open':'ac-sidebar'}><a className="ac-brand" href="index.html"><img src="assets/favicon.svg" alt=""/><span>Space<span>Lab</span><small>CENTRO DE ADMINISTRACIÓN</small></span></a>
   <a className="ac-back" href="index.html#/home"><ArrowLeft size={16}/>Volver a mi espacio</a><p className="ac-overline">OPERACIÓN</p>
   <nav aria-label="Administración">{sections.filter(s=>can(s.permission)).map(s=><a key={s.id} href={'#'+s.id} aria-current={route===s.id?'page':undefined}><s.icon size={18}/>{s.label}</a>)}</nav>
   <p className="ac-overline">PRÓXIMOS MÓDULOS</p><nav aria-label="Próximos módulos">{pending.map(label=><a key={label} href={'#'+encodeURIComponent(label)}><Clock3 size={15}/>{label}<small>Pendiente</small></a>)}</nav>
   <div className="ac-sidebar-note"><ShieldCheck size={20}/><strong>Operaciones con trazabilidad</strong><span>Permisos, segundo factor y motivo para cada cambio.</span></div>
  </aside>
  <div className="ac-workspace"><header className="ac-top"><button className="ac-mobile" aria-label="Abrir menú" aria-expanded={open} onClick={()=>setOpen(!open)}><Menu size={20}/></button><span>Administración <span className="ac-muted">/ {title}</span></span><div className="ac-top-actions">
   <label className="ac-theme"><SunMoon size={17}/><select aria-label="Tema" data-theme-selector defaultValue={themePreference()} onChange={e=>(window as unknown as {SpaceLabTheme?:{setPreference:(p:string)=>void}}).SpaceLabTheme?.setPreference(e.target.value)}><option value="system">Sistema</option><option value="light">Claro</option><option value="dark">Oscuro</option></select></label>
   {access&&<button onClick={async()=>{try{const result=await client?.auth.signOut();if(result?.error)throw result.error;}catch(e){setError(friendly(e));}}}><LogOut size={16}/>Salir</button>}
  </div></header>
  <main id="admin-main"><div className="ac-heading"><div><p className="ac-eyebrow">SPACE LAB · OPERACIONES</p><h1>{access?title:'Centro de administración'}</h1><p className="ac-muted">Controla tu plataforma con datos verificables y cambios registrados.</p></div>{access&&<button onClick={()=>{setRefresh(v=>v+1);if(detail)void showUser(String(detail.id));}} disabled={loading}><RefreshCw size={16}/>Actualizar</button>}</div>
  {!access?<section className="ac-card ac-gate"><ShieldCheck size={32}/><h2>Acceso protegido</h2><p role="status">{gate}</p><a className="ac-primary" href="index.html#/home">Ir a iniciar sesión</a></section>:<>
   <Mfa client={client!} active={access.mfa} onVerified={async()=>{const owner=account.current;const ctx=await context(client!);if(owner===account.current){setAccess(ctx);setNotice('Segundo factor verificado.');}}}/>
   {notice&&<div className="ac-notice" role="status">{notice}<button aria-label="Cerrar aviso" onClick={()=>setNotice('')}>×</button></div>}
   {error&&<div className="ac-error" role="alert">{error}</div>}
   {!sections.some(s=>s.id===route&&can(s.permission))?<section className="ac-card"><p className="ac-eyebrow">NO DISPONIBLE</p><h2>{routeLabel(route)}</h2><p>Este módulo está pendiente o no está disponible para tu rol. Las operaciones disponibles están en el menú de operación, según tus permisos.</p></section>:<>
   {['overview','generations','audit'].includes(route)&&<div className="ac-toolbar"><label>Período<select value={days} onChange={e=>{setDays(e.target.value);setOffset(0);}}><option value="7">Últimos 7 días</option><option value="30">Últimos 30 días</option><option value="90">Últimos 90 días</option></select></label></div>}
   {loading&&<p role="status">Consultando datos…</p>}
   {data&&route==='overview'&&<><div className="ac-kpis">{[['Usuarios registrados','users'],['Altas en el período','registrations'],['Generaciones completadas','successful'],['Créditos consumidos','credits']].map(([label,key])=><section className="ac-card" key={key}><span className="ac-muted">{label}</span><strong>{num((data as Row)[key])}</strong><small>{key==='users'?'Total acumulado':'En el período seleccionado'}</small></section>)}</div><div className="ac-grid"><section className="ac-card"><h2>Salud de la generación</h2><dl><dt>Solicitudes registradas</dt><dd>{num((data as Row).generations)}</dd><dt>Rechazos o reembolsos</dt><dd>{num((data as Row).failed)}</dd><dt>Costo reportado por telemetría (USD)</dt><dd>{num((data as Row).reportedCostUsd)}</dd><dt>Muestras con tokens reportados</dt><dd>{num((data as Row).telemetrySamples)}</dd></dl><p className="ac-muted">La telemetría de costos no sustituye las facturas del proveedor.</p></section><section className="ac-card"><h2>Mediciones pendientes</h2><p>Usuarios activos: sin instrumentación disponible.</p><p>Ingresos: sin integración de pagos.</p><p className="ac-muted">No se calculan a partir de saldos de créditos.</p></section></div></>}
   {['users','credits'].includes(route)&&<><form className="ac-search" onSubmit={e=>{e.preventDefault();setOffset(0);setSearch(String(new FormData(e.currentTarget).get('search')||''));}}><label className="ac-sr-only" htmlFor="user-search">Buscar usuarios</label><input id="user-search" name="search" placeholder="Correo, nombre o identificador" maxLength={128}/><button><Search size={16}/>Buscar</button></form>{data&&<section className="ac-card ac-flush"><Table rows={rows} columns={route==='credits'?[['email','Usuario',(v,r)=><button className="ac-link" onClick={()=>void showUser(String(r.id))}>{text(v)}</button>],['balance','Cr?ditos disponibles']]:[
    ['email','Usuario',(v,r)=><button className="ac-link" onClick={()=>void showUser(String(r.id))}>{text(v)}</button>],['role','Rol'],['plan_code','Plan'],['balance','Créditos'],['state','Estado'],['created_at','Registro',v=>date(v)]
   ]}/></section>}{detail&&<section className="ac-card ac-user" key={String(detail.id)+refresh}><div className="ac-section-title"><div><p className="ac-eyebrow">FICHA DEL USUARIO</p><h2>{text(detail.email)}</h2><small>{text(detail.id)}</small></div><button onClick={()=>{detailEpoch.current++;setDetail(null);}}>Cerrar</button></div><div className="ac-grid">
    {can('credits.adjust')&&<form onSubmit={e=>propose(e,'credits.adjust',String(detail.id),'Ajustar créditos',{expectedBalance:detail.balance},String(detail.email))}><h3><Coins size={18}/>Ajustar créditos</h3><p>Saldo actual: <strong>{num(detail.balance)}</strong>. Un valor negativo retira créditos disponibles.</p><Field name="delta" label="Cantidad a añadir o retirar" value="" type="number" min={-100000} max={100000}/>{reason}{save()}</form>}
    {route==='users'&&can('users.restrict')&&<form onSubmit={e=>propose(e,'users.restrict',String(detail.id),'Cambiar acceso',{version:controls.version},String(detail.email))}><h3>Acceso y restricciones</h3><label>Estado<select name="state" defaultValue={String(expired?'active':controls.state||'active')}><option value="active">Activo</option><option value="suspended">Suspendido</option><option value="blocked">Bloqueado</option></select></label><Toggle name="restrictAi" label="Restringir IA" value={!expired&&controls.restrict_ai}/><Toggle name="freezeCredits" label="Congelar uso de créditos" value={!expired&&controls.freeze_credits}/><Field name="expiresAt" label="Caducidad (opcional)" type="datetime-local" value={expired?'':localDateInput(controls.expires_at)} required={false}/>{reason}<small>Sin caducidad, la restricción continúa hasta que la retires. El servidor protege al propietario.</small>{save()}</form>}
    {route==='users'&&can('plans.assign')&&<form onSubmit={e=>propose(e,'plans.assign',String(detail.id),'Asignar plan manual',{expectedUpdatedAt:subscription.updated_at||null},String(detail.email))}><h3>Asignación manual de plan</h3><label>Plan<select name="planCode" defaultValue={String(subscription.plan_code||'free')}>{plans.filter(p=>p.active).map(p=><option key={String(p.code)} value={String(p.code)}>{text(p.name)}</option>)}</select></label><Field name="expiresAt" label="Fin del período (opcional)" type="datetime-local" value={localDateInput(subscription.current_period_end)} required={false}/>{reason}<small>Respeta los grants y reglas existentes. Las suscripciones de pasarela se gestionan en su proveedor.</small>{save()}</form>}
   </div><h3>Últimos movimientos de créditos</h3><Table rows={(detail.ledger||[]) as Row[]} columns={[
    ['created_at','Fecha',v=>date(v)],['event_type','Movimiento'],['credits_delta','Variación'],['balance_after','Saldo'],['reason','Motivo']
   ]}/></section>}</>}
   {data&&route==='plans'&&<><section className="ac-card ac-flush"><Table rows={rows} columns={[
    ['name','Plan'],['code','Código'],['price_minor','Precio',(v,r)=>`${Number(v)/100} ${text(r.currency)} / ${text(r.billing_period)}`],['active','Activo',v=>v?'Sí':'No'],['is_public','Público',v=>v?'Sí':'No']
   ]}/></section><Quotas client={client!} canWrite={can('quotas.write')&&!protectedWrites} refresh={refresh} propose={propose}/></>}
   {data&&route==='generations'&&<section className="ac-card ac-flush"><Table rows={rows} columns={[
    ['created_at','Fecha',v=>date(v)],['user_id','Usuario'],['action','Acción'],['provider','Proveedor'],['model','Modelo'],['credits','Créditos'],['status','Estado'],['latency_ms','Latencia ms'],['error_code','Error']
   ]}/><p className="ac-muted ac-pad">Solo metadatos operativos. No se consultan prompts ni contenido de los documentos.</p></section>}
   {data&&route==='audit'&&<section className="ac-card ac-flush"><Table rows={rows} columns={[
    ['created_at','Fecha',v=>date(v)],['actor','Operador'],['action','Acción'],['target','Destino'],['reason','Motivo'],['changes','Resultado',v=><details><summary>Ver cambios</summary><pre>{JSON.stringify(v,null,2)}</pre></details>]
   ]}/></section>}
   {data&&route==='runtime'&&<section className="ac-card" key={refresh}><h2>Controles operativos</h2><p className="ac-muted">Los límites del despliegue también se aplican. Activar la IA aquí no habilita un proveedor desactivado en el servidor. Una pausa no cancela generaciones ya iniciadas ni bloquea la edición local.</p><form onSubmit={e=>propose(e,'runtime.update',null,'Actualizar operación de beta',{version:(data as Row).version})}><div className="ac-grid">
    <div><h3>Disponibilidad</h3><Toggle name="aiEnabled" label="Permitir nuevas generaciones de IA" value={(data as Row).aiEnabled}/><Toggle name="signupsEnabled" label="Permitir nuevos registros" value={(data as Row).signupsEnabled}/><Field name="message" label="Nota operativa interna" value={(data as Row).message} required={false}/></div>
    <div><h3>Presupuesto y concurrencia</h3><Field name="dailyCredits" label="Créditos globales por día" type="number" value={(data as Row).dailyCredits} min={1} max={100000}/><Field name="dailyEstimatedUsd" label="Presupuesto diario estimado (USD)" type="number" value={(data as Row).dailyEstimatedUsd} min={0.01} max={1000}/><Field name="maxConcurrent" label="Generaciones simultáneas" type="number" value={(data as Row).maxConcurrent} min={1} max={50}/></div>
    <div><h3>Registros de beta</h3><Field name="signupsPerHour" label="Por hora" type="number" value={(data as Row).signupsPerHour} min={1} max={10000}/><Field name="signupsPerDay" label="Por día" type="number" value={(data as Row).signupsPerDay} min={1} max={100000}/><Field name="signupsPerIpHour" label="Por IP y hora" type="number" value={(data as Row).signupsPerIpHour} min={1} max={1000}/></div></div>{reason}{can('ai.configure')&&save()}</form></section>}
   {data&&route==='operators'&&<section className="ac-card"><h2>Operadores delegados</h2><p>Estos roles son de consulta. El propietario se configura por un procedimiento privilegiado y no se promueve desde el perfil.</p><Table rows={rows} columns={[
    ['user_id','Usuario'],['role','Rol'],['expires_at','Caducidad',v=>date(v)]
   ]}/><form onSubmit={e=>{const id=String(new FormData(e.currentTarget).get('target'));const copy=new FormData(e.currentTarget);copy.delete('target');const payload:Row=Object.fromEntries(copy);if(payload.expiresAt)payload.expiresAt=new Date(String(payload.expiresAt)).toISOString();requestId.current=crypto.randomUUID();e.preventDefault();setModalError('');setProposal({action:'operators.assign',target:id,payload:{...payload,remove:copy.get('remove')==='on'},label:'Actualizar operador',confirmation:id});}}><Field name="target" label="UUID del usuario" value=""/><label>Rol<select name="role"><option value="support">Soporte</option><option value="finance">Finanzas</option><option value="analyst">Analista</option><option value="auditor">Auditor</option></select></label><Field name="expiresAt" label="Caducidad opcional" value="" type="datetime-local" required={false}/><Toggle name="remove" label="Retirar este rol" value={false}/>{reason}{save()}</form></section>}
   {data&&['users','credits','generations','audit'].includes(route)&&<div className="ac-pagination"><span>{page?.total||0} registros · página {offset/25+1}</span><button disabled={offset===0||loading} onClick={()=>setOffset(v=>Math.max(0,v-25))}>Anterior</button><button disabled={loading||offset+25>=(page?.total||0)} onClick={()=>setOffset(v=>v+25)}>Siguiente</button></div>}
   </>}
  </>}
  </main><footer className="ac-footer">Space Lab · Centro de administración · Los módulos pendientes no ejecutan operaciones.</footer></div>
  {proposal&&<Confirmation proposal={proposal} busy={busy} error={modalError} submit={commit} cancel={()=>{if(!busy)setProposal(null);}}/>}
 </div>;
}

function Confirmation({proposal,busy,error,submit,cancel}:{proposal:Proposal;busy:boolean;error:string;submit:(e:React.FormEvent<HTMLFormElement>)=>void;cancel:()=>void}) {
 const ref=useRef<HTMLDialogElement>(null),[confirmed,setConfirmed]=useState('');
 useEffect(()=>{const dialog=ref.current;dialog?.showModal();return()=>dialog?.close();},[]);
 return <dialog ref={ref} className="ac-dialog" onCancel={e=>{e.preventDefault();cancel();}}><form onSubmit={submit}><p className="ac-eyebrow">CONFIRMAR OPERACIÓN</p><h2>{proposal.label}</h2><p>Revisa el destino y los valores. Se registrará el motivo junto con tu cuenta.</p><pre>{JSON.stringify({destino:proposal.target,...proposal.payload},null,2)}</pre><label>Escribe <strong>{proposal.confirmation}</strong> para confirmar<input value={confirmed} onChange={e=>setConfirmed(e.target.value)} autoComplete="off" autoFocus disabled={busy}/></label>{error&&<p className="ac-error" role="alert">{error}</p>}<div className="ac-actions"><button type="button" disabled={busy} onClick={cancel}>Cancelar</button><button className="ac-primary" disabled={busy||confirmed!==proposal.confirmation}>{busy?'Guardando…':'Confirmar cambio'}</button></div></form></dialog>;
}
function Mfa({client,active,onVerified}:{client:AdminClient;active:boolean;onVerified:()=>Promise<void>}) {
 const [factor,setFactor]=useState(''),[qr,setQr]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[expanded,setExpanded]=useState(false);
 const mounted=useRef(true);
 useEffect(()=>()=>{mounted.current=false;},[]);
 async function begin() {
  setBusy(true);setError('');setExpanded(true);
  try {const result=await client.auth.mfa.listFactors();if(!mounted.current)return;if(result.error)throw result.error;
   const existing=result.data.totp.find(f=>f.status==='verified');
   if(existing){setFactor(existing.id);setQr('');}
   else {
    // Reuse this page's pending enrollment; explicitly remove stale unverified
    // admin enrollments so retry does not exhaust the account's factor limit.
    if(factor&&qr)return;
    for(const stale of result.data.totp.filter(f=>f.status==='unverified'&&f.friendly_name==='Space Lab Admin')) {
     if(!mounted.current)return;const removed=await client.auth.mfa.unenroll({factorId:stale.id});if(!mounted.current)return;if(removed.error)throw removed.error;
    }
    const enrolled=await client.auth.mfa.enroll({factorType:'totp',friendlyName:'Space Lab Admin'});if(!mounted.current)return;if(enrolled.error)throw enrolled.error;
    setFactor(enrolled.data.id);setQr(enrolled.data.totp.qr_code);
   }
  }catch(e){if(mounted.current)setError(friendly(e));}finally{if(mounted.current)setBusy(false);}
 }
 async function verify(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError('');
  try{const code=String(new FormData(e.currentTarget).get('code'));const result=await client.auth.mfa.challengeAndVerify({factorId:factor,code});if(!mounted.current)return;if(result.error)throw result.error;setQr('');setFactor('');setExpanded(false);await onVerified();}
  catch(e){if(mounted.current)setError(friendly(e));}finally{if(mounted.current)setBusy(false);}
 }
 return <section className={'ac-mfa '+(active?'verified':'')}><div><ShieldCheck size={20}/><span><strong>{active?'Segundo factor verificado':'Las consultas están disponibles; los cambios requieren MFA'}</strong><small>{active?'Las operaciones siguen sujetas a tus permisos.':'Usa una aplicación autenticadora para autorizar operaciones administrativas.'}</small></span></div>{!active&&<button disabled={busy} onClick={()=>void begin()}>Verificar segundo factor</button>}
  {!active&&expanded&&<form onSubmit={verify}>{qr&&<><p>Escanea este QR en tu aplicación autenticadora. No lo compartas.</p><img className="ac-qr" src={qr.startsWith('data:')?qr:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(qr)} alt="QR de tu segundo factor"/></>}{factor&&<><label>Código de 6 dígitos<input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" required/></label><button disabled={busy}>Verificar código</button></>}{error&&<p role="alert" className="ac-error">{error}</p>}</form>}
 </section>;
}
function Quotas({client,canWrite,refresh,propose}:{client:AdminClient;canWrite:boolean;refresh:number;propose:(e:React.FormEvent<HTMLFormElement>,action:string,target:string|null,label:string,base:Row)=>void}) {
 const [rows,setRows]=useState<Row[]>([]),[error,setError]=useState('');
 useEffect(()=>{let alive=true;setRows([]);setError('');read<Page>(client,'quotas').then(p=>{if(alive)setRows(p.items);}).catch(e=>{if(alive)setError(friendly(e));});return()=>{alive=false;};},[client,refresh]);
 return <section className="ac-card"><h2>Cuotas de IA por plan</h2><p>Los cambios se aplican a nuevas reservas. También se mantienen los límites globales del servidor.</p>{error&&<p role="alert">{error}</p>}<div className="ac-grid">{rows.map(row=><form key={String(row.plan_code)+refresh} onSubmit={e=>propose(e,'quotas.update',null,'Cambiar cuota de '+text(row.plan_code),{planCode:row.plan_code,expectedUpdatedAt:row.updated_at})}><h3>{text(row.plan_code)}</h3><Field name="requestsPerMinute" label="Solicitudes por minuto" value={row.requests_per_minute} type="number" min={1} max={1000}/><Field name="dailyCredits" label="Créditos diarios" value={row.daily_credit_limit} type="number" min={1} max={10000}/><Field name="maxConcurrent" label="Generaciones simultáneas" value={row.max_concurrent_requests} type="number" min={1} max={20}/><Field name="reason" label="Motivo del cambio" value=""/><button className="ac-primary" disabled={!canWrite}>Revisar cuota</button></form>)}</div></section>;
}
createRoot(document.getElementById('admin-root')!).render(<App/>);
