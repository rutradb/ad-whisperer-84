import { useQuery } from "@tanstack/react-query";
import { getCampaignMetrics, getAdGroupMetrics, getAdMetrics } from "@/lib/google-ads/reporting";
import { STALE_TIMES } from "@/lib/queryKeys";
import type { DateRange } from "@/lib/google-ads/types";

type EntityType = "campaign" | "ad_group" | "ad";

export function useEntityInsights(
  customerId: string | undefined,
  entityId: string | undefined,
  entityType: EntityType,
  params: { dateRange?: DateRange; segmentByDate?: boolean } = {}
) {
  const stableKey = JSON.stringify(params);
  return useQuery({
    queryKey: ["insights", customerId, entityId, entityType, stableKey],
    queryFn: () => {
      switch (entityType) {
        case "campaign":
          return getCampaignMetrics(customerId!, entityId, params.dateRange, params.segmentByDate);
        case "ad_group":
          return getAdGroupMetrics(customerId!, entityId, undefined, params.dateRange);
        case "ad":
          return getAdMetrics(customerId!, entityId, undefined, params.dateRange);
      }
    },
    enabled: !!customerId && !!entityId,
    staleTime: STALE_TIMES.REALTIME,
  });
}
