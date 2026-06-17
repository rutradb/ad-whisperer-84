import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { StrategicScanRow } from "@/types/database";
import type { ScanResult } from "@/lib/strategic-scan";

const db = supabase as any;

async function getUserId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user.id ?? null;
}

// --- Helpers usados por useStrategicScan -----------------------------------

export async function saveScan(input: {
  userId: string;
  customerId: string | null;
  title: string;
  dateRange: string;
  result: ScanResult;
}): Promise<string> {
  const { data, error } = await db
    .from("strategic_scans")
    .insert({
      user_id: input.userId,
      customer_id: input.customerId,
      title: input.title.slice(0, 160) || "Varredura",
      date_range: input.dateRange,
      complexity: input.result.complexity ?? null,
      result: input.result,
    })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function fetchScan(id: string): Promise<StrategicScanRow | null> {
  const { data, error } = await db
    .from("strategic_scans")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return (data as StrategicScanRow) ?? null;
}

async function fetchScans(): Promise<StrategicScanRow[]> {
  const uid = await getUserId();
  if (!uid) return [];
  const { data, error } = await db
    .from("strategic_scans")
    .select("id, user_id, customer_id, title, date_range, complexity, created_at")
    .eq("user_id", uid)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data || []) as StrategicScanRow[];
}

async function deleteScanRow(id: string): Promise<void> {
  const { error } = await db.from("strategic_scans").delete().eq("id", id);
  if (error) throw error;
}

// --- Hook para a lista (StrategicScanPage) ---------------------------------

export function useStrategicScanHistory() {
  const queryClient = useQueryClient();

  const scansQuery = useQuery({
    queryKey: ["strategic-scans"],
    queryFn: fetchScans,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteScanRow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategic-scans"] });
    },
  });

  return {
    scans: scansQuery.data || [],
    isLoadingScans: scansQuery.isLoading,
    deleteScan: deleteMutation.mutateAsync,
  };
}
