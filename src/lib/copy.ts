// Textos que lee el niño o la niña, reunidos en un solo sitio para poder probarlos (tests/comfort.test.ts).
// Las indicaciones de postura son consejos de comodidad de uso general, sin distancias, tiempos ni afirmaciones
// sobre la salud. La base está en el estudio de diseño del 09/11/2026 (apartado "Base de las indicaciones de postura").

import type {Chapter} from './book';

export const comfortTitle = 'Vamos a sentarnos bien';

// El número de cada indicación coincide con el número que lleva encima el dibujo de Nubi sentado: 1 espalda, 2 pies, 3 pantalla.
export const comfortTips = [
 {id: 'back', text: 'Apoya la espalda en la silla.'},
 {id: 'feet', text: 'Pon los pies en el suelo o en un banquito.'},
 {id: 'screen', text: 'Apoya la pantalla en la mesa, no sobre las piernas.'},
 {id: 'rest', text: 'Si te cansas, cambia de postura o descansa.'},
] as const;

export const comfortAdult = 'Una persona adulta puede ayudarte a colocarte.';
export const comfortButton = 'Ya estoy cómodo';
export const sitDrawingLabel = 'Dibujo de Nubi sentado: espalda apoyada en la silla, pies en el suelo y pantalla apoyada en la mesa.';

export function comfortSpeech(): string {
 return [`${comfortTitle}.`, ...comfortTips.map(t => t.text), comfortAdult, `Cuando estés cómodo, toca el botón grande que dice: ${comfortButton}.`].join(' ');
}

export function footerText(demo: boolean): string {
 return (demo ? 'Esto es una demo: lo que hagas aquí no se guarda.' : 'Tus resultados se guardan.') + ' · Sin anuncios, monedas ni comparaciones.';
}

// "Terminar por hoy" guarda la actividad como interrumpida (no se puede retomar desde el catálogo);
// recargar la página sí deja continuarla. Esto último es para la persona adulta, no para el niño.
export const pauseCopy = {
 title: 'Puedes descansar',
 body: 'Descansa todo lo que quieras. Cuando estés listo, sigue jugando. Si prefieres parar por hoy, esta actividad se queda sin terminar.',
 adultNote: 'Para la persona adulta: si se recarga la página, la actividad se puede continuar.',
};

// El libro de hoy (sesión 7): portada con los capítulos, final de cada capítulo y final del libro.
// Sin monedas, puntos ni comparaciones: el mensaje final es solo de ánimo. Un mensaje que dependa de cómo ha ido
// la sesión queda para la sesión 8.
export const bookTitle = 'Tu libro de hoy';
export const bookIntro = 'Hoy jugamos con Nubi, un capítulo detrás de otro.';
export const bookSceneLabel = 'Nubi, una mascota con mochila, camina sobre unas piedras naranjas hacia una torre morada.';
export const chapterStatusText = {done: 'Hecho', next: 'Te toca ahora', later: 'Después'} as const;
export const bookDoneNote = 'Ya has terminado tu libro de hoy.';
export const chooseOneGame = 'Elegir un juego suelto';
export const backToBook = 'Volver a mi libro';
export const nextChapterButton = 'Siguiente capítulo';
export const lastChapterButton = 'Terminar el libro';
export const bookAgainButton = 'Jugar otro libro';

// El alias puede llevar una aclaración entre paréntesis, como "Leo (ejemplo)": para saludar y para la voz sobra.
export function friendlyName(alias?: string): string {
 return (alias ?? '').replace(/\s*\([^)]*\)\s*$/, '').trim();
}
export const chapterEndTitle = (number: number): string => `Has terminado el capítulo ${number}`;
export function bookEndTitle(alias?: string): string {
 const name = friendlyName(alias);
 return name ? `Has terminado tu libro de hoy, ${name}` : 'Has terminado tu libro de hoy';
}
export function bookEndBody(chapters: number): string {
 return `Hoy has terminado ${chapters === 1 ? 'un capítulo' : `${chapters} capítulos`}. Gracias por jugar con Nubi. Tu próximo libro te estará esperando.`;
}

// Lo que se lee en voz alta (lib/speech.ts los reúne por pantalla).
export function bookSpeech(chapters: readonly Chapter[], button: string | null): string {
 const list = chapters.map(c => `Capítulo ${c.number}, ${c.title}, ${chapterStatusText[c.status].toLowerCase()}.`);
 const finished = chapters.length > 0 && chapters.every(c => c.status === 'done');
 const action = button ? `Toca el botón grande que dice: ${button}.` : finished ? `${bookDoneNote} Si quieres, toca el botón que dice: ${bookAgainButton}.` : '';
 return [`${bookTitle}.`, bookIntro, ...list, action].filter(Boolean).join(' ');
}
export function chapterEndSpeech(number: number, last: boolean): string {
 return `${chapterEndTitle(number)}. ¿Cómo te lo has pasado? Toca una cara. Cuando quieras, toca el botón grande que dice: ${last ? lastChapterButton : nextChapterButton}.`;
}
export function bookEndSpeech(alias: string | undefined, chapters: number): string {
 return `${bookEndTitle(alias)}. ${bookEndBody(chapters)}`;
}

// Todo lo que lee el niño o la niña en estas pantallas. La nota para adultos queda fuera a propósito.
export function childTexts(): string[] {
 return [comfortTitle, ...comfortTips.map(t => t.text), comfortAdult, comfortButton, sitDrawingLabel, footerText(true), footerText(false), pauseCopy.title, pauseCopy.body,
  bookTitle, bookIntro, bookSceneLabel, ...Object.values(chapterStatusText), bookDoneNote, chooseOneGame, backToBook, nextChapterButton, lastChapterButton, bookAgainButton,
  chapterEndTitle(1), bookEndTitle('Leo'), bookEndTitle(), bookEndBody(1), bookEndBody(3)];
}
