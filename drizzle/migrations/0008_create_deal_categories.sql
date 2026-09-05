CREATE TABLE public.deal_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6366f1',
  position integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deal_categories TO authenticated;
GRANT ALL ON public.deal_categories TO service_role;

ALTER TABLE public.deal_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view deal categories"
ON public.deal_categories FOR SELECT TO authenticated
USING ((auth.uid() = created_by) OR private.is_team_member(auth.uid(), created_by));

CREATE POLICY "Users can create own deal categories"
ON public.deal_categories FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own deal categories"
ON public.deal_categories FOR UPDATE TO authenticated
USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own deal categories"
ON public.deal_categories FOR DELETE TO authenticated
USING (auth.uid() = created_by);

CREATE TRIGGER update_deal_categories_updated_at
BEFORE UPDATE ON public.deal_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.deals ADD COLUMN category_id uuid REFERENCES public.deal_categories(id) ON DELETE SET NULL;
CREATE INDEX idx_deals_category_id ON public.deals(category_id);