import { executePipedriveTool } from "./pipedrive-executor";
import { executeShopifyTool } from "./shopify-executor";
import { executeHubSpotTool } from "./hubspot-executor";
import { getCustomerMetrics, getCampaignMetrics, getAdMetrics } from "@/lib/google-ads/reporting";
import { updateCampaign, updateAdStatus, bulkUpdateStatus, updateBudgetAmount } from "@/lib/google-ads/mutations";
import { classifyCampaigns } from "@/lib/strategicInsights";
import {
  computeRoas,
  computeCpa,
  microsToUnits,
  unitsToMicros,
  normalizeMetricsRow,
  type MetricsRow,
} from "@/lib/google-ads/types";

export async function executeToolCall(
  toolName: string,
  toolInput: Record<string, any>,
  context: { accountId: string }
): Promise<string> {
  const { accountId } = context;

  switch (toolName) {
    case "get_account_overview": {
      const preset = toolInput.date_preset || "LAST_7_DAYS";

      const [accountData, campaignData] = await Promise.all([
        getCustomerMetrics(accountId, preset),
        getCampaignMetrics(accountId, undefined, preset),
      ]);

      const accountRows = (accountData.results || []).map((r: any) => normalizeMetricsRow(r));
      const row = accountRows[0] as MetricsRow | undefined;
      if (!row) {
        return JSON.stringify({ error: "Sem dados para o periodo selecionado." });
      }

      const roas = computeRoas(row);
      const conversions = row.conversions;
      const cpa = computeCpa(row);
      const spend = microsToUnits(row.costMicros);

      const campaignRows = (campaignData.results || []).map((r: any) => normalizeMetricsRow(r));
      const classified = classifyCampaigns(campaignRows);
      const winners = classified.filter((c) => c.classification === "winner");
      const bleeders = classified.filter((c) => c.classification === "bleeder");

      return JSON.stringify({
        period: preset,
        spend,
        impressions: row.impressions,
        clicks: row.clicks,
        ctr: (row.ctr * 100).toFixed(2),
        averageCpc: microsToUnits(row.averageCpc).toFixed(2),
        roas,
        conversions,
        cpa: cpa > 0 ? cpa : null,
        winners: winners.map((w) => ({
          id: w.campaign_id,
          name: w.campaign_name,
          roas: w.roas,
          spend: w.spend,
          conversions: w.conversions,
        })),
        bleeders: bleeders.map((b) => ({
          id: b.campaign_id,
          name: b.campaign_name,
          roas: b.roas,
          spend: b.spend,
          reasons: b.reasons,
        })),
        totalCampaigns: classified.length,
      });
    }

    case "list_campaigns": {
      const preset = toolInput.date_preset || "LAST_7_DAYS";

      const data = await getCampaignMetrics(accountId, undefined, preset);
      const rows = (data.results || []).map((r: any) => normalizeMetricsRow(r));
      const classified = classifyCampaigns(rows);

      return JSON.stringify(
        classified.map((c) => ({
          id: c.campaign_id,
          name: c.campaign_name,
          classification: c.classification,
          spend: c.spend,
          roas: c.roas,
          conversions: c.conversions,
          cpa: c.cpa > 0 ? c.cpa : null,
          reasons: c.reasons,
        }))
      );
    }

    case "list_ads": {
      const { campaign_id, date_preset = "LAST_7_DAYS" } = toolInput;

      const response = await getAdMetrics(accountId, undefined, undefined, date_preset);
      const rows = (response.results || []).map((r: any) => normalizeMetricsRow(r));
      const filteredRows = campaign_id
        ? rows.filter((r) => r.campaignId === campaign_id)
        : rows;

      if (filteredRows.length === 0) {
        return JSON.stringify({ message: "Nenhum anuncio encontrado." });
      }

      return JSON.stringify(
        filteredRows.slice(0, 20).map((row) => ({
          id: row.adId,
          adGroupName: row.adGroupName,
          spend: microsToUnits(row.costMicros),
          ctr: (row.ctr * 100).toFixed(2),
          averageCpc: microsToUnits(row.averageCpc).toFixed(2),
          roas: computeRoas(row),
          conversions: row.conversions,
          cpa: computeCpa(row) || null,
        }))
      );
    }

    case "pause_campaigns": {
      const { campaign_ids } = toolInput as { campaign_ids: string[] };
      const resourceNames = campaign_ids.map((id) => `customers/${accountId}/campaigns/${id}`);
      const result = await bulkUpdateStatus(accountId, "campaigns", resourceNames, "PAUSED");
      return JSON.stringify({
        success: true,
        message: `${campaign_ids.length} campanha(s) pausada(s) com sucesso.`,
      });
    }

    case "activate_campaigns": {
      const { campaign_ids } = toolInput as { campaign_ids: string[] };
      const resourceNames = campaign_ids.map((id) => `customers/${accountId}/campaigns/${id}`);
      const result = await bulkUpdateStatus(accountId, "campaigns", resourceNames, "ENABLED");
      return JSON.stringify({
        success: true,
        message: `${campaign_ids.length} campanha(s) ativada(s) com sucesso.`,
      });
    }

    case "update_campaign_budget": {
      const { campaign_id, daily_budget } = toolInput;
      // Google Ads API uses micros
      const budgetResourceName = `customers/${accountId}/campaignBudgets/${campaign_id}`;
      await updateBudgetAmount(accountId, budgetResourceName, unitsToMicros(daily_budget));
      return JSON.stringify({
        success: true,
        campaign_id,
        new_daily_budget_brl: daily_budget,
        message: `Budget diario atualizado para R$ ${daily_budget.toFixed(2)}.`,
      });
    }

    case "pause_ads": {
      const { ad_ids } = toolInput as { ad_ids: string[] };
      const resourceNames = ad_ids.map((id) => `customers/${accountId}/adGroupAds/${id}`);
      const result = await bulkUpdateStatus(accountId, "adGroupAds", resourceNames, "PAUSED");
      return JSON.stringify({
        success: true,
        message: `${ad_ids.length} anuncio(s) pausado(s).`,
      });
    }

    // --- Pipedrive tools ---
    case "get_pipedrive_deal_fields":
    case "list_pipedrive_pipelines":
    case "list_pipedrive_deals":
    case "correlate_pipedrive_with_meta":
    case "correlate_pipedrive_with_google_ads":
      return executePipedriveTool(toolName, toolInput);

    // --- Shopify tools ---
    case "get_shopify_revenue_summary":
    case "correlate_shopify_with_meta":
    case "correlate_shopify_with_google_ads":
    case "get_shopify_real_roas":
      return executeShopifyTool(toolName, toolInput);

    // --- HubSpot tools ---
    case "get_hubspot_overview":
    case "correlate_hubspot_with_meta":
    case "correlate_hubspot_with_google_ads":
    case "get_hubspot_contacts_count":
      return executeHubSpotTool(toolName, toolInput);

    default:
      return JSON.stringify({ error: `Ferramenta desconhecida: ${toolName}` });
  }
}
