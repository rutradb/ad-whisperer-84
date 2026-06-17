import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { useBusinessContextStore } from "@/store/useBusinessContextStore";
import { buildBusinessContextBlock } from "@/lib/agent/buildBusinessContextBlock";
import { gatherScanData, runStrategicScan } from "@/lib/strategic-scan";
import type { ScanResult, ScanOptions } from "@/lib/strategic-scan";
import type { DateRange } from "@/lib/google-ads/types";
import { supabase } from "@/integrations/supabase/client";
import { saveScan, fetchScan } from "@/hooks/useStrategicScanHistory";

export function useStrategicScan() {
  const { anthropicApiKey, selectedCustomer } = useAuthStore();
  const businessContext = useBusinessContextStore();
  const queryClient = useQueryClient();

  const [result, setResult] = useState<ScanResult | null>(null);
  const [currentScanId, setCurrentScanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasApiKey = true;
  const isConnected = !!selectedCustomer?.id;

  const run = useCallback(
    async (dateRange: DateRange | string = "LAST_30_DAYS", options?: ScanOptions) => {
      if (!selectedCustomer?.id) {
        setError("Nenhuma conta Google Ads conectada.");
        return;
      }

      setIsLoading(true);
      setError(null);
      setCurrentScanId(null);

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

        // Persiste a varredura no histórico (não-bloqueante).
        try {
          const uid = (await supabase.auth.getSession()).data.session?.user.id ?? null;
          if (uid) {
            const id = await saveScan({
              userId: uid,
              customerId: selectedCustomer.id ?? null,
              title: selectedCustomer.descriptiveName || selectedCustomer.id || "Varredura",
              dateRange: typeof dateRange === "string" ? dateRange : "Personalizado",
              result: scan,
            });
            setCurrentScanId(id);
            queryClient.invalidateQueries({ queryKey: ["strategic-scans"] });
          }
        } catch (persistErr) {
          console.warn("[useStrategicScan] Falha ao persistir varredura:", persistErr);
        }
      } catch (err) {
        setError((err as Error).message);
        setResult(null);
      } finally {
        setIsLoading(false);
      }
    },
    [anthropicApiKey, selectedCustomer, businessContext, queryClient],
  );

  /** Carrega uma varredura salva do histórico. */
  const loadScan = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const row = await fetchScan(id);
      if (row?.result) {
        setResult(row.result as ScanResult);
        setCurrentScanId(id);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setCurrentScanId(null);
    setError(null);
  }, []);

  return { result, currentScanId, isLoading, error, hasApiKey, isConnected, run, loadScan, reset };
}
