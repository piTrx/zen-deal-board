CREATE TABLE public.team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'rep',
  token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  invited_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_at timestamptz,
  accepted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_team_invitations_team ON public.team_invitations(team_id);
CREATE UNIQUE INDEX idx_team_invitations_pending_email ON public.team_invitations(team_id, lower(email)) WHERE status = 'pending';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_invitations TO authenticated;
GRANT ALL ON public.team_invitations TO service_role;

ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view invitations"
ON public.team_invitations FOR SELECT TO authenticated
USING (
  invited_by = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = team_invitations.team_id AND tm.user_id = auth.uid())
);

CREATE POLICY "Team members can create invitations"
ON public.team_invitations FOR INSERT TO authenticated
WITH CHECK (
  invited_by = auth.uid()
  AND EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = team_invitations.team_id AND tm.user_id = auth.uid())
);

CREATE POLICY "Inviter or admin can update invitations"
ON public.team_invitations FOR UPDATE TO authenticated
USING (invited_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (invited_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Inviter or admin can delete invitations"
ON public.team_invitations FOR DELETE TO authenticated
USING (invited_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_team_invitations_updated_at
BEFORE UPDATE ON public.team_invitations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure the current user has a team
CREATE OR REPLACE FUNCTION public.ensure_default_team()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id uuid;
  v_name text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT tm.team_id INTO v_team_id
  FROM public.team_members tm
  WHERE tm.user_id = auth.uid()
  ORDER BY tm.joined_at
  LIMIT 1;

  IF v_team_id IS NOT NULL THEN
    RETURN v_team_id;
  END IF;

  SELECT NULLIF(trim(coalesce(p.company, '')), '') INTO v_name
  FROM public.profiles p WHERE p.user_id = auth.uid() LIMIT 1;

  INSERT INTO public.teams (name, created_by)
  VALUES (coalesce(v_name, 'My Team'), auth.uid())
  RETURNING id INTO v_team_id;

  INSERT INTO public.team_members (team_id, user_id)
  VALUES (v_team_id, auth.uid());

  RETURN v_team_id;
END;
$$;

-- Public preview of an invitation by token
CREATE OR REPLACE FUNCTION public.get_invitation_preview(_token uuid)
RETURNS TABLE (email text, role app_role, team_name text, status text, expires_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.email, i.role, t.name, i.status, i.expires_at
  FROM public.team_invitations i
  JOIN public.teams t ON t.id = i.team_id
  WHERE i.token = _token
$$;

GRANT EXECUTE ON FUNCTION public.get_invitation_preview(uuid) TO anon, authenticated;

-- Accept an invitation
CREATE OR REPLACE FUNCTION public.accept_team_invitation(_token uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv public.team_invitations;
  v_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();

  SELECT * INTO v_inv FROM public.team_invitations WHERE token = _token;
  IF v_inv IS NULL THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;
  IF v_inv.status <> 'pending' THEN
    RAISE EXCEPTION 'Invitation is no longer valid';
  END IF;
  IF v_inv.expires_at < now() THEN
    RAISE EXCEPTION 'Invitation has expired';
  END IF;
  IF lower(v_inv.email) <> lower(coalesce(v_email, '')) THEN
    RAISE EXCEPTION 'This invitation was sent to a different email address';
  END IF;

  INSERT INTO public.team_members (team_id, user_id)
  VALUES (v_inv.team_id, auth.uid())
  ON CONFLICT DO NOTHING;

  DELETE FROM public.user_roles WHERE user_id = auth.uid();
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), v_inv.role)
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.team_invitations
  SET status = 'accepted', accepted_at = now(), accepted_by = auth.uid()
  WHERE id = v_inv.id;

  RETURN v_inv.team_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_team_invitation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_default_team() TO authenticated;