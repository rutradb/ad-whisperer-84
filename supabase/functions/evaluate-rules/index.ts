import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FB_API = "https://graph.facebook.com/v22.0";

interface Rule {
  id: string;
  user_id: string;
  name: string;
  entity_type: string;
  condition_metric: string;
  condition_operator: string;
  condition_value: number;
  action_type: string;
  date_preset: string;
}

interface InsightRow {
  [key: string]: any;
}

function extractMetric(row: InsightRow, metric: string): number | null {
  // Direct fields
  if (["spend", "impressions", "clicks", "cpc", "ctr", "cpm", "reach", "frequency"].includes(metric)) {
    const val = parseFloat(row[metric]);
    return isNaN(val) ? null : val;
  }

  const actions: any[] = row.actions || [];
  const costPerAction: any[] = row.cost_per_action_type || [];

  const purchases = actions.find(
    (a: any) => a.action_type === "purchase" || a.action_type === "offsite_conversion.fb_pixel_purchase"
  );
  const purchaseCount = purchases ? parseFloat(purchases.value) : 0;

  if (metric === "cpa") {
    const spend = parseFloat(row.spend || "0");
    return purchaseCount > 0 ? spend / purchaseCount : null;
  }

  if (metric === "roas") {
    const spend = parseFloat(row.spend || "0");
    const purchaseValue = actions.find(
      (a: any) => a.action_type === "omni_purchase" || a.action_type === "offsite_conversion.fb_pixel_purchase"
    );
    const value = purchaseValue ? parseFloat(purchaseValue.value) : 0;
    return spend > 0 ? value / spend : null;
  }

  if (metric === "cost_per_purchase") {
    const cpa = costPerAction.find(
      (a: any) => a.action_type === "purchase" || a.action_type === "offsite_conversion.fb_pixel_purchase"
    );
    return cpa ? parseFloat(cpa.value) : null;
  }

  return null;
}

function evaluate(metricValue: number, operator: string, threshold: number): boolean {
  switch (operator) {
    case "gt": return metricValue > threshold;
    case "lt": return metricValue < threshold;
    case "gte": return metricValue >= threshold;
    case "lte": return metricValue <= threshold;
    case "eq": return metricValue === threshold;
    default: return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Fetch active rules
    const { data: rules, error: rulesErr } = await supabase
      .from("automated_rules")
      .select("*")
      .eq("is_active", true);

    if (rulesErr) throw rulesErr;
    if (!rules || rules.length === 0) {
      return new Response(
        JSON.stringify({ rules_evaluated: 0, actions_taken: 0, message: "Nenhuma regra ativa" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Get unique user_ids and fetch their tokens
    const userIds = [...new Set(rules.map((r: Rule) => r.user_id))];
    const { data: tokens, error: tokensErr } = await supabase
      .from("user_tokens")
      .select("*")
      .in("user_id", userIds);

    if (tokensErr) throw tokensErr;

    const tokenMap = new Map<string, { fb_access_token: string; fb_account_id: string }>();
    for (const t of tokens || []) {
      tokenMap.set(t.user_id, { fb_access_token: t.fb_access_token, fb_account_id: t.fb_account_id });
    }

    let totalActions = 0;
    const results: { rule_id: string; rule_name: string; result: string }[] = [];

    // 3. Process each rule
    for (const rule of rules as Rule[]) {
      const userToken = tokenMap.get(rule.user_id);
      if (!userToken) {
        await supabase
          .from("automated_rules")
          .update({ last_run_at: new Date().toISOString(), last_run_result: "Erro: token não encontrado" })
          .eq("id", rule.id);
        results.push({ rule_id: rule.id, rule_name: rule.name, result: "Token não encontrado" });
        continue;
      }

      const { fb_access_token, fb_account_id } = userToken;
      const accountId = fb_account_id.startsWith("act_") ? fb_account_id : `act_${fb_account_id}`;

      // Fetch insights
      const insightsUrl = new URL(`${FB_API}/${accountId}/insights`);
      insightsUrl.searchParams.set("access_token", fb_access_token);
      insightsUrl.searchParams.set("fields", "spend,impressions,clicks,cpc,ctr,actions,cost_per_action_type");
      insightsUrl.searchParams.set("date_preset", rule.date_preset);
      insightsUrl.searchParams.set("level", rule.entity_type);
      insightsUrl.searchParams.set("limit", "500");

      let insightsData: any;
      try {
        const res = await fetch(insightsUrl.toString());
        insightsData = await res.json();
        if (insightsData.error) {
          throw new Error(insightsData.error.message);
        }
      } catch (e: any) {
        await supabase
          .from("automated_rules")
          .update({ last_run_at: new Date().toISOString(), last_run_result: `Erro API: ${e.message}` })
          .eq("id", rule.id);
        results.push({ rule_id: rule.id, rule_name: rule.name, result: `Erro API: ${e.message}` });
        continue;
      }

      const rows: InsightRow[] = insightsData.data || [];
      let actionsForRule = 0;

      for (const row of rows) {
        const metricValue = extractMetric(row, rule.condition_metric);
        if (metricValue === null) continue;

        if (evaluate(metricValue, rule.condition_operator, rule.condition_value)) {
          // Determine entity ID
          const entityId = row[`${rule.entity_type}_id`];
          if (!entityId) continue;

          const newStatus = rule.action_type === "pause" ? "PAUSED" : "ACTIVE";

          try {
            const body = new URLSearchParams();
            body.set("access_token", fb_access_token);
            body.set("status", newStatus);

            const updateRes = await fetch(`${FB_API}/${entityId}`, {
              method: "POST",
              body,
            });
            const updateData = await updateRes.json();
            if (updateData.error) {
              console.error(`Failed to update ${entityId}:`, updateData.error.message);
              continue;
            }
            actionsForRule++;
          } catch (e: any) {
            console.error(`Failed to update ${entityId}:`, e.message);
          }
        }
      }

      totalActions += actionsForRule;
      const resultMsg = actionsForRule > 0
        ? `Executada: ${actionsForRule} entidades afetadas`
        : "Nenhuma ação necessária";

      await supabase
        .from("automated_rules")
        .update({ last_run_at: new Date().toISOString(), last_run_result: resultMsg })
        .eq("id", rule.id);

      results.push({ rule_id: rule.id, rule_name: rule.name, result: resultMsg });
    }

    return new Response(
      JSON.stringify({
        rules_evaluated: rules.length,
        actions_taken: totalActions,
        details: results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
