import { CONFIG } from "@/config";

export type FatigueLevel = "healthy" | "warning" | "critical";

export interface FatigueAlert {
  adId: string;
  adName: string;
  level: FatigueLevel;
  alerts: string[];
  metrics: {
    currentCtr: number;
    peakCtr: number;
    ctrDropPercent: number;
    frequency: number;
    currentCpc: number;
    baselineCpc: number;
    cpcIncreasePercent: number;
  };
}

export function detectFatigue(adInsightsOverTime: any[]): FatigueAlert[] {
  const grouped = new Map<string, any[]>();
  for (const row of adInsightsOverTime) {
    const id = row.ad_id;
    if (!id) continue;
    if (!grouped.has(id)) grouped.set(id, []);
    grouped.get(id)!.push(row);
  }

  const alerts: FatigueAlert[] = [];

  for (const [adId, days] of grouped) {
    days.sort((a: any, b: any) => a.date_start.localeCompare(b.date_start));
    const ctrs = days.map((d: any) => parseFloat(d.ctr || "0"));
    const cpcs = days.map((d: any) => parseFloat(d.cpc || "0"));
    const frequencies = days.map((d: any) => parseFloat(d.frequency || "0"));

    const peakCtr = Math.max(...ctrs);
    const currentCtr = ctrs[ctrs.length - 1] || 0;
    const ctrDropPercent = peakCtr > 0 ? ((peakCtr - currentCtr) / peakCtr) * 100 : 0;
    const currentFrequency = frequencies[frequencies.length - 1] || 0;
    const validCpcs = cpcs.filter((c) => c > 0);
    const baselineCpc = validCpcs.length > 0
      ? validCpcs.slice(0, 7).reduce((a, b) => a + b, 0) / Math.min(validCpcs.length, 7)
      : 0;
    const currentCpc = cpcs[cpcs.length - 1] || 0;
    const cpcIncreasePercent = baselineCpc > 0 ? ((currentCpc - baselineCpc) / baselineCpc) * 100 : 0;

    const adAlerts: string[] = [];
    let level: FatigueLevel = "healthy";

    // Rule 1: CTR drop from peak for consecutive days → CRITICAL
    if (ctrDropPercent >= CONFIG.FATIGUE_CTR_DROP_PERCENT) {
      const recentCtrs = ctrs.slice(-CONFIG.FATIGUE_CTR_DROP_DAYS);
      const threshold = peakCtr * (1 - CONFIG.FATIGUE_CTR_DROP_PERCENT / 100);
      if (recentCtrs.every((c) => c < threshold) && recentCtrs.length >= CONFIG.FATIGUE_CTR_DROP_DAYS) {
        adAlerts.push(`CTR caiu ${ctrDropPercent.toFixed(0)}% do pico (${peakCtr.toFixed(2)}% → ${currentCtr.toFixed(2)}%) por ${CONFIG.FATIGUE_CTR_DROP_DAYS}+ dias`);
        level = "critical";
      }
    }

    // Rule 2: High frequency → WARNING
    if (currentFrequency > CONFIG.FATIGUE_FREQUENCY_MAX) {
      adAlerts.push(`Frequência ${currentFrequency.toFixed(1)} (limite: ${CONFIG.FATIGUE_FREQUENCY_MAX}) — público saturado`);
      if (level !== "critical") level = "warning";
    }

    // Rule 3: CPC increase vs baseline → WARNING
    if (cpcIncreasePercent > CONFIG.FATIGUE_CPC_INCREASE_PERCENT) {
      adAlerts.push(`CPC subiu ${cpcIncreasePercent.toFixed(0)}% vs base (R$${baselineCpc.toFixed(2)} → R$${currentCpc.toFixed(2)}) — leilão rejeitando criativo`);
      if (level !== "critical") level = "warning";
    }

    if (adAlerts.length > 0) {
      alerts.push({
        adId,
        adName: days[0]?.ad_name || "Sem nome",
        level,
        alerts: adAlerts,
        metrics: { currentCtr, peakCtr, ctrDropPercent, frequency: currentFrequency, currentCpc, baselineCpc, cpcIncreasePercent },
      });
    }
  }

  return alerts.sort((a, b) => {
    const order: Record<FatigueLevel, number> = { critical: 0, warning: 1, healthy: 2 };
    return order[a.level] - order[b.level];
  });
}
