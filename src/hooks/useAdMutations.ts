import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createResponsiveSearchAd, updateAdStatus } from "@/lib/google-ads/mutations";
import { useToast } from "@/hooks/use-toast";

interface CreateRSAInput {
  customerId: string;
  data: {
    adGroup: string;
    finalUrls: string[];
    headlines: Array<{ text: string; pinnedField?: string }>;
    descriptions: Array<{ text: string; pinnedField?: string }>;
    path1?: string;
    path2?: string;
    status?: string;
  };
}

export function useCreateAd() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ customerId, data }: CreateRSAInput) =>
      createResponsiveSearchAd(customerId, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      toast({ title: "An\u00fancio criado", description: "O an\u00fancio RSA foi criado com status PAUSADO." });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao criar an\u00fancio", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateAdStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      customerId,
      resourceName,
      status,
    }: {
      customerId: string;
      resourceName: string;
      status: string;
    }) => updateAdStatus(customerId, resourceName, status as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad"] });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      toast({ title: "Status do an\u00fancio atualizado" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao atualizar an\u00fancio", description: err.message, variant: "destructive" });
    },
  });
}
