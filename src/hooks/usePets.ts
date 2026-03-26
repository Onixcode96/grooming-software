import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Pet {
  id: string;
  name: string;
  type: string;
  breed: string;
  weight: number;
  age: number;
  date_of_birth: string | null;
  photo: string;
  allergies: string[] | null;
  notes: string | null;
  last_visit: string | null;
}

export const usePets = () => {
  return useQuery({
    queryKey: ["pets"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("pets")
        .select("id, name, type, breed, weight, age, date_of_birth, photo, allergies, notes, last_visit")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Pet[];
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useAddPet = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pet: Omit<Pet, "id" | "age" | "last_visit"> & { user_id: string; age: number }) => {
      const { data, error } = await supabase
        .from("pets")
        .insert(pet)
        .select("id, name, type, breed, weight, age, date_of_birth, photo, allergies, notes, last_visit")
        .single();
      if (error) throw error;
      return data as Pet;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["pets"] });
      toast.success(`${data.name} has been added! 🐾`);
    },
    onError: () => toast.error("Failed to add pet"),
  });
};

export const useDeletePet = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pets").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pets"] });
      toast.success("Pet removed");
    },
    onError: () => toast.error("Failed to delete pet"),
  });
};
