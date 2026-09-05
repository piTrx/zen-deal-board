import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DealCategory {
  id: string;
  name: string;
  color: string;
  position: number;
  created_by: string;
}

export function useDealCategories() {
  return useQuery({
    queryKey: ["deal_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deal_categories")
        .select("id, name, color, position, created_by")
        .order("position");
      if (error) throw error;
      return data as DealCategory[];
    },
  });
}

export function useCreateDealCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (category: { name: string; color: string; position: number; created_by: string }) => {
      const { data, error } = await supabase.from("deal_categories").insert(category).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["deal_categories"] }),
  });
}

export function useUpdateDealCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; color?: string; position?: number }) => {
      const { error } = await supabase.from("deal_categories").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["deal_categories"] }),
  });
}

export function useDeleteDealCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deal_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal_categories"] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });
}
