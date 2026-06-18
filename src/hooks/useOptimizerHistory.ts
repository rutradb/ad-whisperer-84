import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { OptimizerRunRow } from "@/types/database";

const db = supabase as any;

async function getUserId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user.id ?? null;
}

// --- Helpers usados por OptimizerPage --------------------------------------

export async function saveOptimizerRun(input: {
  userId: string;
  customerId: string | null;
  campaignId: string | null;
  campaignName: string;
  datePreset: string;
  cpaTarget: number;
  classified: unknown[];
  crmContext: string | null;
}): Promise<string> {
  const { data, error } = await db
    .from("optimizer_runs")
    .insert({
      user_id: input.userId,
      customer_id: input.customerId,
      campaign_id: input.campaignId,
      campaign_name: input.campaignName.slice(0, 160) || "Campanha",
      date_preset: input.datePreset,
      cpa_target: input.cpaTarget,
      classified: input.classified,
      crm_context: input.crmContext,
    })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function fetchOptimizerRun(id: string): Promise<OptimizerRunRow | null> {
  const { data, error } = await db
    .from("optimizer_runs")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return (data as OptimizerRunRow) ?? null;
}

async function fetchOptimizerRuns(): Promise<OptimizerRunRow[]> {
  const uid = await getUserId();
  if (!uid) return [];
  const { data, error } = await db
    .from("optimizer_runs")
    .select("id, user_id, customer_id, campaign_id, campaign_name, date_preset, cpa_target, created_at")
    .eq("user_id", uid)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data || []) as OptimizerRunRow[];
}

async function deleteOptimizerRunRow(id: string): Promise<void> {
  const { error } = await db.from("optimizer_runs").delete().eq("id", id);
  if (error) throw error;
}

// --- Hook para a lista (OptimizerPage) -------------------------------------

export function useOptimizerHistory() {
  const queryClient = useQueryClient();

  const runsQuery = useQuery({
    queryKey: ["optimizer-runs"],
    queryFn: fetchOptimizerRuns,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOptimizerRunRow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["optimizer-runs"] });
    },
  });

  return {
    runs: runsQuery.data || [],
    isLoadingRuns: runsQuery.isLoading,
    deleteRun: deleteMutation.mutateAsync,
  };
}
