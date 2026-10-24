import {PGlite} from '@electric-sql/pglite';
import {readFile,readdir} from 'node:fs/promises';
export async function createDatabase() {
const db = new PGlite();
await db.exec(`
 SET TIME ZONE 'UTC';
 CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
 CREATE ROLE supabase_auth_admin;
 CREATE SCHEMA auth; CREATE SCHEMA storage;
 GRANT USAGE ON SCHEMA public,auth,storage TO anon,authenticated,service_role,supabase_auth_admin;
 CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,raw_user_meta_data jsonb DEFAULT '{}',
  raw_app_meta_data jsonb DEFAULT '{}',created_at timestamptz DEFAULT now(),last_sign_in_at timestamptz);
 CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS
 $$ SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT (auth.jwt()->>'sub')::uuid $$;
 CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT auth.jwt()->>'role' $$;
 CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 CREATE TABLE storage.objects(id uuid PRIMARY KEY,bucket_id text,name text,owner uuid);
 ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
 CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql AS $$ SELECT string_to_array($1,'/') $$;
 CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger LANGUAGE plpgsql AS $$ BEGIN RETURN; END $$;
 ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT,INSERT,UPDATE,DELETE ON TABLES TO authenticated,service_role;
`);
await db.exec(await readFile(new URL('../../database_setup.sql',import.meta.url),'utf8'));
for (const file of (await readdir(new URL('../../supabase/migrations/',import.meta.url))).sort()) {
 if (!file.endsWith('.sql') || file<'202609260001' || file.includes('backup_reader')) continue;
 try { await db.exec(await readFile(new URL('../../supabase/migrations/'+file,import.meta.url),'utf8')); }
 catch(e) { console.error('Migration failed:',file,e.message); throw e; }
}
const ids={owner:'00000000-0000-4000-8000-000000000001',admin:'00000000-0000-4000-8000-000000000002',user:'00000000-0000-4000-8000-000000000003',support:'00000000-0000-4000-8000-000000000004'};
for(const [name,id] of Object.entries(ids)) await db.query('INSERT INTO auth.users(id,email) VALUES($1,$2)',[id,`${name}@example.test`]);
await db.query("UPDATE public.profiles SET role='superadmin' WHERE id=$1",[ids.owner]);
await db.query("UPDATE public.profiles SET role='admin' WHERE id=$1",[ids.admin]);

return {db,ids};
}
