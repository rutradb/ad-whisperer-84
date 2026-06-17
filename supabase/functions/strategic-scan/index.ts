// =============================================================================
// strategic-scan — Varredura estratégica de campanhas com IA adaptativa
// =============================================================================
//
// Recebe um payload de métricas (conta + campanhas + breakdowns) já normalizado
// e roda um pipeline de 2 passes usando os modelos Claude de forma ADAPTATIVA:
//
//   Pass 1 — Triagem (Haiku):   concatena/normaliza os dados, calcula métricas
//                               derivadas, detecta anomalias e classifica a
//                               COMPLEXIDADE da conta (low | medium | high).
//
//   Pass 2 — Análise profunda:  avaliação matemática, estatística e estratégica
//                               com ações priorizadas. O MODELO é escolhido em
//                               função da complexidade:
//                                 low    -> claude-haiku-4-5
//                                 medium -> claude-sonnet-4-6
//                                 high   -> claude-opus-4-8
//
// A chave da API pode vir no corpo (`apiKey`, escolha atual do projeto) ou da
// secret ANTHROPIC_API_KEY (Project Settings -> Edge Functions -> Secrets).
// =============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

// Modelos atuais (ver claude-api skill / models.md)
const MODELS = {
  haiku: "claude-haiku-4-5-20251001",
  sonnet: "claude-sonnet-4-6",
  opus: "claude-opus-4-8",
} as const;

type Complexity = "low" | "medium" | "high";

// --- Tipos do payload de entrada ------------------------------------------------

interface AccountSummary {
  name: string;
  currency: string;
  dateRange: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctrPct: number;
  conversions: number;
  convValue: number;
  cpa: number;
  roas: number;
  convRatePct: number;
}

interface CampaignSummary {
  id: string;
  name: string;
  status: string;
  channel: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctrPct: number;
  conversions: number;
  convValue: number;
  cpa: number;
  roas: number;
  convRatePct: number;
}

interface SegmentSummary {
  segment: string;
  spend: number;
  conversions: number;
  cpa: number;
  roas: number;
  ctrPct: number;
}

interface ScanPayload {
  account: AccountSummary;
  campaigns: CampaignSummary[];
  breakdowns?: {
    byDevice?: SegmentSummary[];
    byDayOfWeek?: SegmentSummary[];
  };
  businessContext?: string;
  options?: {
    forceModel?: keyof typeof MODELS;
    forceComplexity?: Complexity;
  };
}

// --- JSON Schemas (structured outputs) -----------------------------------------

const TRIAGE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    complexity: { type: "string", enum: ["low", "medium", "high"] },
    complexityReason: { type: "string" },
    dataDigest: { type: "string" },
    derivedMetrics: {
      type: "object",
      additionalProperties: false,
      properties: {
        bestCampaign: { type: "string" },
        worstCampaign: { type: "string" },
        spendConcentrationPct: { type: "number" },
        zeroConversionCampaigns: { type: "integer" },
      },
      required: [
        "bestCampaign",
        "worstCampaign",
        "spendConcentrationPct",
        "zeroConversionCampaigns",
      ],
    },
    anomalies: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          campaign: { type: "string" },
          metric: { type: "string" },
          note: { type: "string" },
          severity: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: ["campaign", "metric", "note", "severity"],
      },
    },
  },
  required: [
    "complexity",
    "complexityReason",
    "dataDigest",
    "derivedMetrics",
    "anomalies",
  ],
};

const STRATEGY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    executiveSummary: { type: "string" },
    healthScore: { type: "integer" }, // 0-100 (instruído no prompt)
    statisticalFindings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          detail: { type: "string" },
          evidence: { type: "string" },
        },
        required: ["title", "detail", "evidence"],
      },
    },
    recommendations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          rationale: { type: "string" },
          action: { type: "string" },
          priority: { type: "string", enum: ["alta", "media", "baixa"] },
          impact: { type: "string", enum: ["alto", "medio", "baixo"] },
          effort: { type: "string", enum: ["alto", "medio", "baixo"] },
          targetCampaigns: { type: "array", items: { type: "string" } },
          expectedOutcome: { type: "string" },
        },
        required: [
          "title",
          "rationale",
          "action",
          "priority",
          "impact",
          "effort",
          "targetCampaigns",
          "expectedOutcome",
        ],
      },
    },
    projection: { type: "string" },
    risks: { type: "array", items: { type: "string" } },
  },
  required: [
    "executiveSummary",
    "healthScore",
    "statisticalFindings",
    "recommendations",
    "projection",
    "risks",
  ],
};

// --- Prompts -------------------------------------------------------------------

