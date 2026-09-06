CREATE TABLE public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction text NOT NULL CHECK (direction IN ('inbound','outbound')),
  from_number text NOT NULL,
  to_number text NOT NULL,
  body text,
  media_url text,
  message_sid text UNIQUE,
  status text NOT NULL DEFAULT 'received',
  error_message text,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  activity_id uuid REFERENCES public.activities(id) ON DELETE SET NULL,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_whatsapp_messages_contact ON public.whatsapp_messages (contact_id, created_at DESC);
CREATE INDEX idx_whatsapp_messages_deal ON public.whatsapp_messages (deal_id, created_at DESC);
CREATE INDEX idx_whatsapp_messages_created ON public.whatsapp_messages (created_at DESC);

GRANT SELECT ON public.whatsapp_messages TO authenticated;
GRANT ALL ON public.whatsapp_messages TO service_role;

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view whatsapp messages"
ON public.whatsapp_messages FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR (contact_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.contacts c
    WHERE c.id = whatsapp_messages.contact_id
      AND (c.created_by = auth.uid() OR private.is_team_member(auth.uid(), c.created_by))
  ))
  OR (deal_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.deals d
    WHERE d.id = whatsapp_messages.deal_id
      AND (d.created_by = auth.uid() OR d.owner_id = auth.uid() OR private.is_team_member(auth.uid(), d.created_by))
  ))
);
