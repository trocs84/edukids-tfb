import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {initialize} from '../lib/local-db';
import {makeItems} from '../lib/games';
import {isSmileyValue, smileyScale} from '../lib/smileyometer';

const adultA = '11111111-1111-4111-8111-111111111111';
const adultB = '22222222-2222-4222-8222-222222222222';

async function fixture() {
 const db = await initialize(await PGlite.create());
 await db.query("insert into auth.users(id,email,encrypted_password) values($1,'a@demo.test','x'),($2,'b@demo.test','x')", [adultA, adultB]);
 async function as<T = Record<string, unknown>>(uid: string, sql: string, values: unknown[] = []) {
  return db.transaction(async tx => {
   await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [uid]);
   await tx.exec('set local role authenticated');
   return (await tx.query<T>(sql, values)).rows;
  });
 }
 const [{id: child}] = await as<{id: string}>(adultA, "insert into public.child_profiles(adult_id,alias,avatar,age_band) values($1,'A','star','7-8') returning id", [adultA]);
 // Parte una actividad de "Atrapa el número"; si completed es true, responde bien los 5 retos y la termina.
 async function session(completed: boolean) {
  const [{s}] = await as<{s: {id: string}}>(adultA, "select public.start_play($1,'catch') s", [child]);
  if (completed) {
   for (const item of makeItems('catch', 1)) {
    await as(adultA, 'select public.record_answer($1,$2,$3,$4,$5,$6,$7)', [s.id, item.id, JSON.stringify(item.solution), false, 500, 0, 1]);
   }
   await as(adultA, "select public.finish_play($1,'completed')", [s.id]);
  }
  return s.id;
 }
 const rating = async (id: string) => (await db.query<{fun_rating: number | null}>('select fun_rating from public.play_sessions where id=$1', [id])).rows[0].fun_rating;
 return {db, as, session, rating};
}

test('la escala tiene cinco caras ordenadas y solo acepta enteros del 1 al 5', () => {
 assert.deepEqual(smileyScale.map(o => o.value), [1, 2, 3, 4, 5]);
 assert.equal(new Set(smileyScale.map(o => o.label)).size, 5);
 for (const ok of [1, 2, 3, 4, 5]) assert.equal(isSmileyValue(ok), true, String(ok));
 for (const bad of [0, 6, -1, 2.5, NaN, '3', null, undefined, true, [3]]) assert.equal(isSmileyValue(bad), false, String(bad));
});

test('una actividad terminada guarda su valoración y repetir el mismo envío no falla', async () => {
 const {db, as, session, rating} = await fixture();
 try {
  const id = await session(true);
  assert.equal(await rating(id), null);
  const [{r}] = await as<{r: {rating: number; replayed: boolean}}>(adultA, 'select public.rate_play($1,$2) r', [id, 4]);
  assert.deepEqual(r, {id, rating: 4, replayed: false});
  assert.equal(await rating(id), 4);
  const [{again}] = await as<{again: {replayed: boolean}}>(adultA, 'select public.rate_play($1,$2) again', [id, 4]);
  assert.equal(again.replayed, true);
  await assert.rejects(() => as(adultA, 'select public.rate_play($1,$2)', [id, 5]));
  assert.equal(await rating(id), 4);
 } finally { await db.close(); }
});

test('no se aceptan valoraciones fuera de la escala', async () => {
 const {db, as, session, rating} = await fixture();
 try {
  const id = await session(true);
  for (const bad of [0, 6, -1, null]) await assert.rejects(() => as(adultA, 'select public.rate_play($1,$2)', [id, bad]), String(bad));
  await assert.rejects(() => db.query('update public.play_sessions set fun_rating=7 where id=$1', [id]));
  assert.equal(await rating(id), null);
 } finally { await db.close(); }
});

test('solo se valora una actividad terminada, no una activa ni una interrumpida', async () => {
 const {db, as, session, rating} = await fixture();
 try {
  const active = await session(false);
  await assert.rejects(() => as(adultA, 'select public.rate_play($1,$2)', [active, 3]));
  await as(adultA, "select public.finish_play($1,'interrupted')", [active]);
  await assert.rejects(() => as(adultA, 'select public.rate_play($1,$2)', [active, 3]));
  assert.equal(await rating(active), null);
 } finally { await db.close(); }
});

test('otra familia no puede valorar y nadie escribe la valoración directamente', async () => {
 const {db, as, session, rating} = await fixture();
 try {
  const id = await session(true);
  await assert.rejects(() => as(adultB, 'select public.rate_play($1,$2)', [id, 1]));
  await assert.rejects(() => as(adultA, 'update public.play_sessions set fun_rating=5 where id=$1', [id]));
  assert.equal(await rating(id), null);
  assert.equal((await as(adultB, 'select fun_rating from public.play_sessions')).length, 0);
 } finally { await db.close(); }
});
