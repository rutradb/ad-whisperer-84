import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CopyHistoryRow } from "@/types/database";

interface SaveCopyInput {
  productDescription: string;
  targetAudience: string;
  tone: string;
  objective: string;
  framework: string;
  variations: { primaryText: string; headline: string; description: string }[];
}

async function fetchCopyHistory(): Promise<CopyHistoryRow[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user.id) return [];

  const { data, error } = await supabase
    .from("copy_history")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data || []) as unknown as CopyHistoryRow[];
}

async function insertCopyHistory(input: SaveCopyInput): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user.id) throw new Error("Não autenticado");

  const { error } = await supabase.from("copy_history").insert({
    user_id: session.user.id,
    product_description: input.productDescription,
    target_audience: input.targetAudience,
    tone: input.tone,
    objective: input.objective,
    framework: input.framework,
    variations: input.variations,
    variation_count: input.variations.length,
  });

  if (error) throw error;
}

async function deleteCopyHistoryRow(id: string): Promise<void> {
  const { error } = await supabase.from("copy_history").delete().eq("id", id);
  if (error) throw error;
}

export function useCopyHistory() {
  const queryClient = useQueryClient();

  const historyQuery = useQuery({
    queryKey: ["copy-history"],
    queryFn: fetchCopyHistory,
  });

  const saveMutation = useMutation({
    mutationFn: insertCopyHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["copy-history"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCopyHistoryRow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["copy-history"] });
    },
  });

  return {
    history: historyQuery.data || [],
    isLoadingHistory: historyQuery.isLoading,
    saveCopy: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    deleteCopy: deleteMutation.mutateAsync,
  };
}
