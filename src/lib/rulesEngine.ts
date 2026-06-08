export interface AutomatedRule {
  id: string;
  user_id: string;
  name: string;
  entity_type: "campaign" | "ad_group" | "ad" | "keyword";
  condition_metric: string;
  condition_operator: ">" | "<" | ">=" | "<=" | "==";
  condition_value: number;
  action_type: string;
  action_value?: number;
  date_preset: string;
  is_active: boolean;
  last_run_at?: string;
  last_run_result?: string;
  created_at: string;
  // Enhanced fields (Sprint 3)
  compound_logic?: "AND" | "OR";
  conditions?: CompoundCondition[];
  schedule_cron?: string;
  schedule_timezone?: string;
  notification_email?: string;
  max_executions_per_day?: number;
  cooldown_hours?: number;
}

export interface CompoundCondition {
  metric: string;
  operator: ">" | "<" | ">=" | "<=" | "==";
  value: number;
}

export function evaluateCondition(
  metricValue: number,
  operator: AutomatedRule["condition_operator"],
  threshold: number
): boolean {
  switch (operator) {
    case ">": return metricValue > threshold;
    case "<": return metricValue < threshold;
    case ">=": return metricValue >= threshold;
    case "<=": return metricValue <= threshold;
    case "==": return metricValue === threshold;
    default: return false;
  }
}

/**
 * Avalia múltiplas condições com lógica AND/OR.
 */
export function evaluateCompoundConditions(
  insightsRow: Record<string, any>,
  conditions: CompoundCondition[],
  logic: "AND" | "OR" = "AND"
): boolean {
  if (conditions.length === 0) return true;

  const results = conditions.map((c) => {
    const value = getMetricValue(insightsRow, c.metric);
    return evaluateCondition(value, c.operator, c.value);
  });

  return logic === "AND"
    ? results.every(Boolean)
    : results.some(Boolean);
}

export function getMetricValue(insightsRow: Record<string, any>, metric: string): number {
  // Handle computed metrics
  if (metric === "roas") {
    const roas = insightsRow.purchase_roas;
    if (Array.isArray(roas) && roas.length > 0) {
      return parseFloat(roas[0]?.value || "0");
    }
    return 0;
  }
  if (metric === "cpa") {
    const spend = parseFloat(insightsRow.spend || "0");
    const actions = insightsRow.actions;
    if (Array.isArray(actions)) {
      const purchases = actions.find((a: any) =>
        a.action_type === "omni_purchase" || a.action_type === "purchase"
      );
      const leads = actions.find((a: any) => a.action_type === "lead");
      const total = parseFloat(purchases?.value || "0") + parseFloat(leads?.value || "0");
      return total > 0 ? spend / total : 0;
    }
    return 0;
  }
  if (metric === "conversions") {
    const actions = insightsRow.actions;
    if (Array.isArray(actions)) {
      let total = 0;
      for (const a of actions) {
        if (["omni_purchase", "purchase", "lead", "complete_registration"].includes(a.action_type)) {
          total += parseFloat(a.value || "0");
        }
      }
      return total;
    }
    return 0;
  }

  const val = insightsRow[metric];
  if (val === undefined || val === null) return 0;
  return typeof val === "string" ? parseFloat(val) : val;
}

export const AVAILABLE_METRICS = [
  { value: "costMicros", label: "Gasto (micros)" },
  { value: "averageCpc", label: "CPC Medio" },
  { value: "averageCpm", label: "CPM Medio" },
  { value: "ctr", label: "CTR" },
  { value: "impressions", label: "Impressoes" },
  { value: "clicks", label: "Cliques" },
  { value: "conversions", label: "Conversoes" },
  { value: "conversionRate", label: "Taxa de Conversao" },
  { value: "costPerConversion", label: "Custo/Conversao" },
  { value: "searchImpressionShare", label: "Search Impression Share" },
  { value: "roas", label: "ROAS" },
  { value: "cpa", label: "CPA" },
];

export const OPERATORS: { value: AutomatedRule["condition_operator"]; label: string }[] = [
  { value: ">", label: "Maior que" },
  { value: "<", label: "Menor que" },
  { value: ">=", label: "Maior ou igual" },
  { value: "<=", label: "Menor ou igual" },
  { value: "==", label: "Igual a" },
];

export const ACTION_TYPES = [
  { value: "pause", label: "Pausar" },
  { value: "activate", label: "Ativar" },
  { value: "increase_budget", label: "Aumentar Budget (%)" },
  { value: "decrease_budget", label: "Reduzir Budget (%)" },
  { value: "send_notification", label: "Enviar Notificação" },
];

export const SCHEDULE_PRESETS = [
  { value: "0 * * * *", label: "A cada hora" },
  { value: "0 */6 * * *", label: "A cada 6 horas" },
  { value: "0 8 * * *", label: "Diariamente (8h)" },
  { value: "0 8 * * 1", label: "Semanalmente (Seg 8h)" },
];
