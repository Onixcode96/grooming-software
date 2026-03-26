
-- Create business_hours table
CREATE TABLE public.business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week integer NOT NULL UNIQUE CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_open boolean NOT NULL DEFAULT true,
  open_time time without time zone NOT NULL DEFAULT '09:00',
  close_time time without time zone NOT NULL DEFAULT '18:00',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Seed default data (0=Mon, 6=Sun)
INSERT INTO public.business_hours (day_of_week, is_open, open_time, close_time) VALUES
  (0, true, '09:00', '18:00'),
  (1, true, '09:00', '18:00'),
  (2, true, '09:00', '18:00'),
  (3, true, '09:00', '18:00'),
  (4, true, '09:00', '18:00'),
  (5, true, '09:00', '13:00'),
  (6, false, '09:00', '18:00');

-- Enable RLS
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

-- Anyone can view business hours
CREATE POLICY "Anyone can view business hours"
ON public.business_hours FOR SELECT
USING (true);

-- Only admins can update
CREATE POLICY "Admins can update business hours"
ON public.business_hours FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert
CREATE POLICY "Admins can insert business hours"
ON public.business_hours FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_business_hours_updated_at
BEFORE UPDATE ON public.business_hours
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
