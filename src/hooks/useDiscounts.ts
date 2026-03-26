import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DiscountSetting {
  id: string;
  percentage: number;
  service_id: string | null;
  is_active: boolean;
  loyal_only: boolean;
  created_at: string;
  updated_at: string;
}

export const useDiscounts = () => {
  return useQuery({
    queryKey: ["discount_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discount_settings" as any)
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return (data || []) as unknown as DiscountSetting[];
    },
  });
};

export const getDiscountForService = (
  discounts: DiscountSetting[],
  serviceId: string,
  isLoyal: boolean
): number => {
  // Find a discount matching this service (or null = all services)
  const match = discounts.find(
    (d) =>
      d.is_active &&
      (d.service_id === serviceId || d.service_id === null) &&
      (!d.loyal_only || isLoyal)
  );
  return match?.percentage ?? 0;
};
