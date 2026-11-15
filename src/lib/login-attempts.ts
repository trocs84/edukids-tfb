import type {PGlite} from '@electric-sql/pglite';

// Bloqueo por intentos fallidos de la cuenta local (solo el modo local; en la nube lo gestiona Supabase Auth).
// Se permiten maxFailures fallos seguidos; el último bloquea el correo blockMinutes minutos. Al caducar el bloqueo
// la cuenta empieza de cero: antes el contador no se reiniciaba y, tras el primer bloqueo, cada fallo nuevo volvía
// a bloquear al instante. Un acceso correcto también lo reinicia.
export const maxFailures = 5;
export const blockMinutes = 5;
export const tooManyAttempts = 'Too many attempts';
export const badCredentials = 'Invalid credentials';

type Db = Pick<PGlite, 'query'>;

export async function isBlocked(db: Db, email: string): Promise<boolean> {
 const r = await db.query('select 1 from auth.login_attempts where email=$1 and blocked_until>now()', [email]);
 return r.rows.length > 0;
}

// Anota un fallo. Si el bloqueo anterior ya caducó, este fallo cuenta como el primero.
export async function recordFailure(db: Db, email: string): Promise<{failures: number; blocked: boolean}> {
 const next = 'case when auth.login_attempts.blocked_until<=now() then 1 else auth.login_attempts.failures+1 end';
 const r = await db.query<{failures: number; blocked: boolean}>(
  `insert into auth.login_attempts(email,failures) values($1,1)
   on conflict(email) do update set failures=${next}, blocked_until=case when ${next}>=$2 then now()+make_interval(mins=>$3) else null end
   returning failures, (blocked_until is not null) as blocked`,
  [email, maxFailures, blockMinutes],
 );
 return r.rows[0]!;
}

export async function clearFailures(db: Db, email: string): Promise<void> {
 await db.query('delete from auth.login_attempts where email=$1', [email]);
}
