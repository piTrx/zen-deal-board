
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_on_deal_insert() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_team_member(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.seed_default_pipeline(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ensure_default_team() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_team_invitation(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_invitation_preview(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_team_member(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.seed_default_pipeline(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ensure_default_team() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.accept_team_invitation(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_invitation_preview(uuid) TO anon, authenticated, service_role;
