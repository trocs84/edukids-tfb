import {scryptSync,randomBytes,createHash,timingSafeEqual} from 'node:crypto';
import {cookies} from 'next/headers';
import {localDb} from './local-db';
export type Identity={id:string;email:string};
const digest=(s:string)=>createHash('sha256').update(s).digest('hex');
export async function localUser():Promise<Identity|null>{const token=(await cookies()).get('edukids_session')?.value;if(!token)return null;const db=await localDb();const r=await db.query<Identity>('select u.id,u.email from auth.users u join auth.local_sessions s on s.user_id=u.id where s.token_hash=$1 and s.expires_at>now()',[digest(token)]);return r.rows[0]??null;}
export async function localAuth(action:string,email:string,password:string){
 const db=await localDb();email=email.trim().toLowerCase();
 const blocked=await db.query('select email from auth.login_attempts where email=$1 and blocked_until>now()',[email]);if(blocked.rows.length)throw new Error('Access denied');
 if(action==='signup'){const salt=randomBytes(16).toString('hex');const hash=scryptSync(password,salt,64).toString('hex');await db.query('insert into auth.users(email,encrypted_password) values($1,$2)',[email,`${salt}:${hash}`]);}
 const r=await db.query<Identity&{encrypted_password:string}>('select id,email,encrypted_password from auth.users where email=$1',[email]);const row=r.rows[0];const [salt,expected]=row?.encrypted_password.split(':')??['dummy-salt','0'.repeat(128)];const actual=scryptSync(password,salt,64).toString('hex');
 if(!row||!timingSafeEqual(Buffer.from(actual),Buffer.from(expected))){await db.query("insert into auth.login_attempts(email,failures) values($1,1) on conflict(email) do update set failures=auth.login_attempts.failures+1,blocked_until=case when auth.login_attempts.failures>=4 then now()+interval '5 minutes' else null end",[email]);throw new Error('Access denied');}
 await db.query('delete from auth.login_attempts where email=$1',[email]);
 const token=randomBytes(32).toString('hex');await db.query("insert into auth.local_sessions values($1,$2,now()+interval '8 hours')",[digest(token),row.id]);
 (await cookies()).set('edukids_session',token,{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',path:'/',maxAge:28800});return {id:row.id,email:row.email};
}
export async function localLogout(){const jar=await cookies();const token=jar.get('edukids_session')?.value;if(token)await (await localDb()).query('delete from auth.local_sessions where token_hash=$1',[digest(token)]);jar.delete('edukids_session');}
