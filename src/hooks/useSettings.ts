import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Settings {
  id: string;
  business_name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  instagram_url: string;
  facebook_url: string;
  cancellation_policy: string;
  privacy_policy: string;
  theme_color: string;
  allow_cash: boolean;
  allow_online: boolean;
  updated_at: string;
}

export const useSettings = () => {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Settings | null;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<Omit<Settings, "id" | "updated_at">>) => {
      // Get existing row id
      const { data: existing } = await supabase
        .from("settings")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase.from("settings").insert(updates as any);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("settings")
          .update(updates)
          .eq("id", existing.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast({ title: "Impostazioni salvate", description: "Le modifiche sono state applicate con successo." });
    },
    onError: () => {
      toast({ title: "Errore", description: "Impossibile salvare le impostazioni.", variant: "destructive" });
    },
  });
};
