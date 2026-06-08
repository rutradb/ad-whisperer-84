import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { STALE_TIMES } from "@/lib/queryKeys";

export interface ABTestRecord {
  id: string;
  user_id: string;
  test_name: string;
  variable_type: "creative" | "audience" | "placement" | "bidding";
  base_adset_id: string;
  variant_adset_ids: string[];
  status: "running" | "completed" | "stopped";
  winner_adset_id?: string;
  confidence_level?: number;
  primary_metric: string;
  started_at: string;
  ended_at?: string;
  snapshots: any[];
  created_at: string;
}

export function useABTests(userId: string | undefined) {
  return useQuery({
    queryKey: ["ab-tests", userId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("ab_test_results")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ABTestRecord[];
    },
    enabled: !!userId,
    staleTime: STALE_TIMES.STANDARD,
  });
}

export function useCreateABTest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (test: Omit<ABTestRecord, "id" | "created_at" | "started_at">) => {
      const { data, error } = await (supabase as any)
        .from("ab_test_results")
        .insert(test)
        .select()
        .single();
      if (error) throw error;
      return data as ABTestRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ab-tests"] });
      toast({ title: "Teste A/B registrado" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao registrar teste", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateABTest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<ABTestRecord>) => {
      const { error } = await (supabase as any)
        .from("ab_test_results")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ab-tests"] });
      toast({ title: "Teste atualizado" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao atualizar teste", description: err.message, variant: "destructive" });
    },
  });
}
