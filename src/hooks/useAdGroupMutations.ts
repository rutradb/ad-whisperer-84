import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAdGroup, updateAdGroup } from "@/lib/google-ads/mutations";
import { useToast } from "@/hooks/use-toast";

export function useCreateAdGroup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      customerId,
      data,
    }: {
      customerId: string;
      data: {
        name: string;
        campaign: string;
        status?: string;
        type?: string;
        cpcBidMicros?: string;
        targetCpaMicros?: string;
      };
    }) => createAdGroup(customerId, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-groups"] });
      toast({ title: "Grupo de an\u00fancios criado", description: "O grupo foi criado com status PAUSADO." });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao criar grupo", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateAdGroup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      customerId,
      resourceName,
      data,
    }: {
      customerId: string;
      resourceName: string;
      data: Record<string, unknown>;
    }) => updateAdGroup(customerId, resourceName, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-group"] });
      queryClient.invalidateQueries({ queryKey: ["ad-groups"] });
      toast({ title: "Grupo de an\u00fancios atualizado" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao atualizar grupo", description: err.message, variant: "destructive" });
    },
  });
}
