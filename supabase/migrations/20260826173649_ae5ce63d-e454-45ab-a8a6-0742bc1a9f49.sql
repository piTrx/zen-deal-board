
DROP POLICY IF EXISTS "Team members can view invitations" ON public.team_invitations;
CREATE POLICY "Inviter or admin can view invitations"
ON public.team_invitations FOR SELECT TO authenticated
USING (
  invited_by = auth.uid()
  OR (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_invitations.team_id AND tm.user_id = auth.uid()
    )
  )
);
