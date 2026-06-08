export function formatCurrency(value: string | number, currency = "BRL"): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(n)) return "R$ 0,00";
  return n.toLocaleString("pt-BR", { style: "currency", currency });
}

export function formatNumber(value: string | number): string {
  const n = typeof value === "string" ? parseInt(String(value), 10) : value;
  if (isNaN(n)) return "0";
  return n.toLocaleString("pt-BR");
}

export function formatPercent(value: string | number): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(n)) return "0,00%";
  return `${n.toFixed(2)}%`;
}

export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString("pt-BR");
}

/**
 * Format a Google Ads micros value (1 unit = 1,000,000 micros) to currency.
 */
export function formatMicros(micros?: string | number, currency = "BRL"): string {
  if (micros === undefined || micros === null) return "\u2014";
  const n = typeof micros === "string" ? parseFloat(micros) : micros;
  if (isNaN(n)) return "\u2014";
  return (n / 1_000_000).toLocaleString("pt-BR", { style: "currency", currency });
}

/**
 * @deprecated Use formatMicros instead. Kept for backward compatibility during migration.
 */
export function formatBudgetCents(cents?: string): string {
  if (!cents) return "\u2014";
  return (parseInt(cents, 10) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
