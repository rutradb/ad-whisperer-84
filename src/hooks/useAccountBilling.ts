import { useQuery } from "@tanstack/react-query";
import { getCustomerDetails } from "@/lib/google-ads/customers";
import { STALE_TIMES } from "@/lib/queryKeys";

export function useAccountBilling(customerId: string | undefined) {
  return useQuery({
    queryKey: ["account-billing", customerId],
    queryFn: () => getCustomerDetails(customerId!),
    enabled: !!customerId,
    staleTime: STALE_TIMES.SLOW_CHANGING,
  });
}
