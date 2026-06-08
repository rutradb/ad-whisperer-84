import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listRecommendations,
  applyRecommendation,
  dismissRecommendation,
  getOptimizationScore,
} from "@/lib/google-ads/recommendations";
import { useToast } from "@/hooks/use-toast";
import { STALE_TIMES } from "@/lib/queryKeys";

export function useRecommendations(
  customerId: string | undefined,
  params: { type?: string; campaignId?: string; limit?: number } = {}
) {
  const stableKey = JSON.stringify(params);
  return useQuery({
    queryKey: ["recommendations", customerId, stableKey],
    queryFn: () => listRecommendations(customerId!, params),
    enabled: !!customerId,
    staleTime: STALE_TIMES.SLOW_CHANGING,
  });
}

export function useOptimizationScore(customerId: string | undefined) {
  return useQuery({
    queryKey: ["optimization-score", customerId],
    queryFn: () => getOptimizationScore(customerId!),
    enabled: !!customerId,
    staleTime: STALE_TIMES.REALTIME,
  });
}

export function useApplyRecommendation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ customerId, resourceName }: { customerId: string; resourceName: string }) =>
      applyRecommendation(customerId, resourceName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      queryClient.invalidateQueries({ queryKey: ["optimization-score"] });
      toast({ title: "Recomenda\u00e7\u00e3o aplicada" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao aplicar", description: err.message, variant: "destructive" });
    },
  });
}

export function useDismissRecommendation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ customerId, resourceName }: { customerId: string; resourceName: string }) =>
      dismissRecommendation(customerId, resourceName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      toast({ title: "Recomenda\u00e7\u00e3o descartada" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao descartar", description: err.message, variant: "destructive" });
    },
  });
}
