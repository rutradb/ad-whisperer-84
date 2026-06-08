import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getKeywordsByCustomer,
  getKeywordsByAdGroup,
  getKeywordsWithMetrics,
  addKeywords,
  removeKeyword,
  getSearchTerms,
  getNegativeKeywords,
  addNegativeKeywords,
} from "@/lib/google-ads/keywords";
import { useToast } from "@/hooks/use-toast";
import { STALE_TIMES } from "@/lib/queryKeys";
import type { DateRange, KeywordMatchType } from "@/lib/google-ads/types";

export function useKeywords(
  customerId: string | undefined,
  params: { campaignId?: string; status?: string; limit?: number } = {}
) {
  const stableKey = JSON.stringify(params);
  return useQuery({
    queryKey: ["keywords", customerId, stableKey],
    queryFn: () => getKeywordsByCustomer(customerId!, params),
    enabled: !!customerId,
    staleTime: STALE_TIMES.STANDARD,
  });
}

export function useKeywordsByAdGroup(
  customerId: string | undefined,
  adGroupId: string | undefined
) {
  return useQuery({
    queryKey: ["keywords", customerId, "ad-group", adGroupId],
    queryFn: () => getKeywordsByAdGroup(customerId!, adGroupId!),
    enabled: !!customerId && !!adGroupId,
    staleTime: STALE_TIMES.STANDARD,
  });
}

export function useKeywordsWithMetrics(
  customerId: string | undefined,
  params: { adGroupId?: string; campaignId?: string; dateRange?: DateRange } = {}
) {
  const stableKey = JSON.stringify(params);
  return useQuery({
    queryKey: ["keywords-metrics", customerId, stableKey],
    queryFn: () => getKeywordsWithMetrics(customerId!, params),
    enabled: !!customerId,
    staleTime: STALE_TIMES.REALTIME,
  });
}

export function useAddKeywords() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      customerId,
      adGroupResourceName,
      keywords,
    }: {
      customerId: string;
      adGroupResourceName: string;
      keywords: Array<{ text: string; matchType: KeywordMatchType; cpcBidMicros?: string; status?: string }>;
    }) => addKeywords(customerId, adGroupResourceName, keywords as any),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["keywords"] });
      toast({ title: `${vars.keywords.length} palavra(s)-chave adicionada(s)` });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao adicionar palavras-chave", description: err.message, variant: "destructive" });
    },
  });
}

export function useRemoveKeyword() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ customerId, resourceName }: { customerId: string; resourceName: string }) =>
      removeKeyword(customerId, resourceName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keywords"] });
      toast({ title: "Palavra-chave removida" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao remover", description: err.message, variant: "destructive" });
    },
  });
}

export function useSearchTerms(
  customerId: string | undefined,
  params: { campaignId?: string; adGroupId?: string; dateRange?: DateRange; limit?: number } = {}
) {
  const stableKey = JSON.stringify(params);
  return useQuery({
    queryKey: ["search-terms", customerId, stableKey],
    queryFn: () => getSearchTerms(customerId!, params),
    enabled: !!customerId,
    staleTime: STALE_TIMES.STANDARD,
  });
}

export function useNegativeKeywords(
  customerId: string | undefined,
  campaignId?: string
) {
  return useQuery({
    queryKey: ["negative-keywords", customerId, campaignId],
    queryFn: () => getNegativeKeywords(customerId!, campaignId),
    enabled: !!customerId,
    staleTime: STALE_TIMES.STANDARD,
  });
}

export function useAddNegativeKeywords() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      customerId,
      campaignResourceName,
      keywords,
    }: {
      customerId: string;
      campaignResourceName: string;
      keywords: Array<{ text: string; matchType: KeywordMatchType }>;
    }) => addNegativeKeywords(customerId, campaignResourceName, keywords),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["negative-keywords"] });
      toast({ title: `${vars.keywords.length} negativa(s) adicionada(s)` });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao adicionar negativas", description: err.message, variant: "destructive" });
    },
  });
}
