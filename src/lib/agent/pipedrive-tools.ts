interface Tool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export const PIPEDRIVE_TOOLS: Tool[] = [
  {
    name: "get_pipedrive_deal_fields",
    description: "Busca os campos customizados disponíveis nos deals do Pipedrive. Use para descobrir quais campos armazenam UTM source, UTM campaign, etc.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "list_pipedrive_pipelines",
    description: "Lista os pipelines de vendas configurados no Pipedrive",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "list_pipedrive_deals",
    description: "Lista deals do Pipedrive com filtros opcionais. Retorna deals com campos customizados (UTM, origem, etc.)",
    input_schema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          enum: ["open", "won", "lost", "all_not_deleted"],
          description: "Filtro de status (padrão: all_not_deleted)",
        },
        pipeline_id: { type: "number", description: "Filtrar por pipeline" },
        limit: { type: "number", description: "Máximo de deals (padrão: 100)" },
        updated_since: { type: "string", description: "Data mínima (RFC3339)" },
        updated_until: { type: "string", description: "Data máxima (RFC3339)" },
      },
      required: [],
    },
  },
  {
    name: "correlate_pipedrive_with_meta",
    description: "Agrupa deals do Pipedrive por origem/campanha e calcula: total de deals, deals ganhos, valor total e taxa de conversão. Funciona com campos UTM customizados ou com os campos nativos 'origin'/'channel' do Pipedrive. Use para calcular CPA real e comparar com campanhas Google Ads.",
    input_schema: {
      type: "object" as const,
      properties: {
        utm_campaign_field_key: {
          type: "string",
          description: "Chave do campo que armazena utm_campaign. Se omitido, usa 'origin_id' (campo nativo do Pipedrive).",
        },
        utm_source_field_key: {
          type: "string",
          description: "Chave do campo que armazena utm_source. Se omitido, usa 'origin' (campo nativo).",
        },
        start_date: { type: "string", description: "Data início RFC3339" },
        end_date: { type: "string", description: "Data fim RFC3339" },
        pipeline_id: { type: "number", description: "Filtrar por pipeline" },
      },
      required: [],
    },
  },
];
