import { executeToolCall as baseExecuteToolCall } from "./executor";
import {
  getCustomerMetrics,
  getCampaignMetrics,
  getAdGroupMetrics,
  getAdMetrics,
  getPerformanceByDevice,
  getPerformanceByHour,
  getPerformanceByDayOfWeek,
  getGeographicPerformance,
} from "@/lib/google-ads/reporting";
import { getKeywordsByCustomer, getSearchTerms } from "@/lib/google-ads/keywords";
import { getAdGroupsByCustomer } from "@/lib/google-ads/adgroups";
import { listRecommendations } from "@/lib/google-ads/recommendations";
import { listConversionActions } from "@/lib/google-ads/conversions";
import { getChangeEvents } from "@/lib/google-ads/change-history";
import {
  normalizeMetricsRow,
  microsToUnits,
  computeRoas,
  computeCpa,
} from "@/lib/google-ads/types";

const DATE_MAP: Record<string, string> = {
  today: "TODAY",
  last_7d: "LAST_7_DAYS",
  last_14d: "LAST_14_DAYS",
  last_30d: "LAST_30_DAYS",
  this_month: "THIS_MONTH",
  last_month: "LAST_MONTH",
};

function mapDate(preset?: string): string {
  return DATE_MAP[preset || "last_7d"] || "LAST_7_DAYS";
}

