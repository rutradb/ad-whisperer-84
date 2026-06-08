import type { BusinessContext } from "@/store/useBusinessContextStore";

const OBJECTIVE_LABELS: Record<string, string> = {
  conversions: "Conversões",
  traffic:     "Tráfego",
  leads:       "Geração de leads",
  awareness:   "Reconhecimento de marca",
};

export function buildBusinessContextBlock(ctx: BusinessContext): string {
  const lines: string[] = [];

  lines.push("## Contexto de Negócio do Gestor");
  lines.push("");

  if (ctx.businessSegment) {
    lines.push(`**Segmento:** ${ctx.businessSegment}`);
  }
  lines.push(`**Objetivo principal:** ${OBJECTIVE_LABELS[ctx.businessObjective] ?? ctx.businessObjective}`);
  lines.push("");

  lines.push("### Critérios de Escala");
  lines.push(`- Só recomendar escala após **${ctx.minDaysBeforeScale} dia${ctx.minDaysBeforeScale !== 1 ? "s" : ""}** de performance consistente`);
  lines.push(`- ROAS mínimo para escalar: **${ctx.minRoasToScale.toFixed(1)}x**`);
  lines.push(`- Gasto mínimo para ter dados significativos: **R$ ${ctx.minSpendToEvaluate}`);
  lines.push(`- Frequência máxima tolerada: **${ctx.maxFrequency.toFixed(1)}** — acima disso, sinalizar fadiga criativa`);
  lines.push("");

  lines.push("### Metas de Custo");
  lines.push(ctx.targetRoas   !== null ? `- ROAS alvo: **${ctx.targetRoas.toFixed(1)}x**`          : "- ROAS alvo: não definido");
  lines.push(ctx.maxCpa       !== null ? `- CPA máximo aceitável: **R$ ${ctx.maxCpa.toFixed(2)}**`  : "- CPA máximo: não definido");
  lines.push(ctx.maxCpc       !== null ? `- CPC máximo aceitável: **R$ ${ctx.maxCpc.toFixed(2)}**`  : "- CPC máximo: não definido");
  if (ctx.averageTicket !== null) {
    lines.push(`- Ticket médio (contexto para CPA): **R$ ${ctx.averageTicket.toFixed(2)}**`);
  }
  lines.push("");

  if (ctx.customRules.length > 0) {
    lines.push("### Regras Estratégicas do Gestor (RESPEITE SEMPRE)");
    ctx.customRules.forEach((rule, i) => {
      lines.push(`${i + 1}. ${rule}`);
    });
    lines.push("");
  }

  lines.push("**Importante:** Todas as recomendações devem respeitar esses critérios. Nunca sugira escalar um criativo que não atenda os requisitos acima. Se não houver dados suficientes pelo critério de gasto mínimo ou dias mínimos, deixe claro que ainda é cedo para concluir.");

  return lines.join("\n");
}
