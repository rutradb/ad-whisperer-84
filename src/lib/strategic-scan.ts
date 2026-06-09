// =============================================================================
// strategic-scan (cliente) — junta métricas do Google Ads, normaliza e chama a
// edge function `strategic-scan` que roda a análise adaptativa com Claude.
// =============================================================================

import { supabase } from "@/integrations/supabase/client";
import {
  getCustomerMetrics,
  getCampaignMetrics,
  getAccountPerformanceBySegment,
} from "@/lib/google-ads/reporting";
import {
  normalizeMetricsRow,
  microsToUnits,
  computeRoas,
  computeCpa,
} from "@/lib/google-ads/types";
import type { MetricsRow, DateRange } from "@/lib/google-ads/types";

// --- Tipos do payload (espelham a edge function) -------------------------------

export interface AccountSummary {
  name: string;
  currency: string;
  dateRange: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctrPct: number;
  conversions: number;
  convValue: number;
  cpa: number;
  roas: number;
  convRatePct: number;
}

export interface CampaignSummary {
  id: string;
  name: string;
  status: string;
  channel: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctrPct: number;
  conversions: number;
  convValue: number;
  cpa: number;
  roas: number;
  convRatePct: number;
}

export interface SegmentSummary {
  segment: string;
  spend: number;
  conversions: number;
  cpa: number;
  roas: number;
  ctrPct: number;
}

export interface ScanData {
  account: AccountSummary;
  campaigns: CampaignSummary[];
  breakdowns: {
    byDevice: SegmentSummary[];
    byDayOfWeek: SegmentSummary[];
  };
}

export interface ScanOptions {
  forceModel?: "haiku" | "sonnet" | "opus";
  forceComplexity?: "low" | "medium" | "high";
}

// --- Tipos do resultado (espelham a edge function) -----------------------------

export type Complexity = "low" | "medium" | "high";

export interface TriageResult {
  complexity: Complexity;
  complexityReason: string;
  dataDigest: string;
  derivedMetrics: {
    bestCampaign: string;
    worstCampaign: string;
    spendConcentrationPct: number;
    zeroConversionCampaigns: number;
  };
  anomalies: Array<{
    campaign: string;
    metric: string;
    note: string;
    severity: "low" | "medium" | "high";
  }>;
}

export interface Recommendation {
  title: string;
  rationale: string;
  action: string;
  priority: "alta" | "media" | "baixa";
  impact: "alto" | "medio" | "baixo";
  effort: "alto" | "medio" | "baixo";
  targetCampaigns: string[];
  expectedOutcome: string;
}

export interface StrategyResult {
  executiveSummary: string;
  healthScore: number;
  statisticalFindings: Array<{ title: string; detail: string; evidence: string }>;
  recommendations: Recommendation[];
  projection: string;
  risks: string[];
}

export interface ScanResult {
  complexity: Complexity;
  complexitySignals: {
    heuristic: Complexity;
    triage: Complexity;
    override: Complexity | null;
  };
  models: { triage: string; strategy: string };
  triage: TriageResult;
  analysis: StrategyResult;
  usage: { triage: Record<string, number>; strategy: Record<string, number> };
  generatedAt: string;
}

// --- Normalização para summaries -----------------------------------------------

function num(v: number | undefined): number {
  return Number.isFinite(v as number) ? (v as number) : 0;
}

function campaignFromRow(row: MetricsRow): CampaignSummary {
  return {
    id: row.campaignId || "",
    name: row.campaignName || row.campaignId || "Sem nome",
    status: "ENABLED",
    channel: "",
    spend: microsToUnits(row.costMicros),
    impressions: num(row.impressions),
    clicks: num(row.clicks),
    ctrPct: num(row.ctr) * 100,
    conversions: num(row.conversions),
    convValue: num(row.conversionsValue),
    cpa: computeCpa(row),
    roas: computeRoas(row),
    convRatePct: num(row.conversionRate) * 100,
  };
}

function segmentFromRow(row: MetricsRow, label: string): SegmentSummary {
  return {
    segment: label || "—",
    spend: microsToUnits(row.costMicros),
    conversions: num(row.conversions),
    cpa: computeCpa(row),
    roas: computeRoas(row),
    ctrPct: num(row.ctr) * 100,
  };
}

// --- Coleta de dados ------------------------------------------------------------

/**
 * Busca métricas de conta, campanhas e breakdowns (dispositivo + dia da semana)
 * em paralelo e devolve summaries prontos para a IA.
 */
export async function gatherScanData(
  customerId: string,
  account: { name: string; currency: string },
  dateRange: DateRange | string = "LAST_30_DAYS",
): Promise<ScanData> {
  const [customerRes, campaignRes, deviceRes, dowRes] = await Promise.all([
    getCustomerMetrics(customerId, dateRange),
    getCampaignMetrics(customerId, undefined, dateRange),
    getAccountPerformanceBySegment(customerId, "device", { dateRange }).catch(() => ({ results: [] })),
    getAccountPerformanceBySegment(customerId, "day_of_week", { dateRange }).catch(() => ({ results: [] })),
  ]);

  const accountRow = (customerRes.results || []).map((r: any) => normalizeMetricsRow(r))[0];
  const campaigns = (campaignRes.results || []).map((r: any) => campaignFromRow(normalizeMetricsRow(r)));

  const account_: AccountSummary = {
    name: account.name,
    currency: account.currency,
    dateRange: String(dateRange),
    spend: accountRow ? microsToUnits(accountRow.costMicros) : 0,
    impressions: accountRow ? num(accountRow.impressions) : 0,
    clicks: accountRow ? num(accountRow.clicks) : 0,
    ctrPct: accountRow ? num(accountRow.ctr) * 100 : 0,
    conversions: accountRow ? num(accountRow.conversions) : 0,
    convValue: accountRow ? num(accountRow.conversionsValue) : 0,
    cpa: accountRow ? computeCpa(accountRow) : 0,
    roas: accountRow ? computeRoas(accountRow) : 0,
    convRatePct: accountRow ? num(accountRow.conversionRate) * 100 : 0,
  };

  const byDevice = (deviceRes.results || [])
    .map((r: any) => normalizeMetricsRow(r))
    .map((row: MetricsRow) => segmentFromRow(row, row.device || "—"));

  const byDayOfWeek = (dowRes.results || [])
    .map((r: any) => normalizeMetricsRow(r))
    .map((row: MetricsRow) => segmentFromRow(row, row.dayOfWeek || "—"));

  return { account: account_, campaigns, breakdowns: { byDevice, byDayOfWeek } };
}

// --- Invocação da edge function ------------------------------------------------

export async function runStrategicScan(input: {
  apiKey: string;
  data: ScanData;
  businessContext?: string;
  options?: ScanOptions;
}): Promise<ScanResult> {
  const { data, error } = await supabase.functions.invoke<ScanResult & { error?: string }>(
    "strategic-scan",
    {
      body: {
        apiKey: input.apiKey,
        account: input.data.account,
        campaigns: input.data.campaigns,
        breakdowns: input.data.breakdowns,
        businessContext: input.businessContext,
        options: input.options,
      },
    },
  );

  if (error) throw new Error(error.message || "Falha ao executar a varredura estratégica.");
  if (!data) throw new Error("Resposta vazia da varredura.");
  if ((data as { error?: string }).error) throw new Error((data as { error?: string }).error!);

  return data as ScanResult;
}
