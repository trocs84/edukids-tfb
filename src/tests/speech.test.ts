import test from 'node:test';
import assert from 'node:assert/strict';
import {games, makeItems, type Item} from '../lib/games';
import {speechFor, playSpeech, pickSpanishVoice, type View, type PlayState} from '../lib/speech';
import {raceLine, actionVisibility} from '../lib/display';

// Qué se lee en voz alta en cada pantalla y cómo se ve la línea de Carrera (sesión 6).
// Estas pruebas no abren el navegador: comprueban las funciones puras que usa Studio.tsx.

const flat = games.flatMap(g => [1, 2, 3].flatMap(level => makeItems(g.id, level)));
const byKind = (kind: Item['kind']) => flat.filter(i => i.kind === kind);
const state = (item: Item, extra: Partial<PlayState> = {}): PlayState => ({item, answer: [], hint: false, feedback: '', showSequence: item.kind === 'memory', ...extra});

test('cada pantalla tiene su propio texto y el resultado ya no repite el del catálogo', () => {
 const views: View[] = ['profiles', 'prepare', 'catalog', 'result', 'progress'];
 const texts = views.map(v => speechFor(v));
 texts.forEach((t, i) => assert.ok(t.length > 20, `${views[i]}: texto demasiado corto o vacío`));
 assert.equal(new Set(texts).size, views.length, 'dos pantallas leen lo mismo');
 assert.ok(!speechFor('result').includes('Elige tu aventura'), 'el resultado no debe decir "Elige tu aventura"');
 assert.equal(speechFor('play'), '', 'sin reto no hay nada que leer');
});

test('Atrapa y Carrera: la voz lee el enunciado y todas las opciones, sin símbolos que se lean mal', () => {
 for (const item of [...byKind('catch'), ...byKind('race')]) {
  const text = playSpeech(state(item));
  assert.ok(!/[+→□]/.test(text), `${item.id}: quedan símbolos en "${text}"`);
  for (const option of item.options) assert.ok(text.includes(String(option)), `${item.id}: falta la opción ${option}`);
  assert.match(text, /[.!?]$/, `${item.id}: la frase debe terminar con un signo de puntuación`);
  if (item.kind === 'catch') {
   const [, a, b] = /(\d+) \+ (\d+)/.exec(item.prompt)!;
   assert.ok(text.includes(`${a} más ${b}`), `${item.id}: la suma debe leerse "${a} más ${b}"`);
  }
 }
});

test('Memory: la voz no lee nunca la secuencia, ni al mostrarla ni al esconderla', () => {
 for (const item of byKind('memory')) {
  for (const showSequence of [true, false]) {
   for (const feedback of ['', 'retry'] as const) {
    for (const hint of [false, true]) {
     const text = playSpeech(state(item, {showSequence, feedback, hint}));
     assert.ok(!/\d/.test(text), `${item.id}: la voz dice un número y revela la secuencia: "${text}"`);
    }
   }
  }
 }
});

test('los mensajes de acierto, intento y explicación se leen; la explicación dice la respuesta', () => {
 for (const item of flat) {
  assert.equal(playSpeech(state(item, {feedback: 'correct'})), '¡Lo has encontrado!');
  const explain = playSpeech(state(item, {feedback: 'explain'}));
  const solution = item.kind === 'catch' ? String(item.solution[0]) : item.solution.join(item.kind === 'race' ? ' más ' : ', ');
  assert.ok(explain.includes(`La respuesta es ${solution}.`), `${item.id}: "${explain}"`);
  const retry = playSpeech(state(item, {feedback: 'retry', showSequence: false}));
  assert.ok(retry.startsWith('Vamos a probar otra vez.'), `${item.id}: "${retry}"`);
 }
 // Tras fallar, además del ánimo se vuelve a leer qué hay que hacer.
 const catchItem = makeItems('catch', 1)[0];
 assert.ok(playSpeech(state(catchItem, {feedback: 'retry'})).includes('Puedes elegir'));
});

test('la pista solo se lee si se ha pedido', () => {
 for (const item of flat) {
  assert.ok(!playSpeech(state(item)).includes('Pista'), `${item.id}: lee la pista sin pedirla`);
  const withHint = playSpeech(state(item, {hint: true, showSequence: false}));
  assert.ok(withHint.includes('Pista:') && withHint.includes(item.hint), `${item.id}: falta la pista en "${withHint}"`);
 }
});

test('Carrera: tras elegir el primer salto la voz lo recuerda', () => {
 const item = makeItems('race', 1)[0];
 const text = playSpeech(state(item, {answer: [item.options[0]]}));
 assert.ok(text.includes(`Ya has elegido sumar ${item.options[0]}.`));
 assert.ok(!playSpeech(state(item)).includes('Ya has elegido'));
});

test('pickSpanishVoice prefiere es-ES, acepta otro español y no inventa si no hay', () => {
 const voice = (lang: string, name = lang) => ({lang, name});
 assert.equal(pickSpanishVoice([voice('en-US'), voice('es-MX'), voice('es-ES')])?.lang, 'es-ES');
 assert.equal(pickSpanishVoice([voice('en-US'), voice('es-MX')])?.lang, 'es-MX');
 assert.equal(pickSpanishVoice([voice('en-GB'), voice('es_ES')])?.lang, 'es_ES', 'algunos Android usan guion bajo');
 assert.equal(pickSpanishVoice([voice('es')])?.lang, 'es');
 assert.equal(pickSpanishVoice([voice('en-US'), voice('fr-FR'), voice('de-DE')]), null);
 assert.equal(pickSpanishVoice([]), null);
 assert.equal(pickSpanishVoice([voice('est-EE')]), null, 'est (estonio) no es español');
});

test('botones secundarios: solo se ofrece lo que sirve en cada momento', () => {
 const v = (game: 'catch' | 'race' | 'memory', showSequence: boolean, feedback: string, answerLength: number) => actionVisibility({game, showSequence, feedback, answerLength});
 // showSequence vale true al empezar cualquier juego, aunque solo Memory tiene fase de secuencia.
 assert.deepEqual(v('catch', true, '', 0), {hint: true, undo: false});
 assert.deepEqual(v('catch', true, '', 1), {hint: true, undo: false}, 'Atrapa nunca deshace: responde con un toque');
 assert.deepEqual(v('race', true, '', 0), {hint: true, undo: false}, 'sin toques no hay nada que deshacer');
 assert.deepEqual(v('race', true, '', 1), {hint: true, undo: true}, 'Carrera: tras el primer salto se puede deshacer');
 assert.deepEqual(v('memory', true, '', 0), {hint: false, undo: false}, 'mientras se ve la secuencia no hay "Volver a mirar" ni "Deshacer"');
 assert.deepEqual(v('memory', false, '', 0), {hint: true, undo: false});
 assert.deepEqual(v('memory', false, '', 2), {hint: true, undo: true});
 for (const game of ['catch', 'race', 'memory'] as const) {
  for (const feedback of ['correct', 'retry', 'explain']) assert.deepEqual(v(game, false, feedback, 1), {hint: false, undo: false}, `${game}/${feedback}: con mensaje no se ofrece pista ni deshacer`);
 }
});

test('Carrera de números: la línea muestra dos huecos que se van rellenando', () => {
 for (const item of byKind('race')) {
  const [a, b] = item.solution;
  assert.equal(raceLine(item, []), `${item.start} + □ + □ → ${item.target}`);
  assert.equal(raceLine(item, [a]), `${item.start} + ${a} + □ → ${item.target}`);
  assert.equal(raceLine(item, [a, b]), `${item.start} + ${a} + ${b} → ${item.target}`);
 }
});
