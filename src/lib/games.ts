export type GameKind='catch'|'race'|'memory';
export type Item={id:string;kind:GameKind;level:number;prompt:string;options:number[];solution:number[];hint:string;sequence?:number[];start?:number;target?:number};
export const games=[{id:'catch',title:'Atrapa el número',symbol:'7 + 2',description:'Elige una respuesta',tone:'mint'},{id:'race',title:'Carrera de números',symbol:'2 → 10',description:'Encuentra un camino',tone:'peach'},{id:'memory',title:'Memory Numbers',symbol:'2 · 4 · 1',description:'Recuerda el orden',tone:'lavender'}] as const;
export function makeItems(kind:GameKind,level:number):Item[]{
 if(![1,2,3].includes(level))throw new Error('Nivel no válido');
 return Array.from({length:5},(_,i)=>{
  const id=`${kind}-${level}-${i+1}`;
  if(kind==='catch') {const a=level===1?i+2:level===2?i+7:i+12,b=level===1?2:level===2?5:9,solution=a+b;return {id,kind,level,prompt:`¿Cuánto es ${a} + ${b}?`,options:[solution-1,solution,solution+2].sort((x,y)=>((x+i)%3)-((y+i)%3)),solution:[solution],hint:`Cuenta ${a} y añade ${b}.`};}
  if(kind==='race'){const start=i+2,step=level+1,target=start+step+(step+2);return {id,kind,level,prompt:`Llega del ${start} al ${target} en dos pasos`,options:[step,step+2,step+5],solution:[step,step+2],start,target,hint:`Necesitas sumar ${target-start} en total. Prueba dos saltos pequeños.`};}
  const sequence=Array.from({length:level+1},(_,j)=>(i+j*2)%5+1);return {id,kind,level,prompt:'Recuerda el orden de los números',options:[1,2,3,4,5],solution:sequence,sequence,hint:'Puedes volver a mirar. Después toca los números en el mismo orden.'};
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
