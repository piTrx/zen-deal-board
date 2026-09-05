ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'whatsapp';
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'visit';

ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'EUR';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'EUR';