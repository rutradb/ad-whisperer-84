import { useState, useMemo, useEffect, useRef, useCallback, type MouseEvent } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { getCampaignMetrics, getCustomerMetrics } from "@/lib/google-ads/reporting";
import { normalizeMetricsRow, microsToUnits, computeRoas, computeCpa } from "@/lib/google-ads/types";
import type { MetricsRow, DateRange } from "@/lib/google-ads/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { AIInsightsPanel } from "@/components/AIInsightsPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useDiagnosticHistory, saveDiagnostic, fetchDiagnostic } from "@/hooks/useDiagnosticHistory";
import type { DiagnosticRow } from "@/types/database";
import { Activity, AlertTriangle, CheckCircle, Eye, Search, TrendingDown, Clock, History, Trash2 } from "lucide-react";

type DiagnosticLevel = "critical" | "warning" | "healthy";

interface DiagnosticAlert {
  campaignId: string;
  campaignName: string;
  level: DiagnosticLevel;
  alerts: string[];
  metrics: {
    optimizationScore: number | null;
    searchImpressionShare: number;
    searchBudgetLostIS: number;
    searchRankLostIS: number;
    ctr: number;
    conversions: number;
    costPerConversion: number;
    roas: number;
  };
}

function analyzeCampaigns(rows: MetricsRow[]): DiagnosticAlert[] {
  const alerts: DiagnosticAlert[] = [];

  for (const row of rows) {
    if (!row.campaignId) continue;

    const campaignAlerts: string[] = [];
    let level: DiagnosticLevel = "healthy";

    const searchIS = (row.searchImpressionShare || 0) * 100;
    const budgetLostIS = (row.searchBudgetLostImpressionShare || 0) * 100;
    const rankLostIS = (row.searchRankLostImpressionShare || 0) * 100;
    const ctr = (row.ctr || 0) * 100;
    const spend = microsToUnits(row.costMicros);
    const costPerConv = row.conversions > 0 ? spend / row.conversions : 0;
    const roas = computeRoas(row);

    // Rule 1: High budget lost impression share -> CRITICAL
    if (budgetLostIS > 30) {
      campaignAlerts.push(`Perdendo ${budgetLostIS.toFixed(0)}% das impressoes por orcamento — considere aumentar o budget`);
      level = "critical";
    } else if (budgetLostIS > 15) {
      campaignAlerts.push(`Perdendo ${budgetLostIS.toFixed(0)}% das impressoes por orcamento`);
      if ((level as string) !== "critical") level = "warning";
    }

    // Rule 2: High rank lost impression share -> WARNING
    if (rankLostIS > 30) {
      campaignAlerts.push(`Perdendo ${rankLostIS.toFixed(0)}% das impressoes por ranking — melhore Quality Score ou aumente lances`);
      if (level !== "critical") level = "warning";
    }

    // Rule 3: Low CTR -> WARNING
    if (ctr < 1.0 && row.impressions > 100) {
      campaignAlerts.push(`CTR baixo (${ctr.toFixed(2)}%) — revise anuncios e palavras-chave`);
      if (level !== "critical") level = "warning";
    }

    // Rule 4: High cost per conversion
    if (costPerConv > 100 && row.conversions > 0) {
      campaignAlerts.push(`Custo por conversao alto (R$ ${costPerConv.toFixed(2)}) — otimize targeting e lances`);
      if (level !== "critical") level = "warning";
    }

    // Rule 5: Zero conversions with significant spend
    if (row.conversions === 0 && spend > 100) {
      campaignAlerts.push(`Nenhuma conversao com R$ ${spend.toFixed(2)} gastos — verifique rastreamento e relevancia`);
      level = "critical";
    }

    if (campaignAlerts.length > 0) {
      alerts.push({
        campaignId: row.campaignId,
        campaignName: row.campaignName || row.campaignId,
        level,
        alerts: campaignAlerts,
        metrics: {
          optimizationScore: null,
          searchImpressionShare: searchIS,
          searchBudgetLostIS: budgetLostIS,
          searchRankLostIS: rankLostIS,
          ctr,
          conversions: row.conversions,
          costPerConversion: costPerConv,
          roas,
        },
      });
    }
  }

  return alerts.sort((a, b) => {
    const order: Record<DiagnosticLevel, number> = { critical: 0, warning: 1, healthy: 2 };
    return order[a.level] - order[b.level];
  });
}

