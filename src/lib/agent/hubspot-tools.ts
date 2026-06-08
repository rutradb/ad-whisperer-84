interface Tool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export const HUBSPOT_TOOLS: Tool[] = [
  {
    name: "get_hubspot_overview",
    description:
      "Busca um resumo dos deals do HubSpot CRM para um período: total de deals, ganhos, abertos, perdidos, valor total ganho e taxa de conversão. Use para entender a performance geral do pipeline de vendas.",
    input_schema: {
      type: "object" as const,
      properties: {
        start_date: {
          type: "string",
          description: "Data início no formato YYYY-MM-DD (ex: 2026-02-01)",
        },
        end_date: {
          type: "string",
          description: "Data fim no formato YYYY-MM-DD (ex: 2026-03-10)",
        },
      },
      required: ["start_date", "end_date"],
    },
  },
  {
    name: "correlate_hubspot_with_meta",
    description:
      "Agrupa deals do HubSpot por fonte de tráfego (hs_analytics_source) e campanha (hs_analytics_source_data_1). PAID_SOCIAL indica tráfego pago de redes sociais como Google Ads. Retorna deal_count, won_count, conversion_rate e won_value por fonte/campanha. Use para calcular o CPA real e comparar com o gasto no Google Ads.",
    input_schema: {
      type: "object" as const,
      properties: {
        start_date: {
          type: "string",
          description: "Data início no formato YYYY-MM-DD",
        },
        end_date: {
          type: "string",
          description: "Data fim no formato YYYY-MM-DD",
        },
      },
      required: ["start_date", "end_date"],
    },
  },
  {
    name: "get_hubspot_contacts_count",
    description: "Retorna o número total de contatos cadastrados no HubSpot.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];
