// =============================================================================
// agent-run — Proxy server-side do loop de tool-use do agente
// =============================================================================
//
// Mantém a chave da API Anthropic FORA do browser. O cliente (useAgent) continua
// orquestrando o loop de tool-use e executando as ferramentas, mas cada chamada
// ao modelo passa por esta edge function — eliminando o uso de
// `anthropic-dangerous-direct-browser-access` no front-end.
//
// Faz UMA chamada ao endpoint /v1/messages por invocação e devolve a resposta
// bruta da Anthropic (mesmo shape que o browser já consome: stop_reason +
// content[]), garantindo zero mudança de comportamento.
//
// A chave pode vir no corpo (`apiKey`, padrão do projeto, igual `strategic-scan`)
// ou da secret ANTHROPIC_API_KEY (Project Settings -> Edge Functions -> Secrets).
// =============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

interface AgentRunPayload {
  apiKey?: string;
  model: string;
  system?: string;
  tools?: unknown[];
  messages: unknown[];
  max_tokens?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as AgentRunPayload;
    const apiKey = payload.apiKey || Deno.env.get("ANTHROPIC_API_KEY");

    if (!apiKey) {
      return json(
        {
          error:
            "Chave da API Anthropic ausente. Configure em Configurações > Integrações ou defina a secret ANTHROPIC_API_KEY.",
        },
        400,
      );
    }
    if (!payload.model || !Array.isArray(payload.messages)) {
      return json(
        { error: "Payload inválido: 'model' e 'messages' são obrigatórios." },
        400,
      );
    }

    const body: Record<string, unknown> = {
      model: payload.model,
      max_tokens: payload.max_tokens ?? 4096,
      messages: payload.messages,
    };
    if (payload.system) body.system = payload.system;
    if (Array.isArray(payload.tools)) body.tools = payload.tools;

    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg =
        (data as { error?: { message?: string } })?.error?.message ||
        `Erro na API Anthropic (${res.status})`;
      return json({ error: msg }, res.status);
    }

    // Devolve a resposta bruta da Anthropic (stop_reason + content[]).
    return json(data, 200);
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
