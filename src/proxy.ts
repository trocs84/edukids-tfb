import {createServerClient} from '@supabase/ssr';
import {NextResponse,type NextRequest} from 'next/server';
export async function proxy(req:NextRequest){
 let res=NextResponse.next({request:req});if(process.env.EDUKIDS_DATA_MODE!=='supabase'||!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)return res;
 const client=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{cookies:{getAll:()=>req.cookies.getAll(),setAll:(values,headers)=>{values.forEach(({name,value})=>req.cookies.set(name,value));res=NextResponse.next({request:req});values.forEach(({name,value,options})=>res.cookies.set(name,value,{...options,httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production'}));Object.entries(headers??{}).forEach(([key,value])=>res.headers.set(key,value));}}});
 await client.auth.getClaims();res.headers.set('Cache-Control','private, no-store');return res;
}
export const config={matcher:['/api/:path*','/familia','/jugar']};
