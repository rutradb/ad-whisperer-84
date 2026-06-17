import { runAnthropicText } from "@/lib/ai/anthropicProxy";
import { AI_MODELS } from "@/lib/ai/models";

function getAnthropicKey(): string {
  const key = localStorage.getItem("anthropic_api_key");
  if (!key) throw new Error("Chave da API Anthropic não configurada. Acesse Configurações > Integrações.");
  return key;
}

export type CopyFramework = "PAS" | "BAB" | "AIDA" | "SOCIAL_PROOF";

export interface CopyGeneratorInput {
  productDescription: string;
  targetAudience: string;
  tone: string;
  objective: string;
  framework: CopyFramework;
  variations: number;
}

export interface CopyVariation {
  primaryText: string;
  headline: string;
  description: string;
}

const FRAMEWORK_INSTRUCTIONS: Record<CopyFramework, string> = {
  PAS: `Use o framework PAS (Problem/Agitate/Solution):
- PROBLEM: Identifique a dor principal do público-alvo
- AGITATE: Amplifique a dor mostrando consequências de não agir
- SOLUTION: Apresente o produto/serviço como solução clara`,
  BAB: `Use o framework BAB (Before/After/Bridge):
- BEFORE: Descreva a situação atual (com a dor/problema)
- AFTER: Pinte o cenário ideal (com o problema resolvido)
- BRIDGE: Mostre como o produto/serviço é a ponte entre os dois`,
  AIDA: `Use o framework AIDA (Attention/Interest/Desire/Action):
- ATTENTION: Comece com um gancho impactante
- INTEREST: Desperte curiosidade com dados ou fatos relevantes
- DESIRE: Crie desejo mostrando benefícios concretos
- ACTION: Termine com um CTA claro e urgente`,
  SOCIAL_PROOF: `Use o framework de Social Proof (Prova Social):
- Use depoimentos, estatísticas, números de clientes satisfeitos
- Cite autoridades, certificações ou reconhecimentos
- Mostre resultados concretos de outros clientes`,
};

function buildSystemPrompt(): string {
  return `Você é um copywriter especialista em anúncios para Facebook/Instagram Ads.
Seu trabalho é criar textos persuasivos em português do Brasil (pt-BR) que convertem.

REGRAS DE FORMATO OBRIGATÓRIAS:
- primaryText: máximo 2200 caracteres. Os primeiros 125 caracteres são o GANCHO — devem ser irresistíveis para fazer o usuário clicar em "ver mais"
- headline: máximo 40 caracteres. Curto, direto e impactante
- description: máximo 30 caracteres. Complemento da headline

Responda SEMPRE em JSON válido, no formato:
[
  { "primaryText": "...", "headline": "...", "description": "..." }
]

Retorne EXATAMENTE o número de variações solicitado.
Cada variação deve ter uma abordagem diferente, mas usando o mesmo framework.
Use emojis com moderação quando apropriado para o tom.`;
}

function buildUserPrompt(input: CopyGeneratorInput): string {
  return `Crie ${input.variations} variação(ões) de copy para anúncio do Facebook.

PRODUTO/SERVIÇO: ${input.productDescription}
PÚBLICO-ALVO: ${input.targetAudience}
TOM: ${input.tone}
OBJETIVO DA CAMPANHA: ${input.objective}

FRAMEWORK:
${FRAMEWORK_INSTRUCTIONS[input.framework]}

Lembre-se:
- primaryText max 2200 chars (gancho nos primeiros 125)
- headline max 40 chars
- description max 30 chars
- ${input.variations} variação(ões) diferentes
- Responda APENAS com o JSON, sem texto adicional`;
}

function parseCopyResponse(text: string): CopyVariation[] {
  // Try to extract JSON from the response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Resposta inválida da IA. Tente novamente.");

  const parsed = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(parsed)) throw new Error("Formato de resposta inválido.");

  return parsed.map((item: any) => ({
    primaryText: String(item.primaryText || ""),
    headline: String(item.headline || ""),
    description: String(item.description || ""),
  }));
}

export async function generateAdCopy(input: CopyGeneratorInput): Promise<CopyVariation[]> {
  const content = await runAnthropicText({
    apiKey: getAnthropicKey(),
    model: AI_MODELS.sonnet,
    maxTokens: 4096,
    system: buildSystemPrompt(),
    messages: [{ role: "user", content: buildUserPrompt(input) }],
  });

  if (!content) throw new Error("Resposta vazia da IA.");

  return parseCopyResponse(content);
}
