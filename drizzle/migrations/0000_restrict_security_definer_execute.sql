-- Internal RLS helpers: not meant to be callable through the API
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_team_member(uuid, uuid) FROM PUBLIC, anon, authenticated;

-- Invitation preview is only used after sign-in; no anonymous access needed
REVOKE EXECUTE ON FUNCTION public.get_invitation_preview(uuid) FROM PUBLIC, anon;

-- Trigger-only functions must never be API-callable
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_deal_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.accept_team_invitation(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.ensure_default_team() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.seed_default_pipeline(uuid) FROM PUBLIC, anon;
