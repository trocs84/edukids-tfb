// El libro de hoy: una sentada con los tres juegos como tres capítulos, siempre en el mismo orden.
// Es lógica pura, sin pantalla ni base de datos, para poder probarla en tests/book.test.ts.
// Aquí se decide qué capítulos hay, en qué orden, cuál toca ahora y qué dice el botón de la portada.
// Los textos de la portada, del final de cada capítulo y del final del libro se añaden con las pantallas.
import {games, type GameKind} from './games';

// Orden fijo del libro: Atrapa el número, Carrera de números y Memory Numbers.
export const bookOrder: readonly GameKind[] = ['catch', 'race', 'memory'];

export type ChapterStatus = 'done' | 'next' | 'later';
export type Chapter = {game: GameKind; title: string; number: number; status: ChapterStatus};
type Enabled = {activity_id: string; enabled: boolean};

// Juegos que entran en el libro, en orden. Una persona adulta puede desactivar juegos en Familias: ese capítulo no
// aparece y los demás se renumeran. El criterio es el mismo que el del catálogo: solo cuenta "enabled === false".
// En la demo no hay ajustes y salen todos.
export function bookGames(settings: readonly Enabled[], demo = false): GameKind[] {
 if (demo) return [...bookOrder];
 return bookOrder.filter(id => settings.find(s => s.activity_id === id)?.enabled !== false);
}

// Capítulo que toca ahora: el primero, en el orden del libro, que todavía no se ha terminado. Null si no queda ninguno.
export function nextGame(order: readonly GameKind[], completed: readonly GameKind[]): GameKind | null {
 return order.find(id => !completed.includes(id)) ?? null;
}

// Los capítulos con su número (1, 2, 3 dentro de este libro) y su estado: hecho, el que toca o los que quedan.
export function bookChapters(order: readonly GameKind[], completed: readonly GameKind[]): Chapter[] {
 const next = nextGame(order, completed);
 return order.map((game, i): Chapter => ({
  game,
  title: games.find(g => g.id === game)?.title ?? game,
  number: i + 1,
  status: completed.includes(game) ? 'done' : game === next ? 'next' : 'later',
 }));
}

// Un libro sin capítulos (todos los juegos desactivados) no cuenta como libro terminado.
export function isBookComplete(order: readonly GameKind[], completed: readonly GameKind[]): boolean {
 return order.length > 0 && nextGame(order, completed) === null;
}

// Texto del botón grande de la portada. Null si no hay nada que empezar (libro terminado o sin capítulos).
export function coverButton(order: readonly GameKind[], completed: readonly GameKind[]): string | null {
 const next = nextGame(order, completed);
 if (next === null) return null;
 return completed.some(id => order.includes(id)) ? `Seguir con el capítulo ${order.indexOf(next) + 1}` : 'Empezar el libro';
}

// "Capítulo 2 de 3". Si hay un juego desactivado, el total es el de este libro: "Capítulo 2 de 2".
export function chapterLabel(order: readonly GameKind[], game: GameKind): string {
 const i = order.indexOf(game);
 if (i < 0) throw new Error('Ese juego no forma parte del libro');
 return `Capítulo ${i + 1} de ${order.length}`;
}
