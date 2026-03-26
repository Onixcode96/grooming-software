
-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  animal_type TEXT NOT NULL,
  breed TEXT NOT NULL,
  size TEXT NOT NULL,
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Users can view their own appointments; admin can see all
CREATE POLICY "Users can view own appointments or admin sees all"
ON public.appointments FOR SELECT
USING (
  auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role)
);

-- Users can insert their own appointments
CREATE POLICY "Users can create own appointments"
ON public.appointments FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own; admin can update all
CREATE POLICY "Users can update own appointments or admin updates all"
ON public.appointments FOR UPDATE
USING (
  auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role)
);

-- Admin can delete
CREATE POLICY "Admin can delete appointments"
ON public.appointments FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for fast availability lookups
CREATE INDEX idx_appointments_date_time ON public.appointments (date, time);
CREATE INDEX idx_appointments_user ON public.appointments (user_id);

-- Function to check slot availability atomically
CREATE OR REPLACE FUNCTION public.book_appointment(
  p_user_id UUID,
  p_animal_type TEXT,
  p_breed TEXT,
  p_size TEXT,
  p_service_id TEXT,
  p_service_name TEXT,
  p_date DATE,
  p_time TIME,
  p_duration_minutes INTEGER,
  p_price NUMERIC,
  p_notes TEXT DEFAULT ''
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id UUID;
  v_conflict BOOLEAN;
BEGIN
  -- Check for overlapping appointments
  SELECT EXISTS (
    SELECT 1 FROM public.appointments
    WHERE date = p_date
      AND status IN ('confirmed', 'pending')
      AND (
        -- New appointment overlaps with existing
        (p_time::time, (p_time::time + (p_duration_minutes || ' minutes')::interval)) OVERLAPS
        (time, (time + (duration_minutes || ' minutes')::interval))
      )
  ) INTO v_conflict;

  IF v_conflict THEN
    RAISE EXCEPTION 'SLOT_TAKEN';
  END IF;

  INSERT INTO public.appointments (user_id, animal_type, breed, size, service_id, service_name, date, time, duration_minutes, price, notes)
  VALUES (p_user_id, p_animal_type, p_breed, p_size, p_service_id, p_service_name, p_date, p_time, p_duration_minutes, p_price, p_notes)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
