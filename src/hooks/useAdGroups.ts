import { useQuery } from "@tanstack/react-query";
import { getAdGroupsByCustomer, getAdGroupsByCampaign } from "@/lib/google-ads/adgroups";
import { STALE_TIMES } from "@/lib/queryKeys";
import type { AdGroupAdStatus } from "@/lib/google-ads/types";

export interface AdGroupQueryParams {
  campaignId?: string;
  status?: AdGroupAdStatus;
  limit?: number;
  fields?: string[];
}

export function useAdGroups(
  customerId: string | undefined,
  params: AdGroupQueryParams = {}
) {
  const stableKey = JSON.stringify(params);
  return useQuery({
    queryKey: ["ad-groups", customerId, stableKey],
    queryFn: async () => {
      const res = await getAdGroupsByCustomer(customerId!, params);
      return (res.results || []).map((r: any) => ({ ...r.adGroup, ...r.campaign && { campaign: r.campaign } })) as any[];
    },
    enabled: !!customerId,
    staleTime: STALE_TIMES.STANDARD,
  });
}

export function useAdGroupsByCampaign(
  customerId: string | undefined,
  campaignId: string | undefined
) {
  return useQuery({
    queryKey: ["ad-groups", customerId, "campaign", campaignId],
    queryFn: async () => {
      const res = await getAdGroupsByCampaign(customerId!, campaignId!);
      return (res.results || []).map((r: any) => ({ ...r.adGroup, ...r.campaign && { campaign: r.campaign } })) as any[];
    },
    enabled: !!customerId && !!campaignId,
    staleTime: STALE_TIMES.STANDARD,
  });
}
