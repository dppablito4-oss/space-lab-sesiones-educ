import assert from 'node:assert/strict';
import {createDatabase} from './helpers/admin-db.mjs';
const {db,ids}=await createDatabase();
async function as(user) {
 await db.exec('RESET ROLE');
 await db.query("SELECT set_config('request.jwt.claims',$1,false)",[JSON.stringify({role:'authenticated',sub:ids[user],aal:'aal2'})]);
 await db.exec('SET ROLE authenticated');
}
async function state(value,expires=null) {
 await db.exec('RESET ROLE');
 await db.query(`INSERT INTO private.admin_account_controls(user_id,state,expires_at,reason,updated_by)
 VALUES($1,$2,$3,'Storage security regression',$4) ON CONFLICT(user_id) DO UPDATE SET state=$2,expires_at=$3`,[ids.user,value,expires,ids.owner]);
 await as('user');
}
const id='70000000-0000-4000-8000-000000000001';
const insert=()=>db.query("INSERT INTO storage.objects(id,bucket_id,name,owner) VALUES($1,'logos',$2,$3)",[id,ids.user+'/logo.png',ids.user]);
await as('user'); await insert();
assert.equal((await db.query('SELECT * FROM storage.objects')).rows.length,1);
await as('support');
assert.equal((await db.query('SELECT * FROM storage.objects')).rows.length,0);
await assert.rejects(()=>db.query("INSERT INTO storage.objects(id,bucket_id,name,owner) VALUES(gen_random_uuid(),'logos',$1,$2)",[ids.user+'/other.png',ids.user]),/row-level security/);
for (const restriction of ['blocked','suspended']) {
 await state(restriction);
 assert.equal((await db.query('SELECT public.account_is_active() AS active')).rows[0].active,false);
 assert.equal((await db.query('SELECT * FROM storage.objects')).rows.length,0);
 assert.equal((await db.query('UPDATE storage.objects SET name=name RETURNING id')).rows.length,0);
 assert.equal((await db.query('DELETE FROM storage.objects RETURNING id')).rows.length,0);
 await assert.rejects(()=>db.query("INSERT INTO storage.objects(id,bucket_id,name,owner) VALUES(gen_random_uuid(),'logos',$1,$2)",[ids.user+'/blocked.png',ids.user]),/row-level security/);
}
await state('blocked','2020-01-01T00:00:00Z');
assert.equal((await db.query('SELECT * FROM storage.objects')).rows.length,1,'Expired restrictions restore access');
await state('active');
assert.equal((await db.query("UPDATE storage.objects SET name=$1 WHERE id=$2 RETURNING id",[ids.user+'/restored.png',id])).rows.length,1);
assert.equal((await db.query('DELETE FROM storage.objects WHERE id=$1 RETURNING id',[id])).rows.length,1);
await db.close();
console.log('storage-account-controls.test.mjs: active, suspended, blocked, expired and ownership policies passed.');
