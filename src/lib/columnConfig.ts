export interface ColumnDef {
  key: string;
  label: string;
  category: string;
  defaultVisible: boolean;
  align?: "left" | "right";
  format?: "currency" | "number" | "percent" | "text" | "date" | "budget" | "micros";
}

export const CAMPAIGN_COLUMNS: ColumnDef[] = [
  { key: "name", label: "Nome", category: "Basico", defaultVisible: true, format: "text" },
  { key: "status", label: "Status", category: "Basico", defaultVisible: true, format: "text" },
  { key: "advertisingChannelType", label: "Tipo de Canal", category: "Basico", defaultVisible: true, format: "text" },
  { key: "budgetAmountMicros", label: "Orcamento Diario", category: "Orcamento", defaultVisible: true, format: "micros" },
  { key: "biddingStrategyType", label: "Estrategia de Lances", category: "Basico", defaultVisible: false, format: "text" },
  { key: "costMicros", label: "Gasto", category: "Performance", defaultVisible: true, align: "right", format: "micros" },
  { key: "impressions", label: "Impressoes", category: "Performance", defaultVisible: true, align: "right", format: "number" },
  { key: "clicks", label: "Cliques", category: "Performance", defaultVisible: true, align: "right", format: "number" },
  { key: "ctr", label: "CTR", category: "Performance", defaultVisible: true, align: "right", format: "percent" },
  { key: "averageCpc", label: "CPC Medio", category: "Performance", defaultVisible: false, align: "right", format: "micros" },
  { key: "conversions", label: "Conversoes", category: "Performance", defaultVisible: true, align: "right", format: "number" },
  { key: "costPerConversion", label: "Custo/Conversao", category: "Performance", defaultVisible: false, align: "right", format: "micros" },
  { key: "searchImpressionShare", label: "Search IS", category: "Performance", defaultVisible: false, align: "right", format: "percent" },
];

export const ADGROUP_COLUMNS: ColumnDef[] = [
  { key: "name", label: "Nome", category: "Basico", defaultVisible: true, format: "text" },
  { key: "status", label: "Status", category: "Basico", defaultVisible: true, format: "text" },
  { key: "type", label: "Tipo", category: "Basico", defaultVisible: true, format: "text" },
  { key: "cpcBidMicros", label: "Lance CPC", category: "Orcamento", defaultVisible: true, format: "micros" },
  { key: "costMicros", label: "Gasto", category: "Performance", defaultVisible: true, align: "right", format: "micros" },
  { key: "impressions", label: "Impressoes", category: "Performance", defaultVisible: true, align: "right", format: "number" },
  { key: "clicks", label: "Cliques", category: "Performance", defaultVisible: true, align: "right", format: "number" },
  { key: "ctr", label: "CTR", category: "Performance", defaultVisible: true, align: "right", format: "percent" },
  { key: "averageCpc", label: "CPC Medio", category: "Performance", defaultVisible: false, align: "right", format: "micros" },
  { key: "conversions", label: "Conversoes", category: "Performance", defaultVisible: true, align: "right", format: "number" },
];

export const AD_COLUMNS: ColumnDef[] = [
  { key: "name", label: "Nome", category: "Basico", defaultVisible: true, format: "text" },
  { key: "status", label: "Status", category: "Basico", defaultVisible: true, format: "text" },
  { key: "adStrength", label: "Forca do Anuncio", category: "Basico", defaultVisible: true, format: "text" },
  { key: "costMicros", label: "Gasto", category: "Performance", defaultVisible: true, align: "right", format: "micros" },
  { key: "impressions", label: "Impressoes", category: "Performance", defaultVisible: true, align: "right", format: "number" },
  { key: "clicks", label: "Cliques", category: "Performance", defaultVisible: true, align: "right", format: "number" },
  { key: "ctr", label: "CTR", category: "Performance", defaultVisible: true, align: "right", format: "percent" },
  { key: "averageCpc", label: "CPC Medio", category: "Performance", defaultVisible: true, align: "right", format: "micros" },
  { key: "conversions", label: "Conversoes", category: "Performance", defaultVisible: false, align: "right", format: "number" },
];
