import { useQuery } from "@tanstack/react-query";
import { getCampaignsByCustomer } from "@/lib/google-ads/campaigns";
import { STALE_TIMES } from "@/lib/queryKeys";
import type { CampaignStatus, AdvertisingChannelType } from "@/lib/google-ads/types";

export interface CampaignQueryParams {
  status?: CampaignStatus;
  channelType?: AdvertisingChannelType;
  limit?: number;
}

export function useCampaigns(
  customerId: string | undefined,
  params: CampaignQueryParams = {}
) {
  const stableKey = JSON.stringify(params);

  return useQuery({
    queryKey: ["campaigns", customerId, stableKey],
    queryFn: async () => {
      const res = await getCampaignsByCustomer(customerId!, params);
      // GAQL returns { campaign: { id, name, ... } } — flatten to { id, name, ... }
      return (res.results || []).map((r: any) => r.campaign || r) as any[];
    },
    enabled: !!customerId,
    staleTime: STALE_TIMES.STANDARD,
  });
}
