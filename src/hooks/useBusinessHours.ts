import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface BusinessHour {
  id: string;
  day_of_week: number;
  is_open: boolean;
  open_time: string;
  close_time: string;
}

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const getDayName = (day: number) => DAY_NAMES[day] || "";

export const useBusinessHours = () => {
  return useQuery({
    queryKey: ["business_hours"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_hours")
        .select("*")
        .order("day_of_week", { ascending: true });
      if (error) throw error;
      return (data as any[]).map((d) => ({
        id: d.id,
        day_of_week: d.day_of_week,
        is_open: d.is_open,
        open_time: d.open_time,
        close_time: d.close_time,
      })) as BusinessHour[];
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdateBusinessHour = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: string; is_open?: boolean; open_time?: string; close_time?: string }) => {
      const { id, ...rest } = updates;
      const { error } = await supabase
        .from("business_hours")
        .update(rest)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business_hours"] });
      toast({ title: "Hours updated", description: "Changes saved successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not save hours.", variant: "destructive" });
    },
  });
};
