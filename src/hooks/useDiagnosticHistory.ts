import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DiagnosticRow } from "@/types/database";

const db = supabase as any;

async function getUserId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user.id ?? null;
}

// --- Helpers usados por DiagnosticPage -------------------------------------

export async function saveDiagnostic(input: {
  userId: string;
  customerId: string | null;
  datePreset: string;
  alerts: unknown[];
  total: number;
  critical: number;
  warning: number;
  healthy: number;
}): Promise<string> {
  const { data, error } = await db
    .from("diagnostics")
    .insert({
      user_id: input.userId,
      customer_id: input.customerId,
      date_preset: input.datePreset,
      alerts: input.alerts,
      total: input.total,
      critical: input.critical,
      warning: input.warning,
      healthy: input.healthy,
    })
    .select("id, created_at")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function fetchDiagnostic(id: string): Promise<DiagnosticRow | null> {
  const { data, error } = await db.from("diagnostics").select("*").eq("id", id).single();
  if (error) throw error;
  return (data as DiagnosticRow) ?? null;
}

async function fetchDiagnostics(): Promise<DiagnosticRow[]> {
  const uid = await getUserId();
  if (!uid) return [];
  const { data, error } = await db
    .from("diagnostics")
    .select("id, user_id, customer_id, date_preset, total, critical, warning, healthy, created_at")
    .eq("user_id", uid)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data || []) as DiagnosticRow[];
}

async function deleteDiagnosticRow(id: string): Promise<void> {
  const { error } = await db.from("diagnostics").delete().eq("id", id);
  if (error) throw error;
}

// --- Hook para a lista (DiagnosticPage) ------------------------------------

export function useDiagnosticHistory() {
  const queryClient = useQueryClient();

  const diagnosticsQuery = useQuery({
    queryKey: ["diagnostics-history"],
    queryFn: fetchDiagnostics,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDiagnosticRow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diagnostics-history"] });
    },
  });

  return {
    diagnostics: diagnosticsQuery.data || [],
    isLoadingDiagnostics: diagnosticsQuery.isLoading,
    deleteDiagnostic: deleteMutation.mutateAsync,
  };
}
