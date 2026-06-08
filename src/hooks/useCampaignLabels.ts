import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { STALE_TIMES } from "@/lib/queryKeys";

export interface CampaignLabel {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface LabelAssignment {
  id: string;
  user_id: string;
  campaign_id: string;
  label_id: string;
  created_at: string;
}

export function useCampaignLabels(userId: string | undefined) {
  return useQuery({
    queryKey: ["campaign-labels", userId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("campaign_labels")
        .select("*")
        .eq("user_id", userId!)
        .order("name");
      if (error) throw error;
      return data as CampaignLabel[];
    },
    enabled: !!userId,
    staleTime: STALE_TIMES.SLOW_CHANGING,
  });
}

export function useLabelAssignments(userId: string | undefined) {
  return useQuery({
    queryKey: ["label-assignments", userId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("campaign_label_assignments")
        .select("*")
        .eq("user_id", userId!);
      if (error) throw error;
      return data as LabelAssignment[];
    },
    enabled: !!userId,
    staleTime: STALE_TIMES.SLOW_CHANGING,
  });
}

export function useCreateLabel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (label: { name: string; color: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await (supabase as any)
        .from("campaign_labels")
        .insert({ user_id: user.id, name: label.name, color: label.color })
        .select()
        .single();
      if (error) throw error;
      return data as CampaignLabel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-labels"] });
      toast({ title: "Label criada" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao criar label", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteLabel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("campaign_labels")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-labels"] });
      queryClient.invalidateQueries({ queryKey: ["label-assignments"] });
      toast({ title: "Label removida" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao remover label", description: err.message, variant: "destructive" });
    },
  });
}

export function useAssignLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ campaignId, labelId }: { campaignId: string; labelId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { error } = await (supabase as any)
        .from("campaign_label_assignments")
        .upsert({ user_id: user.id, campaign_id: campaignId, label_id: labelId }, { onConflict: "campaign_id,label_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["label-assignments"] });
    },
  });
}

export function useUnassignLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ campaignId, labelId }: { campaignId: string; labelId: string }) => {
      const { error } = await (supabase as any)
        .from("campaign_label_assignments")
        .delete()
        .eq("campaign_id", campaignId)
        .eq("label_id", labelId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["label-assignments"] });
    },
  });
}
