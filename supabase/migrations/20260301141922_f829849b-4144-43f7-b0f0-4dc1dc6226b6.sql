
-- Create services table
CREATE TABLE public.services (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '✂️',
  price numeric NOT NULL DEFAULT 0,
  duration_minutes integer NOT NULL DEFAULT 30,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Everyone can read services
CREATE POLICY "Anyone can view services"
ON public.services FOR SELECT
USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert services"
ON public.services FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update
CREATE POLICY "Admins can update services"
ON public.services FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "Admins can delete services"
ON public.services FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Seed initial data from the existing mock services
INSERT INTO public.services (name, description, icon, price, duration_minutes, sort_order) VALUES
  ('Bagno & Asciugatura', 'Bagno con shampoo specifico, balsamo e asciugatura professionale', '🛁', 35, 50, 1),
  ('Toelettatura Completa', 'Bagno, tosatura, taglio unghie, pulizia orecchie', '✂️', 60, 90, 2),
  ('Solo Tosatura', 'Tosatura e rifinitura del pelo senza bagno', '💇', 40, 60, 3),
  ('Trattamento SPA', 'Bagno aromatico, maschera nutriente, massaggio rilassante', '💆', 70, 105, 4),
  ('Taglio Unghie & Orecchie', 'Taglio e limatura unghie, pulizia orecchie', '💅', 15, 20, 5),
  ('Igiene Dentale', 'Pulizia denti, alito fresco e controllo gengivale', '🦷', 22, 25, 6);
