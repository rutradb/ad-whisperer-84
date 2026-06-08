import { useQuery } from "@tanstack/react-query";
import { getAdById } from "@/lib/google-ads/ads";
import { STALE_TIMES } from "@/lib/queryKeys";

/**
 * Google Ads does not have a formal ad preview API like Facebook.
 * This hook fetches the RSA ad data which can be rendered client-side.
 */
export function useAdPreview(
  customerId: string | undefined,
  adGroupId: string | undefined,
  adId: string | undefined
) {
  return useQuery({
    queryKey: ["ad-preview", customerId, adGroupId, adId],
    queryFn: () => getAdById(customerId!, adGroupId!, adId!),
    enabled: !!customerId && !!adGroupId && !!adId,
    staleTime: STALE_TIMES.STATIC,
  });
}
