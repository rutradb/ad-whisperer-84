import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useCampaigns } from "@/hooks/useCampaigns";
import { getAdMetrics, getCampaignMetrics } from "@/lib/google-ads/reporting";
import { updateAdStatus, bulkUpdateStatus } from "@/lib/google-ads/mutations";
import { normalizeMetricsRow, microsToUnits, computeRoas, computeCpa } from "@/lib/google-ads/types";
import type { MetricsRow, DateRange } from "@/lib/google-ads/types";
import { CONFIG } from "@/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { AIInsightsPanel } from "@/components/AIInsightsPanel";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  TrendingUp, TrendingDown, Minus, Loader2, Zap, AlertTriangle, ArrowRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIntegrationsStore } from "@/store/useIntegrationsStore";
import { executeShopifyTool } from "@/lib/agent/shopify-executor";
import { executePipedriveTool } from "@/lib/agent/pipedrive-executor";
import { executeHubSpotTool } from "@/lib/agent/hubspot-executor";

const DATE_PRESETS: { label: string; value: DateRange }[] = [
  { label: "7 dias", value: "LAST_7_DAYS" },
  { label: "14 dias", value: "LAST_14_DAYS" },
  { label: "30 dias", value: "LAST_30_DAYS" },
];

type AdClassification = "bleeder" | "winner" | "neutral";

interface ClassifiedAd {
  id: string;
  name: string;
  classification: AdClassification;
  reasons: string[];
  metrics: {
    ctr: number;
    spend: number;
    cpa: number | null;
    impressions: number;
    conversions: number;
  };
  recommendation: string;
  resourceName?: string;
}

function classifyAdsFromMetrics(rows: MetricsRow[], cpaTarget: number): ClassifiedAd[] {
  return rows.map((row) => {
    const ctr = row.ctr * 100; // Google Ads returns ctr as fraction
    const spend = microsToUnits(row.costMicros);
    const impressions = row.impressions;
    const conversions = row.conversions;
    const cpa = conversions > 0 ? spend / conversions : null;

    let classification: AdClassification = "neutral";
    const reasons: string[] = [];
    let recommendation = "Manter em observacao";

    const BLEEDER_CTR = CONFIG.BLEEDER_CTR_THRESHOLD || 0.5;
    const BLEEDER_SPEND = CONFIG.BLEEDER_MIN_SPEND || 50;
    const WINNER_CTR = CONFIG.WINNER_CTR_THRESHOLD || 1.5;

    if (ctr < BLEEDER_CTR && spend > BLEEDER_SPEND) {
      classification = "bleeder";
      reasons.push(`CTR muito baixo (${ctr.toFixed(2)}% < ${BLEEDER_CTR}%)`);
      reasons.push(`Ja gastou R$ ${spend.toFixed(2)} sem eficiencia`);
      recommendation = "PAUSAR imediatamente e realocar orcamento para Winners";
    }

    if (ctr > WINNER_CTR && (cpa !== null ? cpa < cpaTarget : true)) {
      classification = "winner";
      reasons.push(`CTR excelente (${ctr.toFixed(2)}% > ${WINNER_CTR}%)`);
      if (cpa !== null) reasons.push(`CPA (R$ ${cpa.toFixed(2)}) abaixo da meta (R$ ${cpaTarget.toFixed(2)})`);
      recommendation = "Escalar orcamento +20% a cada 3 dias (usar Scale Calculator)";
    }

    return {
      id: row.adId || "",
      name: row.adGroupName ? `${row.adGroupName} / Ad ${row.adId}` : `Ad ${row.adId}`,
      classification,
      reasons,
      metrics: { ctr, spend, cpa, impressions, conversions },
      recommendation,
    };
  });
}

