import {sameOrigin} from "@/lib/origin";

import {NextRequest,NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {identity,isLocal,profiles,settings,sessions,saveProfile,saveSettings,rpc} from '@/lib/data';
import {verifyGate} from '@/lib/gate';
export const dynamic='force-dynamic';
const response=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
export async function GET(req:NextRequest){try{
 const user=await identity();if(!user)return response({error:'Inicia sesión con una cuenta adulta.',mode:isLocal()?'local':'supabase'},401);
 const gate=verifyGate((await cookies()).get('parent_gate')?.value,user.id);const list=await profiles(user.id);
 const child=req.nextUrl.searchParams.get('profile');if(child&&!list.some(p=>p.id===child))return response({error:'Perfil no disponible.'},403);
 if(req.nextUrl.searchParams.get('area')==='family'&&!gate)return response({error:'Revalida tu acceso adulto.',needsUnlock:true},403);
 const [configuration,history]=child?await Promise.all([settings(user.id,child),sessions(user.id,child)]):[[],[]];
 return response({configured:true,mode:isLocal()?'local':'supabase',email:gate?user.email:undefined,profiles:list,settings:configuration,sessions:history,adultUnlocked:gate});
 }catch{return response({error:'No se han podido cargar los datos. Revisa la configuración del servidor.'},500);}}
export async function POST(req:NextRequest){
 if(!sameOrigin(req))return response({error:'Origen no permitido.'},403);
 try{const user=await identity();if(!user)return response({error:'La sesión ha caducado.'},401);const b=await req.json();const gate=verifyGate((await cookies()).get('parent_gate')?.value,user.id);
 if(['profile','settings'].includes(b.action)&&!gate)return response({error:'Revalida tu acceso adulto.'},403);
 if(b.action==='profile'){
  if(typeof b.alias!=='string'||b.alias.trim().length<1||b.alias.trim().length>24||!['star','circle','triangle'].includes(b.avatar)||!['5-6','7-8','9-10'].includes(b.ageBand))return response({error:'Revisa los datos del perfil.'},400);
  const data=await saveProfile(user.id,{id:b.id,alias:b.alias.trim(),avatar:b.avatar,ageBand:b.ageBand});return response({ok:true,data});
 }
 if(b.action==='settings'){
  if(!['catch','race','memory'].includes(b.game)||![1,2,3].includes(b.level)||typeof b.enabled!=='boolean')return response({error:'Configuración no válida.'},400);
  await saveSettings(user.id,b);return response({ok:true});
 }
 let data;
 if(b.action==='start')data=await rpc(user.id,'start_play',{p_profile:b.profileId,p_activity:b.game});
 else if(b.action==='answer')data=await rpc(user.id,'record_answer',{p_session:b.sessionId,p_item:b.itemId,p_answer:b.answer,p_hint:b.hintUsed,p_latency:b.latencyMs,p_exposure:b.exposureMs,p_attempt:b.attemptNo});
 else if(b.action==='complete'||b.action==='interrupt')data=await rpc(user.id,'finish_play',{p_session:b.sessionId,p_status:b.action==='complete'?'completed':'interrupted'});
 else return response({error:'Acción no válida.'},400);
 return response({data});
 }catch{return response({error:'No se pudo completar la operación. Revisa la conexión y los permisos.'},400);}
}
