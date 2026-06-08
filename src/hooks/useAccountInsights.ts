import { useQuery } from "@tanstack/react-query";
import { getCustomerMetrics } from "@/lib/google-ads/reporting";
import { STALE_TIMES } from "@/lib/queryKeys";
import type { DateRange } from "@/lib/google-ads/types";

export function useAccountInsights(
  customerId: string | undefined,
  params: { dateRange?: DateRange; startDate?: string; endDate?: string } = {}
) {
  const stableKey = JSON.stringify(params);

  return useQuery({
    queryKey: ["account-insights", customerId, stableKey],
    queryFn: () => getCustomerMetrics(customerId!, params.dateRange),
    enabled: !!customerId,
    staleTime: STALE_TIMES.REALTIME,
  });
}
