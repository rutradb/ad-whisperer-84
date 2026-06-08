interface Tool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export const SHOPIFY_TOOLS: Tool[] = [
  {
    name: "get_shopify_revenue_summary",
    description: "Retorna resumo de receita do Shopify para um período: total, AOV, quantidade de pedidos. Use para comparar com o ROAS reportado pelo Google Ads.",
    input_schema: {
      type: "object" as const,
      properties: {
        created_at_min: { type: "string", description: "Data início ISO8601 (ex: 2024-01-01T00:00:00Z)" },
        created_at_max: { type: "string", description: "Data fim ISO8601" },
        financial_status: {
          type: "string",
          enum: ["paid", "any"],
          description: "Filtro de pagamento — use 'paid' para ROAS real (padrão: paid)",
        },
      },
      required: ["created_at_min", "created_at_max"],
    },
  },
  {
    name: "correlate_shopify_with_meta",
    description: "Agrupa pedidos do Shopify por UTM campanha (via note_attributes) e calcula receita e pedidos por campanha. Use para comparar ROAS real vs ROAS reportado pelo Meta.",
    input_schema: {
      type: "object" as const,
      properties: {
        created_at_min: { type: "string", description: "Data início ISO8601" },
        created_at_max: { type: "string", description: "Data fim ISO8601" },
        utm_campaign_attribute: {
          type: "string",
          description: "Nome do note_attribute que contém utm_campaign (padrão: utm_campaign)",
        },
        utm_source_attribute: {
          type: "string",
          description: "Nome do note_attribute que contém utm_source (padrão: utm_source)",
        },
        financial_status: {
          type: "string",
          enum: ["paid", "any"],
          description: "Padrão: paid",
        },
      },
      required: ["created_at_min", "created_at_max"],
    },
  },
  {
    name: "get_shopify_real_roas",
    description: "Calcula o ROAS real: receita do Shopify ÷ gasto no Google Ads informado. Mostra a diferença entre o ROAS reportado pelo pixel e o ROAS baseado em receita real.",
    input_schema: {
      type: "object" as const,
      properties: {
        created_at_min: { type: "string", description: "Data início ISO8601" },
        created_at_max: { type: "string", description: "Data fim ISO8601" },
        meta_spend: {
          type: "number",
          description: "Valor total gasto no Google Ads no período (na mesma moeda)",
        },
        meta_reported_roas: {
          type: "number",
          description: "ROAS reportado pelo Google Ads (opcional, para comparação)",
        },
      },
      required: ["created_at_min", "created_at_max", "meta_spend"],
    },
  },
];
