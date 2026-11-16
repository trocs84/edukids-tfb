import test from 'node:test';
import assert from 'node:assert/strict';
import {games} from '../lib/games';
import {levelFor, enabledFor, choicesFromForm, levelSummary, enabledField, levelField, noGameEnabled, invalidLevel, type StoredSetting} from '../lib/levels';

// Niveles por perfil (sesión 8): sin nada guardado todo empieza en el nivel 1 y un único formulario guarda los tres juegos.

const form = (values: Record<string, string>) => ({get: (name: string) => values[name] ?? null});
const full = (levels: [string, string, string], on: [boolean, boolean, boolean] = [true, true, true]) => {
 const values: Record<string, string> = {};
 games.forEach((g, i) => {
  values[levelField(g.id)] = levels[i];
  if (on[i]) values[enabledField(g.id)] = 'on';
 });
 return form(values);
};

test('sin nada guardado cada juego está activo en el nivel 1, sea cual sea la franja', () => {
 for (const g of games) {
  assert.equal(levelFor([], g.id), 1);
  assert.equal(enabledFor([], g.id), true);
 }
});

test('se usa lo guardado y un nivel fuera de 1 a 3 se trata como el nivel 1', () => {
 const saved: StoredSetting[] = [
  {activity_id: 'catch', enabled: true, level: 3},
  {activity_id: 'race', enabled: false, level: 2},
  {activity_id: 'memory', enabled: true, level: 9},
 ];
 assert.equal(levelFor(saved, 'catch'), 3);
 assert.equal(levelFor(saved, 'race'), 2);
 assert.equal(enabledFor(saved, 'race'), false);
 assert.equal(levelFor(saved, 'memory'), 1);
});

test('el formulario único devuelve una elección por juego, en el orden de los juegos', () => {
 const choices = choicesFromForm(full(['3', '1', '2'], [true, true, false]));
 assert.deepEqual(choices.map(c => c.game), games.map(g => g.id));
 assert.deepEqual(choices.map(c => c.level), [3, 1, 2]);
 assert.deepEqual(choices.map(c => c.enabled), [true, true, false]);
});

test('rechaza niveles que no son 1, 2 o 3 y el formulario sin nivel', () => {
 for (const bad of ['0', '4', '1.5', 'x', '']) {
  assert.throws(() => choicesFromForm(full([bad, '1', '1'])), {message: invalidLevel}, `nivel ${bad}`);
 }
 assert.throws(() => choicesFromForm(form({})), {message: invalidLevel});
});

test('no deja desactivar los tres juegos a la vez', () => {
 assert.throws(() => choicesFromForm(full(['1', '1', '1'], [false, false, false])), {message: noGameEnabled});
 assert.doesNotThrow(() => choicesFromForm(full(['1', '1', '1'], [false, false, true])));
});

test('la frase de confirmación nombra cada juego con su nivel o su desactivación', () => {
 const text = levelSummary(choicesFromForm(full(['2', '1', '3'], [true, false, true])));
 assert.match(text, /Atrapa el número: nivel 2 \(Práctica\)/);
 assert.match(text, /Carrera de números: desactivado/);
 assert.match(text, /Memory Numbers: nivel 3 \(Reto\)/);
});
