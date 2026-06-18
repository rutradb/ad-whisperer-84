/**
 * HubSpot in-app executor
 *
 * A HubSpot CRM API NÃO permite chamadas cross-origin do browser (CORS) —
 * por isso roteamos via edge function `hubspot-proxy` (igual ao Shopify).
 * O token vai no corpo; a auth da edge é cuidada pelo supabase.functions.invoke.
 */

import { useIntegrationsStore } from "@/store/useIntegrationsStore";
import { supabase } from "@/integrations/supabase/client";

async function hsCall(
  token: string,
  method: "GET" | "POST",
  path: string,
  opts: { params?: Record<string, string | number>; body?: unknown } = {},
): Promise<unknown> {
  const { data, error } = await supabase.functions.invoke<any>("hubspot-proxy", {
    body: { token, method, path, params: opts.params, body: opts.body },
  });
  if (error) {
    let msg = error.message || `HubSpot proxy error`;
    try {
      const ctx = await (error as any).context?.json?.();
      if (ctx?.error) msg = ctx.error;
      else if (ctx?.message) msg = ctx.message;
    } catch {
      // mantém a mensagem padrão
    }
    throw new Error(`HubSpot API: ${msg}`);
  }
  return data;
}

function hsGet(token: string, path: string, params: Record<string, string | number> = {}): Promise<unknown> {
  return hsCall(token, "GET", path, { params });
}

function hsPost(token: string, path: string, body: unknown): Promise<unknown> {
  return hsCall(token, "POST", path, { body });
}

type HsDeal = {
  id: string;
  properties: Record<string, string | null>;
};

type HsSearchResult = {
  results: HsDeal[];
  total: number;
  paging?: { next?: { after: string } };
};

/** Fetch all deals in a date range, handling pagination (max 3 pages / 600 deals). */
async function fetchDeals(token: string, fromISO: string, toISO: string): Promise<HsDeal[]> {
  const DEAL_PROPS = [
    "dealname", "amount", "dealstage", "pipeline",
    "closedate", "createdate",
    "hs_analytics_source",
    "hs_analytics_source_data_1",   // campaign name / utm_campaign
    "hs_analytics_source_data_2",   // medium / utm_content
    "hs_deal_stage_probability",
    "hs_is_closed",                 // flag oficial: deal fechado
    "hs_is_closed_won",             // flag oficial: fechado ganho
  ];

  const body = {
    filterGroups: [{
      filters: [
        { propertyName: "createdate", operator: "GTE", value: new Date(fromISO).getTime() },
        { propertyName: "createdate", operator: "LTE", value: new Date(toISO).getTime() },
      ],
    }],
    properties: DEAL_PROPS,
    limit: 200,
    sorts: [{ propertyName: "createdate", direction: "DESCENDING" }],
  };

  const all: HsDeal[] = [];
  let after: string | undefined;

  for (let page = 0; page < 3; page++) {
    const payload = after ? { ...body, after } : body;
    const data = await hsPost(token, "/crm/v3/objects/deals/search", payload) as HsSearchResult;
    all.push(...data.results);
    if (!data.paging?.next?.after) break;
    after = data.paging.next.after;
  }

  return all;
}

/**
 * Classifica um deal como won/lost/open.
 * Prioriza as flags oficiais do HubSpot (hs_is_closed_won / hs_is_closed), que
 * funcionam com qualquer pipeline/idioma; cai para heurística por nome do stage
 * (incluindo PT-BR) só quando as flags não vêm preenchidas.
 */
function dealOutcome(props: Record<string, string | null>): "won" | "lost" | "open" {
  if (props.hs_is_closed_won === "true") return "won";
  if (props.hs_is_closed === "true") return "lost";
  const stage = (props.dealstage ?? "").toLowerCase();
  if (stage.includes("won") || stage.includes("ganho") || stage === "closedwon") return "won";
  if (stage.includes("lost") || stage.includes("perdid") || stage === "closedlost") return "lost";
  return "open";
}

