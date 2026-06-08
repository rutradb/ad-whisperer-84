import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCampaign,
  updateCampaign,
  createCampaignBudget,
  removeResource,
} from "@/lib/google-ads/mutations";
import { useToast } from "@/hooks/use-toast";

interface CreateCampaignInput {
  customerId: string;
  budgetData: { name: string; amountMicros: string; deliveryMethod?: "STANDARD" | "ACCELERATED" };
  campaignData: {
    name: string;
    advertisingChannelType: string;
    status?: string;
    biddingStrategyType?: string;
    targetCpa?: { targetCpaMicros?: string };
    targetRoas?: { targetRoas?: number };
    startDate?: string;
    endDate?: string;
    networkSettings?: Record<string, boolean>;
  };
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ customerId, budgetData, campaignData }: CreateCampaignInput) => {
      // First create the budget
      const budgetResult = await createCampaignBudget(customerId, budgetData as any);
      const budgetResourceName = budgetResult.results?.[0]?.resourceName;
      if (!budgetResourceName) throw new Error("Falha ao criar or\u00e7amento");

      // Then create the campaign referencing the budget
      return createCampaign(customerId, {
        ...campaignData,
        campaignBudget: budgetResourceName,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast({ title: "Campanha criada", description: "A campanha foi criada com status PAUSADA." });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao criar campanha", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateCampaign() {
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
    }) => updateCampaign(customerId, resourceName, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["campaign"] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast({ title: "Campanha atualizada" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao atualizar campanha", description: err.message, variant: "destructive" });
    },
  });
}

export function useRemoveResource() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      customerId,
      resource,
      resourceName,
    }: {
      customerId: string;
      resource: string;
      resourceName: string;
    }) => removeResource(customerId, resource, resourceName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["ad-groups"] });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      toast({ title: "Recurso removido" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao remover", description: err.message, variant: "destructive" });
    },
  });
}
