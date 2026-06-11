// =============================================================================
// execution — aplica planos AUTORIZADOS no Google Ads (Fase 4)
// =============================================================================
//
// Pega um plano 'authorized' (ou 'failed' p/ retry), re-snapshota o before_state
// autoritativo, executa cada item via o CRUD existente e registra cada escrita
// no MCP (com plan_id → aderência). Atualiza status de itens e do plano.
//
// Módulo PURO (sem React): recebe um planId e orquestra. Pensado para poder ser
// elevado a uma Edge Function no futuro com mínima alteração.
// =============================================================================

import { supabase } from "@/integrations/supabase/client";
import { bulkUpdateStatus, updateBudgetAmount } from "@/lib/google-ads/mutations";
import { GoogleAdsAPIError } from "@/lib/google-ads/googleAdsClient";
import { getEndpointSpec, resolveEndpoint } from "./mcp/registry";
import { logMcpInvocation, hashInput } from "./mcp/invocationLog";
import { captureBeforeState, type ProposalActionType } from "./proposals";

interface DbPlan {
  id: string;
  customer_id: string;
  login_customer_id: string | null;
  status: string;
}

interface DbItem {
  id: string;
  plan_id: string;
  tool_name: string;
  entity_type: string | null;
  entity_id: string | null;
  resource_name: string | null;
  before_state: Record<string, any>;
  after_state: Record<string, any>;
  execution_status: string;
  position: number;
}

export interface ExecutePlanResult {
  executed: number;
  failed: number;
}

// tool_name (registry) → action_type (snapshot)
const ACTION_TYPE_BY_TOOL: Record<string, ProposalActionType> = {
  pause_campaigns: "pause_campaign",
  activate_campaigns: "activate_campaign",
  update_campaign_budget: "update_campaign_budget",
  pause_ads: "pause_ad",
};

/** Executa uma única ação no Google Ads usando o resource_name capturado. */
async function executeItem(
  plan: DbPlan,
  item: DbItem,
): Promise<{ status: "success" | "error"; result?: unknown; error?: Record<string, unknown> }> {
  const cid = plan.customer_id;
  const resourceName = item.resource_name || "";
  const spec = getEndpointSpec(item.tool_name);
  const start = performance.now();
  let responseStatus = 200;
  let errorCode: string | null = null;

  try {
    let result: unknown;
    switch (item.tool_name) {
      case "update_campaign_budget": {
        const micros = Number(item.after_state?.amount_micros);
        if (!Number.isFinite(micros) || micros <= 0) {
          throw new Error("Budget proposto inválido.");
        }
        result = await updateBudgetAmount(cid, resourceName, micros);
        break;
      }
      case "pause_campaigns":
        result = await bulkUpdateStatus(cid, "campaigns", [resourceName], "PAUSED");
        break;
      case "activate_campaigns":
        result = await bulkUpdateStatus(cid, "campaigns", [resourceName], "ENABLED");
        break;
      case "pause_ads":
        result = await bulkUpdateStatus(cid, "adGroupAds", [resourceName], "PAUSED");
        break;
      default:
        throw new Error(`Ação não executável: ${item.tool_name}`);
    }
    return { status: "success", result };
  } catch (err) {
    if (err instanceof GoogleAdsAPIError) {
      responseStatus = err.status;
      errorCode = err.errorCode ?? String(err.status);
    } else {
      responseStatus = 500;
      errorCode = "EXECUTION_ERROR";
    }
    return { status: "error", error: { message: (err as Error).message, code: errorCode } };
  } finally {
    const latencyMs = Math.round(performance.now() - start);
    void logMcpInvocation({
      toolName: item.tool_name,
      endpoint: spec ? resolveEndpoint(spec, cid) : `unregistered:${item.tool_name}`,
      httpMethod: spec?.httpMethod ?? "POST",
      operationType: "write",
      riskTier: spec?.riskTier,
      customerId: cid,
      loginCustomerId: plan.login_customer_id,
      requestSummary: { resource_name: resourceName, after_state: item.after_state },
      requestHash: hashInput(item.tool_name, item.after_state),
      responseStatus,
      errorCode,
      latencyMs,
      planId: plan.id,
      actionItemId: item.id,
    });
  }
}

/** Re-snapshot autoritativo do estado atual, imediatamente antes de mutar. */
async function reSnapshot(customerId: string, item: DbItem): Promise<Record<string, unknown>> {
  const actionType = ACTION_TYPE_BY_TOOL[item.tool_name];
  if (!actionType || !item.entity_id) return {};
  try {
    const { before } = await captureBeforeState(customerId, {
      action_type: actionType,
      entity_id: item.entity_id,
    });
    return before;
  } catch {
    return {};
  }
}

