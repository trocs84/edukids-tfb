-- Restrict a dashboard-created administrative helper, when present.
DO $$ BEGIN
 IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
  EXECUTE 'REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated';
 END IF;
END $$;
