// =============================================================================
// useActionPlanMutations — gate de autorização (Fase 3)
// =============================================================================
//
// Aprovar  → status 'authorized' (+ decided_at / decided_by)
// Rejeitar → status 'rejected'
// Editar   → ajusta o after_state de um item (ex.: novo budget) antes de aprovar
//
// A EXECUÇÃO real das ações autorizadas é da Fase 4.
// =============================================================================

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { unitsToMicros } from "@/lib/google-ads/types";
import { executePlan, rollbackPlan } from "@/lib/agent/execution";
import { verifyPlan } from "@/lib/agent/verification";

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

function useInvalidatePlans() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["action-plans"] });
}

/** Aprova um plano (só se ainda estiver 'proposed', evitando corrida). */
export function useApprovePlan() {
  const invalidate = useInvalidatePlans();
  return useMutation({
    mutationFn: async (planId: string) => {
      const userId = await currentUserId();
      const { error } = await (supabase as any)
        .from("ai_action_plans")
        .update({
          status: "authorized",
          decided_at: new Date().toISOString(),
          decided_by: userId,
        })
        .eq("id", planId)
        .eq("status", "proposed");
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useRejectPlan() {
  const invalidate = useInvalidatePlans();
  return useMutation({
    mutationFn: async (planId: string) => {
      const userId = await currentUserId();
      const { error } = await (supabase as any)
        .from("ai_action_plans")
        .update({
          status: "rejected",
          decided_at: new Date().toISOString(),
          decided_by: userId,
        })
        .eq("id", planId)
        .eq("status", "proposed");
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

/** Aprova vários planos de uma vez (usado no batch de baixo/médio risco). */
export function useApproveManyPlans() {
  const invalidate = useInvalidatePlans();
  return useMutation({
    mutationFn: async (planIds: string[]) => {
      const userId = await currentUserId();
      const decidedAt = new Date().toISOString();
      const results = await Promise.allSettled(
        planIds.map((id) =>
          (supabase as any)
            .from("ai_action_plans")
            .update({ status: "authorized", decided_at: decidedAt, decided_by: userId })
            .eq("id", id)
            .eq("status", "proposed"),
        ),
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) throw new Error(`${failed} plano(s) não puderam ser aprovados.`);
    },
    onSuccess: invalidate,
  });
}

/** Executa um plano autorizado (aplica as ações no Google Ads). */
export function useExecutePlan() {
  const invalidate = useInvalidatePlans();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => executePlan(planId),
    onSuccess: () => {
      invalidate();
      // a execução gera telemetria de escrita com plan_id → atualiza a auditoria
      qc.invalidateQueries({ queryKey: ["mcp-invocations"] });
    },
  });
}

/** Reverte um plano executado, restaurando o before_state. */
export function useRollbackPlan() {
  const invalidate = useInvalidatePlans();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => rollbackPlan(planId),
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ["mcp-invocations"] });
    },
  });
}

/** Mede o efeito de um plano executado e grava o veredito. */
export function useVerifyPlan() {
  const invalidate = useInvalidatePlans();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, windowDays }: { planId: string; windowDays?: number }) =>
      verifyPlan(planId, windowDays),
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ["action-outcomes"] });
    },
  });
}

/** Edita o budget proposto de um item (apenas update_campaign_budget). */
export function useUpdateItemBudget() {
  const invalidate = useInvalidatePlans();
  return useMutation({
    mutationFn: async ({ itemId, dailyBudget }: { itemId: string; dailyBudget: number }) => {
      const { error } = await (supabase as any)
        .from("ai_action_items")
        .update({
          after_state: {
            daily_budget: dailyBudget,
            amount_micros: unitsToMicros(dailyBudget),
          },
        })
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}
