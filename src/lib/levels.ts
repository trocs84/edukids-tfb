import {games, type GameKind} from './games';

// Niveles y juegos activos de un perfil. La franja de edad es solo una etiqueta: el nivel lo fija la familia.
// Mientras no se guarde nada, cada juego está activo en el nivel 1.
export type Level = 1 | 2 | 3;
export type StoredSetting = {activity_id: string; enabled: boolean; level: number};
export type Choice = {game: GameKind; enabled: boolean; level: Level};

export const levelNames: Record<Level, string> = {1: 'Inicio', 2: 'Práctica', 3: 'Reto'};
export const levelOptions: Level[] = [1, 2, 3];
export const noGameEnabled = 'Deja al menos un juego activado.';
export const invalidLevel = 'Elige un nivel válido para cada juego.';

const isLevel = (n: unknown): n is Level => n === 1 || n === 2 || n === 3;

export function levelFor(settings: StoredSetting[], game: GameKind): Level {
 const level = settings.find(s => s.activity_id === game)?.level;
 return isLevel(level) ? level : 1;
}

export function enabledFor(settings: StoredSetting[], game: GameKind): boolean {
 return settings.find(s => s.activity_id === game)?.enabled !== false;
}

export const enabledField = (game: GameKind) => `enabled-${game}`;
export const levelField = (game: GameKind) => `level-${game}`;

// Lee el formulario único de Familias (FormData o cualquier objeto con get) y devuelve una elección por juego.
export function choicesFromForm(form: {get(name: string): unknown}): Choice[] {
 const choices = games.map(g => {
  const level = Number(form.get(levelField(g.id)));
  if (!isLevel(level)) throw new Error(invalidLevel);
  return {game: g.id, enabled: form.get(enabledField(g.id)) === 'on', level};
 });
 if (!choices.some(c => c.enabled)) throw new Error(noGameEnabled);
 return choices;
}

// Frase para confirmar lo guardado, con los mismos nombres que ve la familia.
export function levelSummary(choices: Choice[]): string {
 return choices.map(c => {
  const title = games.find(g => g.id === c.game)?.title ?? c.game;
  return `${title}: ${c.enabled ? `nivel ${c.level} (${levelNames[c.level]})` : 'desactivado'}`;
 }).join(' · ');
}
