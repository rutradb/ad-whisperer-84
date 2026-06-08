import { useQuery } from "@tanstack/react-query";
import { getAdsByCustomer, getAdsByAdGroup } from "@/lib/google-ads/ads";
import { STALE_TIMES } from "@/lib/queryKeys";
import type { AdGroupAdStatus } from "@/lib/google-ads/types";

export interface AdQueryParams {
  campaignId?: string;
  adGroupId?: string;
  status?: AdGroupAdStatus;
  limit?: number;
  fields?: string[];
}

export function useAds(
  customerId: string | undefined,
  params: AdQueryParams = {}
) {
  const stableKey = JSON.stringify(params);
  return useQuery({
    queryKey: ["ads", customerId, stableKey],
    queryFn: async () => {
      const res = await getAdsByCustomer(customerId!, params);
      return (res.results || []).map((r: any) => {
        const ad = r.adGroupAd || {};
        return { ...ad, adGroup: r.adGroup, campaign: r.campaign };
      }) as any[];
    },
    enabled: !!customerId,
    staleTime: STALE_TIMES.STANDARD,
  });
}

export function useAdsByAdGroup(
  customerId: string | undefined,
  adGroupId: string | undefined
) {
  return useQuery({
    queryKey: ["ads", customerId, "ad-group", adGroupId],
    queryFn: async () => {
      const res = await getAdsByAdGroup(customerId!, adGroupId!);
      return (res.results || []).map((r: any) => {
        const ad = r.adGroupAd || {};
        return { ...ad, adGroup: r.adGroup, campaign: r.campaign };
      }) as any[];
    },
    enabled: !!customerId && !!adGroupId,
    staleTime: STALE_TIMES.STANDARD,
  });
}
