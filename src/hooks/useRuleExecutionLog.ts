import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { STALE_TIMES } from "@/lib/queryKeys";

export interface RuleExecutionLogEntry {
  id: string;
  rule_id: string;
  user_id: string;
  executed_at: string;
  entities_evaluated: number;
  entities_matched: number;
  entities_actioned: number;
  details: any[];
  status: "success" | "error" | "partial";
  error_message?: string;
}

export function useRuleExecutionLog(ruleId: string | undefined) {
  return useQuery({
    queryKey: ["rule-execution-log", ruleId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("rule_execution_log")
        .select("*")
        .eq("rule_id", ruleId!)
        .order("executed_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as RuleExecutionLogEntry[];
    },
    enabled: !!ruleId,
    staleTime: STALE_TIMES.STANDARD,
  });
}
