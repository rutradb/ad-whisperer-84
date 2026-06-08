import { useQuery } from "@tanstack/react-query";
import { getAdGroupById } from "@/lib/google-ads/adgroups";
import { STALE_TIMES } from "@/lib/queryKeys";

export function useAdGroupDetail(
  customerId: string | undefined,
  adGroupId: string | undefined
) {
  return useQuery({
    queryKey: ["ad-group", customerId, adGroupId],
    queryFn: async () => {
      const res = await getAdGroupById(customerId!, adGroupId!);
      const row = (res.results?.[0] as any) || null;
      if (!row) return null;
      // Flatten adGroup properties from the GAQL response
      const ag = row.adGroup || row;
      return {
        id: ag.id || "",
        name: ag.name || "",
        status: ag.status || "UNKNOWN",
        type: ag.type || "UNKNOWN",
        campaign: ag.campaign || "",
        cpcBidMicros: ag.cpcBidMicros || null,
        targetCpaMicros: ag.targetCpaMicros || null,
        resourceName: ag.resourceName || "",
        ...ag,
      };
    },
    enabled: !!customerId && !!adGroupId,
    staleTime: STALE_TIMES.STANDARD,
  });
}
