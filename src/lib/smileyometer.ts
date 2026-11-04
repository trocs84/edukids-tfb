// Escala Smileyometer (CU-09): cinco caras para que el niño o la niña diga cómo se lo ha pasado.
// 1 = la cara más triste, 5 = la más contenta. Se guarda como número en play_sessions.fun_rating.
export type SmileyValue = 1 | 2 | 3 | 4 | 5;

export const smileyScale: {value: SmileyValue; label: string}[] = [
 {value: 1, label: 'Muy mal'},
 {value: 2, label: 'Mal'},
 {value: 3, label: 'Normal'},
 {value: 4, label: 'Bien'},
 {value: 5, label: 'Muy bien'},
];

// Se usa en la API antes de llamar a la base de datos: solo enteros del 1 al 5.
export function isSmileyValue(n: unknown): n is SmileyValue {
 return typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 5;
}
