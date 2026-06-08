import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { STALE_TIMES } from "@/lib/queryKeys";

export interface TargetingTemplate {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  targeting_spec: Record<string, any>;
  category: string;
  is_shared: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export function useTargetingTemplates(userId: string | undefined) {
  return useQuery({
    queryKey: ["targeting-templates", userId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("targeting_templates")
        .select("*")
        .or(`user_id.eq.${userId!},is_shared.eq.true`)
        .order("usage_count", { ascending: false });
      if (error) throw error;
      return data as TargetingTemplate[];
    },
    enabled: !!userId,
    staleTime: STALE_TIMES.SLOW_CHANGING,
  });
}

export function useSaveTargetingTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (template: {
      name: string;
      description?: string;
      targeting_spec: Record<string, any>;
      category?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await (supabase as any)
        .from("targeting_templates")
        .insert({
          user_id: user.id,
          name: template.name,
          description: template.description || null,
          targeting_spec: template.targeting_spec,
          category: template.category || "custom",
        })
        .select()
        .single();
      if (error) throw error;
      return data as TargetingTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["targeting-templates"] });
      toast({ title: "Template salvo com sucesso" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao salvar template", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteTargetingTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("targeting_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["targeting-templates"] });
      toast({ title: "Template removido" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao remover template", description: err.message, variant: "destructive" });
    },
  });
}

export function useIncrementTemplateUsage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: current } = await (supabase as any)
        .from("targeting_templates")
        .select("usage_count")
        .eq("id", id)
        .single();

      const { error } = await (supabase as any)
        .from("targeting_templates")
        .update({ usage_count: (current?.usage_count || 0) + 1 })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["targeting-templates"] });
    },
  });
}
