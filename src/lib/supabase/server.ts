import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
export function configured(){return Boolean(process.env.APP_ORIGIN&&process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY&&process.env.PARENT_GATE_SECRET&&process.env.PARENT_GATE_SECRET.length>=32)}
export async function supabaseServer(){
 if(!configured())throw new Error('SUPABASE_NOT_CONFIGURED');
 const jar=await cookies();return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{cookies:{getAll:()=>jar.getAll(),setAll:values=>{values.forEach(({name,value,options})=>jar.set(name,value,{...options,httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production'}));}}});
}
