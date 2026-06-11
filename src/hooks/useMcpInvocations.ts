// =============================================================================
// useMcpInvocations — lê a telemetria do MCP Gateway p/ a página de auditoria
// =============================================================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";

export interface McpInvocation {
  id: string;
  tool_name: string;
  endpoint: string;
  http_method: string;
  operation_type: "read" | "write";
  risk_tier: string | null;
  response_status: number | null;
  error_code: string | null;
  latency_ms: number | null;
  customer_id: string | null;
  plan_id: string | null;
  created_at: string;
}

export function useMcpInvocations(limit = 200) {
  const { selectedCustomer } = useAuthStore();
  const customerId = selectedCustomer?.id;

  return useQuery({
    queryKey: ["mcp-invocations", customerId, limit],
    queryFn: async (): Promise<McpInvocation[]> => {
      let q = (supabase as any)
        .from("mcp_endpoint_invocations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (customerId) q = q.eq("customer_id", customerId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as McpInvocation[];
    },
  });
}

export interface McpAdherenceStats {
  total: number;
  reads: number;
  writes: number;
  errors: number;
  errorRatePct: number;
  avgLatencyMs: number;
  /** % de writes vinculados a um plano de ação (aderência ao gate — Fase 3+). */
  writeAdherencePct: number;
}

export function computeAdherenceStats(rows: McpInvocation[]): McpAdherenceStats {
  const total = rows.length;
  const reads = rows.filter((r) => r.operation_type === "read").length;
  const writes = rows.filter((r) => r.operation_type === "write").length;
  const errors = rows.filter((r) => (r.response_status ?? 200) >= 400).length;
  const latencies = rows.map((r) => r.latency_ms ?? 0);
  const avgLatencyMs = total ? Math.round(latencies.reduce((a, b) => a + b, 0) / total) : 0;
  const writesWithPlan = rows.filter((r) => r.operation_type === "write" && r.plan_id).length;

  return {
    total,
    reads,
    writes,
    errors,
    errorRatePct: total ? Math.round((errors / total) * 100) : 0,
    avgLatencyMs,
    writeAdherencePct: writes ? Math.round((writesWithPlan / writes) * 100) : 0,
  };
}

export interface EndpointCoverage {
  endpoint: string;
  toolNames: string[];
  count: number;
  errors: number;
  operationType: "read" | "write";
}

export function computeEndpointCoverage(rows: McpInvocation[]): EndpointCoverage[] {
  const map = new Map<string, EndpointCoverage>();
  for (const r of rows) {
    const cur = map.get(r.endpoint) ?? {
      endpoint: r.endpoint,
      toolNames: [],
      count: 0,
      errors: 0,
      operationType: r.operation_type,
    };
    cur.count += 1;
    if ((r.response_status ?? 200) >= 400) cur.errors += 1;
    if (!cur.toolNames.includes(r.tool_name)) cur.toolNames.push(r.tool_name);
    map.set(r.endpoint, cur);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}