const TRIAGE_SYSTEM = `Você é um engenheiro de dados de performance digital. Recebe métricas JÁ calculadas de uma conta Google Ads (conta + campanhas + breakdowns por dispositivo e dia da semana).

Sua tarefa NÃO é dar conselhos. É preparar o terreno para o estrategista:
1. CONCATENAR e resumir os dados num "dataDigest" denso (texto corrido, sem repetir números crus desnecessários — destaque padrões, proporções e contrastes).
2. Calcular metadados úteis: melhor e pior campanha (por ROAS/CPA conforme houver conversão), concentração de gasto (% do gasto na campanha top), nº de campanhas com zero conversão.
3. Detectar ANOMALIAS estatísticas (outliers de CPA/CTR/ROAS, campanhas gastando sem converter, quedas de eficiência) com severidade.
4. Classificar a COMPLEXIDADE da análise necessária:
   - "low": conta pequena/simples (poucas campanhas, padrões óbvios, pouco gasto).
   - "medium": conta intermediária com trade-offs reais entre campanhas.
   - "high": conta grande/heterogênea, muitos sinais conflitantes, decisões de alocação não triviais.

Responda APENAS no formato estruturado solicitado. Português do Brasil.`;

const STRATEGY_SYSTEM = `Você é um estrategista SÊNIOR de performance digital com forte base matemática e estatística, analisando contas Google Ads de negócios brasileiros.

Você recebe: (a) os dados normalizados da conta e campanhas, (b) uma triagem prévia com métricas derivadas e anomalias. Sua missão é avaliar a conta de PONTA A PONTA e transformar dados em DIREÇÃO.

PRINCÍPIOS DE ANÁLISE:
- Matemática/estatística: raciocine sobre eficiência marginal de gasto, concentração (Pareto), variância entre campanhas, CPA vs ROAS, elasticidade de budget e custo de oportunidade. Quando afirmar algo, ancore na "evidence" (números do payload).
- Estratégia: priorize o que move o ponteiro mais rápido. Considere o porte do negócio — uma conta local com pouco budget tem dinâmica diferente de uma conta nacional.
- Tom construtivo e orientado a ação. Cada problema é uma alavanca. Evite alarmismo.
- Se faltam conversões, trate como setup de rastreamento pendente — não como fracasso.

SAÍDA (estruturada):
- executiveSummary: 2-4 frases com o panorama e a aposta principal.
- healthScore: inteiro de 0 a 100 (saúde geral da conta).
- statisticalFindings: achados quantitativos com title/detail/evidence (cite os números que sustentam).
- recommendations: ações priorizadas e EXECUTÁVEIS. Cada uma com priority (alta/media/baixa), impact, effort, targetCampaigns (nomes) e expectedOutcome (resultado esperado, idealmente quantificado).
- projection: o que esperar se as ações de prioridade alta forem executadas.
- risks: riscos/armadilhas a vigiar.

Português do Brasil. Seja específico — nada de conselhos genéricos.`;

// --- Chamada à Anthropic -------------------------------------------------------

interface CallOpts {
  apiKey: string;
  model: string;
  system: string;
  user: string;
  maxTokens: number;
  schema: Record<string, unknown>;
  /** effort só é suportado em Sonnet 4.6 / Opus 4.x (erro em Haiku 4.5) */
  effort?: "low" | "medium" | "high";
  /** adaptive thinking só em Sonnet 4.6 / Opus 4.x */
  thinking?: boolean;
}

interface CallResult<T> {
  data: T;
  usage: Record<string, number>;
}

async function callAnthropic<T>(opts: CallOpts): Promise<CallResult<T>> {
  const body: Record<string, unknown> = {
    model: opts.model,
    max_tokens: opts.maxTokens,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  };

  // output_config carrega format (todos os modelos) e effort (sonnet/opus)
  const outputConfig: Record<string, unknown> = {
    format: { type: "json_schema", schema: opts.schema },
  };
  if (opts.effort) outputConfig.effort = opts.effort;
  body.output_config = outputConfig;

  if (opts.thinking) body.thinking = { type: "adaptive" };

  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": opts.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = (err as any)?.error?.message || `Erro na API Anthropic (${res.status})`;
    throw new Error(`[${opts.model}] ${msg}`);
  }

  const json = await res.json();
  const text =
    (json.content || []).find((c: any) => c.type === "text")?.text ?? "";
  const parsed = extractJson<T>(text);
  if (!parsed) throw new Error(`[${opts.model}] Resposta da IA não pôde ser interpretada como JSON.`);

  return { data: parsed, usage: json.usage ?? {} };
}

/** Structured outputs já retorna JSON válido; o fallback de regex cobre edge cases. */
function extractJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}

// --- Roteamento adaptativo de modelo -------------------------------------------

const RANK: Record<Complexity, number> = { low: 0, medium: 1, high: 2 };
const BY_RANK: Complexity[] = ["low", "medium", "high"];

