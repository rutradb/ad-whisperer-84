// =============================================================================
// Proposals — cria planos de ação (propostas) a partir do agente
// =============================================================================
//
// Fase 2 (Propose): em vez de executar mutações no Google Ads, o agente cria um
// `ai_action_plan` + N `ai_action_items` com status 'proposed'. NADA é aplicado
// até a aprovação do usuário (Fase 3) e a execução (Fase 4).
//
// Captura um `before_state` best-effort no momento da proposta (para exibir o
// diff na tela de aprovação). O snapshot AUTORITATIVO para rollback é refeito no
// momento da execução (Fase 4).
// =============================================================================

import { supabase } from "@/integrations/supabase/client";
import { gaqlSearch } from "@/lib/google-ads/googleAdsClient";
import { unitsToMicros, microsToUnits } from "@/lib/google-ads/types";

export type ProposalActionType =
  | "pause_campaign"
  | "activate_campaign"
  | "update_campaign_budget"
  | "pause_ad";

export interface ProposalActionInput {
  action_type: ProposalActionType;
  entity_id: string;
  /** Apenas para update_campaign_budget — novo budget diário em R$. */
  daily_budget?: number;
  reason?: string;
}

export interface CreatePlanInput {
  customerId: string;
  loginCustomerId?: string | null;
  title: string;
  rationale?: string;
  riskTier?: "low" | "medium" | "high";
  estimatedImpact?: Record<string, unknown>;
  source?: string;
  actions: ProposalActionInput[];
}

export interface CreatePlanResult {
  planId: string;
  itemCount: number;
  riskTier: "low" | "medium" | "high";
}

// Mapeia a ação de proposta para o nome da tool registrada (camada de execução).
const TOOL_NAME_BY_ACTION: Record<ProposalActionType, string> = {
  pause_campaign: "pause_campaigns",
  activate_campaign: "activate_campaigns",
  update_campaign_budget: "update_campaign_budget",
  pause_ad: "pause_ads",
};

const ENTITY_TYPE_BY_ACTION: Record<ProposalActionType, string> = {
  pause_campaign: "campaign",
  activate_campaign: "campaign",
  update_campaign_budget: "campaign_budget",
  pause_ad: "ad",
};

async function escapeGaqlId(id: string): Promise<string> {
  // IDs do Google Ads são numéricos; sanitiza para evitar injeção em GAQL.
  return String(id).replace(/[^0-9]/g, "");
}

/** Lê o estado atual da entidade (best-effort) para preencher before_state. */
export async function captureBeforeState(
  customerId: string,
  action: ProposalActionInput,
): Promise<{ before: Record<string, unknown>; resourceName: string }> {
  const cid = customerId;
  const id = await escapeGaqlId(action.entity_id);

  try {
    if (action.action_type === "update_campaign_budget") {
      const res = await gaqlSearch<any>(
        cid,
        `SELECT campaign.id, campaign_budget.resource_name, campaign_budget.amount_micros
         FROM campaign WHERE campaign.id = ${id} LIMIT 1`,
      );
      const row = res.results?.[0];
      const micros = Number(row?.campaignBudget?.amountMicros ?? 0);
      const resourceName =
        row?.campaignBudget?.resourceName ||
        `customers/${cid}/campaignBudgets/${id}`;
      return {
        before: micros
          ? { amount_micros: micros, daily_budget: microsToUnits(micros) }
          : {},
        resourceName,
      };
    }

    if (action.action_type === "pause_campaign" || action.action_type === "activate_campaign") {
      const res = await gaqlSearch<any>(
        cid,
        `SELECT campaign.id, campaign.status FROM campaign WHERE campaign.id = ${id} LIMIT 1`,
      );
      const status = res.results?.[0]?.campaign?.status;
      return {
        before: status ? { status } : {},
        resourceName: `customers/${cid}/campaigns/${id}`,
      };
    }

    // pause_ad: snapshot detalhado fica para a execução (resource name composto)
    return { before: {}, resourceName: `customers/${cid}/adGroupAds/${id}` };
  } catch {
    // best-effort: nunca falha a proposta por causa do snapshot
    const fallback: Record<ProposalActionType, string> = {
      update_campaign_budget: `customers/${cid}/campaignBudgets/${id}`,
      pause_campaign: `customers/${cid}/campaigns/${id}`,
      activate_campaign: `customers/${cid}/campaigns/${id}`,
      pause_ad: `customers/${cid}/adGroupAds/${id}`,
    };
    return { before: {}, resourceName: fallback[action.action_type] };
  }
}

function buildAfterState(action: ProposalActionInput): Record<string, unknown> {
  switch (action.action_type) {
    case "pause_campaign":
    case "pause_ad":
      return { status: "PAUSED" };
    case "activate_campaign":
      return { status: "ENABLED" };
    case "update_campaign_budget":
      return {
        daily_budget: action.daily_budget,
        amount_micros:
          action.daily_budget != null ? unitsToMicros(action.daily_budget) : null,
      };
  }
}

export async function createActionPlan(input: CreatePlanInput): Promise<CreatePlanResult> {
  const { customerId, actions } = input;
  if (!actions?.length) {
    throw new Error("Nenhuma ação informada para a proposta.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) throw new Error("Sessão de usuário não encontrada.");

  const riskTier =
    input.riskTier ??
    (actions.every((a) => a.action_type === "pause_ad") ? "low" : "medium");

  // 1. cria o plano
  const { data: plan, error: planErr } = await (supabase as any)
    .from("ai_action_plans")
    .insert({
      user_id: userId,
      customer_id: customerId,
      login_customer_id: input.loginCustomerId ?? null,
      source: input.source ?? "agent",
      title: input.title,
      rationale: input.rationale ?? null,
      status: "proposed",
      risk_tier: riskTier,
      estimated_impact: input.estimatedImpact ?? {},
    })
    .select()
    .single();

  if (planErr) throw planErr;

  // 2. cria os itens (com snapshot best-effort)
  const items = await Promise.all(
    actions.map(async (action, index) => {
      const { before, resourceName } = await captureBeforeState(customerId, action);
      return {
        plan_id: plan.id,
        user_id: userId,
        tool_name: TOOL_NAME_BY_ACTION[action.action_type],
        entity_type: ENTITY_TYPE_BY_ACTION[action.action_type],
        entity_id: action.entity_id,
        resource_name: resourceName,
        before_state: before,
        after_state: buildAfterState(action),
        execution_status: "pending",
        position: index,
      };
    }),
  );

  const { error: itemsErr } = await (supabase as any)
    .from("ai_action_items")
    .insert(items);

  if (itemsErr) throw itemsErr;

  return { planId: plan.id, itemCount: items.length, riskTier };
}
