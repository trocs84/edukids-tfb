import {games,makeItems,type Result,type GameKind,type Attempt} from './games';
type StoredResponse={item_id:string;answer:number[];correct:boolean;hint_used:boolean;latency_ms:number;exposure_ms:number;attempt_no:number};
export type StoredSession={id:string;activity_id:GameKind;level:number;status:'active'|'completed'|'interrupted';created_at:string;responses:StoredResponse[]};
export function toResults(rows:StoredSession[]):Result[]{return rows.filter(s=>s.status!=='active').map(s=>({id:s.id,game:s.activity_id,level:s.level,status:s.status as Result['status'],createdAt:s.created_at,attempts:s.responses.map(a=>({itemId:a.item_id,answer:a.answer,correct:a.correct,hintUsed:a.hint_used,latencyMs:a.latency_ms,exposureMs:a.exposure_ms,attemptNo:a.attempt_no}) as Attempt)}));}
export type ActiveSession={id:string;game:GameKind;level:number;round:number;attemptNo:number;feedback:''|'retry'|'correct'|'explain';attempts:Attempt[]};
export function pendingSession(rows:StoredSession[]):ActiveSession|null{
 const stored=rows.find(s=>s.status==='active');
 if(!stored||!games.some(g=>g.id===stored.activity_id)||![1,2,3].includes(stored.level))return null;
 const attempts=(stored.responses??[]).map(a=>({itemId:a.item_id,answer:a.answer,correct:a.correct,hintUsed:a.hint_used,latencyMs:a.latency_ms,exposureMs:a.exposure_ms,attemptNo:a.attempt_no}));
 const items=makeItems(stored.activity_id,stored.level);
 for(let round=0;round<items.length;round++){
  const current=attempts.filter(a=>a.itemId===items[round].id).sort((a,b)=>a.attemptNo-b.attemptNo);
  const last=current.at(-1);
  if(!last)return {id:stored.id,game:stored.activity_id,level:stored.level,round,attemptNo:1,feedback:'',attempts};
  if(!last.correct&&last.attemptNo===1)return {id:stored.id,game:stored.activity_id,level:stored.level,round,attemptNo:1,feedback:'retry',attempts};
  if(round===items.length-1)return {id:stored.id,game:stored.activity_id,level:stored.level,round,attemptNo:last.attemptNo,feedback:last.correct?'correct':'explain',attempts};
 }
 return null;
}
export async function request(path:string,body?:unknown){const response=await fetch(path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,cache:'no-store'});const text=await response.text();
// La API devuelve formas distintas según la acción; cada consumidor valida sus campos de uso.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let data:any={};try{data=text?JSON.parse(text):{};}catch{throw new Error(response.ok?'El servidor devolvió una respuesta inesperada. Inténtalo de nuevo en unos minutos.':'El servidor no está disponible ahora mismo. Inténtalo de nuevo en unos minutos.');}if(!response.ok)throw new Error(data.error??'No se ha podido completar la operación.');return data;}
