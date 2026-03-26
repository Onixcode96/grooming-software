import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

let cachedTenantId: string | null = null;

export const useTenant = () => {
  const [tenantId, setTenantId] = useState<string | null>(cachedTenantId);
  const [loading, setLoading] = useState(!cachedTenantId);

  useEffect(() => {
    if (cachedTenantId) return;

    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase.rpc("get_user_tenant_id", { _user_id: user.id });
      if (data) {
        cachedTenantId = data;
        setTenantId(data);
      }
      setLoading(false);
    };

    fetch();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        cachedTenantId = null;
        setTenantId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { tenantId, loading };
};

/** Utility to get tenant_id for the current user (one-shot) */
export const getTenantId = async (): Promise<string | null> => {
  if (cachedTenantId) return cachedTenantId;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.rpc("get_user_tenant_id", { _user_id: user.id });
  if (data) cachedTenantId = data;
  return data;
};
