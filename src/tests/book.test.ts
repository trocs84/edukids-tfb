import test from 'node:test';
import assert from 'node:assert/strict';
import {bookOrder, bookGames, bookChapters, nextGame, isBookComplete, coverButton, chapterLabel} from '../lib/book';
import {games, type GameKind} from '../lib/games';

// El libro de hoy (sesión 7): tres capítulos en orden fijo, con el estado de cada uno y el texto del botón de la portada.

const on = (id: string) => ({activity_id: id, enabled: true});
const off = (id: string) => ({activity_id: id, enabled: false});

test('el orden del libro es fijo: Atrapa el número, Carrera de números y Memory Numbers', () => {
 assert.deepEqual([...bookOrder], ['catch', 'race', 'memory']);
 // Si se añade un juego a la lista de juegos, esta prueba obliga a decidir en qué capítulo entra.
 assert.deepEqual([...bookOrder].sort(), games.map(g => g.id).sort());
});

test('sin ajustes de una persona adulta entran los tres juegos; en la demo entran siempre', () => {
 assert.deepEqual(bookGames([]), ['catch', 'race', 'memory']);
 assert.deepEqual(bookGames([on('catch'), on('race'), on('memory')]), ['catch', 'race', 'memory']);
 assert.deepEqual(bookGames([off('catch'), off('race'), off('memory')], true), ['catch', 'race', 'memory']);
});

test('un juego desactivado en Familias no sale en el libro y el orden de los demás no cambia', () => {
 assert.deepEqual(bookGames([off('race')]), ['catch', 'memory']);
 assert.deepEqual(bookGames([off('catch')]), ['race', 'memory']);
 assert.deepEqual(bookGames([off('memory'), on('race')]), ['catch', 'race']);
 // Un ajuste de una actividad que no existe no altera el libro.
 assert.deepEqual(bookGames([off('otra-cosa')]), ['catch', 'race', 'memory']);
});

test('si están todos desactivados no hay libro: ni capítulos, ni siguiente, ni botón, ni libro terminado', () => {
 const order = bookGames([off('catch'), off('race'), off('memory')]);
 assert.deepEqual(order, []);
 assert.deepEqual(bookChapters(order, []), []);
 assert.equal(nextGame(order, []), null);
 assert.equal(coverButton(order, []), null);
 assert.equal(isBookComplete(order, []), false);
});

test('al empezar, el primer capítulo es el que toca y los otros quedan para después', () => {
 const chapters = bookChapters([...bookOrder], []);
 assert.deepEqual(chapters.map(c => c.number), [1, 2, 3]);
 assert.deepEqual(chapters.map(c => c.status), ['next', 'later', 'later']);
 assert.deepEqual(chapters.map(c => c.title), ['Atrapa el número', 'Carrera de números', 'Memory Numbers']);
});

test('cada capítulo terminado pasa a hecho y el siguiente pasa a ser el que toca', () => {
 assert.deepEqual(bookChapters([...bookOrder], ['catch']).map(c => c.status), ['done', 'next', 'later']);
 assert.deepEqual(bookChapters([...bookOrder], ['catch', 'race']).map(c => c.status), ['done', 'done', 'next']);
 assert.deepEqual(bookChapters([...bookOrder], ['catch', 'race', 'memory']).map(c => c.status), ['done', 'done', 'done']);
});

test('el capítulo que toca es siempre el primero sin terminar en el orden del libro', () => {
 assert.equal(nextGame([...bookOrder], []), 'catch');
 assert.equal(nextGame([...bookOrder], ['catch']), 'race');
 assert.equal(nextGame([...bookOrder], ['catch', 'race']), 'memory');
 assert.equal(nextGame([...bookOrder], ['catch', 'race', 'memory']), null);
 // Si llegaran terminados en otro orden, o repetidos, o con un juego ajeno, el libro no se descuadra.
 assert.equal(nextGame([...bookOrder], ['race']), 'catch');
 assert.equal(nextGame([...bookOrder], ['catch', 'catch']), 'race');
 assert.equal(nextGame(['catch', 'memory'], ['race']), 'catch');
});

test('el libro está terminado solo cuando todos sus capítulos están hechos', () => {
 assert.equal(isBookComplete([...bookOrder], []), false);
 assert.equal(isBookComplete([...bookOrder], ['catch', 'race']), false);
 assert.equal(isBookComplete([...bookOrder], ['catch', 'race', 'memory']), true);
 // Con un juego desactivado, el libro de dos capítulos se termina con los dos.
 assert.equal(isBookComplete(['catch', 'memory'], ['catch', 'memory']), true);
 // Un juego que ya no está en el libro no cuenta como capítulo hecho.
 assert.equal(isBookComplete(['catch', 'memory'], ['catch', 'race']), false);
});

test('el botón de la portada empieza el libro, sigue con el capítulo que toca y desaparece al terminar', () => {
 assert.equal(coverButton([...bookOrder], []), 'Empezar el libro');
 assert.equal(coverButton([...bookOrder], ['catch']), 'Seguir con el capítulo 2');
 assert.equal(coverButton([...bookOrder], ['catch', 'race']), 'Seguir con el capítulo 3');
 assert.equal(coverButton([...bookOrder], ['catch', 'race', 'memory']), null);
});

test('los capítulos se numeran dentro de este libro, no según el catálogo completo', () => {
 const order: GameKind[] = ['catch', 'memory'];
 assert.deepEqual(bookChapters(order, []).map(c => [c.game, c.number]), [['catch', 1], ['memory', 2]]);
 assert.equal(coverButton(order, ['catch']), 'Seguir con el capítulo 2');
 assert.equal(chapterLabel(order, 'memory'), 'Capítulo 2 de 2');
 assert.equal(chapterLabel(['race', 'memory'], 'race'), 'Capítulo 1 de 2');
});

test('la etiqueta de capítulo dice cuál es y cuántos hay; con un juego ajeno al libro avisa', () => {
 assert.equal(chapterLabel([...bookOrder], 'catch'), 'Capítulo 1 de 3');
 assert.equal(chapterLabel([...bookOrder], 'race'), 'Capítulo 2 de 3');
 assert.equal(chapterLabel([...bookOrder], 'memory'), 'Capítulo 3 de 3');
 assert.throws(() => chapterLabel(['catch', 'memory'], 'race'), /no forma parte del libro/);
});

test('los textos del libro son para el niño o la niña: sin lenguaje técnico ni monedas, puntos o comparaciones', () => {
 const order = [...bookOrder];
 const texts = [
  coverButton(order, []), coverButton(order, ['catch']), coverButton(order, ['catch', 'race']),
  ...order.map(g => chapterLabel(order, g)),
  ...bookChapters(order, ['catch']).map(c => c.title),
 ];
 const technical = /base de datos|servidor|\bAPI\b|configurad|recarg|sesi[oó]n|migraci|supabase|token|cuenta|contrase/i;
 const reward = /moneda|punto|premio|ranking|gan[aó]|pierd|compar/i;
 for (const text of texts) {
  assert.ok(text && text.length > 0, 'texto vacío');
  assert.ok(!technical.test(text), `lenguaje técnico en: ${text}`);
  assert.ok(!reward.test(text), `recompensa o comparación en: ${text}`);
 }
});
