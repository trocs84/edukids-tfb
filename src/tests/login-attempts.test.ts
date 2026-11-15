import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {initialize} from '../lib/local-db';
import {isBlocked, recordFailure, clearFailures, maxFailures, blockMinutes} from '../lib/login-attempts';

// Bloqueo de la cuenta local por intentos fallidos (arreglo del 15/11/2026: tras el primer bloqueo,
// un solo fallo más volvía a bloquear). Usa la misma base local de las demás pruebas, en memoria.

const expire = (db: PGlite, email: string) => db.query("update auth.login_attempts set blocked_until=now()-interval '1 minute' where email=$1", [email]);

test('el bloqueo deja al menos tres intentos y no salta en el primer fallo', async () => {
 assert.ok(maxFailures >= 3, 'tienen que ser tres intentos o más');
 assert.equal(blockMinutes, 5);
 const db = await initialize(await PGlite.create());
 for (let i = 1; i < maxFailures; i++) {
  const r = await recordFailure(db, 'a@demo.test');
  assert.equal(r.failures, i);
  assert.equal(r.blocked, false, `el fallo ${i} no debe bloquear`);
  assert.equal(await isBlocked(db, 'a@demo.test'), false);
 }
 const last = await recordFailure(db, 'a@demo.test');
 assert.equal(last.blocked, true, `el fallo ${maxFailures} bloquea`);
 assert.equal(await isBlocked(db, 'a@demo.test'), true);
 await db.close();
});

test('al caducar el bloqueo se vuelve a tener todos los intentos, no uno solo', async () => {
 const db = await initialize(await PGlite.create());
 for (let i = 0; i < maxFailures; i++) await recordFailure(db, 'b@demo.test');
 assert.equal(await isBlocked(db, 'b@demo.test'), true);
 await expire(db, 'b@demo.test');
 assert.equal(await isBlocked(db, 'b@demo.test'), false);
 // Antes, este primer fallo tras el bloqueo volvía a bloquear al instante.
 const again = await recordFailure(db, 'b@demo.test');
 assert.equal(again.failures, 1);
 assert.equal(again.blocked, false);
 for (let i = 2; i < maxFailures; i++) assert.equal((await recordFailure(db, 'b@demo.test')).blocked, false);
 assert.equal((await recordFailure(db, 'b@demo.test')).blocked, true);
 await db.close();
});

test('un acceso correcto reinicia los fallos y cada correo cuenta aparte', async () => {
 const db = await initialize(await PGlite.create());
 for (let i = 0; i < maxFailures - 1; i++) await recordFailure(db, 'c@demo.test');
 await clearFailures(db, 'c@demo.test');
 assert.equal((await recordFailure(db, 'c@demo.test')).failures, 1);
 for (let i = 0; i < maxFailures; i++) await recordFailure(db, 'd@demo.test');
 assert.equal(await isBlocked(db, 'd@demo.test'), true);
 assert.equal(await isBlocked(db, 'c@demo.test'), false, 'bloquear un correo no afecta a otro');
 await db.close();
});
