/**
 * Shopify in-app executor
 *
 * NOTE: Shopify Admin API has CORS restrictions for browser requests.
 * This executor routes calls through a Supabase Edge Function proxy.
 *
 * Deploy the proxy:
 *   supabase functions deploy shopify-proxy
 *
 * The proxy endpoint: {SUPABASE_URL}/functions/v1/shopify-proxy
 * It forwards requests to Shopify with the access token server-side.
 */

import { useIntegrationsStore } from "@/store/useIntegrationsStore";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const PROXY_URL = `${SUPABASE_URL}/functions/v1/shopify-proxy`;

interface OrderNote { name: string; value: string }

interface ShopifyOrder {
  id: number;
  total_price: string;
  currency: string;
  source_name: string;
  note_attributes: OrderNote[];
  financial_status: string;
  created_at: string;
  line_items?: Array<{ title: string; quantity: number; price: string }>;
}

async function shopifyProxyGet(
  storeUrl: string,
  accessToken: string,
  path: string,
  params: Record<string, string | number> = {}
): Promise<unknown> {
  // Try direct request first (may work in some configurations)
  // Falls back to proxy if CORS error
  const directUrl = new URL(`https://${storeUrl}/admin/api/2024-04${path}`);
  for (const [k, v] of Object.entries(params)) directUrl.searchParams.set(k, String(v));

  try {
    const res = await fetch(directUrl.toString(), {
      headers: { "X-Shopify-Access-Token": accessToken },
    });
    if (res.ok) return res.json();
  } catch {
    // CORS blocked — fall through to proxy
  }

  // Use Supabase Edge Function proxy
  const res = await fetch(PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      store: storeUrl,
      token: accessToken,
      path,
      params,
    }),
  });
  if (!res.ok) throw new Error(`Proxy error ${res.status}. Configure a Supabase Edge Function shopify-proxy.`);
  return res.json();
}

function extractUtm(note_attributes: OrderNote[], key: string): string | null {
  return note_attributes?.find((a) => a.name === key)?.value ?? null;
}

