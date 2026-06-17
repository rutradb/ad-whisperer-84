// IDs dos modelos Anthropic usados em toda a aplicação.
// Fonte única da verdade — evite strings de modelo soltas pelo código.
export const AI_MODELS = {
  sonnet: "claude-sonnet-4-6",
  opus: "claude-opus-4-8",
  haiku: "claude-haiku-4-5-20251001",
} as const;

export const DEFAULT_AI_MODEL = AI_MODELS.sonnet;
