export type GameKind='catch'|'race'|'memory';
export type Item={id:string;kind:GameKind;level:number;prompt:string;options:number[];solution:number[];hint:string;sequence?:number[];start?:number;target?:number};
export const games=[{id:'catch',title:'Atrapa el número',symbol:'7 + 2',description:'Elige una respuesta',tone:'mint'},{id:'race',title:'Carrera de números',symbol:'2 → 10',description:'Encuentra un camino',tone:'peach'},{id:'memory',title:'Memory Numbers',symbol:'2 · 4 · 1',description:'Recuerda el orden',tone:'lavender'}] as const;

// Versión 2 del catálogo (sesión 5): 45 retos fijos, revisados a mano. Se escriben en tablas, no se calculan,
// para que la solución no dependa de una fórmula que se pueda adivinar. makeItems sigue siendo determinista:
// cliente y servidor generan lo mismo y el servidor corrige contra activity_items.
// Los ids no cambian (juego-nivel-orden). Las pruebas de tests/catalog-quality.test.ts fijan las reglas.

// Atrapa el número: [primer sumando, segundo sumando, opciones tal como se muestran].
// La solución cambia de posición y de rango (menor, intermedio, mayor). Algunos distractores son errores típicos
// (olvidar la decena: 13 → 3; sumar una decena de más: 12 → 22).
const catchRows:Record<number,[number,number,number[]][]>={
 1:[[4,3,[6,7,9]],[2,2,[5,6,4]],[5,4,[9,7,8]],[3,2,[8,6,5]],[6,2,[8,6,7]]],
 2:[[9,4,[12,3,13]],[8,6,[14,13,16]],[7,5,[13,12,22]],[11,6,[17,7,16]],[10,5,[14,16,15]]],
 3:[[14,9,[24,23,33]],[12,10,[22,21,12]],[16,8,[23,26,24]],[13,8,[21,22,31]],[17,10,[26,27,17]]]
};

// Carrera de números: [inicio, opciones tal como se muestran, par que lleva al total].
// Con tres opciones distintas, dos pares nunca suman lo mismo, así que cada reto tiene una sola forma de llegar
// (ninguna opción es la mitad del total). El par correcto cambia de lugar y el tercer número engaña sin sobrar.
const raceRows:Record<number,[number,number[],number[]][]>={
 1:[[3,[2,4,5],[2,4]],[5,[3,1,4],[1,4]],[2,[3,2,4],[3,4]],[6,[1,3,2],[3,2]],[4,[2,1,5],[2,5]]],
 2:[[4,[3,5,6],[3,5]],[6,[6,2,5],[6,2]],[3,[4,7,3],[7,3]],[5,[6,3,4],[3,4]],[2,[2,6,5],[2,5]]],
 3:[[4,[5,8,3],[5,8]],[6,[7,4,9],[7,4]],[5,[6,3,8],[3,8]],[7,[9,5,2],[9,2]],[3,[4,9,6],[4,6]]]
};

// Memory Numbers: secuencias de números distintos del 1 al 5, con longitud nivel+1 y sin un salto fijo.
const memoryRows:Record<number,number[][]>={
 1:[[3,1],[2,5],[4,5],[5,2],[4,3]],
 2:[[4,1,5],[3,5,1],[5,3,4],[2,3,5],[1,5,2]],
 3:[[2,5,1,3],[5,2,3,1],[1,3,2,5],[4,5,2,1],[3,2,5,4]]
};

export function makeItems(kind:GameKind,level:number):Item[]{
 if(![1,2,3].includes(level))throw new Error('Nivel no válido');
 return Array.from({length:5},(_,i)=>{
  const id=`${kind}-${level}-${i+1}`;
  if(kind==='catch'){const [a,b,options]=catchRows[level]![i]!;const solution=a+b;return {id,kind,level,prompt:`¿Cuánto es ${a} + ${b}?`,options:[...options],solution:[solution],hint:`Cuenta ${a} y añade ${b}.`};}
  if(kind==='race'){const [start,options,solution]=raceRows[level]![i]!;const target=start+solution[0]!+solution[1]!;return {id,kind,level,prompt:`Llega del ${start} al ${target} en dos pasos`,options:[...options],solution:[...solution],start,target,hint:`Necesitas sumar ${target-start} en total. Prueba dos saltos pequeños.`};}
  const sequence=[...memoryRows[level]![i]!];return {id,kind,level,prompt:'Recuerda el orden de los números',options:[1,2,3,4,5],solution:sequence,sequence:[...sequence],hint:'Puedes volver a mirar. Después toca los números en el mismo orden.'};
 });
}
export function evaluate(item:Item,answer:number[]):boolean {
 if(!Array.isArray(answer)||answer.some(n=>!Number.isFinite(n)||!item.options.includes(n)))return false;
 if(item.kind==='race')return answer.length===2 && answer.reduce((a,b)=>a+b,0)===(item.target!-item.start!);
 return answer.length===item.solution.length&&answer.every((n,i)=>n===item.solution[i]);
}
export type Attempt={itemId:string;answer:number[];correct:boolean;hintUsed:boolean;latencyMs:number;exposureMs:number;attemptNo:number};
export type Result={id:string;game:GameKind;level:number;status:'completed'|'interrupted';attempts:Attempt[];createdAt:string};
export function summary(results:Result[]){const done=results.filter(r=>r.status==='completed');const first=done.flatMap(r=>r.attempts.filter(a=>a.attemptNo===1));const unassisted=first.filter(a=>!a.hintUsed);return {completed:done.length,interrupted:results.filter(r=>r.status==='interrupted').length,firstCorrect:unassisted.filter(a=>a.correct).length,firstTotal:unassisted.length,hints:done.flatMap(r=>r.attempts).filter(a=>a.hintUsed).length};}
