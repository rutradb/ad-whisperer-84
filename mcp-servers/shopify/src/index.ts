#!/usr/bin/env node
/**
 * Shopify MCP Server
 *
 * Exposes Shopify order and revenue data to Claude for Meta Ads correlation.
 * Uses Shopify REST Admin API (2024-04).
 *
 * Setup (claude_desktop_config.json / .claude/settings.json):
 * {
 *   "mcpServers": {
 *     "shopify": {
 *       "command": "node",
 *       "args": ["/path/to/mcp-servers/shopify/dist/index.js"],
 *       "env": {
 *         "SHOPIFY_STORE": "mystore.myshopify.com",
 *         "SHOPIFY_ACCESS_TOKEN": "shpat_xxxx"
 *       }
 *     }
 *   }
 * }
 *
 * Required scopes: read_orders, read_customers, read_products
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = "2024-04";

if (!SHOPIFY_STORE || !SHOPIFY_ACCESS_TOKEN) {
  process.stderr.write("SHOPIFY_STORE and SHOPIFY_ACCESS_TOKEN environment variables are required\n");
  process.exit(1);
}

const BASE_URL = `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}`;

// ─── HTTP helper ─────────────────────────────────────────────────────────────

async function shopifyGet(path: string, params: Record<string, string | number> = {}): Promise<unknown> {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString(), {
    headers: {
      "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN!,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`Shopify API error ${res.status}: ${await res.text()}`);
  return res.json();
}

// ─── UTM extraction helpers ───────────────────────────────────────────────────

interface OrderNote { name: string; value: string }

function extractUtmFromNoteAttributes(note_attributes: OrderNote[]): Record<string, string> {
  const utm: Record<string, string> = {};
  for (const attr of note_attributes ?? []) {
    if (attr.name.startsWith("utm_")) utm[attr.name] = attr.value;
  }
  return utm;
}

// ─── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS: Tool[] = [
  {
    name: "list_orders",
    description: "List Shopify orders with filtering. Returns order data including source_name, landing_site, referrer_url, and note_attributes (UTM params if store tracks them).",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["open", "closed", "cancelled", "any"],
          description: "Order status (default: any)",
        },
        financial_status: {
          type: "string",
          enum: ["authorized", "pending", "paid", "partially_paid", "refunded", "voided", "partially_refunded", "any"],
          description: "Payment status filter",
        },
        created_at_min: { type: "string", description: "ISO8601 — orders created after this date" },
        created_at_max: { type: "string", description: "ISO8601 — orders created before this date" },
        limit: { type: "number", description: "Max orders to return (max: 250, default: 50)" },
        fields: { type: "string", description: "Comma-separated fields to return (default: all)" },
      },
    },
  },
  {
    name: "get_order",
    description: "Get a single order with full details including UTM note_attributes, source_name, landing_site, browser_ip",
    inputSchema: {
      type: "object",
      properties: {
        order_id: { type: "number", description: "The Shopify order ID" },
      },
      required: ["order_id"],
    },
  },
  {
    name: "get_orders_count",
    description: "Count orders matching a filter — fast way to check volume",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["open", "closed", "cancelled", "any"] },
        financial_status: { type: "string" },
        created_at_min: { type: "string" },
        created_at_max: { type: "string" },
      },
    },
  },
  {
    name: "list_customers",
    description: "List Shopify customers",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max results (default: 50)" },
        created_at_min: { type: "string" },
        created_at_max: { type: "string" },
      },
    },
  },
  {
    name: "list_products",
    description: "List products in the Shopify store",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max results (default: 50)" },
        status: { type: "string", enum: ["active", "archived", "draft"] },
      },
    },
  },
  {
    name: "get_revenue_summary",
    description: "Aggregate total revenue, order count, AOV (average order value), and top products for a date range. Use to compare against Meta Ads spend.",
    inputSchema: {
      type: "object",
      properties: {
        created_at_min: { type: "string", description: "Start date ISO8601" },
        created_at_max: { type: "string", description: "End date ISO8601" },
        financial_status: {
          type: "string",
          enum: ["paid", "any"],
          description: "Only count paid orders for ROAS calculation (default: paid)",
        },
      },
      required: ["created_at_min", "created_at_max"],
    },
  },
  {
    name: "correlate_with_meta_campaigns",
    description: "Aggregate orders by UTM campaign (from note_attributes) to show which campaigns drove revenue. Compare against Meta Ads reported ROAS.",
    inputSchema: {
      type: "object",
      properties: {
        created_at_min: { type: "string", description: "Start date ISO8601" },
        created_at_max: { type: "string", description: "End date ISO8601" },
        utm_campaign_attribute: {
          type: "string",
          description: "Name of the order note_attribute that holds utm_campaign value (default: utm_campaign)",
        },
        utm_source_attribute: {
          type: "string",
          description: "Name of the note_attribute for utm_source (default: utm_source)",
        },
        financial_status: {
          type: "string",
          enum: ["paid", "any"],
          description: "Only count paid orders (default: paid)",
        },
      },
      required: ["created_at_min", "created_at_max"],
    },
  },
  {
    name: "get_real_roas",
    description: "Calculate real ROAS: Shopify revenue ÷ Meta Ads spend. Requires you to provide the Meta spend figure from the Meta Ads account.",
    inputSchema: {
      type: "object",
      properties: {
        created_at_min: { type: "string", description: "Start date ISO8601" },
        created_at_max: { type: "string", description: "End date ISO8601" },
        meta_spend: { type: "number", description: "Total Meta Ads spend in same currency for period (from Meta Ads account)" },
        currency: { type: "string", description: "Currency code (default: BRL)" },
      },
      required: ["created_at_min", "created_at_max", "meta_spend"],
    },
  },
  {
    name: "get_orders_by_source",
    description: "Group orders by source_name (web, pos, draft_orders, etc.) to understand channel distribution",
    inputSchema: {
      type: "object",
      properties: {
        created_at_min: { type: "string" },
        created_at_max: { type: "string" },
        financial_status: { type: "string", enum: ["paid", "any"] },
      },
    },
  },
];

// ─── Tool execution ───────────────────────────────────────────────────────────

type ShopifyOrder = {
  id: number;
  name: string;
  created_at: string;
  financial_status: string;
  total_price: string;
  currency: string;
  source_name: string;
  landing_site: string | null;
  referrer_url: string | null;
  note_attributes: OrderNote[];
  customer?: { id: number; email: string };
  line_items: Array<{ title: string; quantity: number; price: string }>;
};

async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case "list_orders": {
      const params: Record<string, string | number> = {
        status: (args.status as string) ?? "any",
        limit: (args.limit as number) ?? 50,
      };
      if (args.financial_status) params.financial_status = args.financial_status as string;
      if (args.created_at_min) params.created_at_min = args.created_at_min as string;
      if (args.created_at_max) params.created_at_max = args.created_at_max as string;
      if (args.fields) params.fields = args.fields as string;
      const data = await shopifyGet("/orders.json", params);
      return JSON.stringify(data, null, 2);
    }

    case "get_order": {
      const data = await shopifyGet(`/orders/${args.order_id}.json`);
      return JSON.stringify(data, null, 2);
    }

    case "get_orders_count": {
      const params: Record<string, string | number> = {};
      if (args.status) params.status = args.status as string;
      if (args.financial_status) params.financial_status = args.financial_status as string;
      if (args.created_at_min) params.created_at_min = args.created_at_min as string;
      if (args.created_at_max) params.created_at_max = args.created_at_max as string;
      const data = await shopifyGet("/orders/count.json", params);
      return JSON.stringify(data, null, 2);
    }

    case "list_customers": {
      const params: Record<string, string | number> = { limit: (args.limit as number) ?? 50 };
      if (args.created_at_min) params.created_at_min = args.created_at_min as string;
      if (args.created_at_max) params.created_at_max = args.created_at_max as string;
      const data = await shopifyGet("/customers.json", params);
      return JSON.stringify(data, null, 2);
    }

    case "list_products": {
      const params: Record<string, string | number> = { limit: (args.limit as number) ?? 50 };
      if (args.status) params.status = args.status as string;
      const data = await shopifyGet("/products.json", params);
      return JSON.stringify(data, null, 2);
    }

    case "get_revenue_summary": {
      const params: Record<string, string | number> = {
        created_at_min: args.created_at_min as string,
        created_at_max: args.created_at_max as string,
        financial_status: (args.financial_status as string) ?? "paid",
        limit: 250,
        fields: "id,total_price,currency,financial_status,created_at,line_items",
      };
      const data = await shopifyGet("/orders.json", params) as { orders: ShopifyOrder[] };
      const orders = data.orders ?? [];

      let total = 0;
      const productCounts: Record<string, { title: string; quantity: number; revenue: number }> = {};

      for (const order of orders) {
        const price = parseFloat(order.total_price ?? "0");
        total += price;
        for (const item of order.line_items ?? []) {
          if (!productCounts[item.title]) productCounts[item.title] = { title: item.title, quantity: 0, revenue: 0 };
          productCounts[item.title].quantity += item.quantity;
          productCounts[item.title].revenue += parseFloat(item.price) * item.quantity;
        }
      }

      const topProducts = Object.values(productCounts)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      return JSON.stringify({
        period: { from: args.created_at_min, to: args.created_at_max },
        order_count: orders.length,
        total_revenue: total.toFixed(2),
        aov: orders.length > 0 ? (total / orders.length).toFixed(2) : "0",
        currency: orders[0]?.currency ?? "BRL",
        top_products: topProducts,
      }, null, 2);
    }

    case "correlate_with_meta_campaigns": {
      const utmCampaignAttr = (args.utm_campaign_attribute as string) ?? "utm_campaign";
      const utmSourceAttr = (args.utm_source_attribute as string) ?? "utm_source";

      const params: Record<string, string | number> = {
        created_at_min: args.created_at_min as string,
        created_at_max: args.created_at_max as string,
        financial_status: (args.financial_status as string) ?? "paid",
        limit: 250,
        fields: "id,total_price,currency,source_name,note_attributes,created_at",
      };
      const data = await shopifyGet("/orders.json", params) as { orders: ShopifyOrder[] };
      const orders = data.orders ?? [];

      const byCampaign: Record<string, {
        campaign: string;
        source: string | null;
        order_count: number;
        revenue: number;
        currency: string;
      }> = {};

      for (const order of orders) {
        const utm = extractUtmFromNoteAttributes(order.note_attributes);
        const campaign = utm[utmCampaignAttr] ?? order.source_name ?? "(direto/sem UTM)";
        const source = utm[utmSourceAttr] ?? null;
        const revenue = parseFloat(order.total_price ?? "0");

        if (!byCampaign[campaign]) {
          byCampaign[campaign] = { campaign, source, order_count: 0, revenue: 0, currency: order.currency };
        }
        byCampaign[campaign].order_count++;
        byCampaign[campaign].revenue += revenue;
      }

      const results = Object.values(byCampaign)
        .sort((a, b) => b.revenue - a.revenue)
        .map(r => ({ ...r, revenue: r.revenue.toFixed(2) }));

      return JSON.stringify({
        period: { from: args.created_at_min, to: args.created_at_max },
        total_orders: orders.length,
        by_campaign: results,
      }, null, 2);
    }

    case "get_real_roas": {
      const params: Record<string, string | number> = {
        created_at_min: args.created_at_min as string,
        created_at_max: args.created_at_max as string,
        financial_status: "paid",
        limit: 250,
        fields: "id,total_price,currency",
      };
      const data = await shopifyGet("/orders.json", params) as { orders: ShopifyOrder[] };
      const orders = data.orders ?? [];
      const revenue = orders.reduce((sum, o) => sum + parseFloat(o.total_price ?? "0"), 0);
      const metaSpend = args.meta_spend as number;
      const realRoas = metaSpend > 0 ? revenue / metaSpend : null;

      return JSON.stringify({
        period: { from: args.created_at_min, to: args.created_at_max },
        shopify_revenue: revenue.toFixed(2),
        meta_spend: metaSpend.toFixed(2),
        real_roas: realRoas ? realRoas.toFixed(2) + "x" : "N/A",
        currency: (args.currency as string) ?? orders[0]?.currency ?? "BRL",
        order_count: orders.length,
        note: "ROAS real = receita Shopify ÷ gasto Meta Ads. Pode diferir do ROAS do Meta por janela de atribuição.",
      }, null, 2);
    }

    case "get_orders_by_source": {
      const params: Record<string, string | number> = {
        financial_status: (args.financial_status as string) ?? "paid",
        limit: 250,
        fields: "id,total_price,source_name,currency",
      };
      if (args.created_at_min) params.created_at_min = args.created_at_min as string;
      if (args.created_at_max) params.created_at_max = args.created_at_max as string;
      const data = await shopifyGet("/orders.json", params) as { orders: ShopifyOrder[] };
      const orders = data.orders ?? [];

      const bySource: Record<string, { source: string; order_count: number; revenue: number }> = {};
      for (const order of orders) {
        const src = order.source_name ?? "unknown";
        if (!bySource[src]) bySource[src] = { source: src, order_count: 0, revenue: 0 };
        bySource[src].order_count++;
        bySource[src].revenue += parseFloat(order.total_price ?? "0");
      }

      return JSON.stringify({
        total_orders: orders.length,
        by_source: Object.values(bySource)
          .sort((a, b) => b.revenue - a.revenue)
          .map(s => ({ ...s, revenue: s.revenue.toFixed(2) })),
      }, null, 2);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ─── Server setup ─────────────────────────────────────────────────────────────

const server = new Server(
  { name: "shopify-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  try {
    const result = await executeTool(name, args as Record<string, unknown>);
    return { content: [{ type: "text", text: result }] };
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
      isError: true,
    };
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
process.stderr.write("Shopify MCP server running via stdio\n");
