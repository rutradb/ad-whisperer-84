import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { AutomatedRule } from "@/lib/rulesEngine";
import { STALE_TIMES } from "@/lib/queryKeys";

export function useAutomatedRules(userId: string | undefined) {
  return useQuery({
    queryKey: ["automated-rules", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automated_rules")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as AutomatedRule[];
    },
    enabled: !!userId,
    staleTime: STALE_TIMES.SLOW_CHANGING,
  });
}

export function useCreateRule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (rule: Omit<AutomatedRule, "id" | "created_at" | "last_run_at" | "last_run_result">) => {
      const { data, error } = await supabase
        .from("automated_rules")
        .insert(rule)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automated-rules"] });
      toast({ title: "Regra criada com sucesso" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao criar regra", description: err.message, variant: "destructive" });
    },
  });
}

export function useToggleRule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("automated_rules")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automated-rules"] });
      toast({ title: "Regra atualizada" });
    },
  });
}

export function useDeleteRule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("automated_rules")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automated-rules"] });
      toast({ title: "Regra removida" });
    },
  });
}
