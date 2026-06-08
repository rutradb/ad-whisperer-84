import { useState, useCallback, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useBusinessContextStore } from "@/store/useBusinessContextStore";
import { buildBusinessContextBlock } from "@/lib/agent/buildBusinessContextBlock";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

export type InsightType = "warning" | "opportunity" | "info" | "action";

export interface Insight {
  type: InsightType;
  title: string;
  body: string;
  action?: string;
  /** When true, the action requires the user to configure something in Meta/settings */
  requiresSetup?: boolean;
}

const BASE_SYSTEM_PROMPT = `Você é um estrategista sênior de performance digital com visão positiva e construtiva. Você analisa contas Google Ads de negócios brasileiros de todos os porte — desde pequenos empreendedores locais até marcas nacionais.

Sua missão: transformar dados em direção. Não em alerta.

TOM OBRIGATÓRIO:
- Seja construtivo e orientado a ação. Cada problema é uma oportunidade de melhoria.
- Evite linguagem alarmista ("impossível", "sangrando", "falha", "catástrofe"). Prefira "oportunidade de ajuste", "próximo passo", "ponto de atenção".
- Mesmo quando os dados são ruins, foque no que o gestor PODE fazer agora.
- Inclua sempre pelo menos 1 insight de "opportunity" (algo positivo ou alavanca de crescimento).
- Se não há dados de conversão, trate como setup pendente — não como fracasso.

REGRAS DE CONTEÚDO:
1. Nunca repita os números brutos do contexto. Use-os para identificar padrões e significados.
2. Cada insight deve responder: "o que o gestor deve pensar ou fazer por causa disso?"
3. Considere o porte e contexto: uma conta local com poucos reais de budget tem dinâmica diferente de uma conta nacional.
4. body deve ter no máximo 20 palavras — frases curtas, diretas, conversacionais.
5. Priorize o que move o ponteiro mais rápido.

RETORNE APENAS um array JSON. Cada objeto:
- "type": "warning" | "opportunity" | "info" | "action"
- "title": observação interpretiva (1 linha curta, sem ponto final)
- "body": consequência ou contexto prático (max 20 palavras)
- "action": instrução específica e possível (ex: "Ativar rastreamento de conversões no Pixel", "Testar novo criativo nas campanhas com maior alcance")
- "requiresSetup": true se a ação exige configuração no Google Ads Manager ou pixel (opcional)

Apenas JSON array. Sem markdown.`;

export function useAIInsights() {
  const { anthropicApiKey } = useAuthStore();
  const businessContext = useBusinessContextStore();
  const [insights, setInsights] = useState<Insight[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Prevents re-generation when prompt changes mid-load due to async data arrival
  const hasGeneratedRef = useRef(false);

  const hasApiKey = !!anthropicApiKey;

  const generate = useCallback(
    async (prompt: string) => {
      if (!anthropicApiKey || !prompt) return;
      if (hasGeneratedRef.current) return;
      hasGeneratedRef.current = true;

      setIsLoading(true);
      setError(null);

      const systemPrompt = BASE_SYSTEM_PROMPT + "\n\n" + buildBusinessContextBlock(businessContext);

      try {
        const response = await fetch(ANTHROPIC_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": anthropicApiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
          },
          body: JSON.stringify({
            model: MODEL,
            max_tokens: 1000,
            system: systemPrompt,
            messages: [{ role: "user", content: prompt }],
          }),
        });

        if (!response.ok) throw new Error(`API error ${response.status}`);

        const data = await response.json();
        const text = data.content?.[0]?.text ?? "";
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error("Resposta inválida da IA");

        const parsed: Insight[] = JSON.parse(jsonMatch[0]);
        setInsights(parsed);
      } catch (err) {
        setError((err as Error).message);
        setInsights(null);
        hasGeneratedRef.current = false; // allow retry on error
      } finally {
        setIsLoading(false);
      }
    },
    [anthropicApiKey, businessContext],
  );

  const refresh = useCallback(
    (prompt: string) => {
      hasGeneratedRef.current = false;
      setInsights(null);
      generate(prompt);
    },
    [generate],
  );

  return { insights, isLoading, error, hasApiKey, generate, refresh };
}
