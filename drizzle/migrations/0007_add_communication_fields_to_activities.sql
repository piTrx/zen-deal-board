ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recipient text,
  ADD COLUMN IF NOT EXISTS occurred_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_activities_company_id ON public.activities (company_id);
CREATE INDEX IF NOT EXISTS idx_activities_occurred_at ON public.activities (occurred_at DESC);