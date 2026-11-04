-- Migración: valoración de la actividad con la escala Smileyometer (CU-09)
-- Fecha: 2026-11-04
-- Autor: Antonio Rivera
--
-- Es un cambio aditivo: añade una columna opcional y una función nueva.
-- No toca filas existentes, así que se puede aplicar sin migrar datos.
-- Se puede ejecutar más de una vez sin error (if not exists / or replace).

-- 1 = "Muy mal" ... 5 = "Muy bien". NULL = no se ha valorado (o se saltó la pregunta).
ALTER TABLE public.play_sessions
ADD COLUMN IF NOT EXISTS fun_rating smallint CHECK (fun_rating BETWEEN 1 AND 5);

-- Los clientes no tienen permiso de UPDATE sobre play_sessions (igual que con finish_play),
-- así que la valoración solo se puede escribir a través de esta función.
CREATE OR REPLACE FUNCTION private.rate_play(p_session uuid, p_rating integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE s public.play_sessions;
BEGIN
 SELECT * INTO s FROM public.play_sessions WHERE id = p_session FOR UPDATE;
 IF s.id IS NULL OR auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.child_profiles WHERE id = s.profile_id AND adult_id = auth.uid()) THEN
  RAISE EXCEPTION 'Access denied';
 END IF;
 IF p_rating IS NULL OR p_rating NOT BETWEEN 1 AND 5 THEN RAISE EXCEPTION 'Invalid rating'; END IF;
 -- Solo se valora una actividad terminada (no una activa ni una interrumpida).
 IF s.status <> 'completed' THEN RAISE EXCEPTION 'Session not completed'; END IF;
 IF s.fun_rating IS NOT NULL THEN
  -- Repetir el mismo envío (por ejemplo, tras un corte de red) no es un error; cambiarlo sí.
  IF s.fun_rating = p_rating THEN RETURN jsonb_build_object('id', s.id, 'rating', s.fun_rating, 'replayed', true); END IF;
  RAISE EXCEPTION 'Already rated';
 END IF;
 UPDATE public.play_sessions SET fun_rating = p_rating WHERE id = s.id;
 RETURN jsonb_build_object('id', s.id, 'rating', p_rating, 'replayed', false);
END $$;

REVOKE ALL ON FUNCTION private.rate_play(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.rate_play(uuid, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.rate_play(p_session uuid, p_rating integer)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$ SELECT private.rate_play(p_session, p_rating) $$;

REVOKE ALL ON FUNCTION public.rate_play(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rate_play(uuid, integer) TO authenticated;
