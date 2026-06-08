import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { STALE_TIMES } from "@/lib/queryKeys";

export interface ReportConfig {
  level: string;
  fields: string[];
  date_preset?: string;
  time_range?: { since: string; until: string };
  breakdowns?: string[];
  sort?: string[];
}

export interface SavedReport {
  id: string;
  user_id: string;
  name: string;
  config: ReportConfig;
  created_at: string;
  updated_at: string;
}

export function useSavedReports() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["saved-reports"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];
      const { data, error } = await (supabase as any).from("saved_reports")
        .select("*")
        .eq("user_id", session.user.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as SavedReport[];
    },
    staleTime: STALE_TIMES.SLOW_CHANGING,
  });

  const saveMutation = useMutation({
    mutationFn: async (input: { name: string; config: ReportConfig }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");
      const { error } = await (supabase as any).from("saved_reports").insert({
        user_id: session.user.id,
        name: input.name,
        config: input.config,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-reports"] });
      toast({ title: "Relatório salvo" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("saved_reports").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-reports"] });
      toast({ title: "Relatório excluído" });
    },
  });

  return {
    reports: query.data || [],
    isLoading: query.isLoading,
    saveReport: saveMutation,
    deleteReport: deleteMutation,
  };
}
