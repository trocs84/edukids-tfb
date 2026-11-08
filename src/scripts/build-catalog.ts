import {writeFileSync} from 'node:fs';import {games,makeItems} from '../lib/games';
// Genera la migración que deja el catálogo igual que los retos de lib/games.ts (versión 2, sesión 5).
// No toca 20260927141229_edukids_catalog_data.sql: esa migración ya está aplicada y no se modifica.
// Uso, desde la carpeta src: node --import tsx scripts/build-catalog.ts
const quote=(s:string)=>"'"+s.replaceAll("'","''")+"'";
const rows:string[]=[];
for(const g of games)for(const level of [1,2,3])for(const item of makeItems(g.id,level))rows.push(`  (${quote(item.id)},${quote(item.prompt)},${quote(JSON.stringify(item.options))}::jsonb,${quote(JSON.stringify(item.solution))}::jsonb,${quote(item.hint)})`);
const sql=`-- Version 2 del catalogo (sesion 5): sustituye los ${rows.length} retos por retos fijos sin patrones.
-- Los ids no cambian. Es una sola sentencia: si no actualiza exactamente ${rows.length} retos, se deshace entera.
-- Se puede repetir sin cambiar nada. Generada con scripts/build-catalog.ts a partir de lib/games.ts.
do $$
declare n integer;
begin
 update public.activity_items as a set prompt=v.prompt,options=v.options,solution=v.solution,hint=v.hint
 from (values
${rows.join(',\n')}
 ) as v(id,prompt,options,solution,hint)
 where a.id=v.id;
 get diagnostics n = row_count;
 if n<>${rows.length} then raise exception 'Se esperaban ${rows.length} retos y se actualizaron %',n; end if;
end $$;
`;
writeFileSync('supabase/migrations/20261108000000_update_catalog_v2.sql',sql);
