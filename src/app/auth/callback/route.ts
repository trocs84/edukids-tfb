import {NextRequest,NextResponse} from 'next/server';
import {supabaseServer} from '@/lib/supabase/server';
export async function GET(request:NextRequest){
 const base=process.env.APP_ORIGIN??request.nextUrl.origin;
 const code=request.nextUrl.searchParams.get('code');
 if(code){try{const {error}=await (await supabaseServer()).auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL('/familia',base));}catch{}}
 return NextResponse.redirect(new URL('/familia?confirmation=failed',base));
}