export async function executePlan(planId: string): Promise<ExecutePlanResult> {
  const { data: plan, error: planErr } = await (supabase as any)
    .from("ai_action_plans")
    .select("*")
    .eq("id", planId)
    .single();
  if (planErr || !plan) throw new Error("Plano não encontrado.");
  if (plan.status !== "authorized" && plan.status !== "failed") {
    throw new Error(`Plano não está autorizado para execução (status: ${plan.status}).`);
  }

  const { data: items, error: itemsErr } = await (supabase as any)
    .from("ai_action_items")
    .select("*")
    .eq("plan_id", planId)
    .order("position", { ascending: true });
  if (itemsErr) throw itemsErr;

  await (supabase as any).from("ai_action_plans").update({ status: "executing" }).eq("id", planId);

  let executed = 0;
  let failed = 0;

  for (const item of (items ?? []) as DbItem[]) {
    // idempotência: não reaplica item já concluído num retry
    if (item.execution_status === "success") {
      executed++;
      continue;
    }

    const before = await reSnapshot(plan.customer_id, item);
    const outcome = await executeItem(plan as DbPlan, item);

    await (supabase as any)
      .from("ai_action_items")
      .update({
        execution_status: outcome.status,
        before_state: Object.keys(before).length ? before : item.before_state,
        google_result: outcome.result ?? null,
        error: outcome.error ?? null,
      })
      .eq("id", item.id);

    if (outcome.status === "success") executed++;
    else failed++;
  }

  // all ok → executed | nenhum ok → failed | parcial → executed (itens carregam o erro)
  const finalStatus = failed === 0 ? "executed" : executed === 0 ? "failed" : "executed";

  await (supabase as any)
    .from("ai_action_plans")
    .update({ status: finalStatus, executed_at: new Date().toISOString() })
    .eq("id", planId);

  return { executed, failed };
}

// =============================================================================
// Rollback — desfaz um plano executado restaurando o before_state
// =============================================================================

export interface RollbackResult {
  restored: number;
  failed: number;
}

/** Desfaz uma única ação restaurando o estado anterior capturado. */
async function rollbackItem(
  plan: DbPlan,
  item: DbItem,
): Promise<{ status: "success" | "error"; error?: Record<string, unknown> }> {
  const cid = plan.customer_id;
  const resourceName = item.resource_name || "";
  const spec = getEndpointSpec(item.tool_name);
  const before = item.before_state || {};
  const start = performance.now();
  let responseStatus = 200;
  let errorCode: string | null = null;

  try {
    switch (item.tool_name) {
      case "update_campaign_budget": {
        const micros = Number(before.amount_micros);
        if (!Number.isFinite(micros) || micros <= 0) {
          throw new Error("Sem budget anterior capturado para reverter.");
        }
        await updateBudgetAmount(cid, resourceName, micros);
        break;
      }
      case "pause_campaigns":
        await bulkUpdateStatus(cid, "campaigns", [resourceName], String(before.status || "ENABLED"));
        break;
      case "activate_campaigns":
        await bulkUpdateStatus(cid, "campaigns", [resourceName], String(before.status || "PAUSED"));
        break;
      case "pause_ads":
        await bulkUpdateStatus(cid, "adGroupAds", [resourceName], String(before.status || "ENABLED"));
        break;
      default:
        throw new Error(`Ação não reversível: ${item.tool_name}`);
    }
    return { status: "success" };
  } catch (err) {
    if (err instanceof GoogleAdsAPIError) {
      responseStatus = err.status;
      errorCode = err.errorCode ?? String(err.status);
    } else {
      responseStatus = 500;
      errorCode = "ROLLBACK_ERROR";
    }
    return { status: "error", error: { message: (err as Error).message, code: errorCode } };
  } finally {
    const latencyMs = Math.round(performance.now() - start);
    void logMcpInvocation({
      toolName: item.tool_name,
      endpoint: spec ? resolveEndpoint(spec, cid) : `unregistered:${item.tool_name}`,
      httpMethod: spec?.httpMethod ?? "POST",
      operationType: "write",
      riskTier: spec?.riskTier,
      customerId: cid,
      loginCustomerId: plan.login_customer_id,
      requestSummary: { rollback: true, resource_name: resourceName, restore_to: item.before_state },
      requestHash: hashInput(`rollback:${item.tool_name}`, item.before_state),
      responseStatus,
      errorCode,
      latencyMs,
      planId: plan.id,
      actionItemId: item.id,
    });
  }
}

export async function rollbackPlan(planId: string): Promise<RollbackResult> {
  const { data: plan, error: planErr } = await (supabase as any)
    .from("ai_action_plans")
    .select("*")
    .eq("id", planId)
    .single();
  if (planErr || !plan) throw new Error("Plano não encontrado.");
  if (!["executed", "verified", "failed"].includes(plan.status)) {
    throw new Error(`Plano não pode ser revertido (status: ${plan.status}).`);
  }

  const { data: items } = await (supabase as any)
    .from("ai_action_items")
    .select("*")
    .eq("plan_id", planId)
    .order("position", { ascending: true });

  let restored = 0;
  let failed = 0;

  for (const item of (items ?? []) as DbItem[]) {
    if (item.execution_status !== "success") continue; // só reverte o que foi aplicado
    const outcome = await rollbackItem(plan as DbPlan, item);
    if (outcome.status === "success") restored++;
    else failed++;
  }

  if (restored === 0 && failed > 0) {
    throw new Error("Nenhuma ação pôde ser revertida.");
  }

  await (supabase as any)
    .from("ai_action_plans")
    .update({ status: "rolled_back" })
    .eq("id", planId);

  return { restored, failed };
}
