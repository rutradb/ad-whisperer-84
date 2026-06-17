import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_AI_MODEL } from "./models";

export interface AnthropicTextOptions {
  /** Chave Anthropic (vai no corpo; nunca é exposta no browser). */
  apiKey: string | null;
  /** Mensagens da conversa (texto simples, sem tools). */
  messages: { role: "user" | "assistant"; content: string }[];
  system?: string;
  model?: string;
  maxTokens?: number;
}

/**
 * Faz uma chamada de texto à Anthropic através da edge function `agent-run`,
 * mantendo a chave FORA do browser. Retorna o texto da resposta.
 *
 * Use para completions simples (sem tool-use). Para o loop de tool-use do
 * agente, veja `useAgent`.
 */
export async function runAnthropicText(opts: AnthropicTextOptions): Promise<string> {
  const { data, error } = await supabase.functions.invoke<any>("agent-run", {
    body: {
      apiKey: opts.apiKey,
      model: opts.model ?? DEFAULT_AI_MODEL,
      max_tokens: opts.maxTokens ?? 1024,
      system: opts.system,
      messages: opts.messages,
    },
  });

  if (error) {
    let msg = error.message || "Erro ao chamar a IA.";
    try {
      const ctx = await (error as any).context?.json?.();
      if (ctx?.error) msg = ctx.error;
    } catch {
      // mantém a mensagem padrão
    }
    throw new Error(msg);
  }
  if (data?.error) throw new Error(data.error);

  return (data?.content?.find((c: any) => c.type === "text")?.text ?? "") as string;
}
