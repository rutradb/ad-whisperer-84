#!/usr/bin/env node
/**
 * Pipedrive MCP Server
 *
 * Exposes Pipedrive CRM data to Claude for Meta Ads correlation.
 *
 * Setup (claude_desktop_config.json / .claude/settings.json):
 * {
 *   "mcpServers": {
 *     "pipedrive": {
 *       "command": "node",
 *       "args": ["/path/to/mcp-servers/pipedrive/dist/index.js"],
 *       "env": { "PIPEDRIVE_API_TOKEN": "your_token_here" }
 *     }
 *   }
 * }
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";

const API_TOKEN = process.env.PIPEDRIVE_API_TOKEN;
const BASE_URL = "https://api.pipedrive.com/v1";

if (!API_TOKEN) {
  process.stderr.write("PIPEDRIVE_API_TOKEN environment variable is required\n");
  process.exit(1);
}

// ─── HTTP helper ─────────────────────────────────────────────────────────────

async function pipedriveGet(path: string, params: Record<string, string | number> = {}): Promise<unknown> {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("api_token", API_TOKEN!);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Pipedrive API error ${res.status}: ${await res.text()}`);
  const json = await res.json() as { success: boolean; data: unknown; additional_data?: unknown };
  if (!json.success) throw new Error(`Pipedrive error: ${JSON.stringify(json)}`);
  return json.data;
}

// ─── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS: Tool[] = [
  {
    name: "list_pipelines",
    description: "List all sales pipelines configured in Pipedrive",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_stages",
    description: "List all stages for a given pipeline",
    inputSchema: {
      type: "object",
      properties: {
        pipeline_id: { type: "number", description: "Pipeline ID (use list_pipelines to get IDs)" },
      },
      required: ["pipeline_id"],
    },
  },
  {
    name: "list_deals",
    description: "List Pipedrive deals with optional filters. Use this to find deals attributed to campaigns.",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["open", "won", "lost", "all_not_deleted"],
          description: "Deal status filter (default: all_not_deleted)",
        },
        pipeline_id: { type: "number", description: "Filter by pipeline ID" },
        stage_id: { type: "number", description: "Filter by stage ID" },
        start: { type: "number", description: "Pagination offset (default: 0)" },
        limit: { type: "number", description: "Max deals to return (max: 500, default: 100)" },
        updated_since: { type: "string", description: "RFC3339 date — only return deals updated after this date" },
        updated_until: { type: "string", description: "RFC3339 date — only return deals updated before this date" },
      },
    },
  },
  {
    name: "get_deal",
    description: "Get full details of a single deal including all custom fields",
    inputSchema: {
      type: "object",
      properties: {
        deal_id: { type: "number", description: "The deal ID" },
      },
      required: ["deal_id"],
    },
  },
  {
    name: "get_deal_fields",
    description: "List all deal field definitions including custom fields. Use to discover which field stores UTM source, campaign name, etc.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "search_deals",
    description: "Search deals by term — useful for finding deals linked to a specific campaign name or UTM value",
    inputSchema: {
      type: "object",
      properties: {
        term: { type: "string", description: "Search term (campaign name, UTM value, etc.)" },
        fields: {
          type: "string",
          description: "Comma-separated fields to search in: title, notes, custom_fields (default: title)",
        },
        status: { type: "string", enum: ["open", "won", "lost", "all_not_deleted"] },
        limit: { type: "number", description: "Max results (default: 50)" },
      },
      required: ["term"],
    },
  },
  {
    name: "get_persons",
    description: "List persons (contacts) in Pipedrive",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max results (default: 100)" },
        start: { type: "number", description: "Pagination offset" },
      },
    },
  },
  {
    name: "list_leads",
    description: "List leads in Pipedrive — leads are pre-deal opportunities",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max results (default: 100)" },
        start: { type: "number", description: "Pagination offset" },
        archived_status: {
          type: "string",
          enum: ["archived", "not_archived", "all"],
          description: "Filter by archived status (default: not_archived)",
        },
      },
    },
  },
  {
    name: "get_deals_summary",
    description: "Get aggregated summary of deals: count and total value by status and pipeline. Use for revenue correlation with Meta Ads spend.",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["open", "won", "lost", "all_not_deleted"] },
        pipeline_id: { type: "number", description: "Filter by pipeline" },
      },
    },
  },
  {
    name: "correlate_with_meta_campaigns",
    description: "Analyze deals to find UTM attribution and build a correlation table: campaign_name → deal_count, won_count, total_value. Requires UTM custom field keys from get_deal_fields.",
    inputSchema: {
      type: "object",
      properties: {
        utm_campaign_field_key: {
          type: "string",
          description: "The custom field key (hash) in Pipedrive that stores UTM campaign. Get from get_deal_fields.",
        },
        utm_source_field_key: {
          type: "string",
          description: "The custom field key (hash) in Pipedrive that stores UTM source (optional)",
        },
        start_date: { type: "string", description: "RFC3339 — filter deals updated/created after this date" },
        end_date: { type: "string", description: "RFC3339 — filter deals updated/created before this date" },
        pipeline_id: { type: "number", description: "Filter to specific pipeline" },
      },
      required: ["utm_campaign_field_key"],
    },
  },
];

// ─── Tool execution ───────────────────────────────────────────────────────────

async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case "list_pipelines": {
      const data = await pipedriveGet("/pipelines");
      return JSON.stringify(data, null, 2);
    }

    case "list_stages": {
      const data = await pipedriveGet("/stages", { pipeline_id: args.pipeline_id as number });
      return JSON.stringify(data, null, 2);
    }

    case "list_deals": {
      const params: Record<string, string | number> = {
        limit: (args.limit as number) ?? 100,
        start: (args.start as number) ?? 0,
        status: (args.status as string) ?? "all_not_deleted",
      };
      if (args.pipeline_id) params.pipeline_id = args.pipeline_id as number;
      if (args.stage_id) params.stage_id = args.stage_id as number;
      if (args.updated_since) params.updated_since = args.updated_since as string;
      if (args.updated_until) params.updated_until = args.updated_until as string;
      const data = await pipedriveGet("/deals", params);
      return JSON.stringify(data, null, 2);
    }

    case "get_deal": {
      const data = await pipedriveGet(`/deals/${args.deal_id}`);
      return JSON.stringify(data, null, 2);
    }

    case "get_deal_fields": {
      const data = await pipedriveGet("/dealFields");
      return JSON.stringify(data, null, 2);
    }

    case "search_deals": {
      const params: Record<string, string | number> = {
        term: args.term as string,
        item_types: "deal",
        limit: (args.limit as number) ?? 50,
      };
      if (args.fields) params.fields = args.fields as string;
      const data = await pipedriveGet("/itemSearch", params);
      return JSON.stringify(data, null, 2);
    }

    case "get_persons": {
      const data = await pipedriveGet("/persons", {
        limit: (args.limit as number) ?? 100,
        start: (args.start as number) ?? 0,
      });
      return JSON.stringify(data, null, 2);
    }

    case "list_leads": {
      const params: Record<string, string | number> = {
        limit: (args.limit as number) ?? 100,
        start: (args.start as number) ?? 0,
      };
      if (args.archived_status) params.archived_status = args.archived_status as string;
      const data = await pipedriveGet("/leads", params);
      return JSON.stringify(data, null, 2);
    }

    case "get_deals_summary": {
      const params: Record<string, string | number> = {};
      if (args.status) params.status = args.status as string;
      if (args.pipeline_id) params.pipeline_id = args.pipeline_id as number;
      const data = await pipedriveGet("/deals/summary", params);
      return JSON.stringify(data, null, 2);
    }

    case "correlate_with_meta_campaigns": {
      // Fetch all deals and aggregate by UTM campaign field
      const params: Record<string, string | number> = {
        limit: 500,
        start: 0,
        status: "all_not_deleted",
      };
      if (args.pipeline_id) params.pipeline_id = args.pipeline_id as number;
      if (args.start_date) params.updated_since = args.start_date as string;
      if (args.updated_until) params.updated_until = args.end_date as string;

      const deals = await pipedriveGet("/deals", params) as Array<Record<string, unknown>>;
      if (!Array.isArray(deals)) return JSON.stringify({ error: "No deals found" });

      const utmCampaignKey = args.utm_campaign_field_key as string;
      const utmSourceKey = args.utm_source_field_key as string | undefined;

      // Aggregate by campaign
      const byCampaign: Record<string, {
        campaign: string;
        source: string | null;
        deal_count: number;
        won_count: number;
        lost_count: number;
        open_count: number;
        total_value: number;
        won_value: number;
        currency: string;
      }> = {};

      for (const deal of deals) {
        const campaign = (deal[utmCampaignKey] as string) ?? "(sem UTM)";
        const source = utmSourceKey ? (deal[utmSourceKey] as string) ?? null : null;
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
            currency,
          };
        }
        byCampaign[campaign].deal_count++;
        byCampaign[campaign].total_value += value;
        if (status === "won") { byCampaign[campaign].won_count++; byCampaign[campaign].won_value += value; }
        if (status === "lost") byCampaign[campaign].lost_count++;
        if (status === "open") byCampaign[campaign].open_count++;
      }

      const results = Object.values(byCampaign).sort((a, b) => b.won_value - a.won_value);
      return JSON.stringify({ total_deals: deals.length, by_campaign: results }, null, 2);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ─── Server setup ─────────────────────────────────────────────────────────────

const server = new Server(
  { name: "pipedrive-mcp", version: "1.0.0" },
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
process.stderr.write("Pipedrive MCP server running via stdio\n");
