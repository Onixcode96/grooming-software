
-- Create settings table (single-row pattern for global app config)
CREATE TABLE public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL DEFAULT 'PetGrooming',
  tagline text NOT NULL DEFAULT 'La toelettatura professionale per il tuo amico a 4 zampe',
  address text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  instagram_url text NOT NULL DEFAULT '',
  facebook_url text NOT NULL DEFAULT '',
  cancellation_policy text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (needed for landing page, etc.)
CREATE POLICY "Anyone can view settings"
ON public.settings FOR SELECT
USING (true);

-- Only admins can update
CREATE POLICY "Admins can update settings"
ON public.settings FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert (for initial seed)
CREATE POLICY "Admins can insert settings"
ON public.settings FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed a default row
INSERT INTO public.settings (business_name, tagline) VALUES ('PetGrooming', 'La toelettatura professionale per il tuo amico a 4 zampe');

-- Trigger for updated_at
CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
