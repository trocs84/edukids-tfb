import test from 'node:test';
import assert from 'node:assert/strict';
import {bookOrder, bookChapters, coverButton} from '../lib/book';
import {speechFor, type BookContext, type View} from '../lib/speech';
import {friendlyName, bookEndTitle, bookEndBody, bookSpeech, chapterEndSpeech, bookEndSpeech, chapterEndTitle, childTexts,
 bookTitle, bookIntro, bookDoneNote, bookAgainButton, nextChapterButton, lastChapterButton, chapterStatusText} from '../lib/copy';

// Pantallas del libro de hoy (sesión 7): portada, final de capítulo y final del libro. Solo textos y voz;
// cómo se ven las pantallas se comprueba a mano en el navegador.

const order = [...bookOrder];
const ctx = (completed: Parameters<typeof bookChapters>[1], extra: Partial<BookContext> = {}): BookContext => ({
 chapters: bookChapters(order, completed), button: coverButton(order, completed), alias: 'Leo', inBook: true, chapterNumber: 0, last: false, ...extra,
});

test('el nombre para saludar quita la aclaración entre paréntesis del alias', () => {
 assert.equal(friendlyName('Leo (ejemplo)'), 'Leo');
 assert.equal(friendlyName('F1'), 'F1');
 assert.equal(friendlyName('  Ana María  '), 'Ana María');
 assert.equal(friendlyName('(ejemplo)'), '');
 assert.equal(friendlyName(undefined), '');
});

test('el final del libro saluda con el nombre si lo hay y cuenta los capítulos, sin recompensas', () => {
 assert.equal(bookEndTitle('Leo (ejemplo)'), 'Has terminado tu libro de hoy, Leo');
 assert.equal(bookEndTitle('F1'), 'Has terminado tu libro de hoy, F1');
 assert.equal(bookEndTitle(), 'Has terminado tu libro de hoy');
 assert.ok(bookEndBody(3).startsWith('Hoy has terminado 3 capítulos.'));
 assert.ok(bookEndBody(1).startsWith('Hoy has terminado un capítulo.'));
 assert.ok(bookEndBody(2).includes('Tu próximo libro te estará esperando'));
});

test('la voz de la portada lee el título, cada capítulo con su estado y el botón', () => {
 const fresh = speechFor('book', undefined, ctx([]));
 assert.ok(fresh.startsWith(`${bookTitle}.`));
 assert.ok(fresh.includes(bookIntro));
 assert.ok(fresh.includes('Capítulo 1, Atrapa el número, te toca ahora.'));
 assert.ok(fresh.includes('Capítulo 2, Carrera de números, después.'));
 assert.ok(fresh.includes('Capítulo 3, Memory Numbers, después.'));
 assert.ok(fresh.includes('Toca el botón grande que dice: Empezar el libro.'));
 const half = speechFor('book', undefined, ctx(['catch']));
 assert.ok(half.includes('Capítulo 1, Atrapa el número, hecho.'));
 assert.ok(half.includes('Capítulo 2, Carrera de números, te toca ahora.'));
 assert.ok(half.includes('Seguir con el capítulo 2'));
});

test('con el libro terminado la portada lo dice y ofrece jugar otro, sin botón de seguir', () => {
 const done = speechFor('book', undefined, ctx(['catch', 'race', 'memory']));
 assert.ok(done.includes(bookDoneNote));
 assert.ok(done.includes(bookAgainButton));
 assert.ok(!done.includes('Seguir con'));
 assert.ok(!done.includes('Empezar el libro'));
});

test('al terminar un capítulo la voz dice cuál es, pide una cara y nombra el botón que toca', () => {
 const middle = speechFor('result', undefined, ctx(['catch'], {chapterNumber: 1}));
 assert.ok(middle.startsWith('Has terminado el capítulo 1.'));
 assert.ok(middle.includes('Toca una cara'));
 assert.ok(middle.includes(nextChapterButton));
 assert.ok(!middle.includes(lastChapterButton));
 const last = speechFor('result', undefined, ctx(['catch', 'race', 'memory'], {chapterNumber: 3, last: true}));
 assert.ok(last.startsWith('Has terminado el capítulo 3.'));
 assert.ok(last.includes(lastChapterButton));
 assert.ok(!last.includes(nextChapterButton));
});

test('fuera del libro, el resultado de un juego suelto sigue leyendo lo de siempre', () => {
 const single = speechFor('result', undefined, ctx(['catch'], {inBook: false, chapterNumber: 1}));
 assert.equal(single, speechFor('result'));
 assert.ok(single.startsWith('Has terminado tu actividad.'));
});

test('el final del libro se lee con el nombre y los capítulos', () => {
 const end = speechFor('bookEnd', undefined, ctx(['catch', 'race', 'memory']));
 assert.ok(end.startsWith('Has terminado tu libro de hoy, Leo.'));
 assert.ok(end.includes('3 capítulos'));
 assert.equal(end, bookEndSpeech('Leo', 3));
});

test('cada pantalla del libro tiene voz propia y sin el contexto no inventa nada', () => {
 const views: View[] = ['profiles', 'prepare', 'book', 'catalog', 'result', 'bookEnd', 'progress'];
 const texts = views.map(v => speechFor(v, undefined, ctx(['catch', 'race', 'memory'], {chapterNumber: 3, last: true})));
 texts.forEach((t, i) => assert.ok(t.length > 20, `${views[i]}: texto demasiado corto o vacío`));
 assert.equal(new Set(texts).size, views.length, 'dos pantallas leen lo mismo');
 assert.equal(speechFor('book'), '');
 assert.equal(speechFor('bookEnd'), '');
});

test('los textos del libro no llevan lenguaje técnico ni monedas, puntos, premios o comparaciones', () => {
 const technical = /base de datos|servidor|\bAPI\b|configurad|recarg|sesi[oó]n|migraci|supabase|token|cuenta|contrase/i;
 const reward = /moneda|punto|premio|ranking|gan[aó]|pierd|compar|nivel/i;
 // Los textos nuevos del libro (el pie de página, que dice "sin monedas ni comparaciones", queda fuera de la segunda regla).
 const bookTexts = [
  bookSpeech(bookChapters(order, []), 'Empezar el libro'), bookSpeech(bookChapters(order, order), null),
  chapterEndSpeech(1, false), chapterEndSpeech(3, true), bookEndSpeech('Leo', 3), chapterEndTitle(2),
  bookTitle, bookIntro, bookDoneNote, bookAgainButton, nextChapterButton, lastChapterButton, bookEndBody(1), bookEndBody(3),
  ...Object.values(chapterStatusText),
 ];
 for (const text of [...childTexts(), ...bookTexts]) {
  assert.ok(text.length > 0, 'texto vacío');
  assert.ok(!technical.test(text), `lenguaje técnico en: ${text}`);
 }
 for (const text of bookTexts) assert.ok(!reward.test(text), `recompensa o comparación en: ${text}`);
});
