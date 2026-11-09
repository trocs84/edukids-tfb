import type {Item} from './games';
import {comfortSpeech} from './copy';

// Qué se lee en voz alta en cada pantalla. Son funciones puras para poder comprobarlas sin navegador
// (tests/speech.test.ts). Studio.tsx solo se ocupa de pasarle el texto a la voz del dispositivo.

export type View = 'profiles' | 'prepare' | 'catalog' | 'play' | 'result' | 'progress';
export type Feedback = '' | 'correct' | 'retry' | 'explain';
export type PlayState = {item: Item; answer: number[]; hint: boolean; feedback: Feedback; showSequence: boolean};

const list = (numbers: number[]) => (numbers.length < 2 ? numbers.join('') : `${numbers.slice(0, -1).join(', ')} o ${numbers[numbers.length - 1]}`);
// Las voces no leen igual los símbolos: "4 + 3" se lee "4 más 3".
const spoken = (text: string) => text.replace(/\s*\+\s*/g, ' más ').replace(/\s*→\s*/g, ' hasta ').replace(/\s+/g, ' ').trim();
const sentence = (text: string) => (/[.!?]$/.test(text) ? text : `${text}.`);

function solutionText(item: Item): string {
 if (item.kind === 'race') return item.solution.join(' más ');
 if (item.kind === 'memory') return item.solution.join(', ');
 return String(item.solution[0]);
}

// Decisión de diseño: en Memory la voz NO lee la secuencia. Si la leyera, cambiaría lo que se mide
// (recordar lo que se ve pasaría a recordar también lo que se oye). La voz solo explica qué hacer.
export function playSpeech({item, answer, hint, feedback, showSequence}: PlayState): string {
 if (feedback === 'correct') return '¡Lo has encontrado!';
 if (feedback === 'explain') return `La respuesta es ${solutionText(item)}. Seguimos aprendiendo.`;
 const parts: string[] = [];
 if (feedback === 'retry') parts.push('Vamos a probar otra vez. Puedes pedir una pista.');
 if (item.kind === 'memory') {
  parts.push(showSequence ? 'Mira los números con calma. Cuando los recuerdes, toca el botón Ya los recuerdo.' : 'Toca los números en el mismo orden.');
 } else {
  parts.push(sentence(spoken(item.prompt)));
  parts.push(item.kind === 'race' ? `Puedes sumar ${list(item.options)}.` : `Puedes elegir ${list(item.options)}.`);
  if (item.kind === 'race' && answer.length === 1) parts.push(`Ya has elegido sumar ${answer[0]}. Elige un salto más.`);
 }
 if (hint) parts.push(`Pista: ${sentence(spoken(item.hint))}`);
 return parts.join(' ');
}

export function speechFor(view: View, play?: PlayState): string {
 switch (view) {
  case 'profiles': return '¿Quién va a jugar? Toca tu dibujo para entrar.';
  case 'prepare': return comfortSpeech();
  case 'catalog': return 'Elige tu aventura. Toca un juego para empezar. Puedes pedir ayuda o descansar cuando quieras.';
  case 'play': return play ? playSpeech(play) : '';
  case 'result': return 'Has terminado tu actividad. Puedes seguir aprendiendo o descansar. ¿Cómo te lo has pasado? Toca una cara.';
  case 'progress': return 'Mi camino. Aquí ves las actividades que has hecho. Toca el botón grande para elegir otro juego.';
 }
}

// Voz en español del dispositivo. Preferimos es-ES; si no hay, cualquier español; si no, ninguna.
export type VoiceLike = {lang: string; name: string};
const norm = (lang: string) => lang.toLowerCase().replace('_', '-');
export function pickSpanishVoice<T extends VoiceLike>(voices: readonly T[]): T | null {
 const spanish = voices.filter(v => norm(v.lang) === 'es' || norm(v.lang).startsWith('es-'));
 return spanish.find(v => norm(v.lang) === 'es-es') ?? spanish[0] ?? null;
}
