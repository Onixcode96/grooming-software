import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { getTenantId } from "@/hooks/useTenant";

export interface Service {
  id: string;
  name: string;
  description: string;
  icon: string;
  price: number;
  duration_minutes: number;
  sort_order: number;
  created_at: string;
  name_it: string;
  name_en: string;
  description_it: string;
  description_en: string;
}

export type ServiceInput = Omit<Service, "id" | "created_at">;

const fetchServices = async (): Promise<Service[]> => {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data as Service[];
};

/** Returns services with `name` and `description` resolved to the active locale */
export const useServices = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith("it") ? "it" : "en";

  const query = useQuery({
    queryKey: ["services"],
    queryFn: fetchServices,
  });

  const localizedData = useMemo(() => {
    if (!query.data) return undefined;
    return query.data.map((s) => ({
      ...s,
      name: (lang === "it" ? s.name_it : s.name_en) || s.name,
      description: (lang === "it" ? s.description_it : s.description_en) || s.description,
    }));
  }, [query.data, lang]);

  return { ...query, data: localizedData };
};

/** Returns raw services without locale resolution (for admin editing) */
export const useServicesRaw = () => {
  return useQuery({
    queryKey: ["services"],
    queryFn: fetchServices,
  });
};

export const useCreateService = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<ServiceInput> & { name: string }) => {
      const tenant_id = await getTenantId();
      const { error } = await supabase.from("services").insert({ ...input, tenant_id } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services"] });
      toast({ title: "Servizio creato ✅", description: "Il nuovo servizio è stato aggiunto." });
    },
    onError: (e: Error) => {
      toast({ title: "Errore", description: e.message, variant: "destructive" });
    },
  });
};

export const useUpdateService = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Service> & { id: string }) => {
      const { error } = await supabase.from("services").update(input as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services"] });
      toast({ title: "Servizio aggiornato ✅", description: "Le modifiche sono state salvate." });
    },
    onError: (e: Error) => {
      toast({ title: "Errore", description: e.message, variant: "destructive" });
    },
  });
};

export const useDeleteService = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services"] });
      toast({ title: "Servizio eliminato 🗑️", description: "Il servizio è stato rimosso." });
    },
    onError: (e: Error) => {
      toast({ title: "Errore", description: e.message, variant: "destructive" });
    },
  });
};
