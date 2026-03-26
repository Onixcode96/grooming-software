CREATE OR REPLACE FUNCTION public.mark_my_messages_as_read()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_count integer;
BEGIN
  UPDATE public.messages
  SET read = true
  WHERE receiver_id = auth.uid()
    AND read = false;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_my_messages_as_read() TO authenticated;