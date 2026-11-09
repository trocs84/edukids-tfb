import type {Item, GameKind} from './games';

// Qué botones secundarios se ven durante un reto. Solo se ofrece lo que sirve en ese momento:
// no hay pista tras acertar, y ni "Volver a mirar" ni "Deshacer" mientras Memory enseña la secuencia.
// "showSequence" solo importa en Memory; en los demás juegos es un valor interno sin significado.
export function actionVisibility({game, showSequence, feedback, answerLength}: {game: GameKind; showSequence: boolean; feedback: string; answerLength: number}) {
 const sequenceOnScreen = game === 'memory' && showSequence;
 return {
  hint: !feedback && !sequenceOnScreen,
  undo: game !== 'catch' && !feedback && !sequenceOnScreen && answerLength > 0,
 };
}

// Carrera de números: los dos saltos se ven como huecos que se van rellenando, "3 + □ + □ → 9".
// Antes solo se veía "3 → 9" y no se notaba que faltaban dos pasos.
export function raceLine(item: Item, answer: number[]): string {
 return `${item.start} + ${answer[0] ?? '□'} + ${answer[1] ?? '□'} → ${item.target}`;
}
