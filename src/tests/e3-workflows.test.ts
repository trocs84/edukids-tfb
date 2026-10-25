import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {initialize} from '../lib/local-db';
import {games,makeItems} from '../lib/games';

const adultA='11111111-1111-4111-8111-111111111111';
const adultB='22222222-2222-4222-8222-222222222222';

async function fixture(){
 const db=await initialize(await PGlite.create());
 await db.query("insert into auth.users(id,email,encrypted_password) values($1,'a@demo.test','x'),($2,'b@demo.test','x')",[adultA,adultB]);
 async function as<T=Record<string,unknown>>(uid:string,sql:string,values:unknown[]=[]){
  return db.transaction(async tx=>{
   await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[uid]);
   await tx.exec('set local role authenticated');
   return (await tx.query<T>(sql,values)).rows;
  });
 }
 const [{id:childA}]=await as<{id:string}>(adultA,"insert into public.child_profiles(adult_id,alias,avatar,age_band) values($1,'A','star','7-8') returning id",[adultA]);
 const [{id:childA2}]=await as<{id:string}>(adultA,"insert into public.child_profiles(adult_id,alias,avatar,age_band) values($1,'A2','circle','9-10') returning id",[adultA]);
 const [{id:childB}]=await as<{id:string}>(adultB,"insert into public.child_profiles(adult_id,alias,avatar,age_band) values($1,'B','triangle','5-6') returning id",[adultB]);
 return {db,as,childA,childA2,childB};
}

test('los tres juegos completan y guardan sus tres niveles sin mezclar perfiles',async()=>{
 const {db,as,childA,childA2}=await fixture();
 try{
  for(const game of games){
   for(const level of [1,2,3]){
    await as(adultA,'insert into public.profile_activity(profile_id,activity_id,enabled,level) values($1,$2,true,$3) on conflict(profile_id,activity_id) do update set level=excluded.level',[childA,game.id,level]);
    const [{session}]=await as<{session:{id:string;level:number}}>(adultA,'select public.start_play($1,$2) session',[childA,game.id]);
    assert.equal(session.level,level);
    for(const item of makeItems(game.id,level)){
     const [{saved}]=await as<{saved:{correct:boolean}}>(adultA,'select public.record_answer($1,$2,$3,$4,$5,$6,$7) saved',[session.id,item.id,JSON.stringify(item.solution),false,500,0,1]);
     assert.equal(saved.correct,true,`${game.id} nivel ${level}, ${item.id}`);
    }
    const [{finished}]=await as<{finished:{status:string}}>(adultA,"select public.finish_play($1,'completed') finished",[session.id]);
    assert.equal(finished.status,'completed');
   }
  }
  assert.equal((await as(adultA,'select id from public.play_sessions where profile_id=$1',[childA])).length,9);
  assert.equal((await as(adultA,'select id from public.responses')).length,45);
  assert.equal((await as(adultA,'select id from public.play_sessions where profile_id=$1',[childA2])).length,0);
  assert.equal((await as(adultB,'select id from public.play_sessions')).length,0);
 }finally{await db.close();}
});

test('familias distintas no leen ni escriben sesiones ajenas',async()=>{
 const {db,as,childA,childB}=await fixture();
 try{
  const [{session}]=await as<{session:{id:string}}>(adultA,"select public.start_play($1,'catch') session",[childA]);
  assert.equal((await as(adultB,'select id from public.play_sessions')).length,0);
  await assert.rejects(()=>as(adultB,'select public.record_answer($1,$2,$3,$4,$5,$6,$7)',[session.id,'catch-1-1','[4]',false,100,0,1]));
  await assert.rejects(()=>as(adultB,"select public.finish_play($1,'interrupted')",[session.id]));
  await assert.rejects(()=>as(adultA,"select public.start_play($1,'catch')",[childB]));
  assert.equal((await as(adultA,'select id from public.play_sessions')).length,1);
 }finally{await db.close();}
});

test('un juego deshabilitado no arranca y una sesión interrumpida no admite respuestas',async()=>{
 const {db,as,childA}=await fixture();
 try{
  await as(adultA,"insert into public.profile_activity(profile_id,activity_id,enabled,level) values($1,'memory',false,2)",[childA]);
  await assert.rejects(()=>as(adultA,"select public.start_play($1,'memory')",[childA]));
  const [{session}]=await as<{session:{id:string}}>(adultA,"select public.start_play($1,'race') session",[childA]);
  await as(adultA,"select public.finish_play($1,'interrupted')",[session.id]);
  const item=makeItems('race',1)[0];
  await assert.rejects(()=>as(adultA,'select public.record_answer($1,$2,$3,$4,$5,$6,$7)',[session.id,item.id,JSON.stringify(item.solution),false,100,0,1]));
 }finally{await db.close();}
});
