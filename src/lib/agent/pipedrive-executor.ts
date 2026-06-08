/**
 * Pipedrive in-app executor
 *
 * Calls Pipedrive REST API directly from the browser.
 * Pipedrive supports browser-side API calls (CORS enabled).
 */

import { useIntegrationsStore } from "@/store/useIntegrationsStore";

const BASE_URL = "https://api.pipedrive.com/v1";

async function pipedriveGet(
  apiToken: string,
  path: string,
  params: Record<string, string | number> = {}
): Promise<unknown> {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("api_token", apiToken);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Pipedrive API ${res.status}: ${await res.text()}`);
  const json = await res.json() as { success: boolean; data: unknown };
  if (!json.success) throw new Error(`Pipedrive error: ${JSON.stringify(json)}`);
  return json.data;
}

type DealRecord = Record<string, unknown>;

export async function executePipedriveTool(
  toolName: string,
  input: Record<string, unknown>
): Promise<string> {
  const { pipedrive } = useIntegrationsStore.getState();
  const token = pipedrive.apiToken || import.meta.env.VITE_PIPEDRIVE_API_TOKEN || "";

  if (!token) {
    return JSON.stringify({
      error: "Pipedrive não configurado. Acesse Integrações para adicionar seu API Token.",
    });
  }

  try {
  switch (toolName) {
    case "get_pipedrive_deal_fields": {
      const data = await pipedriveGet(token, "/dealFields");
      return JSON.stringify(data, null, 2);
    }

    case "list_pipedrive_pipelines": {
      const data = await pipedriveGet(token, "/pipelines");
      return JSON.stringify(data, null, 2);
    }

    case "list_pipedrive_deals": {
      const params: Record<string, string | number> = {
        limit: (input.limit as number) ?? 100,
        start: 0,
        status: (input.status as string) ?? "all_not_deleted",
      };
      if (input.pipeline_id) params.pipeline_id = input.pipeline_id as number;
      if (input.updated_since) params.updated_since = input.updated_since as string;
      if (input.updated_until) params.updated_until = input.updated_until as string;
      const data = await pipedriveGet(token, "/deals", params);
      return JSON.stringify(data, null, 2);
    }

    case "correlate_pipedrive_with_meta": {
      // Supports both custom UTM fields and native Pipedrive origin/channel fields
      const utmCampaignKey = (input.utm_campaign_field_key as string | undefined)
        ?? pipedrive.fieldMapping.utmCampaignFieldKey
        ?? "origin_id"; // fallback: native origin_id (often stores utm_campaign or source label)
      const utmSourceKey = (input.utm_source_field_key as string | undefined)
        ?? pipedrive.fieldMapping.utmSourceFieldKey
        ?? "origin"; // fallback: native origin field ("Google Ads", "API", etc.)
      const pipelineId = (input.pipeline_id as number | undefined)
        ?? pipedrive.fieldMapping.defaultPipelineId
        ?? undefined;

      const params: Record<string, string | number> = {
        limit: 500,
        start: 0,
        status: "all_not_deleted",
      };
      if (pipelineId) params.pipeline_id = pipelineId;
      if (input.start_date) params.updated_since = input.start_date as string;
      if (input.end_date) params.updated_until = input.end_date as string;

      const deals = await pipedriveGet(token, "/deals", params) as DealRecord[];
      if (!Array.isArray(deals)) return JSON.stringify({ error: "Nenhum deal encontrado" });

      const byCampaign: Record<string, {
        campaign: string;
        source: string | null;
        deal_count: number;
        won_count: number;
        lost_count: number;
        open_count: number;
        total_value: number;
        won_value: number;
        conversion_rate: string;
        currency: string;
      }> = {};

      for (const deal of deals) {
        const campaign = (deal[utmCampaignKey] as string) || "(sem UTM campanha)";
        const source = utmSourceKey ? (deal[utmSourceKey] as string) || null : null;
        const value = parseFloat(String(deal.value ?? 0));
        const currency = (deal.currency as string) ?? "BRL";
        const status = deal.status as string;

        if (!byCampaign[campaign]) {
          byCampaign[campaign] = {
            campaign,
            source,
            deal_count: 0,
            won_count: 0,
            lost_count: 0,
            open_count: 0,
            total_value: 0,
            won_value: 0,
            conversion_rate: "0%",
            currency,
          };
        }
        byCampaign[campaign].deal_count++;
        byCampaign[campaign].total_value += value;
        if (status === "won") {
          byCampaign[campaign].won_count++;
          byCampaign[campaign].won_value += value;
        }
        if (status === "lost") byCampaign[campaign].lost_count++;
        if (status === "open") byCampaign[campaign].open_count++;
      }

      const results = Object.values(byCampaign)
        .map((row) => ({
          ...row,
          total_value: row.total_value.toFixed(2),
          won_value: row.won_value.toFixed(2),
          conversion_rate:
            row.deal_count > 0
              ? ((row.won_count / row.deal_count) * 100).toFixed(1) + "%"
              : "0%",
        }))
        .sort((a, b) => parseFloat(b.won_value) - parseFloat(a.won_value));

      return JSON.stringify({
        total_deals_analyzed: deals.length,
        period: { from: input.start_date ?? "all time", to: input.end_date ?? "all time" },
        by_campaign: results,
        tip: "Compare 'won_value' com o gasto da campanha no Google Ads para calcular o ROAS/CPA real.",
      }, null, 2);
    }

    default:
      return JSON.stringify({ error: `Tool Pipedrive desconhecida: ${toolName}` });
  }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return JSON.stringify({ error: `Erro ao conectar com Pipedrive: ${msg}` });
  }
}
