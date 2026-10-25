import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {bootstrap,initialize} from '../lib/local-db';

test('la migración de franjas conserva perfiles creados antes de octubre',async()=>{
 const db=await PGlite.create();
 try{
  await db.exec(bootstrap);
  const dir=join(process.cwd(),'supabase','migrations');
  const previous=(await readdir(dir)).filter(f=>f.endsWith('.sql')&&f<'20261004000000_update_age_bands.sql').sort();
  for(const file of previous){
   await db.exec(await readFile(join(dir,file),'utf8'));
   await db.query('insert into local_meta.migrations(name) values($1)',[file]);
  }
  const user='11111111-1111-4111-8111-111111111111';
  await db.query("insert into auth.users(id,email,encrypted_password) values($1,'old@demo.test','x')",[user]);
  await db.query("insert into public.child_profiles(adult_id,alias,avatar,age_band) values($1,'Perfil antiguo','star','6-8')",[user]);
  await initialize(db);
  const rows=await db.query<{age_band:string}>("select age_band from public.child_profiles where alias='Perfil antiguo'");
  assert.equal(rows.rows[0]?.age_band,'7-8');
  assert.equal((await db.query('select name from local_meta.migrations')).rows.length,4);
  await assert.rejects(()=>db.query("insert into public.child_profiles(adult_id,alias,avatar,age_band) values($1,'Franja vieja','star','6-8')",[user]));
 }finally{await db.close();}
});
