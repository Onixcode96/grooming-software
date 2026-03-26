
-- Replace book_appointment to allow overbooking (status will be 'pending' for admin review)
CREATE OR REPLACE FUNCTION public.book_appointment(
  p_user_id uuid, p_animal_type text, p_breed text, p_size text,
  p_service_id text, p_service_name text, p_date date, p_time time without time zone,
  p_duration_minutes integer, p_price numeric, p_notes text DEFAULT ''::text,
  p_payment_method text DEFAULT 'pending'::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.appointments (
    user_id, animal_type, breed, size, service_id, service_name,
    date, time, duration_minutes, price, notes, payment_method, status
  )
  VALUES (
    p_user_id, p_animal_type, p_breed, p_size, p_service_id, p_service_name,
    p_date, p_time, p_duration_minutes, p_price, p_notes, p_payment_method, 'pending'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
