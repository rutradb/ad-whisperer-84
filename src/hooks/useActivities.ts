import { useQuery } from "@tanstack/react-query";
import { getChangeEvents } from "@/lib/google-ads/change-history";
import { STALE_TIMES } from "@/lib/queryKeys";

export function useActivities(
  customerId: string | undefined,
  params: { startDate?: string; endDate?: string; resourceType?: string; limit?: number } = {}
) {
  return useQuery({
    queryKey: ["activities", customerId, params],
    queryFn: () => getChangeEvents(customerId!, params),
    enabled: !!customerId,
    staleTime: STALE_TIMES.STANDARD,
  });
}