export default function OptimizerPage() {
  const { selectedCustomer } = useAuthStore();
  const customerId = selectedCustomer?.id;
  const isConnected = !!customerId;
  const navigate = useNavigate();
  const { toast } = useToast();

  const [campaignId, setCampaignId] = useState("");
  const [datePreset, setDatePreset] = useState<DateRange>("LAST_7_DAYS");
  const [cpaTarget, setCpaTarget] = useState("30");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [classified, setClassified] = useState<ClassifiedAd[]>([]);
  const [hasResults, setHasResults] = useState(false);
  const [crmRevenueContext, setCrmRevenueContext] = useState<string | null>(null);
  const { shopify, pipedrive, hubspot } = useIntegrationsStore();

  const { data: campaignsData, isLoading: loadingCampaigns, error: campaignsError } = useCampaigns(customerId ?? undefined, {
    status: "ENABLED" as any,
    limit: 100,
  });

  const handleAnalyze = useCallback(async () => {
    if (!campaignId || !customerId) return;
    setIsAnalyzing(true);
    setHasResults(false);
    try {
      const response = await getAdMetrics(customerId, undefined, undefined, datePreset);
      const rows = (response.results || []).map((r: any) => normalizeMetricsRow(r));

      // Filter to ads belonging to the selected campaign
      const campaignAds = rows.filter((r) => r.campaignId === campaignId);

      if (campaignAds.length === 0) {
        toast({ title: "Nenhum anuncio encontrado", description: "Esta campanha nao possui anuncios com dados no periodo.", variant: "destructive" });
        setIsAnalyzing(false);
        return;
      }

      const result = classifyAdsFromMetrics(campaignAds, parseFloat(cpaTarget) || 30);
      setClassified(result);
      setHasResults(true);

      // Fetch real revenue from integrations in background
      const days = datePreset === "LAST_7_DAYS" ? 7 : datePreset === "LAST_14_DAYS" ? 14 : 30;
      const toDate = new Date();
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);
      const fromStr = fromDate.toISOString().split("T")[0];
      const toStr = toDate.toISOString().split("T")[0];
      const crmLines: string[] = [];
      const totalSpend = campaignAds.reduce((s, r) => s + microsToUnits(r.costMicros), 0);

      if (shopify.isConnected) {
        const raw = await executeShopifyTool("get_shopify_revenue_summary", {
          created_at_min: fromStr + "T00:00:00-03:00",
          created_at_max: toStr + "T23:59:59-03:00",
          financial_status: "paid",
        }).catch(() => "{}");
        const parsed = JSON.parse(raw);
        if (!parsed.error && parsed.total_revenue) {
          const realRoas = totalSpend > 0 ? (parseFloat(parsed.total_revenue) / totalSpend).toFixed(2) : "N/A";
          crmLines.push(`Shopify: R$${parseFloat(parsed.total_revenue).toFixed(2)} receita | ${parsed.order_count} pedidos | ROAS real: ${realRoas}x`);
        }
      }
      if (pipedrive.isConnected) {
        const raw = await executePipedriveTool("correlate_pipedrive_with_google_ads", { start_date: fromStr, end_date: toStr }).catch(() => "{}");
        const parsed = JSON.parse(raw);
        if (!parsed.error && parsed.total_deals_analyzed) {
          crmLines.push(`Pipedrive: ${parsed.total_deals_analyzed} deals | Won value: R$${parsed.by_campaign?.reduce((s: number, r: any) => s + parseFloat(r.won_value), 0).toFixed(2) ?? "0"}`);
        }
      }
      if (hubspot.isConnected) {
        const raw = await executeHubSpotTool("get_hubspot_overview", { start_date: fromStr, end_date: toStr }).catch(() => "{}");
        const parsed = JSON.parse(raw);
        if (!parsed.error && parsed.total_deals !== undefined) {
          crmLines.push(`HubSpot: ${parsed.total_deals} deals | Won: ${parsed.won_deals} | Receita ganha: R$${parseFloat(parsed.won_value || "0").toFixed(2)}`);
        }
      }

      setCrmRevenueContext(crmLines.length > 0 ? crmLines.join("\n") : null);
    } catch (err: any) {
      toast({ title: "Erro na analise", description: err.message, variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  }, [campaignId, customerId, datePreset, cpaTarget, toast, shopify, pipedrive, hubspot]);

  const handlePause = useCallback(async (adId: string) => {
    if (!customerId) return;
    try {
      const resourceName = `customers/${customerId}/adGroupAds/${adId}`;
      await updateAdStatus(customerId, resourceName, "PAUSED");
      toast({ title: "Anuncio pausado com sucesso" });
      setClassified(prev => prev.filter(a => a.id !== adId));
    } catch (err: any) {
      toast({ title: "Erro ao pausar", description: err.message, variant: "destructive" });
    }
  }, [customerId, toast]);

  const bleeders = useMemo(() => classified.filter(a => a.classification === "bleeder"), [classified]);
  const winners = useMemo(() => classified.filter(a => a.classification === "winner"), [classified]);
  const neutrals = useMemo(() => classified.filter(a => a.classification === "neutral"), [classified]);

  const insightPrompt = useMemo(() => {
    if (!classified.length) return null;
    const campanha = (campaignsData || []).find((c: any) => c.id === campaignId)?.name || campaignId;
    const lines = classified.slice(0, 15).map((a) => {
      const cpa = a.metrics.cpa && a.metrics.cpa > 0 ? `CPA R$${a.metrics.cpa.toFixed(2)}` : "sem conversao";
      const spend = `R$${a.metrics.spend.toFixed(0)} gasto`;
      return `- [${a.classification.toUpperCase()}] ${a.name} | ${spend} | ${cpa}`;
    });
    return `Analise de otimizacao — campanha "${campanha}" (${datePreset}).
Meta CPA: R$${cpaTarget}. Resultados: ${winners.length} winners, ${bleeders.length} bleeders, ${neutrals.length} neutros.
${lines.join("\n")}
Interprete o padrao de performance, priorize as acoes mais impactantes e sugira proximos passos para escalar winners e conter bleeders.${crmRevenueContext ? `\n\nRECEITA REAL (CRM/Loja):\n${crmRevenueContext}` : ""}`;
  }, [classified, campaignId, campaignsData, datePreset, cpaTarget, winners, bleeders, neutrals, crmRevenueContext]);

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Otimizador de Anuncios</h1>
        <ConnectionBanner />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Otimizador de Anuncios</h1>
        <p className="text-muted-foreground">Classifique anuncios como Bleeder/Winner com base em metricas do Google Ads</p>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2 flex-1 min-w-[200px]">
              <Label>Campanha</Label>
              {campaignsError ? (
                <p className="text-xs text-destructive">Erro ao carregar campanhas — verifique a conexao.</p>
              ) : (
                <Select value={campaignId} onValueChange={setCampaignId} disabled={loadingCampaigns}>
                  <SelectTrigger>
                    {loadingCampaigns
                      ? <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />Carregando...</span>
                      : <SelectValue placeholder="Selecione uma campanha" />
                    }
                  </SelectTrigger>
                  <SelectContent>
                    {(campaignsData || []).map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>Meta CPA (R$)</Label>
              <Input type="number" min="1" className="w-28" value={cpaTarget} onChange={e => setCpaTarget(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Periodo</Label>
              <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DateRange)}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DATE_PRESETS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAnalyze} disabled={!campaignId || isAnalyzing}>
              {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
              Analisar Anuncios
            </Button>
          </div>
        </CardContent>
      </Card>

      {isAnalyzing && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
        </div>
      )}

      {hasResults && !isAnalyzing && (
        <>
          <AIInsightsPanel prompt={insightPrompt} context="Otimizador" />

          {/* Summary badges */}
          <div className="flex flex-wrap gap-3">
            <Badge variant="destructive" className="text-sm px-3 py-1">
              <TrendingDown className="mr-1 h-3 w-3" /> {bleeders.length} Bleeders
            </Badge>
            <Badge className="text-sm px-3 py-1 bg-green-600 hover:bg-green-700">
              <TrendingUp className="mr-1 h-3 w-3" /> {winners.length} Winners
            </Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              <Minus className="mr-1 h-3 w-3" /> {neutrals.length} Neutros
            </Badge>
          </div>

          {/* Bleeders section */}
          {bleeders.length > 0 && (
            <ClassificationSection
              title="BLEEDERS — Pausar Imediatamente"
              borderClass="border-destructive/50"
              ads={bleeders}
              renderAction={(ad) => (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">Pausar Anuncio</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Pausar anuncio?</AlertDialogTitle>
                      <AlertDialogDescription>Tem certeza que deseja pausar "{ad.name}"?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handlePause(ad.id)}>Pausar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            />
          )}

          {/* Winners section */}
          {winners.length > 0 && (
            <ClassificationSection
              title="WINNERS — Escalar"
              borderClass="border-green-500/50"
              ads={winners}
              renderAction={() => (
                <Button variant="outline" size="sm" onClick={() => navigate("/ai/scale-calculator")}>
                  <ArrowRight className="mr-1 h-3 w-3" /> Ir para Scale Calculator
                </Button>
              )}
            />
          )}

          {/* Neutros section */}
          {neutrals.length > 0 && (
            <ClassificationSection
              title="NEUTROS — Monitorar"
              borderClass="border-muted"
              ads={neutrals}
              compact
            />
          )}
        </>
      )}
    </div>
  );
}

// --- Sub-component for classification sections ---

function ClassificationSection({ title, borderClass, ads, renderAction, compact }: {
  title: string;
  borderClass: string;
  ads: ClassifiedAd[];
  renderAction?: (ad: ClassifiedAd) => React.ReactNode;
  compact?: boolean;
}) {
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <Card className={`border-2 ${borderClass}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {ads.map(ad => (
          <div key={ad.id} className={`p-3 rounded-lg border bg-card ${compact ? "py-2" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{ad.name}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                  <span>CTR: {ad.metrics.ctr.toFixed(2)}%</span>
                  <span>Gasto: {fmt(ad.metrics.spend)}</span>
                  {ad.metrics.cpa !== null && <span>CPA: {fmt(ad.metrics.cpa)}</span>}
                  <span>Conversoes: {ad.metrics.conversions}</span>
                </div>
                {!compact && ad.reasons.length > 0 && (
                  <div className="mt-2 space-y-0.5">
                    {ad.reasons.map((r, i) => <p key={i} className="text-xs text-muted-foreground">- {r}</p>)}
                    <p className="text-xs font-medium mt-1">{ad.recommendation}</p>
                  </div>
                )}
              </div>
              {renderAction && <div className="shrink-0">{renderAction(ad)}</div>}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
