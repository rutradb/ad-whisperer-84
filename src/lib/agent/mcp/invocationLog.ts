// =============================================================================
// MCP Invocation Log — telemetria de aderência (best-effort, não-bloqueante)
// =============================================================================
//
// Grava uma linha em `mcp_endpoint_invocations` por chamada de tool. NUNCA deve
// quebrar a execução do agente: qualquer falha de log é engolida silenciosamente.
// =============================================================================

import { supabase } from "@/integrations/supabase/client";

// undefined = ainda não buscado | null = sem sessão
let cachedUserId: string | null | undefined;

async function getUserId(): Promise<string | null> {
  if (cachedUserId !== undefined) return cachedUserId;
  try {
    const { data } = await supabase.auth.getUser();
    cachedUserId = data.user?.id ?? null;
  } catch {
    cachedUserId = null;
  }
  return cachedUserId;
}

export interface InvocationRecord {
  toolName: string;
  endpoint: string;
  httpMethod: string;
  operationType: "read" | "write";
  riskTier?: string;
  customerId?: string | null;
  loginCustomerId?: string | null;
  requestSummary?: Record<string, unknown> | null;
  requestHash?: string | null;
  responseStatus?: number | null;
  errorCode?: string | null;
  latencyMs?: number | null;
  planId?: string | null;
  actionItemId?: string | null;
}

/** djb2 — hash estável e barato para idempotência/agrupamento. */
export function hashInput(toolName: string, input: unknown): string {
  const str = `${toolName}:${JSON.stringify(input ?? {})}`;
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

export async function logMcpInvocation(rec: InvocationRecord): Promise<void> {
  try {
    const userId = await getUserId();
    if (!userId) return; // sem sessão autenticada → não há onde gravar (RLS)

    await (supabase as any).from("mcp_endpoint_invocations").insert({
      user_id: userId,
      customer_id: rec.customerId ?? null,
      login_customer_id: rec.loginCustomerId ?? null,
      tool_name: rec.toolName,
      endpoint: rec.endpoint,
      http_method: rec.httpMethod,
      operation_type: rec.operationType,
      risk_tier: rec.riskTier ?? null,
      request_hash: rec.requestHash ?? null,
      request_summary: rec.requestSummary ?? null,
      response_status: rec.responseStatus ?? null,
      error_code: rec.errorCode ?? null,
      latency_ms: rec.latencyMs ?? null,
      plan_id: rec.planId ?? null,
      action_item_id: rec.actionItemId ?? null,
    });
  } catch {
    // best-effort: telemetria nunca derruba a execução
  }
}