export async function executeExpandedToolCall(
  toolName: string,
  toolInput: Record<string, any>,
  context: { accountId: string }
): Promise<string> {
  const { accountId } = context;

  switch (toolName) {
    // --- Ação ativa: cria uma PROPOSTA (não executa) ---
    case "propose_actions": {
      const { createActionPlan } = await import("./proposals");
      const loginCustomerId =
        typeof localStorage !== "undefined"
          ? localStorage.getItem("gads_login_customer_id")
          : null;
      const res = await createActionPlan({
        customerId: accountId,
        loginCustomerId,
        title: toolInput.title,
        rationale: toolInput.rationale,
        riskTier: toolInput.risk_tier,
        estimatedImpact: toolInput.estimated_impact,
        actions: toolInput.actions ?? [],
      });

      // Autonomia: auto-aprova + executa se o tier for elegível (kill-switch off por padrão)
      const { shouldAutoApprove } = await import("./autonomy");
      if (shouldAutoApprove(res.riskTier)) {
        const { supabase } = await import("@/integrations/supabase/client");
        await (supabase as any)
          .from("ai_action_plans")
          .update({ status: "authorized", decided_at: new Date().toISOString() })
          .eq("id", res.planId);
        const { executePlan } = await import("./execution");
        const exec = await executePlan(res.planId);
        return JSON.stringify({
          proposed: true,
          auto_approved: true,
          plan_id: res.planId,
          executed: exec.executed,
          failed: exec.failed,
          message:
            `Proposta AUTO-APROVADA (autonomia, risco ${res.riskTier}) e executada: ` +
            `${exec.executed} ação(ões) aplicada(s)${exec.failed ? `, ${exec.failed} com falha` : ""}.`,
        });
      }

      return JSON.stringify({
        proposed: true,
        plan_id: res.planId,
        actions_count: res.itemCount,
        message:
          `Proposta criada com ${res.itemCount} ação(ões), aguardando aprovação do ` +
          `usuário em Inteligência > Ações da IA. NADA foi aplicado ao Google Ads.`,
      });
    }

    // --- Novas ferramentas ---

    case "list_keywords": {
      const { campaign_id, limit = 100 } = toolInput;
      const data = await getKeywordsByCustomer(accountId, {
        campaignId: campaign_id,
        limit,
      });
      const results = (data.results || []).map((r: any) => {
        const kw = r.adGroupCriterion || {};
        const m = r.metrics || {};
        return {
          id: kw.criterionId,
          text: kw.keyword?.text,
          matchType: kw.keyword?.matchType,
          status: kw.status,
          qualityScore: kw.qualityInfo?.qualityScore,
          expectedCtr: kw.qualityInfo?.searchPredictedCtr,
          adRelevance: kw.qualityInfo?.creativeQualityScore,
          landingPageExp: kw.qualityInfo?.postClickQualityScore,
          impressions: Number(m.impressions || 0),
          clicks: Number(m.clicks || 0),
          ctr: Number(m.ctr || 0),
          cpc: microsToUnits(Number(m.averageCpc || 0)),
          cost: microsToUnits(Number(m.costMicros || 0)),
          conversions: Number(m.conversions || 0),
        };
      });
      return JSON.stringify(results.slice(0, limit));
    }

    case "list_search_terms": {
      const { campaign_id, date_preset, limit = 50 } = toolInput;
      const data = await getSearchTerms(accountId, {
        campaignId: campaign_id,
        dateRange: mapDate(date_preset) as any,
        limit,
      });
      const results = (data.results || []).map((r: any) => {
        const st = r.searchTermView || {};
        const m = r.metrics || {};
        return {
          searchTerm: st.searchTerm,
          status: st.status,
          impressions: Number(m.impressions || 0),
          clicks: Number(m.clicks || 0),
          cost: microsToUnits(Number(m.costMicros || 0)),
          conversions: Number(m.conversions || 0),
          ctr: Number(m.ctr || 0),
        };
      });
      return JSON.stringify(results.slice(0, limit));
    }

    case "list_ad_groups": {
      const { campaign_id, date_preset } = toolInput;
      const data = await getAdGroupsByCustomer(accountId, {
        campaignId: campaign_id,
      });
      const results = (data.results || []).map((r: any) => {
        const ag = r.adGroup || r;
        return {
          id: ag.id,
          name: ag.name,
          status: ag.status,
          type: ag.type,
          cpcBidMicros: ag.cpcBidMicros ? microsToUnits(Number(ag.cpcBidMicros)) : null,
        };
      });
      return JSON.stringify(results);
    }

    case "get_performance_by_device": {
      const { campaign_id, date_preset } = toolInput;
      const data = await getPerformanceByDevice(accountId, campaign_id, mapDate(date_preset));
      const results = (data.results || []).map((r: any) => {
        const row = normalizeMetricsRow(r);
        return {
          device: r.segments?.device,
          impressions: row.impressions,
          clicks: row.clicks,
          ctr: (row.ctr * 100).toFixed(2) + "%",
          cost: microsToUnits(row.costMicros).toFixed(2),
          conversions: row.conversions,
          roas: computeRoas(row),
          cpa: computeCpa(row) || null,
        };
      });
      return JSON.stringify(results);
    }

    case "get_performance_by_hour": {
      const { campaign_id, date_preset } = toolInput;
      const data = await getPerformanceByHour(accountId, campaign_id, mapDate(date_preset));
      const results = (data.results || []).map((r: any) => {
        const row = normalizeMetricsRow(r);
        return {
          hour: r.segments?.hour,
          impressions: row.impressions,
          clicks: row.clicks,
          cost: microsToUnits(row.costMicros).toFixed(2),
          conversions: row.conversions,
          cpa: computeCpa(row) || null,
        };
      });
      return JSON.stringify(results);
    }

    case "get_performance_by_day": {
      const { campaign_id, date_preset } = toolInput;
      const data = await getPerformanceByDayOfWeek(accountId, campaign_id, mapDate(date_preset));
      const results = (data.results || []).map((r: any) => {
        const row = normalizeMetricsRow(r);
        return {
          dayOfWeek: r.segments?.dayOfWeek,
          impressions: row.impressions,
          clicks: row.clicks,
          cost: microsToUnits(row.costMicros).toFixed(2),
          conversions: row.conversions,
          roas: computeRoas(row),
        };
      });
      return JSON.stringify(results);
    }

    case "get_geographic_performance": {
      const { campaign_id, date_preset } = toolInput;
      const data = await getGeographicPerformance(accountId, campaign_id, mapDate(date_preset));
      const results = (data.results || []).map((r: any) => {
        const row = normalizeMetricsRow(r);
        return {
          location: r.geoTargetConstant?.name || r.segments?.geoTargetCity || "Unknown",
          impressions: row.impressions,
          clicks: row.clicks,
          cost: microsToUnits(row.costMicros).toFixed(2),
          conversions: row.conversions,
          roas: computeRoas(row),
        };
      });
      return JSON.stringify(results.slice(0, 20));
    }

    case "list_recommendations": {
      const { limit = 20 } = toolInput;
      const data = await listRecommendations(accountId, { limit });
      const results = (data.results || []).map((r: any) => {
        const rec = r.recommendation || r;
        return {
          type: rec.type,
          impact: rec.impact,
          campaignId: rec.campaignBudget || rec.campaign,
          resourceName: rec.resourceName,
        };
      });
      return JSON.stringify(results);
    }

    case "list_conversions": {
      const data = await listConversionActions(accountId);
      const results = (data.results || []).map((r: any) => {
        const ca = r.conversionAction || r;
        return {
          id: ca.id,
          name: ca.name,
          type: ca.type,
          status: ca.status,
          category: ca.category,
          attributionModel: ca.attributionModelSettings?.attributionModel,
        };
      });
      return JSON.stringify(results);
    }

    case "get_change_history": {
      const { days = 7, limit = 20 } = toolInput;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      const data = await getChangeEvents(accountId, { startDate, limit });
      const results = (data.results || []).map((r: any) => {
        const event = r.changeEvent || r;
        return {
          changeDateTime: event.changeDateTime,
          changeResourceType: event.changeResourceType,
          changeResourceName: event.changeResourceName,
          clientType: event.clientType,
          oldResource: event.oldResource,
          newResource: event.newResource,
        };
      });
      return JSON.stringify(results);
    }

    // --- Ferramentas existentes — delega pro executor base ---
    default:
      return baseExecuteToolCall(toolName, toolInput, context);
  }
}
