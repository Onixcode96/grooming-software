CREATE OR REPLACE FUNCTION public.send_booking_confirmation_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_admin_id uuid;
BEGIN
  SELECT user_id INTO v_admin_id FROM public.user_roles WHERE role = 'admin' LIMIT 1;
  
  IF v_admin_id IS NOT NULL AND NEW.user_id != v_admin_id THEN
    INSERT INTO public.messages (sender_id, receiver_id, content)
    VALUES (v_admin_id, NEW.user_id, '@@i18n:chatAuto.bookingRequested');
  END IF;
  
  RETURN NEW;
END;
$function$