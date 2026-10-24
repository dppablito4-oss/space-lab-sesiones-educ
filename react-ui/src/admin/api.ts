export type Row = Record<string, unknown>;
export type Page = {items:Row[]; total:number; limit:number; offset:number};
export type Context = {userId:string; permissions:string[]; mfa:boolean; version:number};
type Reply<T> = {data:T; error:{message:string; code?:string}|null};
type Factor = {id:string; status:string; friendly_name?:string};
export interface AdminClient {
 rpc<T>(name:string,args?:Row):PromiseLike<Reply<T>>;
 auth:{
  getSession():Promise<Reply<{session:{user:{id:string}}|null}>>;
  signOut():Promise<{error:unknown}>;
  onAuthStateChange(callback:(event:string,session:{user:{id:string}}|null)=>void):{data:{subscription:{unsubscribe():void}}};
  mfa:{
   listFactors():Promise<Reply<{totp:Factor[]}>>;
   enroll(options:{factorType:'totp'; friendlyName:string}):Promise<Reply<{id:string; totp:{qr_code:string}}>>;
   unenroll(options:{factorId:string}):Promise<Reply<unknown>>;
   challengeAndVerify(options:{factorId:string;code:string}):Promise<Reply<unknown>>;
  };
 };
}
export function getClient():AdminClient|null {
 return (window as unknown as {SupabaseClient?:{client:AdminClient}}).SupabaseClient?.client||null;
}
const messages:Record<string,string>={
 ADMIN_PERMISSION_DENIED:'Tu cuenta no tiene permiso para esta operación.',MFA_REQUIRED:'Verifica tu segundo factor antes de guardar.',
 STALE_BALANCE:'El saldo cambió. Actualiza los datos antes de confirmar otro ajuste.',STALE_CONTROL:'La restricción cambió. Actualiza antes de guardar.',
 STALE_CONFIG:'La configuración cambió. Actualiza antes de guardar.',STALE_QUOTA:'La cuota cambió. Actualiza antes de guardar.',
 STALE_SUBSCRIPTION:'La suscripción cambió. Actualiza antes de guardar.',PROTECTED_OWNER:'No se puede restringir al propietario ni a tu propia cuenta.',
 PROTECTED_OPERATOR:'Solo el propietario puede restringir a otro administrador.',PAYMENT_PROVIDER_MANAGED:'Este plan lo gestiona la pasarela de pagos.',
 IDEMPOTENCY_CONFLICT:'El identificador ya pertenece a otra operación. Actualiza los datos.'
};
export function friendly(error:unknown):string {
 const e=error as {message?:string;code?:string};
 const message=e?.message||'No se pudo completar la solicitud. Puedes reintentar.';
 if(e?.code==='PGRST202'||message.includes('Could not find the function')) return 'El centro necesita su migración de base de datos. Todavía no está instalado en este entorno.';
 return Object.entries(messages).find(([code])=>message.includes(code))?.[1]||message;
}
async function call<T>(client:AdminClient,name:string,args:Row={}):Promise<T> {
 const {data,error}=await client.rpc<T>(name,args);
 if(error) throw error;
 return data;
}
export const context=(client:AdminClient)=>call<Context>(client,'admin_cc_context');
export const read=<T=Page>(client:AdminClient,resource:string,query:Row={})=>call<T>(client,'admin_cc_read',{p_resource:resource,p_query:query});
export const write=(client:AdminClient,id:string,action:string,target:string|null,payload:Row)=>call<Row>(client,'admin_cc_write',{
 p_request_id:id,p_action:action,p_target:target,p_payload:payload
});
