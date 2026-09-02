ALTER FUNCTION public.accept_team_invitation(uuid) SET SCHEMA private;
ALTER FUNCTION public.ensure_default_team() SET SCHEMA private;
ALTER FUNCTION public.seed_default_pipeline(uuid) SET SCHEMA private;
ALTER FUNCTION public.get_invitation_preview(uuid) SET SCHEMA private;

GRANT EXECUTE ON FUNCTION private.accept_team_invitation(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.ensure_default_team() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.seed_default_pipeline(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.get_invitation_preview(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.accept_team_invitation(_token uuid)
RETURNS uuid LANGUAGE sql SECURITY INVOKER SET search_path = public
AS $$ SELECT private.accept_team_invitation(_token) $$;

CREATE OR REPLACE FUNCTION public.ensure_default_team()
RETURNS uuid LANGUAGE sql SECURITY INVOKER SET search_path = public
AS $$ SELECT private.ensure_default_team() $$;

CREATE OR REPLACE FUNCTION public.seed_default_pipeline(p_user_id uuid)
RETURNS uuid LANGUAGE sql SECURITY INVOKER SET search_path = public
AS $$ SELECT private.seed_default_pipeline(p_user_id) $$;

CREATE OR REPLACE FUNCTION public.get_invitation_preview(_token uuid)
RETURNS TABLE(email text, role public.app_role, team_name text, status text, expires_at timestamptz)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$ SELECT * FROM private.get_invitation_preview(_token) $$;

REVOKE EXECUTE ON FUNCTION public.accept_team_invitation(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.ensure_default_team() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.seed_default_pipeline(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_invitation_preview(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.accept_team_invitation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_default_team() TO authenticated;
GRANT EXECUTE ON FUNCTION public.seed_default_pipeline(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_invitation_preview(uuid) TO authenticated;