/** Heurística determinística (porte da conta) como piso de complexidade. */
function heuristicComplexity(payload: ScanPayload): Complexity {
  const n = payload.campaigns.length;
  const spend = payload.account.spend;
  if (n >= 15 || spend >= 50000) return "high";
  if (n >= 5 || spend >= 5000) return "medium";
  return "low";
}

function strategyModelFor(c: Complexity): { key: keyof typeof MODELS; model: string } {
  if (c === "high") return { key: "opus", model: MODELS.opus };
  if (c === "medium") return { key: "sonnet", model: MODELS.sonnet };
  return { key: "haiku", model: MODELS.haiku };
}

// --- Construção do prompt de dados ---------------------------------------------

function buildScanInput(payload: ScanPayload): string {
  const parts = [
    `CONTA: ${payload.account.name} | Moeda: ${payload.account.currency} | Período: ${payload.account.dateRange}`,
    `TOTAIS DA CONTA: gasto=${payload.account.spend.toFixed(2)} | impressões=${payload.account.impressions} | cliques=${payload.account.clicks} | CTR=${payload.account.ctrPct.toFixed(2)}% | conversões=${payload.account.conversions} | valor_conv=${payload.account.convValue.toFixed(2)} | CPA=${payload.account.cpa.toFixed(2)} | ROAS=${payload.account.roas.toFixed(2)} | taxa_conv=${payload.account.convRatePct.toFixed(2)}%`,
    "",
    "CAMPANHAS (JSON):",
    JSON.stringify(payload.campaigns),
  ];

  if (payload.breakdowns?.byDevice?.length) {
    parts.push("", "BREAKDOWN POR DISPOSITIVO (JSON):", JSON.stringify(payload.breakdowns.byDevice));
  }
  if (payload.breakdowns?.byDayOfWeek?.length) {
    parts.push("", "BREAKDOWN POR DIA DA SEMANA (JSON):", JSON.stringify(payload.breakdowns.byDayOfWeek));
  }
  if (payload.businessContext) {
    parts.push("", "CONTEXTO DO NEGÓCIO:", payload.businessContext);
  }

  return parts.join("\n");
}

// --- Handler -------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as ScanPayload & { apiKey?: string };
    const apiKey = payload.apiKey || Deno.env.get("ANTHROPIC_API_KEY");

    if (!apiKey) {
      return json(
        { error: "Chave da API Anthropic ausente. Configure em Configurações > Integrações ou defina a secret ANTHROPIC_API_KEY." },
        400,
      );
    }
    if (!payload.account || !Array.isArray(payload.campaigns)) {
      return json({ error: "Payload inválido: account e campaigns são obrigatórios." }, 400);
    }

    const scanInput = buildScanInput(payload);

    // ---- Pass 1: Triagem (Haiku) — sem effort/thinking (não suportados em Haiku)
    const triage = await callAnthropic<{
      complexity: Complexity;
      complexityReason: string;
      dataDigest: string;
      derivedMetrics: Record<string, unknown>;
      anomalies: Array<{ campaign: string; metric: string; note: string; severity: string }>;
    }>({
      apiKey,
      model: MODELS.haiku,
      system: TRIAGE_SYSTEM,
      user: scanInput,
      maxTokens: 3000,
      schema: TRIAGE_SCHEMA,
    });

    // ---- Roteamento adaptativo: max(heurística, triagem) ou override manual
    const heuristic = heuristicComplexity(payload);
    const fromTriage = triage.data.complexity;
    let complexity: Complexity =
      payload.options?.forceComplexity ??
      BY_RANK[Math.max(RANK[heuristic], RANK[fromTriage])];

    const route = payload.options?.forceModel
      ? { key: payload.options.forceModel, model: MODELS[payload.options.forceModel] }
      : strategyModelFor(complexity);

    const isOpus = route.key === "opus";
    const isHaiku = route.key === "haiku";

    // ---- Pass 2: Análise profunda — modelo + esforço escalam com a complexidade
    const strategyUser = [
      "Analise a conta abaixo de ponta a ponta.",
      "",
      scanInput,
      "",
      "TRIAGEM PRÉVIA (JSON):",
      JSON.stringify(triage.data),
    ].join("\n");

    const strategy = await callAnthropic({
      apiKey,
      model: route.model,
      system: STRATEGY_SYSTEM,
      user: strategyUser,
      maxTokens: isHaiku ? 4000 : 8000,
      schema: STRATEGY_SCHEMA,
      // effort/thinking apenas em sonnet/opus
      effort: isHaiku ? undefined : isOpus ? "high" : "medium",
      thinking: !isHaiku,
    });

    return json({
      complexity,
      complexitySignals: { heuristic, triage: fromTriage, override: payload.options?.forceComplexity ?? null },
      models: { triage: MODELS.haiku, strategy: route.model },
      triage: triage.data,
      analysis: strategy.data,
      usage: { triage: triage.usage, strategy: strategy.usage },
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
