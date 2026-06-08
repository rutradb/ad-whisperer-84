import { PIPEDRIVE_TOOLS } from "./pipedrive-tools";
import { SHOPIFY_TOOLS } from "./shopify-tools";
import { HUBSPOT_TOOLS } from "./hubspot-tools";

export const META_TOOLS = [
  {
    name: "get_account_overview",
    description:
      "Obtém visão geral da conta: KPIs agregados (gasto, impressões, cliques, CTR, ROAS, conversões, CPA), saúde da conta e classificação de campanhas (winners/bleeders). Use para responder perguntas sobre performance geral da conta ou gerar briefings.",
    input_schema: {
      type: "object",
      properties: {
        date_preset: {
          type: "string",
          enum: ["today", "last_7d", "last_14d", "last_30d", "this_month", "last_month"],
          description: "Período de análise. Padrão: last_7d",
        },
      },
      required: [],
    },
  },
  {
    name: "list_campaigns",
    description:
      "Lista campanhas da conta com métricas de performance. Retorna nome, ID, gasto, ROAS, conversões, CPA e classificação (winner/bleeder/neutral). Use para identificar quais campanhas precisam de ação.",
    input_schema: {
      type: "object",
      properties: {
        date_preset: {
          type: "string",
          enum: ["today", "last_7d", "last_14d", "last_30d", "this_month", "last_month"],
          description: "Período de análise. Padrão: last_7d",
        },
        limit: {
          type: "number",
          description: "Máximo de campanhas a retornar. Padrão: 25",
        },
      },
      required: [],
    },
  },
  {
    name: "list_ads",
    description:
      "Lista anúncios de uma campanha específica com métricas detalhadas (CTR, CPC, frequência, ROAS, CPA, gasto). Use para analisar performance no nível de anúncio ou identificar ads para pausar/escalar.",
    input_schema: {
      type: "object",
      properties: {
        campaign_id: {
          type: "string",
          description: "ID da campanha",
        },
        date_preset: {
          type: "string",
          enum: ["last_7d", "last_14d", "last_30d"],
          description: "Período de análise. Padrão: last_7d",
        },
      },
      required: ["campaign_id"],
    },
  },
  {
    name: "pause_campaigns",
    description:
      "Pausa uma ou mais campanhas pelo ID. Use quando o usuário pedir para pausar campanhas bleeders ou campanhas específicas. Sempre confirme quais IDs serão pausados.",
    input_schema: {
      type: "object",
      properties: {
        campaign_ids: {
          type: "array",
          items: { type: "string" },
          description: "Lista de IDs das campanhas a pausar",
        },
      },
      required: ["campaign_ids"],
    },
  },
  {
    name: "activate_campaigns",
    description: "Ativa uma ou mais campanhas pausadas pelo ID.",
    input_schema: {
      type: "object",
      properties: {
        campaign_ids: {
          type: "array",
          items: { type: "string" },
          description: "Lista de IDs das campanhas a ativar",
        },
      },
      required: ["campaign_ids"],
    },
  },
  {
    name: "update_campaign_budget",
    description:
      "Atualiza o budget diário de uma campanha. O valor deve ser em Reais (R$) — o sistema converte automaticamente para centavos. Use para escalar winners ou reduzir gasto em campanhas com performance abaixo da meta.",
    input_schema: {
      type: "object",
      properties: {
        campaign_id: {
          type: "string",
          description: "ID da campanha",
        },
        daily_budget: {
          type: "number",
          description: "Novo budget diário em Reais (R$)",
        },
      },
      required: ["campaign_id", "daily_budget"],
    },
  },
  {
    name: "pause_ads",
    description:
      "Pausa um ou mais anúncios pelo ID. Use para ads com frequência alta, ROAS negativo ou CPA acima da meta.",
    input_schema: {
      type: "object",
      properties: {
        ad_ids: {
          type: "array",
          items: { type: "string" },
          description: "Lista de IDs dos anúncios a pausar",
        },
      },
      required: ["ad_ids"],
    },
  },
];

export const AGENT_TOOLS = [...META_TOOLS, ...PIPEDRIVE_TOOLS, ...SHOPIFY_TOOLS, ...HUBSPOT_TOOLS];

export const TOOL_LABELS: Record<string, string> = {
  // Google Ads
  get_account_overview: "Buscando dados da conta",
  list_campaigns: "Listando campanhas",
  list_ads: "Buscando anúncios",
  pause_campaigns: "Pausando campanhas",
  activate_campaigns: "Ativando campanhas",
  update_campaign_budget: "Atualizando budget",
  pause_ads: "Pausando anúncios",
  // Pipedrive
  get_pipedrive_deal_fields: "Buscando campos do Pipedrive",
  list_pipedrive_pipelines: "Listando pipelines",
  list_pipedrive_deals: "Buscando deals do CRM",
  correlate_pipedrive_with_google_ads: "Correlacionando Pipedrive com Google Ads",
  // Shopify
  get_shopify_revenue_summary: "Buscando receita do Shopify",
  correlate_shopify_with_google_ads: "Correlacionando Shopify com Google Ads",
  get_shopify_real_roas: "Calculando ROAS real",
  // HubSpot
  get_hubspot_overview: "Buscando pipeline do HubSpot",
  correlate_hubspot_with_google_ads: "Correlacionando HubSpot com Google Ads",
  get_hubspot_contacts_count: "Contando contatos HubSpot",
};