export async function executeHubSpotTool(
  toolName: string,
  input: Record<string, unknown>,
): Promise<string> {
  const { hubspot } = useIntegrationsStore.getState();
  const token = hubspot.accessToken || import.meta.env.VITE_HUBSPOT_ACCESS_TOKEN || "";

  if (!token) {
    return JSON.stringify({
      error: "HubSpot não configurado. Acesse Integrações para adicionar seu Access Token.",
    });
  }

  try {
  switch (toolName) {

    // ── Overview: pipelines + deal stage summary ───────────────────────────
    case "get_hubspot_overview": {
      const fromISO = (input.start_date as string) + "T00:00:00.000Z";
      const toISO   = (input.end_date   as string) + "T23:59:59.999Z";

      const deals = await fetchDeals(token, fromISO, toISO);

      let totalValue = 0;
      let wonValue = 0;
      let wonCount = 0;
      let openCount = 0;
      let lostCount = 0;
      const byCurrency: Record<string, number> = {};

      for (const d of deals) {
        const amount = parseFloat(d.properties.amount ?? "0") || 0;
        totalValue += amount;

        const outcome = dealOutcome(d.properties);
        if (outcome === "won") {
          wonCount++;
          wonValue += amount;
        } else if (outcome === "lost") {
          lostCount++;
        } else {
          openCount++;
        }
      }

      return JSON.stringify({
        period: { from: input.start_date, to: input.end_date },
        total_deals: deals.length,
        won_deals: wonCount,
        open_deals: openCount,
        lost_deals: lostCount,
        total_deal_value: totalValue.toFixed(2),
        won_value: wonValue.toFixed(2),
        avg_deal_value: deals.length > 0 ? (totalValue / deals.length).toFixed(2) : "0",
        conversion_rate: deals.length > 0 ? ((wonCount / deals.length) * 100).toFixed(1) + "%" : "0%",
      }, null, 2);
    }

    // ── Correlate deals com campanhas via hs_analytics_source (Google Ads) ──
    case "correlate_hubspot_with_meta":
    case "correlate_hubspot_with_google_ads": {
      const fromISO = (input.start_date as string) + "T00:00:00.000Z";
      const toISO   = (input.end_date   as string) + "T23:59:59.999Z";

      const deals = await fetchDeals(token, fromISO, toISO);

      type Row = {
        source: string;
        campaign: string | null;
        deal_count: number;
        won_count: number;
        lost_count: number;
        open_count: number;
        total_value: number;
        won_value: number;
      };

      const bySource: Record<string, Row> = {};

      for (const d of deals) {
        const source   = d.properties.hs_analytics_source       ?? "(direto)";
        const campaign = d.properties.hs_analytics_source_data_1 ?? null;
        const amount   = parseFloat(d.properties.amount ?? "0") || 0;

        const key = source + (campaign ? ` / ${campaign}` : "");
        if (!bySource[key]) {
          bySource[key] = { source, campaign, deal_count: 0, won_count: 0, lost_count: 0, open_count: 0, total_value: 0, won_value: 0 };
        }
        bySource[key].deal_count++;
        bySource[key].total_value += amount;

        const outcome = dealOutcome(d.properties);
        if (outcome === "won") {
          bySource[key].won_count++;
          bySource[key].won_value += amount;
        } else if (outcome === "lost") {
          bySource[key].lost_count++;
        } else {
          bySource[key].open_count++;
        }
      }

      const results = Object.values(bySource)
        .sort((a, b) => b.won_value - a.won_value)
        .map((r) => ({
          ...r,
          total_value: r.total_value.toFixed(2),
          won_value: r.won_value.toFixed(2),
          conversion_rate: r.deal_count > 0
            ? ((r.won_count / r.deal_count) * 100).toFixed(1) + "%"
            : "0%",
        }));

      return JSON.stringify({
        total_deals_analyzed: deals.length,
        period: { from: input.start_date, to: input.end_date },
        by_source: results,
        note: "hs_analytics_source='PAID_SOCIAL' indica tráfego pago de redes sociais (Google Ads). hs_analytics_source_data_1 = campanha.",
      }, null, 2);
    }

    // ── Contact count ──────────────────────────────────────────────────────
    case "get_hubspot_contacts_count": {
      const data = await hsGet(token, "/crm/v3/objects/contacts", { limit: 1 }) as { total?: number };
      return JSON.stringify({ total_contacts: data.total ?? 0 }, null, 2);
    }

    default:
      return JSON.stringify({ error: `Tool HubSpot desconhecida: ${toolName}` });
  }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // CORS or network error — return structured error instead of throwing
    return JSON.stringify({ error: `Erro ao conectar com HubSpot: ${msg}. Verifique o token ou tente novamente.` });
  }
}
