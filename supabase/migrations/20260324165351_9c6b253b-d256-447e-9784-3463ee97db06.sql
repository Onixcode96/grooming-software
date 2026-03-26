ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS allow_cash boolean NOT NULL DEFAULT true;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS allow_online boolean NOT NULL DEFAULT false;