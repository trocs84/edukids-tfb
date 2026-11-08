import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {initialize} from '../lib/local-db';
import {games, makeItems} from '../lib/games';

type Row = {id: string; prompt: string; options: number[]; solution: number[]; hint: string};
const select = 'select id,prompt,options,solution,hint from public.activity_items order by id';

test('el catálogo de la base coincide con makeItems en los 45 retos', async () => {
 const db = await initialize(await PGlite.create());
 try {
  const rows = (await db.query<Row>(select)).rows;
  assert.equal(rows.length, 45);
  const byId = new Map(rows.map(r => [r.id, r]));
  for (const g of games) for (const level of [1, 2, 3]) for (const item of makeItems(g.id, level)) {
   const row = byId.get(item.id);
   if (!row) throw new Error(`Falta ${item.id} en la base`);
   assert.deepEqual(
    {prompt: row.prompt, options: row.options, solution: row.solution, hint: row.hint},
    {prompt: item.prompt, options: item.options, solution: item.solution, hint: item.hint},
    `${item.id}: la base no coincide con makeItems`
   );
  }
 } finally { await db.close(); }
});

test('la migración del catálogo se puede repetir sin cambiar nada y se deshace si falta un reto', async () => {
 const db = await initialize(await PGlite.create());
 try {
  const sql = await readFile(join(process.cwd(), 'supabase', 'migrations', '20261108000000_update_catalog_v2.sql'), 'utf8');
  const before = (await db.query<Row>(select)).rows;
  await db.exec(sql);
  assert.deepEqual((await db.query<Row>(select)).rows, before);
  await db.exec("delete from public.activity_items where id='catch-1-1'");
  await assert.rejects(() => db.exec(sql), /Se esperaban 45 retos/);
 } finally { await db.close(); }
});
