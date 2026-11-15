-- QUEST DAY: limit trusted user RPCs to signed-in Supabase sessions.
-- Applied to project yivabefhugxvigbsgkts on 2026-11-15.
-- No player data is changed. Supabase anonymous AUTH users still use
-- the authenticated API role; the unauthenticated 'anon' role is denied.
DO $migration$
DECLARE rpc RECORD;
BEGIN
  FOR rpc IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public'
      AND p.proname LIKE 'qd_%'
      AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon',rpc.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',rpc.signature);
  END LOOP;
END
$migration$;

-- Verification query:
-- SELECT count(*) FILTER (WHERE p.prosecdef) AS total,
--        count(*) FILTER (WHERE p.prosecdef AND has_function_privilege('anon',p.oid,'EXECUTE')) AS exposed_to_anon,
--        count(*) FILTER (WHERE p.prosecdef AND has_function_privilege('authenticated',p.oid,'EXECUTE')) AS signed_in
-- FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
-- WHERE n.nspname='public' AND p.proname LIKE 'qd_%';
-- Result after applying: total=25, exposed_to_anon=0, signed_in=25.
