import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bulkUpdateStatus } from "@/lib/google-ads/mutations";
import { useToast } from "@/hooks/use-toast";

export function useBulkUpdateStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      customerId,
      resource,
      resourceNames,
      status,
    }: {
      customerId: string;
      resource: string;
      resourceNames: string[];
      status: "ENABLED" | "PAUSED" | "REMOVED";
    }) => bulkUpdateStatus(customerId, resource, resourceNames, status),
    onSuccess: (result) => {
      const count = result.results?.length || 0;
      toast({ title: `${count} item(ns) atualizado(s)` });
    },
    onError: (err: Error) => {
      toast({ title: "Erro na opera\u00e7\u00e3o em massa", description: err.message, variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["ad-groups"] });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      queryClient.invalidateQueries({ queryKey: ["keywords"] });
    },
  });
}
