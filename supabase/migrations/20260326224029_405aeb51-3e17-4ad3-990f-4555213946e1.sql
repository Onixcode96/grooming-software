
-- ============================================================
-- MULTI-TENANT MIGRATION: Add tenant_id to all tables
-- ============================================================

-- 1. Add tenant_id column to ALL tables (nullable first for backfill)
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.business_hours ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.discount_settings ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.push_config ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS tenant_id uuid;

-- 2. Backfill existing data with current admin's user_id as tenant_id
DO $$
DECLARE v_admin_id uuid;
BEGIN
  SELECT user_id INTO v_admin_id FROM public.user_roles WHERE role = 'admin' LIMIT 1;
  IF v_admin_id IS NOT NULL THEN
    UPDATE public.user_roles SET tenant_id = v_admin_id WHERE tenant_id IS NULL;
    UPDATE public.profiles SET tenant_id = v_admin_id WHERE tenant_id IS NULL;
    UPDATE public.services SET tenant_id = v_admin_id WHERE tenant_id IS NULL;
    UPDATE public.settings SET tenant_id = v_admin_id WHERE tenant_id IS NULL;
    UPDATE public.business_hours SET tenant_id = v_admin_id WHERE tenant_id IS NULL;
    UPDATE public.discount_settings SET tenant_id = v_admin_id WHERE tenant_id IS NULL;
    UPDATE public.appointments SET tenant_id = v_admin_id WHERE tenant_id IS NULL;
    UPDATE public.pets SET tenant_id = v_admin_id WHERE tenant_id IS NULL;
    UPDATE public.messages SET tenant_id = v_admin_id WHERE tenant_id IS NULL;
    UPDATE public.push_config SET tenant_id = v_admin_id WHERE tenant_id IS NULL;
    UPDATE public.push_subscriptions SET tenant_id = v_admin_id WHERE tenant_id IS NULL;
  END IF;
END $$;

-- 3. Create indexes on tenant_id for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant ON public.user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_services_tenant ON public.services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_settings_tenant ON public.settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_business_hours_tenant ON public.business_hours(tenant_id);
CREATE INDEX IF NOT EXISTS idx_discount_settings_tenant ON public.discount_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant ON public.appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pets_tenant ON public.pets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_tenant ON public.messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_tenant ON public.push_subscriptions(tenant_id);

-- 4. Security definer function to get user's tenant_id
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- 5. Update get_admin_user_id to be tenant-aware
CREATE OR REPLACE FUNCTION public.get_admin_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id FROM public.user_roles
  WHERE role = 'admin'
    AND tenant_id = get_user_tenant_id(auth.uid())
  LIMIT 1
$$;

-- ============================================================
-- 6. DROP ALL EXISTING RLS POLICIES
-- ============================================================

-- user_roles
DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

-- profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- services
DROP POLICY IF EXISTS "Admins can delete services" ON public.services;
DROP POLICY IF EXISTS "Admins can insert services" ON public.services;
DROP POLICY IF EXISTS "Admins can update services" ON public.services;
DROP POLICY IF EXISTS "Anyone can view services" ON public.services;

-- settings
DROP POLICY IF EXISTS "Admins can insert settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.settings;
DROP POLICY IF EXISTS "Anyone can view settings" ON public.settings;

-- business_hours
DROP POLICY IF EXISTS "Admins can insert business hours" ON public.business_hours;
DROP POLICY IF EXISTS "Admins can update business hours" ON public.business_hours;
DROP POLICY IF EXISTS "Anyone can view business hours" ON public.business_hours;

-- discount_settings
DROP POLICY IF EXISTS "Admins can delete discounts" ON public.discount_settings;
DROP POLICY IF EXISTS "Admins can insert discounts" ON public.discount_settings;
DROP POLICY IF EXISTS "Admins can update discounts" ON public.discount_settings;
DROP POLICY IF EXISTS "Anyone can view active discounts" ON public.discount_settings;

-- appointments
DROP POLICY IF EXISTS "Admin can delete appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can create own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update own appointments or admin updates all" ON public.appointments;
DROP POLICY IF EXISTS "Users can view own appointments or admin sees all" ON public.appointments;

-- pets
DROP POLICY IF EXISTS "Admins can view all pets" ON public.pets;
DROP POLICY IF EXISTS "Users can delete own pets" ON public.pets;
DROP POLICY IF EXISTS "Users can insert own pets" ON public.pets;
DROP POLICY IF EXISTS "Users can update own pets" ON public.pets;
DROP POLICY IF EXISTS "Users can view own pets" ON public.pets;

-- messages
DROP POLICY IF EXISTS "Users can delete own messages or admin deletes all" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages or admin updates all" ON public.messages;
DROP POLICY IF EXISTS "Users can view own messages or admin sees all" ON public.messages;

-- push_config
DROP POLICY IF EXISTS "Admins can manage push config" ON public.push_config;

-- push_subscriptions
DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can insert own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can view own push subscriptions" ON public.push_subscriptions;

-- ============================================================
-- 7. RECREATE ALL RLS POLICIES WITH TENANT ISOLATION
-- ============================================================

-- === user_roles ===
CREATE POLICY "Tenant: view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid())));

CREATE POLICY "Tenant: admin manage roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant: admin update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant: admin delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));

