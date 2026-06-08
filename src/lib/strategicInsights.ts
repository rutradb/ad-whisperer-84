import type { MetricsRow } from "@/lib/google-ads/types";
import { computeRoas, computeCpa, microsToUnits, parseNumeric } from "@/lib/google-ads/types";
import { isDeltaPositive } from "@/lib/periodUtils";

// --- Health Score ---

export interface HealthSignal {
  name: string;
  score: number;
  weight: number;
  status: "good" | "warning" | "critical";
  detail: string;
}

export interface HealthScore {
  overall: number;
  label: "Excelente" | "Bom" | "Atencao" | "Critico";
  color: string;
  signals: HealthSignal[];
}

function clampScore(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

export function computeHealthScore(
  current: MetricsRow,
  previous?: MetricsRow
): HealthScore {
  const ctr = current.ctr * 100; // Google Ads returns fraction
  const roas = computeRoas(current);
  const spend = microsToUnits(current.costMicros);
  const cpa = computeCpa(current);
  const prevCpa = previous ? computeCpa(previous) : null;

  // 1. CTR Signal (weight 0.20)
  const ctrScore = ctr >= 2 ? 100 : ctr >= 1 ? 70 : ctr >= 0.5 ? 40 : 10;
  const ctrSignal: HealthSignal = {
    name: "CTR",
    score: ctrScore,
    weight: 0.20,
    status: ctrScore >= 70 ? "good" : ctrScore >= 40 ? "warning" : "critical",
    detail: `${ctr.toFixed(2)}%`,
  };

  // 2. ROAS Signal (weight 0.30)
  const roasScore = roas >= 3 ? 100 : roas >= 2 ? 80 : roas >= 1 ? 50 : roas > 0 ? 20 : 0;
  const roasSignal: HealthSignal = {
    name: "ROAS",
    score: roasScore,
    weight: 0.30,
    status: roasScore >= 70 ? "good" : roasScore >= 40 ? "warning" : "critical",
    detail: `${roas.toFixed(2)}x`,
  };

  // 3. CPA Trend Signal (weight 0.20)
  let cpaTrendScore = 60;
  let cpaTrendDetail = "Sem dados anteriores";
  if (prevCpa !== null && prevCpa > 0 && cpa > 0) {
    const cpaDelta = ((cpa - prevCpa) / prevCpa) * 100;
    cpaTrendScore = cpaDelta <= -10 ? 100 : cpaDelta <= 5 ? 70 : cpaDelta <= 30 ? 40 : 10;
    cpaTrendDetail = `${cpaDelta > 0 ? "+" : ""}${cpaDelta.toFixed(0)}% vs anterior`;
  }
  const cpaTrendSignal: HealthSignal = {
    name: "CPA",
    score: cpaTrendScore,
    weight: 0.20,
    status: cpaTrendScore >= 70 ? "good" : cpaTrendScore >= 40 ? "warning" : "critical",
    detail: cpaTrendDetail,
  };

  // 4. Search Impression Share Signal (weight 0.15)
  const searchIS = (current.searchImpressionShare || 0) * 100;
  const searchISScore = searchIS >= 80 ? 100 : searchIS >= 60 ? 70 : searchIS >= 40 ? 40 : 10;
  const searchISSignal: HealthSignal = {
    name: "Search IS",
    score: searchISScore,
    weight: 0.15,
    status: searchISScore >= 70 ? "good" : searchISScore >= 40 ? "warning" : "critical",
    detail: `${searchIS.toFixed(0)}%`,
  };

  // 5. Conversion Rate Signal (weight 0.15)
  const convRate = current.conversionRate * 100;
  const convRateScore = convRate >= 5 ? 100 : convRate >= 3 ? 70 : convRate >= 1 ? 40 : 10;
  const convRateSignal: HealthSignal = {
    name: "Conv. Rate",
    score: convRateScore,
    weight: 0.15,
    status: convRateScore >= 70 ? "good" : convRateScore >= 40 ? "warning" : "critical",
    detail: `${convRate.toFixed(2)}%`,
  };

  const signals = [ctrSignal, roasSignal, cpaTrendSignal, searchISSignal, convRateSignal];
  const overall = clampScore(
    signals.reduce((sum, s) => sum + s.score * s.weight, 0)
  );

  let label: HealthScore["label"];
  let color: string;
  if (overall >= 80) { label = "Excelente"; color = "bg-green-600"; }
  else if (overall >= 60) { label = "Bom"; color = "bg-blue-600"; }
  else if (overall >= 40) { label = "Atencao"; color = "bg-yellow-500"; }
  else { label = "Critico"; color = "bg-red-600"; }

  return { overall, label, color, signals };
}

// --- Anomaly Detection ---

export interface Anomaly {
  metric: string;
  metricLabel: string;
  current: number;
  previous: number;
  changePercent: number;
  severity: "info" | "warning" | "critical";
  direction: "up" | "down";
  isPositive: boolean;
  message: string;
}

const METRIC_LABELS: Record<string, string> = {
  costMicros: "Gasto",
  ctr: "CTR",
  averageCpc: "CPC",
  averageCpm: "CPM",
  conversions: "Conversoes",
  cpa: "CPA",
  roas: "ROAS",
  searchImpressionShare: "Search IS",
};

export function detectAnomalies(
  current: MetricsRow,
  previous: MetricsRow,
  thresholdPercent = 20
): Anomaly[] {
  const anomalies: Anomaly[] = [];

  const currentSpend = microsToUnits(current.costMicros);
  const previousSpend = microsToUnits(previous.costMicros);
  const currentCpc = microsToUnits(current.averageCpc);
  const previousCpc = microsToUnits(previous.averageCpc);

  const metrics: Array<{ key: string; currentVal: number; prevVal: number }> = [
    { key: "costMicros", currentVal: currentSpend, prevVal: previousSpend },
    { key: "ctr", currentVal: current.ctr * 100, prevVal: previous.ctr * 100 },
    { key: "averageCpc", currentVal: currentCpc, prevVal: previousCpc },
    { key: "conversions", currentVal: current.conversions, prevVal: previous.conversions },
    { key: "roas", currentVal: computeRoas(current), prevVal: computeRoas(previous) },
    { key: "cpa", currentVal: computeCpa(current), prevVal: computeCpa(previous) },
  ];

  for (const { key, currentVal, prevVal } of metrics) {
    if (prevVal === 0 && currentVal === 0) continue;
    const change = prevVal === 0 ? 100 : ((currentVal - prevVal) / prevVal) * 100;
    const absChange = Math.abs(change);

    if (absChange >= thresholdPercent) {
      const direction: "up" | "down" = change > 0 ? "up" : "down";
      const isPositive = isDeltaPositive(key, change);
      const severity: Anomaly["severity"] = absChange >= 50 ? "critical" : absChange >= thresholdPercent ? "warning" : "info";
      const dirLabel = direction === "up" ? "subiu" : "caiu";

      anomalies.push({
        metric: key,
        metricLabel: METRIC_LABELS[key] || key,
        current: currentVal,
        previous: prevVal,
        changePercent: change,
        severity,
        direction,
        isPositive,
        message: `${METRIC_LABELS[key] || key} ${dirLabel} ${absChange.toFixed(0)}% (${prevVal.toFixed(2)} -> ${currentVal.toFixed(2)})`,
      });
    }
  }

  return anomalies.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

// --- Campaign Classification ---

export type CampaignClass = "winner" | "bleeder" | "neutral";

export interface ClassifiedCampaign {
  campaign_id: string;
  campaign_name: string;
  classification: CampaignClass;
  roas: number;
  spend: number;
  conversions: number;
  cpa: number;
  reasons: string[];
}

export function classifyCampaigns(
  campaignMetrics: MetricsRow[],
  options?: { minSpend?: number; roasTarget?: number }
): ClassifiedCampaign[] {
  const minSpend = options?.minSpend ?? 10;
  const roasTarget = options?.roasTarget ?? 1.0;

  return campaignMetrics
    .filter(row => row.campaignId)
    .map(row => {
      const roas = computeRoas(row);
      const spend = microsToUnits(row.costMicros);
      const conversions = row.conversions;
      const cpa = computeCpa(row);
      const reasons: string[] = [];

      let classification: CampaignClass = "neutral";

      if (spend >= minSpend && roas >= 2.0) {
        classification = "winner";
        reasons.push(`ROAS ${roas.toFixed(2)}x -- acima da meta`);
        if (conversions > 0) reasons.push(`${conversions} conversoes a R$ ${cpa.toFixed(2)}/conv.`);
      } else if (spend >= minSpend && (roas < roasTarget || (roas === 0 && spend >= minSpend * 3))) {
        classification = "bleeder";
        if (roas === 0) reasons.push(`Zero conversoes com R$ ${spend.toFixed(2)} gastos`);
        else reasons.push(`ROAS ${roas.toFixed(2)}x -- abaixo do break-even`);
        if (cpa > 0) reasons.push(`CPA R$ ${cpa.toFixed(2)}`);
      }

      return {
        campaign_id: row.campaignId!,
        campaign_name: row.campaignName || row.campaignId!,
        classification,
        roas,
        spend,
        conversions,
        cpa,
        reasons,
      };
    })
    .sort((a, b) => {
      const classOrder = { bleeder: 0, winner: 1, neutral: 2 };
      if (classOrder[a.classification] !== classOrder[b.classification])
        return classOrder[a.classification] - classOrder[b.classification];
      return b.spend - a.spend;
    });
}

// --- Budget Projection ---

export interface BudgetProjection {
  dailyBurnRate: number;
  totalSpentPeriod: number;
  projectedMonthlySpend: number;
  daysElapsed: number;
  daysRemaining: number;
  budgetRemaining: number | null;
  daysUntilExhaustion: number | null;
  burnRateStatus: "safe" | "warning" | "critical";
}

export function computeBudgetProjection(
  totalSpend: number,
  daysInPeriod: number,
  monthlyBudgetCap?: number
): BudgetProjection {
  const today = new Date();
  const daysElapsed = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - daysElapsed;

  const dailyBurnRate = daysInPeriod > 0 ? totalSpend / daysInPeriod : 0;
  const projectedMonthlySpend = dailyBurnRate * daysInMonth;

  let budgetRemaining: number | null = null;
  let daysUntilExhaustion: number | null = null;
  let burnRateStatus: BudgetProjection["burnRateStatus"] = "safe";

  if (monthlyBudgetCap && monthlyBudgetCap > 0) {
    budgetRemaining = Math.max(0, monthlyBudgetCap - totalSpend);
    daysUntilExhaustion = dailyBurnRate > 0 ? Math.round(budgetRemaining / dailyBurnRate) : null;

    if (daysUntilExhaustion !== null) {
      if (daysUntilExhaustion < 5) burnRateStatus = "critical";
      else if (daysUntilExhaustion < 10) burnRateStatus = "warning";
    }
  } else {
    if (projectedMonthlySpend > 0 && daysRemaining < 5) burnRateStatus = "warning";
  }

  return {
    dailyBurnRate,
    totalSpentPeriod: totalSpend,
    projectedMonthlySpend,
    daysElapsed,
    daysRemaining,
    budgetRemaining,
    daysUntilExhaustion,
    burnRateStatus,
  };
}
