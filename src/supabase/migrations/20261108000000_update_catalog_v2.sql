-- Version 2 del catalogo (sesion 5): sustituye los 45 retos por retos fijos sin patrones.
-- Los ids no cambian. Es una sola sentencia: si no actualiza exactamente 45 retos, se deshace entera.
-- Se puede repetir sin cambiar nada. Generada con scripts/build-catalog.ts a partir de lib/games.ts.
do $$
declare n integer;
begin
 update public.activity_items as a set prompt=v.prompt,options=v.options,solution=v.solution,hint=v.hint
 from (values
  ('catch-1-1','¿Cuánto es 4 + 3?','[6,7,9]'::jsonb,'[7]'::jsonb,'Cuenta 4 y añade 3.'),
  ('catch-1-2','¿Cuánto es 2 + 2?','[5,6,4]'::jsonb,'[4]'::jsonb,'Cuenta 2 y añade 2.'),
  ('catch-1-3','¿Cuánto es 5 + 4?','[9,7,8]'::jsonb,'[9]'::jsonb,'Cuenta 5 y añade 4.'),
  ('catch-1-4','¿Cuánto es 3 + 2?','[8,6,5]'::jsonb,'[5]'::jsonb,'Cuenta 3 y añade 2.'),
  ('catch-1-5','¿Cuánto es 6 + 2?','[8,6,7]'::jsonb,'[8]'::jsonb,'Cuenta 6 y añade 2.'),
  ('catch-2-1','¿Cuánto es 9 + 4?','[12,3,13]'::jsonb,'[13]'::jsonb,'Cuenta 9 y añade 4.'),
  ('catch-2-2','¿Cuánto es 8 + 6?','[14,13,16]'::jsonb,'[14]'::jsonb,'Cuenta 8 y añade 6.'),
  ('catch-2-3','¿Cuánto es 7 + 5?','[13,12,22]'::jsonb,'[12]'::jsonb,'Cuenta 7 y añade 5.'),
  ('catch-2-4','¿Cuánto es 11 + 6?','[17,7,16]'::jsonb,'[17]'::jsonb,'Cuenta 11 y añade 6.'),
  ('catch-2-5','¿Cuánto es 10 + 5?','[14,16,15]'::jsonb,'[15]'::jsonb,'Cuenta 10 y añade 5.'),
  ('catch-3-1','¿Cuánto es 14 + 9?','[24,23,33]'::jsonb,'[23]'::jsonb,'Cuenta 14 y añade 9.'),
  ('catch-3-2','¿Cuánto es 12 + 10?','[22,21,12]'::jsonb,'[22]'::jsonb,'Cuenta 12 y añade 10.'),
  ('catch-3-3','¿Cuánto es 16 + 8?','[23,26,24]'::jsonb,'[24]'::jsonb,'Cuenta 16 y añade 8.'),
  ('catch-3-4','¿Cuánto es 13 + 8?','[21,22,31]'::jsonb,'[21]'::jsonb,'Cuenta 13 y añade 8.'),
  ('catch-3-5','¿Cuánto es 17 + 10?','[26,27,17]'::jsonb,'[27]'::jsonb,'Cuenta 17 y añade 10.'),
  ('race-1-1','Llega del 3 al 9 en dos pasos','[2,4,5]'::jsonb,'[2,4]'::jsonb,'Necesitas sumar 6 en total. Prueba dos saltos pequeños.'),
  ('race-1-2','Llega del 5 al 10 en dos pasos','[3,1,4]'::jsonb,'[1,4]'::jsonb,'Necesitas sumar 5 en total. Prueba dos saltos pequeños.'),
  ('race-1-3','Llega del 2 al 9 en dos pasos','[3,2,4]'::jsonb,'[3,4]'::jsonb,'Necesitas sumar 7 en total. Prueba dos saltos pequeños.'),
  ('race-1-4','Llega del 6 al 11 en dos pasos','[1,3,2]'::jsonb,'[3,2]'::jsonb,'Necesitas sumar 5 en total. Prueba dos saltos pequeños.'),
  ('race-1-5','Llega del 4 al 11 en dos pasos','[2,1,5]'::jsonb,'[2,5]'::jsonb,'Necesitas sumar 7 en total. Prueba dos saltos pequeños.'),
  ('race-2-1','Llega del 4 al 12 en dos pasos','[3,5,6]'::jsonb,'[3,5]'::jsonb,'Necesitas sumar 8 en total. Prueba dos saltos pequeños.'),
  ('race-2-2','Llega del 6 al 14 en dos pasos','[6,2,5]'::jsonb,'[6,2]'::jsonb,'Necesitas sumar 8 en total. Prueba dos saltos pequeños.'),
  ('race-2-3','Llega del 3 al 13 en dos pasos','[4,7,3]'::jsonb,'[7,3]'::jsonb,'Necesitas sumar 10 en total. Prueba dos saltos pequeños.'),
  ('race-2-4','Llega del 5 al 12 en dos pasos','[6,3,4]'::jsonb,'[3,4]'::jsonb,'Necesitas sumar 7 en total. Prueba dos saltos pequeños.'),
  ('race-2-5','Llega del 2 al 9 en dos pasos','[2,6,5]'::jsonb,'[2,5]'::jsonb,'Necesitas sumar 7 en total. Prueba dos saltos pequeños.'),
  ('race-3-1','Llega del 4 al 17 en dos pasos','[5,8,3]'::jsonb,'[5,8]'::jsonb,'Necesitas sumar 13 en total. Prueba dos saltos pequeños.'),
  ('race-3-2','Llega del 6 al 17 en dos pasos','[7,4,9]'::jsonb,'[7,4]'::jsonb,'Necesitas sumar 11 en total. Prueba dos saltos pequeños.'),
  ('race-3-3','Llega del 5 al 16 en dos pasos','[6,3,8]'::jsonb,'[3,8]'::jsonb,'Necesitas sumar 11 en total. Prueba dos saltos pequeños.'),
  ('race-3-4','Llega del 7 al 18 en dos pasos','[9,5,2]'::jsonb,'[9,2]'::jsonb,'Necesitas sumar 11 en total. Prueba dos saltos pequeños.'),
  ('race-3-5','Llega del 3 al 13 en dos pasos','[4,9,6]'::jsonb,'[4,6]'::jsonb,'Necesitas sumar 10 en total. Prueba dos saltos pequeños.'),
  ('memory-1-1','Recuerda el orden de los números','[1,2,3,4,5]'::jsonb,'[3,1]'::jsonb,'Puedes volver a mirar. Después toca los números en el mismo orden.'),
  ('memory-1-2','Recuerda el orden de los números','[1,2,3,4,5]'::jsonb,'[2,5]'::jsonb,'Puedes volver a mirar. Después toca los números en el mismo orden.'),
  ('memory-1-3','Recuerda el orden de los números','[1,2,3,4,5]'::jsonb,'[4,5]'::jsonb,'Puedes volver a mirar. Después toca los números en el mismo orden.'),
  ('memory-1-4','Recuerda el orden de los números','[1,2,3,4,5]'::jsonb,'[5,2]'::jsonb,'Puedes volver a mirar. Después toca los números en el mismo orden.'),
  ('memory-1-5','Recuerda el orden de los números','[1,2,3,4,5]'::jsonb,'[4,3]'::jsonb,'Puedes volver a mirar. Después toca los números en el mismo orden.'),
  ('memory-2-1','Recuerda el orden de los números','[1,2,3,4,5]'::jsonb,'[4,1,5]'::jsonb,'Puedes volver a mirar. Después toca los números en el mismo orden.'),
  ('memory-2-2','Recuerda el orden de los números','[1,2,3,4,5]'::jsonb,'[3,5,1]'::jsonb,'Puedes volver a mirar. Después toca los números en el mismo orden.'),
  ('memory-2-3','Recuerda el orden de los números','[1,2,3,4,5]'::jsonb,'[5,3,4]'::jsonb,'Puedes volver a mirar. Después toca los números en el mismo orden.'),
  ('memory-2-4','Recuerda el orden de los números','[1,2,3,4,5]'::jsonb,'[2,3,5]'::jsonb,'Puedes volver a mirar. Después toca los números en el mismo orden.'),
  ('memory-2-5','Recuerda el orden de los números','[1,2,3,4,5]'::jsonb,'[1,5,2]'::jsonb,'Puedes volver a mirar. Después toca los números en el mismo orden.'),
  ('memory-3-1','Recuerda el orden de los números','[1,2,3,4,5]'::jsonb,'[2,5,1,3]'::jsonb,'Puedes volver a mirar. Después toca los números en el mismo orden.'),
  ('memory-3-2','Recuerda el orden de los números','[1,2,3,4,5]'::jsonb,'[5,2,3,1]'::jsonb,'Puedes volver a mirar. Después toca los números en el mismo orden.'),
  ('memory-3-3','Recuerda el orden de los números','[1,2,3,4,5]'::jsonb,'[1,3,2,5]'::jsonb,'Puedes volver a mirar. Después toca los números en el mismo orden.'),
  ('memory-3-4','Recuerda el orden de los números','[1,2,3,4,5]'::jsonb,'[4,5,2,1]'::jsonb,'Puedes volver a mirar. Después toca los números en el mismo orden.'),
  ('memory-3-5','Recuerda el orden de los números','[1,2,3,4,5]'::jsonb,'[3,2,5,4]'::jsonb,'Puedes volver a mirar. Después toca los números en el mismo orden.')
 ) as v(id,prompt,options,solution,hint)
 where a.id=v.id;
 get diagnostics n = row_count;
 if n<>45 then raise exception 'Se esperaban 45 retos y se actualizaron %',n; end if;
end $$;
