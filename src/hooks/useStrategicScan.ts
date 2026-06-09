import { useState, useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useBusinessContextStore } from "@/store/useBusinessContextStore";
import { buildBusinessContextBlock } from "@/lib/agent/buildBusinessContextBlock";
import { gatherScanData, runStrategicScan } from "@/lib/strategic-scan";
import type { ScanResult, ScanOptions } from "@/lib/strategic-scan";
import type { DateRange } from "@/lib/google-ads/types";

export function useStrategicScan() {
  const { anthropicApiKey, selectedCustomer } = useAuthStore();
  const businessContext = useBusinessContextStore();

  const [result, setResult] = useState<ScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasApiKey = !!anthropicApiKey;
  const isConnected = !!selectedCustomer?.id;

  const run = useCallback(
    async (dateRange: DateRange | string = "LAST_30_DAYS", options?: ScanOptions) => {
      if (!anthropicApiKey) {
        setError("Configure a chave da API Anthropic em Configurações > Integrações.");
        return;
      }
      if (!selectedCustomer?.id) {
        setError("Nenhuma conta Google Ads conectada.");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await gatherScanData(
          selectedCustomer.id,
          {
            name: selectedCustomer.descriptiveName || selectedCustomer.id,
            currency: selectedCustomer.currencyCode || "BRL",
          },
          dateRange,
        );

        if (data.campaigns.length === 0) {
          throw new Error("Nenhuma campanha com dados no período selecionado.");
        }

        const contextBlock = buildBusinessContextBlock(businessContext);

        const scan = await runStrategicScan({
          apiKey: anthropicApiKey,
          data,
          businessContext: contextBlock,
          options,
        });

        setResult(scan);
      } catch (err) {
        setError((err as Error).message);
        setResult(null);
      } finally {
        setIsLoading(false);
      }
    },
    [anthropicApiKey, selectedCustomer, businessContext],
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, isLoading, error, hasApiKey, isConnected, run, reset };
}
