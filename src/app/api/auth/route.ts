import {NextRequest,NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {authenticate,identity,logout} from '@/lib/data';
import {signGate} from '@/lib/gate';
import {sameOrigin} from '@/lib/origin';
export const dynamic='force-dynamic';
const fail=(error:string,status=400)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function POST(req:NextRequest){
 if(!sameOrigin(req))return fail('Origen no permitido',403);
 try{const {action,email,password}=await req.json();const jar=await cookies();
 if(action==='logout'){await logout();jar.delete('parent_gate');return NextResponse.json({ok:true});}
 if(action==='lock'){jar.delete('parent_gate');return NextResponse.json({ok:true});}
 if(!['login','signup','unlock'].includes(action)||typeof email!=='string'||!email.includes('@')||email.length>254||typeof password!=='string'||password.length<8||password.length>128)return fail('Revisa el correo y la contraseña (mínimo 8 caracteres).');
 if(action==='unlock'){const user=await identity();if(!user||user.email!==email.trim().toLowerCase())return fail('No se ha podido validar el acceso.',401);}
 const {user,needsConfirmation}=await authenticate(action,email,password);
 if(user)jar.set('parent_gate',signGate(user.id),{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',path:'/',maxAge:300});
 return NextResponse.json({ok:true,needsConfirmation},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('No se ha podido validar el acceso. Revisa los datos o espera cinco minutos antes de reintentar.',401);}
}
