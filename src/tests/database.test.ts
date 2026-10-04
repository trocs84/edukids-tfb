import test from 'node:test';import assert from 'node:assert/strict';import {PGlite} from '@electric-sql/pglite';import {initialize} from '../lib/local-db';import {makeItems} from '../lib/games';
test('migraciones, RLS, permisos y finalización idempotente',async()=>{
 const db=await initialize(await PGlite.create());
 const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
 await db.query("insert into auth.users(id,email,encrypted_password) values($1,'a@demo.test','x'),($2,'b@demo.test','x')",[a,b]);
 const own=async<T=Record<string,unknown>>(uid:string,sql:string,values:unknown[]=[])=>db.transaction(async tx=>{await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[uid]);await tx.exec('set local role authenticated');return (await tx.query<T>(sql,values)).rows;});
 const [{id:pid}]=await own<{id:string}>(a,"insert into public.child_profiles(adult_id,alias,avatar,age_band) values($1,'Prueba','star','6-8') returning id",[a]);
 assert.equal((await own(b,'select * from public.child_profiles')).length,0);
 await assert.rejects(()=>own(b,"insert into public.profile_activity values($1,'catch',true,1)",[pid]));
 await assert.rejects(()=>own(a,'update public.child_profiles set adult_id=$1 where id=$2',[b,pid]));
 await assert.rejects(()=>own(b,"select public.start_play($1,'catch')",[pid]));
 await own(a,"insert into public.profile_activity values($1,'memory',false,1)",[pid]);await assert.rejects(()=>own(a,"select public.start_play($1,'memory')",[pid]));
 const [{s}]=await own<{s:{id:string}}>(a,"select public.start_play($1,'catch') s",[pid]);
 await assert.rejects(()=>own(a,"select public.finish_play($1,'completed')",[s.id]));
 await assert.rejects(()=>own(b,"select public.finish_play($1,'interrupted')",[s.id]));
 for(const item of makeItems('catch',1)){const p=[s.id,item.id,JSON.stringify(item.solution),false,400,0,1];await own(a,'select public.record_answer($1,$2,$3,$4,$5,$6,$7)',p);await own(a,'select public.record_answer($1,$2,$3,$4,$5,$6,$7)',p);}
 assert.equal((await own(a,'select * from public.responses')).length,5);assert.equal((await own(b,'select * from public.responses')).length,0);
 await own(a,"select public.finish_play($1,'completed')",[s.id]);const replay=await own<{r:{replayed:boolean}}>(a,"select public.finish_play($1,'completed') r",[s.id]);assert.equal(replay[0].r.replayed,true);
 await assert.rejects(()=>own(a,"insert into public.responses(session_id,item_id,answer,correct,hint_used,latency_ms,attempt_no) values($1,'catch-1-1','[4]',true,false,1,1)",[s.id]));
 await db.close();
});
