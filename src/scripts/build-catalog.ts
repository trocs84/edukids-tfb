import {writeFileSync} from 'node:fs';import {games,makeItems} from '../lib/games';
const quote=(s:string)=>"'"+s.replaceAll("'","''")+"'";
let sql='-- Version 1. Forty-five deterministic, reviewed example items.\n';
for(const g of games){sql+=`insert into public.activities(id,title,kind) values(${quote(g.id)},${quote(g.title)},${quote(g.id)});\n`;for(const level of [1,2,3])for(const [i,item] of makeItems(g.id,level).entries())sql+=`insert into public.activity_items(id,activity_id,level,ordinal,prompt,options,solution,hint) values(${quote(item.id)},${quote(g.id)},${level},${i+1},${quote(item.prompt)},${quote(JSON.stringify(item.options))}::jsonb,${quote(JSON.stringify(item.solution))}::jsonb,${quote(item.hint)});\n`;}
writeFileSync('supabase/migrations/20260927141229_edukids_catalog_data.sql',sql);
