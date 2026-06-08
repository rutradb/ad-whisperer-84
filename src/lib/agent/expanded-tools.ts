/**
 * Ferramentas expandidas para agentes especializados.
 * Cobrem todo o espectro de dados disponíveis via Google Ads API v23.
 */

export const EXPANDED_TOOLS = [
  // --- Dados de conta e campanhas (já existiam) ---
  {
    name: "get_account_overview",
    description: "KPIs agregados da conta: gasto, impressões, cliques, CTR, ROAS, conversões, CPA. Classifica campanhas como winners/bleeders.",
    input_schema: {
      type: "object",
      properties: {
        date_preset: {
          type: "string",
          enum: ["today", "last_7d", "last_14d", "last_30d", "this_month", "last_month"],
          description: "Período. Padrão: last_7d",
        },
      },
      required: [],
    },
  },
  {
    name: "list_campaigns",
    description: "Lista campanhas com métricas, classificação (winner/bleeder/neutral), status, tipo e bidding strategy.",
    input_schema: {
      type: "object",
      properties: {
        date_preset: { type: "string", enum: ["today", "last_7d", "last_14d", "last_30d", "this_month", "last_month"] },
        status: { type: "string", enum: ["ENABLED", "PAUSED", "REMOVED"], description: "Filtrar por status" },
        limit: { type: "number", description: "Máximo de campanhas. Padrão: 50" },
      },
      required: [],
    },
  },
  {
    name: "list_ads",
    description: "Lista anúncios com métricas detalhadas (CTR, CPC, ROAS, CPA, headlines, descriptions).",
    input_schema: {
      type: "object",
      properties: {
        campaign_id: { type: "string", description: "Filtrar por campanha (opcional)" },
        ad_group_id: { type: "string", description: "Filtrar por grupo de anúncios (opcional)" },
        date_preset: { type: "string", enum: ["last_7d", "last_14d", "last_30d"] },
      },
      required: [],
    },
  },

  // --- Palavras-chave e termos de pesquisa ---
  {
    name: "list_keywords",
    description: "Lista palavras-chave com Quality Score, CTR, CPC, impressions, match type, status. Essencial para análise de relevância e otimização de lances.",
    input_schema: {
      type: "object",
      properties: {
        campaign_id: { type: "string", description: "Filtrar por campanha" },
        ad_group_id: { type: "string", description: "Filtrar por grupo" },
        date_preset: { type: "string", enum: ["last_7d", "last_14d", "last_30d"] },
        limit: { type: "number", description: "Máximo. Padrão: 100" },
      },
      required: [],
    },
  },
  {
    name: "list_search_terms",
    description: "Lista termos de pesquisa reais que acionaram os anúncios — mostra o que as pessoas buscaram. Essencial para encontrar negativar termos irrelevantes e descobrir novas oportunidades.",
    input_schema: {
      type: "object",
      properties: {
        campaign_id: { type: "string", description: "Filtrar por campanha" },
        date_preset: { type: "string", enum: ["last_7d", "last_14d", "last_30d"] },
        limit: { type: "number", description: "Máximo. Padrão: 50" },
      },
      required: [],
    },
  },

  // --- Grupos de anúncios ---
  {
    name: "list_ad_groups",
    description: "Lista grupos de anúncios com métricas, CPC bid, status e tipo.",
    input_schema: {
      type: "object",
      properties: {
        campaign_id: { type: "string", description: "Filtrar por campanha" },
        date_preset: { type: "string", enum: ["last_7d", "last_14d", "last_30d"] },
      },
      required: [],
    },
  },

  // --- Performance segmentada ---
  {
    name: "get_performance_by_device",
    description: "Performance segmentada por dispositivo (MOBILE, DESKTOP, TABLET). Mostra onde o tráfego converte melhor.",
    input_schema: {
      type: "object",
      properties: {
        campaign_id: { type: "string", description: "Filtrar por campanha (opcional)" },
        date_preset: { type: "string", enum: ["last_7d", "last_14d", "last_30d"] },
      },
      required: [],
    },
  },
  {
    name: "get_performance_by_hour",
    description: "Performance segmentada por hora do dia (0-23). Identifica horários de pico e horários com desperdício.",
    input_schema: {
      type: "object",
      properties: {
        campaign_id: { type: "string", description: "Filtrar por campanha (opcional)" },
        date_preset: { type: "string", enum: ["last_7d", "last_14d", "last_30d"] },
      },
      required: [],
    },
  },
  {
    name: "get_performance_by_day",
    description: "Performance segmentada por dia da semana. Identifica dias com melhor e pior performance.",
    input_schema: {
      type: "object",
      properties: {
        campaign_id: { type: "string", description: "Filtrar por campanha (opcional)" },
        date_preset: { type: "string", enum: ["last_7d", "last_14d", "last_30d"] },
      },
      required: [],
    },
  },
  {
    name: "get_geographic_performance",
    description: "Performance por localização geográfica. Mostra quais regiões/cidades convertem melhor.",
    input_schema: {
      type: "object",
      properties: {
        campaign_id: { type: "string", description: "Filtrar por campanha (opcional)" },
        date_preset: { type: "string", enum: ["last_7d", "last_14d", "last_30d"] },
      },
      required: [],
    },
  },

  // --- Recomendações do Google ---
  {
    name: "list_recommendations",
    description: "Lista recomendações do Google Ads (optimization suggestions) com tipo, impacto estimado e ação sugerida. Inclui optimization score.",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Máximo. Padrão: 20" },
      },
      required: [],
    },
  },

  // --- Conversões ---
  {
    name: "list_conversions",
    description: "Lista ações de conversão configuradas com nome, tipo, status, valor e modelo de atribuição.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },

  // --- Ações de gestão ---
  {
    name: "pause_campaigns",
    description: "Pausa campanhas pelo ID.",
    input_schema: {
      type: "object",
      properties: {
        campaign_ids: { type: "array", items: { type: "string" } },
      },
      required: ["campaign_ids"],
    },
  },
  {
    name: "activate_campaigns",
    description: "Ativa campanhas pausadas pelo ID.",
    input_schema: {
      type: "object",
      properties: {
        campaign_ids: { type: "array", items: { type: "string" } },
      },
      required: ["campaign_ids"],
    },
  },
  {
    name: "update_campaign_budget",
    description: "Atualiza o budget diário em Reais.",
    input_schema: {
      type: "object",
      properties: {
        campaign_id: { type: "string" },
        daily_budget: { type: "number", description: "Novo budget em R$" },
      },
      required: ["campaign_id", "daily_budget"],
    },
  },
  {
    name: "pause_ads",
    description: "Pausa anúncios pelo ID.",
    input_schema: {
      type: "object",
      properties: {
        ad_ids: { type: "array", items: { type: "string" } },
      },
      required: ["ad_ids"],
    },
  },

  // --- Histórico de alterações ---
  {
    name: "get_change_history",
    description: "Lista alterações recentes feitas na conta (quem mudou o que e quando). Útil para auditoria e debug.",
    input_schema: {
      type: "object",
      properties: {
        days: { type: "number", description: "Últimos N dias. Padrão: 7" },
        limit: { type: "number", description: "Máximo. Padrão: 20" },
      },
      required: [],
    },
  },
];

export const EXPANDED_TOOL_LABELS: Record<string, string> = {
  get_account_overview: "Analisando conta",
  list_campaigns: "Listando campanhas",
  list_ads: "Buscando anúncios",
  list_keywords: "Analisando palavras-chave",
  list_search_terms: "Buscando termos de pesquisa",
  list_ad_groups: "Listando grupos de anúncios",
  get_performance_by_device: "Segmentando por dispositivo",
  get_performance_by_hour: "Analisando horários",
  get_performance_by_day: "Analisando dias da semana",
  get_geographic_performance: "Analisando regiões",
  list_recommendations: "Buscando recomendações do Google",
  list_conversions: "Listando conversões",
  pause_campaigns: "Pausando campanhas",
  activate_campaigns: "Ativando campanhas",
  update_campaign_budget: "Atualizando budget",
  pause_ads: "Pausando anúncios",
  get_change_history: "Buscando histórico de alterações",
};
