// Test-only HTTP adapter to real PGlite PostgreSQL. Never included in a bundle.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname,sep} from 'node:path';
import {createDatabase} from './admin-db.mjs';
const {db,ids}=await createDatabase();
const root=fileURLToPath(new URL('../../',import.meta.url));
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
let queue=Promise.resolve();
const server=createServer(async(req,res)=>{
 try {
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/__rpc'&&req.method==='POST') {
   let body='';for await(const part of req)body+=part;if(body.length>16384)throw Error('Request too large');
   const input=JSON.parse(body);let response;
   await (queue=queue.then(async()=>{
    try {
     await db.exec('RESET ROLE');
     const actor=ids[input.actor]||ids.admin;
     await db.query("SELECT set_config('request.jwt.claims',$1,false)",[JSON.stringify({role:'authenticated',sub:actor,aal:input.aal==='aal2'?'aal2':'aal1'})]);
     await db.exec('SET ROLE authenticated');
     const args=input.args||{};
     const signatures={admin_cc_context:[],admin_cc_read:['p_resource','p_query'],admin_cc_write:['p_request_id','p_action','p_target','p_payload']};
     const names=signatures[input.name];if(!names)throw Error('Unknown RPC');
     const result=await db.query(`SELECT public.${input.name}(${names.map((_,i)=>'$'+(i+1)).join(',')}) AS data`,names.map(n=>args[n]));
     response={data:result.rows[0].data,error:null};
    } catch(e){response={data:null,error:{message:e.message,code:e.code}};}
   }));
   res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(response));return;
  }
  const path=resolve(root,'.'+decodeURIComponent(url.pathname));
  if(!path.startsWith(resolve(root)+sep)||!types[extname(path)]) {res.writeHead(404);res.end();return;}
  const data=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)]});res.end(data);
 } catch {res.writeHead(500);res.end('Test server error');}
});
server.listen(0,'127.0.0.1',()=>process.stdout.write(JSON.stringify({port:server.address().port,ids})+'\n'));
