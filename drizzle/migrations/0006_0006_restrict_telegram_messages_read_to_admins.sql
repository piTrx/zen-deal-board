DROP POLICY IF EXISTS "Allow authenticated users to read all Telegram messages" ON public.telegram_messages;

CREATE POLICY "Admins can read Telegram messages"
ON public.telegram_messages
FOR SELECT
TO authenticated
USING (private.has_role(auth.uid(), 'admin'));