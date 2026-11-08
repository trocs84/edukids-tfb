import test from 'node:test';
import assert from 'node:assert/strict';
import {games, makeItems, evaluate, type GameKind, type Item} from '../lib/games';

// Calidad de los 45 retos. Comprueban que las respuestas no se puedan adivinar por la posición,
// por el valor intermedio o por una regla fija, sin fijar los números concretos de cada reto.

const levels = [1, 2, 3];
const items = (kind: GameKind, level: number) => makeItems(kind, level);
const sorted = (values: number[]) => [...values].sort((a, b) => a - b);
const mean = (values: number[]) => values.reduce((s, n) => s + n, 0) / values.length;

function counts<T>(values: T[]) {
 const map = new Map<T, number>();
 for (const v of values) map.set(v, (map.get(v) ?? 0) + 1);
 return map;
}
const maxCount = <T>(values: T[]) => Math.max(...Array.from(counts(values).values()));

// ---------- Atrapa el número ----------
const catchPosition = (item: Item) => item.options.indexOf(item.solution[0]) + 1;
const catchRank = (item: Item) => sorted(item.options).indexOf(item.solution[0]); // 0 menor, 1 intermedio, 2 mayor
function operands(item: Item) {
 const m = /(\d+) \+ (\d+)/.exec(item.prompt);
 if (!m) throw new Error(`No se entiende el enunciado: ${item.prompt}`);
 return [Number(m[1]), Number(m[2])];
}

test('Atrapa el número: la solución ocupa las tres posiciones y no repite posición seguida', () => {
 for (const level of levels) {
  const positions = items('catch', level).map(catchPosition);
  assert.equal(new Set(positions).size, 3, `Nivel ${level}: posiciones ${positions.join(',')}; deben aparecer las tres`);
  assert.ok(maxCount(positions) <= 2, `Nivel ${level}: posiciones ${positions.join(',')}; ninguna debe repetirse más de 2 veces`);
  positions.slice(1).forEach((p, k) => assert.notEqual(p, positions[k], `Nivel ${level}: dos retos seguidos con la solución en la posición ${p}`));
 }
});

test('Atrapa el número: la solución no es siempre el valor intermedio', () => {
 for (const level of levels) {
  const ranks = items('catch', level).map(catchRank);
  assert.ok(new Set(ranks).size >= 2, `Nivel ${level}: rangos ${ranks.join(',')}; la solución no puede ser siempre el mismo`);
  assert.ok(ranks.filter(r => r === 1).length <= 2, `Nivel ${level}: rangos ${ranks.join(',')}; el intermedio no debe ser solución en más de 2 retos`);
 }
});

test('Atrapa el número: los sumandos varían y las soluciones no son una escalera', () => {
 for (const level of levels) {
  const level_items = items('catch', level);
  const second = level_items.map(i => operands(i)[1]);
  const sums = level_items.map(i => i.solution[0]);
  assert.ok(new Set(second).size >= 3, `Nivel ${level}: segundo sumando ${second.join(',')}; debe haber al menos 3 distintos`);
  assert.equal(new Set(sums).size, 5, `Nivel ${level}: soluciones ${sums.join(',')}; deben ser 5 distintas`);
  assert.notEqual(Math.max(...sums) - Math.min(...sums), 4, `Nivel ${level}: soluciones ${sums.join(',')}; no pueden ser 5 números consecutivos`);
  level_items.forEach(i => assert.equal(operands(i)[0] + operands(i)[1], i.solution[0], `${i.id}: la solución no coincide con la suma`));
 }
 // La dificultad sigue creciendo con el nivel: las sumas de un nivel quedan por debajo de las del siguiente.
 const range = (level: number) => items('catch', level).map(i => i.solution[0]);
 assert.ok(Math.max(...range(1)) < Math.min(...range(2)), 'Las sumas del nivel 1 deben ser menores que las del nivel 2');
 assert.ok(Math.max(...range(2)) < Math.min(...range(3)), 'Las sumas del nivel 2 deben ser menores que las del nivel 3');
});

test('Atrapa el número: tres opciones distintas y solo una es correcta', () => {
 for (const level of levels) for (const item of items('catch', level)) {
  assert.equal(item.options.length, 3, `${item.id}: debe tener 3 opciones`);
  assert.equal(new Set(item.options).size, 3, `${item.id}: opciones repetidas ${item.options.join(',')}`);
  assert.ok(item.options.every(n => Number.isInteger(n) && n > 0), `${item.id}: opciones no válidas ${item.options.join(',')}`);
  assert.equal(item.solution.length, 1, `${item.id}: la solución debe ser un solo número`);
  for (const wrong of item.options.filter(n => n !== item.solution[0])) assert.equal(evaluate(item, [wrong]), false, `${item.id}: ${wrong} no debería ser correcto`);
 }
});

