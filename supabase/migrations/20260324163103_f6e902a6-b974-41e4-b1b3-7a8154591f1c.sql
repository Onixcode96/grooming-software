
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS name_it text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS name_en text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description_it text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description_en text NOT NULL DEFAULT '';

-- Copy existing name/description as Italian defaults
UPDATE public.services SET name_it = name, description_it = description WHERE name_it = '';
