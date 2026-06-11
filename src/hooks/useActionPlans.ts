// =============================================================================
// useActionPlans — lê os planos de ação (propostas) gerados pela IA
// =============================================================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";

export type PlanStatus =
  | "proposed"
  | "authorized"
  | "rejected"
  | "executing"
  | "executed"
  | "verified"
  | "rolled_back"
  | "failed";

export interface ActionItem {
  id: string;
  plan_id: string;
  tool_name: string;
  entity_type: string | null;
  entity_id: string | null;
  resource_name: string | null;
  before_state: Record<string, any>;
  after_state: Record<string, any>;
  execution_status: "pending" | "success" | "error" | "skipped";
  google_result: Record<string, any> | null;
  error: Record<string, any> | null;
  position: number;
}

export interface ActionPlan {
  id: string;
  customer_id: string;
  source: string;
  title: string;
  rationale: string | null;
  status: PlanStatus;
  risk_tier: "low" | "medium" | "high";
  estimated_impact: Record<string, any>;
  created_at: string;
  decided_at: string | null;
  executed_at: string | null;
  items: ActionItem[];
}

export function useActionPlans(status?: PlanStatus) {
  const { selectedCustomer } = useAuthStore();
  const customerId = selectedCustomer?.id;

  return useQuery({
    queryKey: ["action-plans", customerId, status ?? "all"],
    queryFn: async (): Promise<ActionPlan[]> => {
      let q = (supabase as any)
        .from("ai_action_plans")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (customerId) q = q.eq("customer_id", customerId);
      if (status) q = q.eq("status", status);

      const { data: plans, error } = await q;
      if (error) throw error;
      if (!plans?.length) return [];

      const planIds = plans.map((p: any) => p.id);
      const { data: items, error: itemsErr } = await (supabase as any)
        .from("ai_action_items")
        .select("*")
        .in("plan_id", planIds)
        .order("position", { ascending: true });
      if (itemsErr) throw itemsErr;

      const itemsByPlan = new Map<string, ActionItem[]>();
      for (const it of items ?? []) {
        const arr = itemsByPlan.get(it.plan_id) ?? [];
        arr.push(it as ActionItem);
        itemsByPlan.set(it.plan_id, arr);
      }

      return plans.map((p: any) => ({
        ...p,
        items: itemsByPlan.get(p.id) ?? [],
      })) as ActionPlan[];
    },
  });
}

export interface ActionOutcome {
  id: string;
  plan_id: string;
  window_days: number | null;
  metric_before: Record<string, any>;
  metric_after: Record<string, any>;
  verdict: "improved" | "neutral" | "worsened" | null;
  notes: string | null;
  measured_at: string;
}

/** Último outcome por plano (mapa plan_id → outcome). */
export function useActionOutcomes() {
  return useQuery({
    queryKey: ["action-outcomes"],
    queryFn: async (): Promise<Record<string, ActionOutcome>> => {
      const { data, error } = await (supabase as any)
        .from("ai_action_outcomes")
        .select("*")
        .order("measured_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      const byPlan: Record<string, ActionOutcome> = {};
      for (const o of (data ?? []) as ActionOutcome[]) {
        if (!byPlan[o.plan_id]) byPlan[o.plan_id] = o; // o primeiro é o mais recente
      }
      return byPlan;
    },
  });
}
