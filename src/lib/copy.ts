// Textos que lee el niño o la niña, reunidos en un solo sitio para poder probarlos (tests/comfort.test.ts).
// Las indicaciones de postura son consejos de comodidad de uso general, sin distancias, tiempos ni afirmaciones
// sobre la salud. La base está en el estudio de diseño del 09/11/2026 (apartado "Base de las indicaciones de postura").

export const comfortTitle = 'Vamos a sentarnos bien';

// El número de cada indicación coincide con el número del dibujo (SitDrawing): 1 espalda, 2 pies, 3 pantalla.
export const comfortTips = [
 {id: 'back', text: 'Apoya la espalda en la silla.'},
 {id: 'feet', text: 'Pon los pies en el suelo o en un banquito.'},
 {id: 'screen', text: 'Apoya la pantalla en la mesa, no sobre las piernas.'},
 {id: 'rest', text: 'Si te cansas, cambia de postura o descansa.'},
] as const;

export const comfortAdult = 'Una persona adulta puede ayudarte a colocarte.';
export const comfortButton = 'Ya estoy cómodo';
export const sitDrawingLabel = 'Dibujo de cómo sentarse: espalda apoyada en la silla, pies en el suelo y pantalla apoyada en la mesa.';

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

// Todo lo que lee el niño o la niña en estas pantallas. La nota para adultos queda fuera a propósito.
export function childTexts(): string[] {
 return [comfortTitle, ...comfortTips.map(t => t.text), comfortAdult, comfortButton, sitDrawingLabel, footerText(true), footerText(false), pauseCopy.title, pauseCopy.body];
}
