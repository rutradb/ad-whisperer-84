import { useQuery } from "@tanstack/react-query";
import { getCampaignById } from "@/lib/google-ads/campaigns";
import { STALE_TIMES } from "@/lib/queryKeys";

export function useCampaignDetail(
  customerId: string | undefined,
  campaignId: string | undefined
) {
  return useQuery({
    queryKey: ["campaign", customerId, campaignId],
    queryFn: async () => {
      const res = await getCampaignById(customerId!, campaignId!);
      const row = (res.results?.[0] as any) || null;
      if (!row) return null;
      const c = row.campaign || row;
      return { ...c } as any;
    },
    enabled: !!customerId && !!campaignId,
    staleTime: STALE_TIMES.STANDARD,
  });
}
