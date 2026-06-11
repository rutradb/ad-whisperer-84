// =============================================================================
// MCP Gateway — ponto único por onde TODA tool do agente é executada
// =============================================================================
//
// Envolve `executeExpandedToolCall` para:
//   1. Resolver o endpoint registrado (registry) — garante aderência.
//   2. Cronometrar e capturar status/erro.
//   3. Gravar a telemetria em `mcp_endpoint_invocations` (não-bloqueante).
//
// Nesta fase o gateway NÃO altera comportamento: apenas delega ao executor
// existente e registra. O gate de autorização entra na Fase 3.
// =============================================================================

import { executeExpandedToolCall } from "../expanded-executor";
import { GoogleAdsAPIError } from "@/lib/google-ads/googleAdsClient";
import { getEndpointSpec, resolveEndpoint } from "./registry";
import { logMcpInvocation, hashInput } from "./invocationLog";

export interface GatewayContext {
  accountId: string;
  loginCustomerId?: string | null;
  /** Vínculo a um plano de ação (Fase 3+). */
  planId?: string | null;
  actionItemId?: string | null;
}

/** Resume o input para telemetria, evitando payloads enormes. */
function summarizeInput(input: Record<string, any>): Record<string, unknown> {
  try {
    const json = JSON.stringify(input ?? {});
    if (json.length <= 2000) return input ?? {};
    return { _truncated: true, _size: json.length };
  } catch {
    return { _unserializable: true };
  }
}

export async function executeToolViaGateway(
  toolName: string,
  toolInput: Record<string, any>,
  context: GatewayContext,
): Promise<string> {
  const spec = getEndpointSpec(toolName);
  const start = performance.now();
  let responseStatus = 200;
  let errorCode: string | null = null;

  try {
    return await executeExpandedToolCall(toolName, toolInput, {
      accountId: context.accountId,
    });
  } catch (err) {
    if (err instanceof GoogleAdsAPIError) {
      responseStatus = err.status;
      errorCode = err.errorCode ?? String(err.status);
    } else {
      responseStatus = 500;
      errorCode = "EXECUTION_ERROR";
    }
    throw err;
  } finally {
    const latencyMs = Math.round(performance.now() - start);
    const loginCustomerId =
      context.loginCustomerId ??
      (typeof localStorage !== "undefined"
        ? localStorage.getItem("gads_login_customer_id")
        : null);

    void logMcpInvocation({
      toolName,
      endpoint: spec
        ? resolveEndpoint(spec, context.accountId)
        : `unregistered:${toolName}`,
      httpMethod: spec?.httpMethod ?? "POST",
      operationType: spec?.operationType ?? "read",
      riskTier: spec?.riskTier,
      customerId: context.accountId,
      loginCustomerId,
      requestSummary: summarizeInput(toolInput),
      requestHash: hashInput(toolName, toolInput),
      responseStatus,
      errorCode,
      latencyMs,
      planId: context.planId ?? null,
      actionItemId: context.actionItemId ?? null,
    });
  }
}