-- === profiles ===
CREATE POLICY "Tenant: view profiles in same tenant"
  ON public.profiles FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant: insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Tenant: update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- === services ===
CREATE POLICY "Tenant: view services in same tenant"
  ON public.services FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant: admin insert services"
  ON public.services FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant: admin update services"
  ON public.services FOR UPDATE TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant: admin delete services"
  ON public.services FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));

-- === settings ===
CREATE POLICY "Tenant: view settings in same tenant"
  ON public.settings FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant: admin insert settings"
  ON public.settings FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant: admin update settings"
  ON public.settings FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));

-- === business_hours ===
CREATE POLICY "Tenant: view hours in same tenant"
  ON public.business_hours FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant: admin insert hours"
  ON public.business_hours FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant: admin update hours"
  ON public.business_hours FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));

-- === discount_settings ===
CREATE POLICY "Tenant: view discounts in same tenant"
  ON public.discount_settings FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant: admin insert discounts"
  ON public.discount_settings FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant: admin update discounts"
  ON public.discount_settings FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant: admin delete discounts"
  ON public.discount_settings FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));

-- === appointments ===
CREATE POLICY "Tenant: view appointments in same tenant"
  ON public.appointments FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND (auth.uid() = user_id OR has_role(auth.uid(), 'admin')));

CREATE POLICY "Tenant: create own appointments"
  ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant: update appointments"
  ON public.appointments FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND (auth.uid() = user_id OR has_role(auth.uid(), 'admin')));

CREATE POLICY "Tenant: admin delete appointments"
  ON public.appointments FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));

-- === pets ===
CREATE POLICY "Tenant: view own pets or admin sees all in tenant"
  ON public.pets FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND (auth.uid() = user_id OR has_role(auth.uid(), 'admin')));

CREATE POLICY "Tenant: insert own pets"
  ON public.pets FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant: update own pets"
  ON public.pets FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant: delete own pets"
  ON public.pets FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));

-- === messages ===
CREATE POLICY "Tenant: view messages in same tenant"
  ON public.messages FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR sender_id = auth.uid() OR receiver_id = auth.uid()));

CREATE POLICY "Tenant: send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant: update messages"
  ON public.messages FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR sender_id = auth.uid()));

CREATE POLICY "Tenant: delete messages"
  ON public.messages FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR sender_id = auth.uid()));

-- === push_config ===
CREATE POLICY "Tenant: admin manage push config"
  ON public.push_config FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));

-- === push_subscriptions ===
CREATE POLICY "Tenant: view own push subs"
  ON public.push_subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant: insert own push subs"
  ON public.push_subscriptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant: delete own push subs"
  ON public.push_subscriptions FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));

-- ============================================================
-- 8. Update handle_new_user trigger to set tenant_id
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  -- Default tenant: first admin (for single-tenant migration)
  -- In multi-tenant mode, pass tenant_id via user metadata during signup
  v_tenant_id := COALESCE(
    (NEW.raw_user_meta_data->>'tenant_id')::uuid,
    (SELECT user_id FROM public.user_roles WHERE role = 'admin' LIMIT 1)
  );

  INSERT INTO public.profiles (user_id, display_name, tenant_id)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), v_tenant_id);

  INSERT INTO public.user_roles (user_id, role, tenant_id)
  VALUES (NEW.id, 'client', v_tenant_id);

  RETURN NEW;
END;
$$;

-- ============================================================
-- 9. Update book_appointment RPC to include tenant_id
-- ============================================================
CREATE OR REPLACE FUNCTION public.book_appointment(
  p_user_id uuid, p_animal_type text, p_breed text, p_size text,
  p_service_id text, p_service_name text, p_date date, p_time time,
  p_duration_minutes integer, p_price numeric, p_notes text DEFAULT '',
  p_payment_method text DEFAULT 'pending'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_tenant_id uuid;
BEGIN
  -- Get user's tenant
  SELECT tenant_id INTO v_tenant_id FROM public.user_roles WHERE user_id = p_user_id LIMIT 1;

  INSERT INTO public.appointments (
    user_id, animal_type, breed, size, service_id, service_name,
    date, time, duration_minutes, price, notes, payment_method, status, tenant_id
  )
  VALUES (
    p_user_id, p_animal_type, p_breed, p_size, p_service_id, p_service_name,
    p_date, p_time, p_duration_minutes, p_price, p_notes, p_payment_method, 'pending', v_tenant_id
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ============================================================
-- 10. Update send_booking_confirmation_message trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.send_booking_confirmation_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid;
  v_tenant_id uuid;
BEGIN
  v_tenant_id := NEW.tenant_id;
  SELECT user_id INTO v_admin_id FROM public.user_roles WHERE role = 'admin' AND tenant_id = v_tenant_id LIMIT 1;

  IF v_admin_id IS NOT NULL AND NEW.user_id != v_admin_id THEN
    INSERT INTO public.messages (sender_id, receiver_id, content, tenant_id)
    VALUES (v_admin_id, NEW.user_id, '@@i18n:chatAuto.bookingRequested', v_tenant_id);
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- 11. Update mark_my_messages_as_read to be tenant-scoped
-- ============================================================
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
    AND read = false
    AND tenant_id = get_user_tenant_id(auth.uid());

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$;
