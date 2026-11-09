import test from 'node:test';
import assert from 'node:assert/strict';
import {comfortTips, comfortSpeech, comfortAdult, comfortButton, sitDrawingLabel, childTexts, footerText, pauseCopy} from '../lib/copy';

// Pantalla "Antes de empezar" (comodidad y dibujo de cómo sentarse) y textos para el niño o la niña (sesión 6).

test('hay cuatro indicaciones cortas y la primera, la segunda y la tercera coinciden con el dibujo', () => {
 assert.equal(comfortTips.length, 4);
 assert.equal(new Set(comfortTips.map(t => t.id)).size, 4);
 assert.deepEqual(comfortTips.slice(0, 3).map(t => t.id), ['back', 'feet', 'screen']);
 for (const tip of comfortTips) {
  assert.ok(tip.text.length <= 60, `demasiado larga: ${tip.text}`);
  assert.match(tip.text, /^[A-ZÁÉÍÓÚÑ].*\.$/, `empieza con mayúscula y termina en punto: ${tip.text}`);
 }
});

test('las indicaciones son consejos de comodidad: sin números, unidades, tiempos ni palabras médicas', () => {
 const texts = [...comfortTips.map(t => t.text), comfortAdult, sitDrawingLabel];
 for (const text of texts) {
  assert.ok(!/\d/.test(text), `lleva un número: ${text}`);
  assert.ok(!/\b(cm|centímetros?|metros?|minutos?|horas?|segundos?)\b/i.test(text), `lleva una medida o un tiempo: ${text}`);
  assert.ok(!/dolor|lesi[oó]n|lesiones|da[ñn]o|enferm|salud|m[eé]dic|columna|cuello/i.test(text), `lleva una afirmación sobre la salud: ${text}`);
 }
});

test('la voz de la pantalla lee el título, las cuatro indicaciones, la ayuda de la persona adulta y el botón', () => {
 const speech = comfortSpeech();
 assert.ok(speech.startsWith('Vamos a sentarnos bien.'));
 for (const tip of comfortTips) assert.ok(speech.includes(tip.text), `falta: ${tip.text}`);
 assert.ok(speech.includes(comfortAdult));
 assert.ok(speech.includes(comfortButton));
});

test('el dibujo se describe para quien no lo ve: espalda, pies y pantalla', () => {
 for (const word of ['espalda', 'pies', 'pantalla']) assert.ok(sitDrawingLabel.includes(word), `la descripción no menciona ${word}`);
});

test('ningún texto del niño o de la niña usa lenguaje técnico', () => {
 const technical = /base de datos|servidor|\bAPI\b|configurad|recarg|sesi[oó]n|migraci|supabase|token|cuenta|contrase/i;
 for (const text of childTexts()) assert.ok(!technical.test(text), `lenguaje técnico en: ${text}`);
 assert.ok(footerText(true).includes('demo') && footerText(true).includes('no se guarda'));
 assert.ok(footerText(false).includes('se guardan'));
});

test('lo que solo debe leer una persona adulta va aparte del texto infantil', () => {
 assert.ok(pauseCopy.adultNote.startsWith('Para la persona adulta'));
 assert.ok(!childTexts().includes(pauseCopy.adultNote));
 // "Terminar por hoy" deja la actividad interrumpida; el texto no promete que se pueda retomar.
 assert.ok(pauseCopy.body.includes('sin terminar'));
});
