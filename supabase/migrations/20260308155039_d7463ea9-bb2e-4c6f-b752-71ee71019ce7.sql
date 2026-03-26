
CREATE TABLE public.discount_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  percentage integer NOT NULL DEFAULT 10,
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  loyal_only boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.discount_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active discounts" ON public.discount_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert discounts" ON public.discount_settings
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update discounts" ON public.discount_settings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete discounts" ON public.discount_settings
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_discount_settings_updated_at
  BEFORE UPDATE ON public.discount_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
