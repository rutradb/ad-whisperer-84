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

  // --- Ação ativa: PROPOR alterações (não executa) ---
  {
    name: "propose_actions",
    description:
      "Cria uma PROPOSTA de alterações para o usuário aprovar — NÃO executa nada no Google Ads. " +
      "Use SEMPRE que precisar mudar algo na conta: pausar/ativar campanha, ajustar budget diário, " +
      "pausar anúncio, ou REALOCAR budget entre campanhas (várias ações num único plano). " +
      "As ações só são aplicadas após o usuário aprovar. Nunca diga que executou — diga que propôs.",
    input_schema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Título curto do plano (ex.: 'Realocar budget de bleeders para winners').",
        },
        rationale: {
          type: "string",
          description: "Por que essas ações, sustentado em dados concretos.",
        },
        risk_tier: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "Nível de risco do plano. Padrão: medium.",
        },
        actions: {
          type: "array",
          description: "Lista de ações atômicas que compõem o plano.",
          items: {
            type: "object",
            properties: {
              action_type: {
                type: "string",
                enum: ["pause_campaign", "activate_campaign", "update_campaign_budget", "pause_ad"],
                description: "Tipo da ação.",
              },
              entity_id: {
                type: "string",
                description: "ID da campanha (ou ID do anúncio para pause_ad).",
              },
              daily_budget: {
                type: "number",
                description: "Novo budget diário em R$ (apenas para update_campaign_budget).",
              },
              reason: {
                type: "string",
                description: "Justificativa específica desta ação.",
              },
            },
            required: ["action_type", "entity_id"],
          },
        },
      },
      required: ["title", "actions"],
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
  propose_actions: "Criando proposta de ações",
  get_change_history: "Buscando histórico de alterações",
};
