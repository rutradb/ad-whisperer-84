import { useQuery } from "@tanstack/react-query";
import { getAdById, getAdsByCustomer } from "@/lib/google-ads/ads";
import { STALE_TIMES } from "@/lib/queryKeys";

export function useAdDetail(
  customerId: string | undefined,
  adGroupId: string | undefined,
  adId: string | undefined
) {
  return useQuery({
    queryKey: ["ad", customerId, adGroupId, adId],
    queryFn: async () => {
      if (adGroupId) {
        const res = await getAdById(customerId!, adGroupId, adId!);
        return (res.results?.[0] as any) || null;
      }
      // If no adGroupId, search across all ad groups
      const res = await getAdsByCustomer(customerId!, { limit: 1000 });
      const results = (res.results || []) as any[];
      return results.find((r: any) => 
        r.adGroupAd?.ad?.id === adId || r.ad?.id === adId || String(r.adGroupAd?.ad?.id) === adId
      )?.adGroupAd || results.find((r: any) => String(r.adGroupAd?.ad?.id) === adId) || null;
    },
    enabled: !!customerId && !!adId,
    staleTime: STALE_TIMES.STANDARD,
  });
}
