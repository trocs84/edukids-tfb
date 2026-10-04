import {PGlite} from '@electric-sql/pglite';
import {mkdir,readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
const globalDb=globalThis as unknown as {edukidsDb?:Promise<PGlite>};
export const bootstrap=`CREATE SCHEMA IF NOT EXISTS auth;
DO $$ BEGIN CREATE ROLE anon NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE authenticated NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS auth.users(id uuid primary key default gen_random_uuid(),email text unique not null,encrypted_password text not null);
CREATE TABLE IF NOT EXISTS auth.local_sessions(token_hash text primary key,user_id uuid references auth.users(id) on delete cascade,expires_at timestamptz not null);
CREATE TABLE IF NOT EXISTS auth.login_attempts(email text primary key,failures int not null default 0,blocked_until timestamptz);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
GRANT USAGE ON SCHEMA auth TO authenticated; GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
CREATE SCHEMA IF NOT EXISTS local_meta;CREATE TABLE IF NOT EXISTS local_meta.migrations(name text primary key, applied_at timestamptz default now());`;
export async function initialize(db:PGlite){await db.exec(bootstrap);const dir=join(process.cwd(),'supabase','migrations');for(const file of (await readdir(dir)).filter(f=>f.endsWith('.sql')).sort()){const applied=await db.query('select name from local_meta.migrations where name=$1',[file]);if(!applied.rows.length)await db.transaction(async tx=>{await tx.exec(await readFile(join(dir,file),'utf8'));await tx.query('insert into local_meta.migrations(name) values($1)',[file]);});}return db;}
export async function localDb(){if(!globalDb.edukidsDb)globalDb.edukidsDb=(async()=>{const dir=join(process.cwd(),'.data','postgres');await mkdir(dir,{recursive:true});return initialize(await PGlite.create(dir));})();return globalDb.edukidsDb;}
export async function asUser<T>(userId:string,sql:string,values:unknown[]=[]):Promise<T[]>{const db=await localDb();return db.transaction(async tx=>{await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[userId]);await tx.exec('SET LOCAL ROLE authenticated');const result=await tx.query<T>(sql,values);return result.rows;});}