// ---------- Carrera de números ----------
const total = (item: Item) => item.target! - item.start!;
const racePair = (item: Item) => sorted(item.solution).join('+');
const racePositions = (item: Item) => sorted(item.solution.map(n => item.options.indexOf(n) + 1)).join('-');

test('Carrera de números: cada reto pide un par distinto y el par correcto cambia de lugar', () => {
 for (const level of levels) {
  const level_items = items('race', level);
  const pairs = level_items.map(racePair);
  const places = level_items.map(racePositions);
  const optionLists = level_items.map(i => i.options.join(','));
  assert.equal(new Set(pairs).size, 5, `Nivel ${level}: pares ${pairs.join(' | ')}; los 5 retos deben pedir pares distintos`);
  assert.equal(new Set(places).size, 3, `Nivel ${level}: posiciones ${places.join(' | ')}; deben aparecer 1-2, 1-3 y 2-3`);
  assert.ok(maxCount(places) <= 2, `Nivel ${level}: posiciones ${places.join(' | ')}; ninguna combinación más de 2 veces`);
  assert.ok(new Set(optionLists).size >= 4, `Nivel ${level}: opciones ${optionLists.join(' | ')}; no deben repetirse en todos los retos`);
 }
});

test('Carrera de números: cada reto tiene una sola forma de llegar al total', () => {
 for (const level of levels) for (const item of items('race', level)) {
  assert.ok(item.target! > item.start!, `${item.id}: el final debe ser mayor que el inicio`);
  assert.equal(new Set(item.options).size, item.options.length, `${item.id}: opciones repetidas ${item.options.join(',')}`);
  assert.equal(item.solution.reduce((s, n) => s + n, 0), total(item), `${item.id}: la solución no suma el total`);
  const valid = new Set<string>();
  for (const a of item.options) for (const b of item.options) if (evaluate(item, [a, b])) valid.add(sorted([a, b]).join('+'));
  assert.deepEqual([...valid], [racePair(item)], `${item.id}: formas válidas ${[...valid].join(' y ')}; debe haber una sola`);
 }
});

test('Carrera de números: el salto total crece con el nivel', () => {
 const averages = levels.map(level => mean(items('race', level).map(total)));
 assert.ok(averages[0] < averages[1] && averages[1] < averages[2], `Medias por nivel ${averages.join(', ')}; deben crecer`);
});

// ---------- Memory Numbers ----------
const steps = (sequence: number[]) => sequence.slice(1).map((n, k) => (n - sequence[k] + 5) % 5);

test('Memory Numbers: las secuencias de un nivel no son una misma pauta desplazada', () => {
 for (const level of levels) {
  const sequences = items('memory', level).map(i => i.solution);
  const text = sequences.map(s => s.join('-'));
  assert.equal(new Set(text).size, 5, `Nivel ${level}: secuencias ${text.join(' | ')}; deben ser 5 distintas`);
  const patterns = sequences.map(s => steps(s).join(','));
  assert.ok(new Set(patterns).size >= 3, `Nivel ${level}: saltos ${patterns.join(' | ')}; debe haber al menos 3 pautas distintas`);
  if (level >= 2) {
   const constant = sequences.filter(s => new Set(steps(s)).size === 1);
   assert.ok(constant.length <= 1, `Nivel ${level}: ${constant.length} secuencias con salto constante; como mucho 1`);
  }
 }
});

test('Memory Numbers: longitud por nivel, números distintos y botones del 1 al 5', () => {
 for (const level of levels) for (const item of items('memory', level)) {
  assert.equal(item.solution.length, level + 1, `${item.id}: longitud ${item.solution.length}`);
  assert.equal(new Set(item.solution).size, item.solution.length, `${item.id}: números repetidos ${item.solution.join('-')}`);
  assert.deepEqual(item.options, [1, 2, 3, 4, 5], `${item.id}: los botones deben seguir en orden del 1 al 5`);
  assert.deepEqual(item.sequence, item.solution, `${item.id}: la secuencia mostrada debe ser la solución`);
 }
});

// ---------- Comunes ----------
test('Los 45 ids no cambian y la generación es determinista', () => {
 const expected = games.flatMap(g => levels.flatMap(level => [1, 2, 3, 4, 5].map(n => `${g.id}-${level}-${n}`)));
 const generated = games.flatMap(g => levels.flatMap(level => items(g.id, level).map(i => i.id)));
 assert.deepEqual(generated, expected);
 assert.deepEqual(JSON.stringify(games.flatMap(g => levels.map(level => items(g.id, level)))), JSON.stringify(games.flatMap(g => levels.map(level => items(g.id, level)))));
});
