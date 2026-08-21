
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_deal_insert() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE ALL ON FUNCTION public.is_team_member(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.seed_default_pipeline(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.ensure_default_team() FROM anon;
REVOKE ALL ON FUNCTION public.accept_team_invitation(uuid) FROM anon;
