import { CONFIG } from "@/config";

export type AdClassification = "bleeder" | "winner" | "neutral";

export interface ClassifiedAd {
  id: string;
  name: string;
  classification: AdClassification;
  reasons: string[];
  metrics: {
    ctr: number;
    spend: number;
    cpa: number | null;
    impressions: number;
    frequency: number;
  };
  recommendation: string;
}

export function classifyAds(adsWithInsights: any[], cpaTarget: number): ClassifiedAd[] {
  return adsWithInsights.map((ad) => {
    const ctr = parseFloat(ad.ctr || "0");
    const spend = parseFloat(ad.spend || "0");
    const impressions = parseInt(ad.impressions || "0", 10);
    const frequency = parseFloat(ad.frequency || "0");

    let cpa: number | null = null;
    const actions = ad.actions || [];
    const conversion = actions.find((a: any) =>
      ["purchase", "lead", "complete_registration", "offsite_conversion.fb_pixel_purchase"].includes(a.action_type)
    );
    if (conversion && parseFloat(conversion.value) > 0) {
      cpa = spend / parseFloat(conversion.value);
    }

    let classification: AdClassification = "neutral";
    const reasons: string[] = [];
    let recommendation = "Manter em observação";

    // BLEEDER: CTR baixo + gasto significativo
    if (ctr < CONFIG.BLEEDER_CTR_THRESHOLD && spend > CONFIG.BLEEDER_MIN_SPEND) {
      classification = "bleeder";
      reasons.push(`CTR muito baixo (${ctr.toFixed(2)}% < ${CONFIG.BLEEDER_CTR_THRESHOLD}%)`);
      reasons.push(`Já gastou R$ ${spend.toFixed(2)} sem eficiência`);
      recommendation = "PAUSAR imediatamente e realocar orçamento para Winners";
    }

    // WINNER: CTR alto + CPA abaixo da meta
    if (ctr > CONFIG.WINNER_CTR_THRESHOLD && (cpa !== null ? cpa < cpaTarget : true)) {
      classification = "winner";
      reasons.push(`CTR excelente (${ctr.toFixed(2)}% > ${CONFIG.WINNER_CTR_THRESHOLD}%)`);
      if (cpa !== null) reasons.push(`CPA (R$ ${cpa.toFixed(2)}) abaixo da meta (R$ ${cpaTarget.toFixed(2)})`);
      recommendation = "Escalar orçamento +20% a cada 3 dias (usar Scale Calculator)";
    }

    // Alerta de frequência alta
    if (frequency > CONFIG.FATIGUE_FREQUENCY_MAX) {
      reasons.push(`Frequência alta (${frequency.toFixed(1)} > ${CONFIG.FATIGUE_FREQUENCY_MAX}) - Público saturado`);
      if (classification !== "bleeder") {
        recommendation += ". Rotacionar criativos.";
      }
    }

    return {
      id: ad.ad_id || ad.id || "",
      name: ad.ad_name || ad.name || "Sem nome",
      classification,
      reasons,
      metrics: { ctr, spend, cpa, impressions, frequency },
      recommendation,
    };
  });
}
