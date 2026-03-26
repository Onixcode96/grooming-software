
-- Trigger function: send a confirmation message when an appointment is inserted
CREATE OR REPLACE FUNCTION public.send_booking_confirmation_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_id uuid;
BEGIN
  -- Get admin user id
  SELECT user_id INTO v_admin_id FROM public.user_roles WHERE role = 'admin' LIMIT 1;
  
  IF v_admin_id IS NOT NULL AND NEW.user_id != v_admin_id THEN
    INSERT INTO public.messages (sender_id, receiver_id, content)
    VALUES (v_admin_id, NEW.user_id, 'Ciao! Confermiamo che la prenotazione è andata a buon fine ✨');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on appointments insert
CREATE TRIGGER on_appointment_created_send_message
AFTER INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.send_booking_confirmation_message();