export async function executeShopifyTool(
  toolName: string,
  input: Record<string, unknown>
): Promise<string> {
  const { shopify } = useIntegrationsStore.getState();
  const storeUrl = shopify.storeUrl || import.meta.env.VITE_SHOPIFY_STORE || "";
  const accessToken = shopify.accessToken || import.meta.env.VITE_SHOPIFY_ACCESS_TOKEN || "";
  const { fieldMapping } = shopify;

  if (!storeUrl || !accessToken) {
    return JSON.stringify({
      error: "Shopify não configurado. Acesse Integrações para adicionar Store URL e Access Token.",
    });
  }

  switch (toolName) {
    case "get_shopify_revenue_summary": {
      const params: Record<string, string | number> = {
        created_at_min: input.created_at_min as string,
        created_at_max: input.created_at_max as string,
        financial_status: (input.financial_status as string) ?? "paid",
        limit: 250,
        fields: "id,total_price,currency,created_at,line_items,financial_status",
      };
      const data = await shopifyProxyGet(storeUrl, accessToken, "/orders.json", params) as { orders: ShopifyOrder[] };
      const orders = data.orders ?? [];

      let revenue = 0;
      const productCounts: Record<string, { title: string; qty: number; revenue: number }> = {};

      for (const order of orders) {
        const price = parseFloat(order.total_price ?? "0");
        revenue += price;
        for (const item of order.line_items ?? []) {
          if (!productCounts[item.title]) productCounts[item.title] = { title: item.title, qty: 0, revenue: 0 };
          productCounts[item.title].qty += item.quantity;
          productCounts[item.title].revenue += parseFloat(item.price) * item.quantity;
        }
      }

      const topProducts = Object.values(productCounts)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
        .map((p) => ({ ...p, revenue: p.revenue.toFixed(2) }));

      return JSON.stringify({
        period: { from: input.created_at_min, to: input.created_at_max },
        order_count: orders.length,
        total_revenue: revenue.toFixed(2),
        aov: orders.length > 0 ? (revenue / orders.length).toFixed(2) : "0",
        currency: orders[0]?.currency ?? "BRL",
        top_products: topProducts,
      }, null, 2);
    }

    case "correlate_shopify_with_meta": {
      const utmCampaignAttr = (input.utm_campaign_attribute as string) ?? fieldMapping.utmCampaignAttribute;
      const utmSourceAttr = (input.utm_source_attribute as string) ?? fieldMapping.utmSourceAttribute;

      const params: Record<string, string | number> = {
        created_at_min: input.created_at_min as string,
        created_at_max: input.created_at_max as string,
        financial_status: (input.financial_status as string) ?? "paid",
        limit: 250,
        fields: "id,total_price,currency,source_name,note_attributes",
      };
      const data = await shopifyProxyGet(storeUrl, accessToken, "/orders.json", params) as { orders: ShopifyOrder[] };
      const orders = data.orders ?? [];

      const byCampaign: Record<string, {
        campaign: string;
        source: string | null;
        order_count: number;
        revenue: number;
        currency: string;
      }> = {};

      for (const order of orders) {
        const campaign = extractUtm(order.note_attributes, utmCampaignAttr) ?? order.source_name ?? "(direto)";
        const source = extractUtm(order.note_attributes, utmSourceAttr);
        const revenue = parseFloat(order.total_price ?? "0");

        if (!byCampaign[campaign]) {
          byCampaign[campaign] = { campaign, source, order_count: 0, revenue: 0, currency: order.currency };
        }
        byCampaign[campaign].order_count++;
        byCampaign[campaign].revenue += revenue;
      }

      const results = Object.values(byCampaign)
        .sort((a, b) => b.revenue - a.revenue)
        .map((r) => ({ ...r, revenue: r.revenue.toFixed(2) }));

      return JSON.stringify({
        period: { from: input.created_at_min, to: input.created_at_max },
        total_orders: orders.length,
        by_campaign: results,
        tip: "Compare a coluna 'revenue' de cada campanha com o gasto Google Ads para calcular o ROAS real.",
      }, null, 2);
    }

    case "get_shopify_real_roas": {
      const params: Record<string, string | number> = {
        created_at_min: input.created_at_min as string,
        created_at_max: input.created_at_max as string,
        financial_status: "paid",
        limit: 250,
        fields: "id,total_price,currency",
      };
      const data = await shopifyProxyGet(storeUrl, accessToken, "/orders.json", params) as { orders: ShopifyOrder[] };
      const orders = data.orders ?? [];
      const revenue = orders.reduce((s, o) => s + parseFloat(o.total_price ?? "0"), 0);
      const metaSpend = input.meta_spend as number;
      const metaReportedRoas = input.meta_reported_roas as number | undefined;
      const realRoas = metaSpend > 0 ? revenue / metaSpend : null;

      return JSON.stringify({
        period: { from: input.created_at_min, to: input.created_at_max },
        shopify_revenue: revenue.toFixed(2),
        meta_spend: metaSpend.toFixed(2),
        real_roas: realRoas ? realRoas.toFixed(2) + "x" : "N/A",
        ...(metaReportedRoas ? {
          meta_reported_roas: metaReportedRoas.toFixed(2) + "x",
          roas_gap: realRoas
            ? ((realRoas - metaReportedRoas) >= 0 ? "+" : "") + (realRoas - metaReportedRoas).toFixed(2) + "x"
            : "N/A",
          interpretation: realRoas && realRoas < metaReportedRoas
            ? "ROAS real MENOR que o reportado — possível over-attribution do conversion Google Ads."
            : "ROAS real MAIOR ou igual ao reportado — atribuição coerente.",
        } : {}),
        order_count: orders.length,
        currency: orders[0]?.currency ?? "BRL",
      }, null, 2);
    }

    default:
      throw new Error(`Tool Shopify desconhecida: ${toolName}`);
  }
}