const LEVEL_CONFIG: Record<DiagnosticLevel, { label: string; badgeClass: string; rowClass: string }> = {
  critical: { label: "Critico", badgeClass: "bg-destructive text-destructive-foreground", rowClass: "bg-destructive/5" },
  warning: { label: "Atencao", badgeClass: "bg-yellow-500 text-white", rowClass: "bg-yellow-500/5" },
  healthy: { label: "Saudavel", badgeClass: "bg-green-600 text-white", rowClass: "" },
};

export default function DiagnosticPage() {
  const { selectedCustomer } = useAuthStore();
  const customerId = selectedCustomer?.id;
  const isConnected = !!customerId;

  const [datePreset, setDatePreset] = useState<DateRange>("LAST_14_DAYS");
  const queryClient = useQueryClient();
  const { diagnostics, deleteDiagnostic } = useDiagnosticHistory();
  // Diagnóstico salvo sendo visualizado (null = diagnóstico ao vivo)
  const [viewing, setViewing] = useState<DiagnosticRow | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [currentCreatedAt, setCurrentCreatedAt] = useState<string | null>(null);
  const savedForRef = useRef<number>(0); // dedupe: salva uma vez por fetch

  const { data: campaignData, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ["diagnostic-campaigns", customerId, datePreset],
    queryFn: async () => {
      if (!customerId) return null;
      const response = await getCampaignMetrics(customerId, undefined, datePreset);
      return (response.results || []).map((r: any) => normalizeMetricsRow(r));
    },
    enabled: !!customerId,
  });

  const diagnosticAlerts = useMemo(() => {
    if (!campaignData) return [];
    return analyzeCampaigns(campaignData);
  }, [campaignData]);

  const totalCampaigns = useMemo(() => {
    if (!campaignData) return 0;
    return new Set(campaignData.map((r) => r.campaignId).filter(Boolean)).size;
  }, [campaignData]);

  const counts = useMemo(() => ({
    total: totalCampaigns,
    critical: diagnosticAlerts.filter((a) => (a.level as string) === "critical").length,
    warning: diagnosticAlerts.filter((a) => a.level === "warning").length,
    healthy: totalCampaigns - diagnosticAlerts.length,
  }), [diagnosticAlerts, totalCampaigns]);

  // Persiste cada diagnóstico gerado (uma vez por fetch). Não-bloqueante.
  useEffect(() => {
    if (isLoading || !campaignData || !customerId || dataUpdatedAt === 0) return;
    if (savedForRef.current === dataUpdatedAt) return;
    savedForRef.current = dataUpdatedAt;
    (async () => {
      try {
        const uid = (await supabase.auth.getSession()).data.session?.user.id ?? null;
        if (!uid) return;
        const id = await saveDiagnostic({
          userId: uid,
          customerId,
          datePreset: String(datePreset),
          alerts: diagnosticAlerts,
          total: counts.total,
          critical: counts.critical,
          warning: counts.warning,
          healthy: counts.healthy,
        });
        setCurrentId(id);
        setCurrentCreatedAt(new Date().toISOString());
        setViewing(null);
        queryClient.invalidateQueries({ queryKey: ["diagnostics-history"] });
      } catch (err) {
        console.warn("[Diagnostic] Falha ao persistir diagnóstico:", err);
      }
    })();
  }, [dataUpdatedAt, isLoading, campaignData, customerId, datePreset, diagnosticAlerts, counts, queryClient]);

  // Variáveis de exibição: alterna entre o diagnóstico ao vivo e um salvo (viewing).
  const displayAlerts = viewing ? (viewing.alerts as DiagnosticAlert[]) : diagnosticAlerts;
  const displayCounts = viewing
    ? { total: viewing.total, critical: viewing.critical, warning: viewing.warning, healthy: viewing.healthy }
    : counts;
  const displayCreatedAt = viewing ? viewing.created_at : currentCreatedAt;
  const showLoading = isLoading && !viewing;

  const loadDiagnostic = useCallback(async (id: string) => {
    try {
      const row = await fetchDiagnostic(id);
      if (row) setViewing(row);
    } catch (err) {
      console.warn("[Diagnostic] Falha ao carregar diagnóstico:", err);
    }
  }, []);

  const handleDeleteDiagnostic = useCallback(
    async (e: MouseEvent<HTMLButtonElement>, id: string) => {
      e.stopPropagation();
      await deleteDiagnostic(id);
      if (viewing?.id === id) setViewing(null);
    },
    [deleteDiagnostic, viewing],
  );

  const insightPrompt = useMemo(() => {
    if (!counts.total) return null;
    const lines = diagnosticAlerts.slice(0, 10).map((a) => {
      const isLoss = a.metrics.searchBudgetLostIS > 0 ? `Budget Lost IS: ${a.metrics.searchBudgetLostIS.toFixed(0)}%` : "";
      const rankLoss = a.metrics.searchRankLostIS > 0 ? `Rank Lost IS: ${a.metrics.searchRankLostIS.toFixed(0)}%` : "";
      const signals = [isLoss, rankLoss, `CTR ${a.metrics.ctr.toFixed(2)}%`].filter(Boolean).join(", ");
      return `- [${a.level.toUpperCase()}] ${a.campaignName} | ${signals}`;
    });
    const saudaveis = counts.healthy > 0 ? `${counts.healthy} campanhas saudaveis sem alertas.` : "";
    return `Diagnostico de conta Google Ads — ultimos ${datePreset === "LAST_14_DAYS" ? "14" : "30"} dias.
${counts.total} campanhas analisadas: ${counts.critical} criticas, ${counts.warning} em alerta, ${counts.healthy} saudaveis. ${saudaveis}
${diagnosticAlerts.length > 0 ? `Campanhas com alertas:\n${lines.join("\n")}` : "Nenhum alerta detectado na conta."}
Interprete os padroes, priorize acoes e sugira estrategias para melhorar a performance geral da conta.`;
  }, [diagnosticAlerts, counts, datePreset]);

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Diagnostico da Conta</h1>
        <ConnectionBanner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Diagnostico da Conta</h1>
        <p className="text-muted-foreground">
          Analisa Quality Score, Impression Share e alertas de performance das campanhas
        </p>
        {displayCreatedAt && (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {viewing ? "Diagnóstico salvo · criado em " : "Criado em "}
            {new Date(displayCreatedAt).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>

      <AIInsightsPanel prompt={insightPrompt} context="Diagnostico da Conta" />

      {/* Period selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label>Periodo de analise</Label>
            <div className="flex gap-2">
              {([
                { label: "14 dias", value: "LAST_14_DAYS" as DateRange },
                { label: "30 dias", value: "LAST_30_DAYS" as DateRange },
              ]).map((p) => (
                <Button
                  key={p.value}
                  variant={datePreset === p.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setViewing(null);
                    setDatePreset(p.value);
                  }}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de diagnósticos */}
      {diagnostics.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4" /> Histórico de diagnósticos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {diagnostics.map((d) => (
              <div
                key={d.id}
                onClick={() => loadDiagnostic(d.id)}
                className={cn(
                  "group flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
                  viewing?.id === d.id ? "border-primary bg-accent" : "hover:bg-muted",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {new Date(d.created_at).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {d.date_preset ? `${d.date_preset} · ` : ""}
                    {d.total} campanhas · {d.critical} críticas · {d.warning} em alerta
                  </p>
                </div>
                <button
                  onClick={(e) => handleDeleteDiagnostic(e, d.id)}
                  className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  aria-label="Excluir diagnóstico"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Summary cards */}
      {!showLoading && displayCounts.total > 0 && (
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Eye className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
              <div className="text-2xl font-bold">{displayCounts.total}</div>
              <p className="text-xs text-muted-foreground">Total analisadas</p>
            </CardContent>
          </Card>
          <Card className="border-destructive/30">
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="h-6 w-6 mx-auto mb-1 text-destructive" />
              <div className="text-2xl font-bold text-destructive">{displayCounts.critical}</div>
              <p className="text-xs text-muted-foreground">Critico</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/30">
            <CardContent className="pt-6 text-center">
              <Activity className="h-6 w-6 mx-auto mb-1 text-yellow-500" />
              <div className="text-2xl font-bold text-yellow-600">{displayCounts.warning}</div>
              <p className="text-xs text-muted-foreground">Atencao</p>
            </CardContent>
          </Card>
          <Card className="border-green-500/30">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-6 w-6 mx-auto mb-1 text-green-600" />
              <div className="text-2xl font-bold text-green-600">{displayCounts.healthy}</div>
              <p className="text-xs text-muted-foreground">Saudavel</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Critical alert */}
      {displayCounts.critical > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{displayCounts.critical} campanha(s)</strong> com problemas criticos detectados.
            Revise orcamentos, lances e rastreamento de conversoes imediatamente.
          </AlertDescription>
        </Alert>
      )}

      {/* Results table */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados da Analise</CardTitle>
          <CardDescription>
            Budget Lost IS {">"} 30% = Critico | Rank Lost IS {">"} 30% = Atencao | CTR {"<"} 1% = Atencao
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : displayAlerts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campanha</TableHead>
                    <TableHead className="text-center">Nivel</TableHead>
                    <TableHead className="text-right">Search IS</TableHead>
                    <TableHead className="text-right">Budget Lost</TableHead>
                    <TableHead className="text-right">Rank Lost</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-right">Conversoes</TableHead>
                    <TableHead className="text-right">Custo/Conv</TableHead>
                    <TableHead>Alertas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayAlerts.map((alert) => {
                    const cfg = LEVEL_CONFIG[alert.level];
                    return (
                      <TableRow key={alert.campaignId} className={cfg.rowClass}>
                        <TableCell className="font-medium max-w-[180px] truncate" title={alert.campaignName}>
                          {alert.campaignName}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={cfg.badgeClass}>{cfg.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{alert.metrics.searchImpressionShare.toFixed(0)}%</TableCell>
                        <TableCell className="text-right">
                          {alert.metrics.searchBudgetLostIS > 0 ? `${alert.metrics.searchBudgetLostIS.toFixed(0)}%` : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {alert.metrics.searchRankLostIS > 0 ? `${alert.metrics.searchRankLostIS.toFixed(0)}%` : "—"}
                        </TableCell>
                        <TableCell className="text-right">{alert.metrics.ctr.toFixed(2)}%</TableCell>
                        <TableCell className="text-right">{alert.metrics.conversions}</TableCell>
                        <TableCell className="text-right">
                          {alert.metrics.costPerConversion > 0 ? `R$ ${alert.metrics.costPerConversion.toFixed(2)}` : "—"}
                        </TableCell>
                        <TableCell className="max-w-[250px]">
                          <div className="space-y-1">
                            {alert.alerts.map((a, i) => (
                              <p key={i} className="text-xs text-muted-foreground">- {a}</p>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">
              {displayCounts.total === 0
                ? "Nenhum dado de campanha encontrado no periodo."
                : "Nenhum alerta detectado — suas campanhas estao saudaveis!"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
