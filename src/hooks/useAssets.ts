import { useQuery } from "@tanstack/react-query";
import { listAssets } from "@/lib/google-ads/assets";
import { STALE_TIMES } from "@/lib/queryKeys";
import type { AssetType } from "@/lib/google-ads/types";

export function useAssets(
  customerId: string | undefined,
  params: { type?: AssetType; limit?: number } = {}
) {
  const stableKey = JSON.stringify(params);
  return useQuery({
    queryKey: ["assets", customerId, stableKey],
    queryFn: () => listAssets(customerId!, params),
    enabled: !!customerId,
    staleTime: STALE_TIMES.STANDARD,
  });
}
