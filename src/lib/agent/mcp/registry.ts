// =============================================================================
// MCP Registry — catálogo único de endpoints rastreáveis do agente
// =============================================================================
//
// Fonte de verdade que mapeia cada TOOL do agente para o endpoint subjacente,
// seu tipo (read/write) e tier de risco. Toda ação ativa precisa existir aqui —
// é isso que garante a "aderência": nenhuma mutação acontece fora de um
// endpoint registrado e rastreado.
//
// Os placeholders {cid} são resolvidos para o customer id no momento da chamada.
// =============================================================================

export type McpOperationType = "read" | "write";
export type McpRiskTier = "low" | "medium" | "high";
export type McpCategory = "google_ads" | "crm";

export interface McpEndpointSpec {
  toolName: string;
  /** Endpoint lógico (Google Ads) com placeholder {cid}, ou `external:<provider>`. */
  endpoint: string;
  httpMethod: "GET" | "POST";
  operationType: McpOperationType;
  riskTier: McpRiskTier;
  category: McpCategory;
  /** Entidade alvo (apenas writes). */
  entityType?: "campaign" | "ad_group" | "ad" | "keyword" | "campaign_budget";
  /** Rótulo legível (pt-BR). */
  label: string;
}

const SEARCH = "/customers/{cid}/googleAds:search";

// --- Leituras Google Ads (GAQL search) ----------------------------------------
const READ_TOOLS: McpEndpointSpec[] = [
  { toolName: "get_account_overview", endpoint: SEARCH, httpMethod: "POST", operationType: "read", riskTier: "low", category: "google_ads", label: "Visão geral da conta" },
  { toolName: "list_campaigns", endpoint: SEARCH, httpMethod: "POST", operationType: "read", riskTier: "low", category: "google_ads", label: "Listar campanhas" },
  { toolName: "list_ads", endpoint: SEARCH, httpMethod: "POST", operationType: "read", riskTier: "low", category: "google_ads", label: "Listar anúncios" },
  { toolName: "list_keywords", endpoint: SEARCH, httpMethod: "POST", operationType: "read", riskTier: "low", category: "google_ads", label: "Listar palavras-chave" },
  { toolName: "list_search_terms", endpoint: SEARCH, httpMethod: "POST", operationType: "read", riskTier: "low", category: "google_ads", label: "Termos de pesquisa" },
  { toolName: "list_ad_groups", endpoint: SEARCH, httpMethod: "POST", operationType: "read", riskTier: "low", category: "google_ads", label: "Listar grupos de anúncios" },
  { toolName: "get_performance_by_device", endpoint: SEARCH, httpMethod: "POST", operationType: "read", riskTier: "low", category: "google_ads", label: "Performance por dispositivo" },
  { toolName: "get_performance_by_hour", endpoint: SEARCH, httpMethod: "POST", operationType: "read", riskTier: "low", category: "google_ads", label: "Performance por hora" },
  { toolName: "get_performance_by_day", endpoint: SEARCH, httpMethod: "POST", operationType: "read", riskTier: "low", category: "google_ads", label: "Performance por dia da semana" },
  { toolName: "get_geographic_performance", endpoint: SEARCH, httpMethod: "POST", operationType: "read", riskTier: "low", category: "google_ads", label: "Performance geográfica" },
  { toolName: "list_recommendations", endpoint: SEARCH, httpMethod: "POST", operationType: "read", riskTier: "low", category: "google_ads", label: "Recomendações do Google" },
  { toolName: "list_conversions", endpoint: SEARCH, httpMethod: "POST", operationType: "read", riskTier: "low", category: "google_ads", label: "Ações de conversão" },
  { toolName: "get_change_history", endpoint: SEARCH, httpMethod: "POST", operationType: "read", riskTier: "low", category: "google_ads", label: "Histórico de alterações" },
];

// --- Escritas Google Ads (mutate) ---------------------------------------------
const WRITE_TOOLS: McpEndpointSpec[] = [
  { toolName: "pause_campaigns", endpoint: "/customers/{cid}/campaigns:mutate", httpMethod: "POST", operationType: "write", riskTier: "medium", category: "google_ads", entityType: "campaign", label: "Pausar campanhas" },
  { toolName: "activate_campaigns", endpoint: "/customers/{cid}/campaigns:mutate", httpMethod: "POST", operationType: "write", riskTier: "medium", category: "google_ads", entityType: "campaign", label: "Ativar campanhas" },
  { toolName: "update_campaign_budget", endpoint: "/customers/{cid}/campaignBudgets:mutate", httpMethod: "POST", operationType: "write", riskTier: "medium", category: "google_ads", entityType: "campaign_budget", label: "Atualizar budget" },
  { toolName: "pause_ads", endpoint: "/customers/{cid}/adGroupAds:mutate", httpMethod: "POST", operationType: "write", riskTier: "low", category: "google_ads", entityType: "ad", label: "Pausar anúncios" },
];

// --- Ferramentas de CRM / e-commerce (sistemas externos) ----------------------
const CRM_TOOLS: McpEndpointSpec[] = [
  "get_pipedrive_deal_fields", "list_pipedrive_pipelines", "list_pipedrive_deals",
  "correlate_pipedrive_with_meta", "correlate_pipedrive_with_google_ads",
  "get_shopify_revenue_summary", "correlate_shopify_with_meta",
  "correlate_shopify_with_google_ads", "get_shopify_real_roas",
  "get_hubspot_overview", "correlate_hubspot_with_meta",
  "correlate_hubspot_with_google_ads", "get_hubspot_contacts_count",
].map((toolName): McpEndpointSpec => {
  const provider = toolName.includes("pipedrive")
    ? "pipedrive"
    : toolName.includes("shopify")
    ? "shopify"
    : "hubspot";
  return {
    toolName,
    endpoint: `external:${provider}`,
    httpMethod: "GET",
    operationType: "read",
    riskTier: "low",
    category: "crm",
    label: toolName,
  };
});

// --- Ação ativa interna: criação de proposta (não toca o Google Ads) ----------
const PROPOSAL_TOOLS: McpEndpointSpec[] = [
  {
    toolName: "propose_actions",
    endpoint: "internal:proposals",
    httpMethod: "POST",
    operationType: "read", // não muta o Google Ads; apenas grava uma proposta
    riskTier: "low",
    category: "google_ads",
    label: "Criar proposta de ações",
  },
];

export const MCP_ENDPOINT_REGISTRY: McpEndpointSpec[] = [
  ...READ_TOOLS,
  ...WRITE_TOOLS,
  ...PROPOSAL_TOOLS,
  ...CRM_TOOLS,
];

const REGISTRY_BY_TOOL: Record<string, McpEndpointSpec> = Object.fromEntries(
  MCP_ENDPOINT_REGISTRY.map((spec) => [spec.toolName, spec]),
);

/** Retorna o spec de uma tool, ou undefined se não registrada (gap de aderência). */
export function getEndpointSpec(toolName: string): McpEndpointSpec | undefined {
  return REGISTRY_BY_TOOL[toolName];
}

/** Resolve o endpoint lógico para um customer id concreto. */
export function resolveEndpoint(spec: McpEndpointSpec, customerId: string): string {
  return spec.endpoint.replace("{cid}", customerId);
}
