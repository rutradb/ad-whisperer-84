// =============================================================================
// verification — mede o efeito de um plano executado (Fase 5)
// =============================================================================
//
// Compara a performance das campanhas afetadas na janela ANTES vs DEPOIS da
// execução e grava um veredito em `ai_action_outcomes` (improved/neutral/worsened).
// =============================================================================

import { supabase } from "@/integrations/supabase/client";
import { gaqlSearch } from "@/lib/google-ads/googleAdsClient";
import { microsToUnits } from "@/lib/google-ads/types";

interface WindowMetrics {
  spend: number;
  conversions: number;
  conversionsValue: number;
  roas: number;
  cpa: number;
}

export interface VerifyResult {
  verdict: "improved" | "neutral" | "worsened";
  metricBefore: WindowMetrics;
  metricAfter: WindowMetrics;
  windowDays: number;
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function emptyMetrics(): WindowMetrics {
  return { spend: 0, conversions: 0, conversionsValue: 0, roas: 0, cpa: 0 };
}

async function metricsForWindow(
  customerId: string,
  campaignIds: string[],
  start: string,
  end: string,
): Promise<WindowMetrics> {
  if (!campaignIds.length) return emptyMetrics();
  const idList = campaignIds.map((id) => String(id).replace(/[^0-9]/g, "")).filter(Boolean).join(", ");
  const res = await gaqlSearch<any>(
    customerId,
    `SELECT campaign.id, metrics.cost_micros, metrics.conversions, metrics.conversions_value
     FROM campaign
     WHERE segments.date BETWEEN '${start}' AND '${end}' AND campaign.id IN (${idList})`,
  );
  let spendMicros = 0, conversions = 0, conversionsValue = 0;
  for (const r of res.results || []) {
    const m = r.metrics || {};
    spendMicros += Number(m.costMicros || 0);
    conversions += Number(m.conversions || 0);
    conversionsValue += Number(m.conversionsValue || 0);
  }
  const spend = microsToUnits(spendMicros);
  return {
    spend,
    conversions,
    conversionsValue,
    roas: spend > 0 ? conversionsValue / spend : 0,
    cpa: conversions > 0 ? spend / conversions : 0,
  };
}

/** Decide o veredito comparando a métrica primária disponível (ROAS > CPA). */
function decideVerdict(before: WindowMetrics, after: WindowMetrics): VerifyResult["verdict"] {
  const THRESHOLD = 0.05; // 5%
  // ROAS (maior é melhor)
  if (after.conversionsValue > 0 || before.conversionsValue > 0) {
    if (before.roas === 0) return after.roas > 0 ? "improved" : "neutral";
    const delta = (after.roas - before.roas) / before.roas;
    if (delta > THRESHOLD) return "improved";
    if (delta < -THRESHOLD) return "worsened";
    return "neutral";
  }
  // CPA (menor é melhor)
  if (after.conversions > 0 || before.conversions > 0) {
    if (before.cpa === 0) return "neutral";
    const delta = (after.cpa - before.cpa) / before.cpa;
    if (delta < -THRESHOLD) return "improved";
    if (delta > THRESHOLD) return "worsened";
    return "neutral";
  }
  return "neutral";
}

export async function verifyPlan(planId: string, windowDays = 7): Promise<VerifyResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) throw new Error("Sessão de usuário não encontrada.");

  const { data: plan, error: planErr } = await (supabase as any)
    .from("ai_action_plans")
    .select("*")
    .eq("id", planId)
    .single();
  if (planErr || !plan) throw new Error("Plano não encontrado.");
  if (!plan.executed_at) throw new Error("Plano ainda não foi executado.");

  const { data: items } = await (supabase as any)
    .from("ai_action_items")
    .select("*")
    .eq("plan_id", planId);

  // campanhas afetadas (orçamento e status de campanha referenciam campaign.id)
  const campaignIds = Array.from(
    new Set(
      (items ?? [])
        .filter((i: any) => i.entity_type === "campaign" || i.entity_type === "campaign_budget")
        .map((i: any) => i.entity_id)
        .filter(Boolean),
    ),
  ) as string[];

  const exec = new Date(plan.executed_at);
  const today = new Date();
  const afterStart = ymd(exec);
  const afterEndDate = new Date(exec.getTime() + windowDays * 86400000);
  const afterEnd = ymd(afterEndDate < today ? afterEndDate : today);
  const beforeEnd = ymd(new Date(exec.getTime() - 86400000));
  const beforeStart = ymd(new Date(exec.getTime() - windowDays * 86400000));

  let metricBefore = emptyMetrics();
  let metricAfter = emptyMetrics();
  try {
    [metricBefore, metricAfter] = await Promise.all([
      metricsForWindow(plan.customer_id, campaignIds, beforeStart, beforeEnd),
      metricsForWindow(plan.customer_id, campaignIds, afterStart, afterEnd),
    ]);
  } catch {
    // mantém zeros → veredito neutral
  }

  const verdict = campaignIds.length ? decideVerdict(metricBefore, metricAfter) : "neutral";

  await (supabase as any).from("ai_action_outcomes").insert({
    plan_id: planId,
    user_id: userId,
    window_days: windowDays,
    metric_before: metricBefore,
    metric_after: metricAfter,
    verdict,
    notes: campaignIds.length ? null : "Sem campanhas mensuráveis no plano.",
  });

  // promove o plano a 'verified' (se ainda estava 'executed')
  if (plan.status === "executed") {
    await (supabase as any).from("ai_action_plans").update({ status: "verified" }).eq("id", planId);
  }

  return { verdict, metricBefore, metricAfter, windowDays };
}
