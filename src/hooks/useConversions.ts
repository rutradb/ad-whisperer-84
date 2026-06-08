import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listConversionActions,
  getConversionActionById,
  createConversionAction,
  updateConversionAction,
  removeConversionAction,
} from "@/lib/google-ads/conversions";
import { useToast } from "@/hooks/use-toast";
import { STALE_TIMES } from "@/lib/queryKeys";

export function useConversionActions(customerId: string | undefined) {
  return useQuery({
    queryKey: ["conversion-actions", customerId],
    queryFn: () => listConversionActions(customerId!),
    enabled: !!customerId,
    staleTime: STALE_TIMES.SLOW_CHANGING,
  });
}

export function useConversionActionDetail(customerId: string | undefined, conversionActionId: string | undefined) {
  return useQuery({
    queryKey: ["conversion-action", customerId, conversionActionId],
    queryFn: () => getConversionActionById(customerId!, conversionActionId!),
    enabled: !!customerId && !!conversionActionId,
    staleTime: STALE_TIMES.SLOW_CHANGING,
  });
}

export function useCreateConversionAction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ customerId, data }: { customerId: string; data: Parameters<typeof createConversionAction>[1] }) =>
      createConversionAction(customerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversion-actions"] });
      toast({ title: "A\u00e7\u00e3o de convers\u00e3o criada" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao criar convers\u00e3o", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateConversionAction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ customerId, resourceName, data }: { customerId: string; resourceName: string; data: Record<string, unknown> }) =>
      updateConversionAction(customerId, resourceName, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversion-actions"] });
      queryClient.invalidateQueries({ queryKey: ["conversion-action"] });
      toast({ title: "A\u00e7\u00e3o de convers\u00e3o atualizada" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao atualizar", description: err.message, variant: "destructive" });
    },
  });
}

export function useRemoveConversionAction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ customerId, resourceName }: { customerId: string; resourceName: string }) =>
      removeConversionAction(customerId, resourceName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversion-actions"] });
      toast({ title: "A\u00e7\u00e3o de convers\u00e3o removida" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao remover", description: err.message, variant: "destructive" });
    },
  });
}
